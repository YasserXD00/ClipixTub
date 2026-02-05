from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import uuid
import subprocess
import threading
import sys
import json

app = FastAPI(title="ClipixTub Backend")

# Mount a static files route so downloaded files in the project's top-level
# `downloads/` folder are publicly accessible at `/downloads/<filename>`.
# The directory is resolved relative to the repository root (one level up
# from this `backend/` folder).
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DOWNLOADS_DIR = os.path.join(PROJECT_ROOT, 'downloads')
os.makedirs(PUBLIC_DOWNLOADS_DIR, exist_ok=True)
app.mount('/downloads', StaticFiles(directory=PUBLIC_DOWNLOADS_DIR), name='downloads')

# Allow frontend dev server to access backend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DownloadRequest(BaseModel):
    url: str
    output: Optional[str] = "downloads"
    quality: Optional[str] = None  # e.g., '1080p', '720p', '4k'
    format: Optional[str] = 'mp4'  # 'mp4' or 'mp3'
    audio_bitrate: Optional[str] = '192'  # For MP3: '128', '192', '320'


# In-memory job store
jobs: Dict[str, Dict[str, Any]] = {}

# User tracking
STATS_FILE = os.path.join(PROJECT_ROOT, 'stats.json')
def get_stats():
    if not os.path.exists(STATS_FILE):
        return {"today": 0, "weekly": 0, "last_reset": 0}
    try:
        import json
        with open(STATS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {"today": 0, "weekly": 0, "last_reset": 0}

def save_stats(stats):
    import json
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f)

def increment_hits():
    import time
    stats = get_stats()
    now = time.time()
    # Reset today if new day (roughly)
    if now - stats.get("last_reset", 0) > 86400:
        stats["today"] = 0
        stats["last_reset"] = now
    
    stats["today"] += 1
    stats["weekly"] += 1
    save_stats(stats)
    return stats


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/download")
async def download(req: DownloadRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="Missing 'url' in request body")

    # Resolve output directory to an absolute path. If the caller provides an
    # absolute path, use it. Otherwise, place relative outputs inside the
    # project's top-level `downloads/` directory so files are easy to share.
    requested = req.output or "downloads"
    if os.path.isabs(requested):
        out_dir = requested
    else:
        # If caller requests the default 'downloads' folder, use the top-level
        # project `downloads/` directory. Otherwise create a subfolder under
        # that directory (useful for namespacing multiple downloads).
        if requested in ("downloads", ".", ""):
            out_dir = PUBLIC_DOWNLOADS_DIR
        else:
            out_dir = os.path.join(PUBLIC_DOWNLOADS_DIR, requested)
    os.makedirs(out_dir, exist_ok=True)

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "running", "logs": [], "exit_code": None, "output_dir": out_dir}

    backend_python = sys.executable or "python"
    engine_path = os.path.join(os.path.dirname(__file__), 'engine.py')

    def run_proc():
        try:
            cmd = [backend_python, engine_path, "--url", req.url, "--output", out_dir]
            if req.quality:
                cmd.extend(["--quality", req.quality])
            if req.format:
                cmd.extend(["--format", req.format])
            if req.audio_bitrate and req.format == 'mp3':
                cmd.extend(["--audio-bitrate", req.audio_bitrate])
            
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=os.path.dirname(__file__))

            # Stream stdout lines into job logs
            assert proc.stdout is not None
            for line in proc.stdout:
                stripped = line.rstrip('\n')
                jobs[job_id]['logs'].append(stripped)
                # detect downloaded file path from engine output
                if 'Download completed:' in stripped:
                    try:
                        # expected format: Download completed: <path>
                        path_part = stripped.split('Download completed:')[-1].strip()
                        if path_part:
                            jobs[job_id]['file_path'] = path_part
                            jobs[job_id]['file_name'] = os.path.basename(path_part)
                    except Exception:
                        pass
                
                # Definitive result file from engine
                if 'RESULT_FILE:' in stripped:
                    try:
                        path_part = stripped.split('RESULT_FILE:')[-1].strip()
                        if path_part:
                            jobs[job_id]['file_path'] = path_part
                            jobs[job_id]['file_name'] = os.path.basename(path_part)
                    except Exception:
                        pass

            proc.wait()
            jobs[job_id]['exit_code'] = proc.returncode

            # Get video title from metadata for proper file naming
            video_title = None
            try:
                # Try to get title from logs
                for log_line in jobs[job_id]['logs']:
                    if 'Title:' in log_line:
                        video_title = log_line.split('Title:')[-1].strip()
                        break
            except:
                pass

            # Verify file path recorded or try to discover produced file
            file_path = jobs[job_id].get('file_path')
            if file_path:
                # normalize any relative path to absolute
                if not os.path.isabs(file_path):
                    file_path = os.path.abspath(os.path.join(out_dir, file_path))
                    jobs[job_id]['file_path'] = file_path

            # Minimum file size: 100KB for video files, 10KB for audio files
            # This prevents small error/log files from being treated as downloads
            min_file_size = 100 * 1024  # 100 KB minimum for videos
            if req.format == 'mp3':
                min_file_size = 10 * 1024  # 10 KB minimum for audio
            
            if file_path and os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                if file_size >= min_file_size:
                    jobs[job_id]['status'] = 'completed'
                else:
                    jobs[job_id]['logs'].append(f"File too small ({file_size} bytes). Expected at least {min_file_size} bytes. This might be an error file.")
                    file_path = None  # Reset to search for another file
            else:
                file_path = None
            
            if not file_path or jobs[job_id]['status'] != 'completed':
                # search output_dir for most recent file that meets size requirements
                out = jobs[job_id].get('output_dir') or out_dir
                found = None
                try:
                    candidates = [os.path.join(out, f) for f in os.listdir(out)]
                    # Filter for actual media files with reasonable sizes
                    valid_extensions = ['.mp4', '.mp3', '.webm', '.m4a', '.mkv']
                    candidates = [
                        p for p in candidates 
                        if os.path.isfile(p) 
                        and os.path.getsize(p) >= min_file_size
                        and any(p.lower().endswith(ext) for ext in valid_extensions)
                    ]
                    if candidates:
                        found = max(candidates, key=os.path.getmtime)
                except Exception:
                    found = None

                if found:
                    file_size = os.path.getsize(found)
                    jobs[job_id]['file_path'] = os.path.abspath(found)
                    jobs[job_id]['file_name'] = os.path.basename(found)
                    jobs[job_id]['status'] = 'completed'
                    jobs[job_id]['logs'].append(f"Discovered output file after process end: {found} ({file_size} bytes)")
                else:
                    jobs[job_id]['status'] = 'failed'
                    jobs[job_id]['logs'].append(f"Process exited with code {proc.returncode}. No valid output file found in {out}. Files must be at least {min_file_size} bytes and have a media extension (.mp4, .mp3, etc.)")
        except Exception as e:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['logs'].append(f"Download error: {e}")

    thread = threading.Thread(target=run_proc, daemon=True)
    thread.start()

    return {"status": "started", "job_id": job_id, "output_dir": out_dir}


@app.get("/status/{job_id}")
async def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": job['status'], "exit_code": job['exit_code'], "output_dir": job['output_dir']}


@app.get("/logs/{job_id}")
async def logs(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"logs": job['logs']}


@app.get("/files/{job_id}")
async def get_file(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    file_path = job.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Output file not found or not yet available")
    
    # Determine media type based on file extension
    file_ext = os.path.splitext(file_path)[1].lower()
    media_type = 'application/octet-stream'
    if file_ext == '.mp4':
        media_type = 'video/mp4'
    elif file_ext == '.mp3':
        media_type = 'audio/mpeg'
    
    return FileResponse(
        path=file_path, 
        filename=job.get('file_name'),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{job.get("file_name")}"'}
    )


@app.get("/stats")
async def stats():
    import random
    current_stats = increment_hits()
    # Simulate real-time users (shifting between 50-150 for effect)
    real_time = random.randint(42, 128)
    return {
        "real_time": real_time,
        "today": current_stats["today"] + 120, # Add offset to make it look active
        "weekly": current_stats["weekly"] + 850
    }

@app.get("/metadata")
async def metadata(url: str):
    import asyncio
    import concurrent.futures
    
    # Try pytubefix first (faster) with timeout, then yt-dlp as fallback
    async def try_pytubefix():
        try:
            from pytubefix import YouTube
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                yt = await asyncio.wait_for(
                    loop.run_in_executor(executor, lambda: YouTube(url)),
                    timeout=5.0  # 5 second timeout (reduced for faster response)
                )
                # build minimal metadata response
                video_id = getattr(yt, 'video_id', '') if hasattr(yt, 'video_id') else ''
                
                # Get available stream resolutions
                # Check both progressive (video+audio) and adaptive (video-only) streams
                # Adaptive streams are needed for 1080p, 4k, etc.
                streams = yt.streams.filter(file_extension='mp4')
                available_qualities = []
                max_height = 0
                if streams:
                    heights = set()
                    for stream in streams:
                        res = stream.resolution
                        if res:
                            # Extract height from "720p" format
                            try:
                                height = int(res.replace('p', '').replace('P', ''))
                                if height and height not in heights:
                                    heights.add(height)
                                    max_height = max(max_height, height)
                            except:
                                pass
                    
                    # Sort and format qualities
                    sorted_heights = sorted([h for h in heights if h], reverse=True)
                    for h in sorted_heights:
                        if h >= 2160:
                            available_qualities.append('4k')
                        elif h >= 1440:
                            available_qualities.append('1440p')
                        elif h >= 1080:
                            available_qualities.append('1080p')
                        elif h >= 720:
                            available_qualities.append('720p')
                        elif h >= 480:
                            available_qualities.append('480p')
                        elif h >= 360:
                            available_qualities.append('360p')
                    
                    # Remove duplicates
                    available_qualities = list(dict.fromkeys(available_qualities))
                
                max_quality = available_qualities[0] if available_qualities else '720p'
                
                return {
                    'type': 'video',
                    'title': getattr(yt, 'title', '') or '',
                    'channel': getattr(yt, 'author', '') or '',
                    'description': getattr(yt, 'description', '') or '',
                    'views': str(getattr(yt, 'views', '0') or '0'),
                    'duration': str(getattr(yt, 'length', '0') or '0'),
                    'thumbnailUrl': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg" if video_id else '',
                    'availableQualities': available_qualities if available_qualities else ['720p', '480p', '360p'],
                    'maxQuality': max_quality,
                }
        except asyncio.TimeoutError:
            raise Exception("pytubefix timeout")
        except Exception as e:
            raise Exception(f"pytubefix failed: {str(e)}")
    
    async def try_ytdlp():
        try:
            from yt_dlp import YoutubeDL
            
            # Configure yt-dlp with proper headers and user agents to bypass restrictions
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'skip_download': True,
                'noplaylist': False,
                # Faster extraction - don't download full info if not needed
                'socket_timeout': 8,  # 8 second socket timeout (reduced for faster response)
                'extract_flat': False,
                # Headers to bypass restrictions
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                    'Accept-Encoding': 'gzip,deflate',
                    'Connection': 'keep-alive',
                },
            }
            
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                with YoutubeDL(ydl_opts) as ydl:
                    info = await asyncio.wait_for(
                        loop.run_in_executor(executor, lambda: ydl.extract_info(url, download=False)),
                        timeout=15.0  # 15 second timeout for yt-dlp
                    )
            
                    # Handle playlists
                    if 'entries' in info and info['entries']:
                        # It's a playlist
                        entries = list(info['entries'])
                        first_entry = entries[0] if entries else info
                        
                        # Build playlist metadata
                        data = {
                            'type': 'playlist',
                            'title': info.get('title', ''),
                            'channel': info.get('uploader', info.get('channel', '')),
                            'description': info.get('description', ''),
                            'views': str(info.get('view_count', '0')),
                            'itemCount': len(entries),
                            'thumbnailUrl': info.get('thumbnails', [{}])[0].get('url', '') if info.get('thumbnails') else '',
                            'items': [
                                {
                                    'title': entry.get('title', ''),
                                    'duration': str(entry.get('duration', '0')),
                                    'videoId': entry.get('id', ''),
                                    'views': str(entry.get('view_count', '0')),
                                }
                                for entry in entries[:50]  # Limit to 50 items
                            ]
                        }
                        
                        # Set thumbnail from first video if playlist thumbnail not available
                        if not data['thumbnailUrl'] and first_entry:
                            video_id = first_entry.get('id', '')
                            if video_id:
                                data['thumbnailUrl'] = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                        return data
                    else:
                        # It's a single video
                        video_id = info.get('id', '')
                        
                        # Extract available qualities from formats
                        available_qualities = []
                        max_height = 0
                        if 'formats' in info:
                            heights = set()
                            for fmt in info.get('formats', []):
                                height = fmt.get('height')
                                if height and height not in heights:
                                    heights.add(height)
                                    max_height = max(max_height, height)
                            
                            # Sort and format qualities
                            sorted_heights = sorted([h for h in heights if h], reverse=True)
                            for h in sorted_heights:
                                if h >= 2160:
                                    available_qualities.append('4k')
                                elif h >= 1440:
                                    available_qualities.append('1440p')
                                elif h >= 1080:
                                    available_qualities.append('1080p')
                                elif h >= 720:
                                    available_qualities.append('720p')
                                elif h >= 480:
                                    available_qualities.append('480p')
                                elif h >= 360:
                                    available_qualities.append('360p')
                            
                            # Remove duplicates while preserving order
                            seen = set()
                            available_qualities = [q for q in available_qualities if not (q in seen or seen.add(q))]
                        
                        max_quality = available_qualities[0] if available_qualities else '1080p'
                        
                        return {
                            'type': 'video',
                            'title': info.get('title', ''),
                            'channel': info.get('uploader', info.get('channel', '')),
                            'description': info.get('description', ''),
                            'views': str(info.get('view_count', '0')),
                            'duration': str(info.get('duration', '0')),
                            'thumbnailUrl': info.get('thumbnail', '') or f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg" if video_id else '',
                            'availableQualities': available_qualities if available_qualities else ['1080p', '720p', '480p', '360p'],
                            'maxQuality': max_quality,
                        }
        except asyncio.TimeoutError:
            raise Exception("yt-dlp timeout")
        except Exception as e:
            raise Exception(f"yt-dlp failed: {str(e)}")
    
    # Try pytubefix first (faster), then yt-dlp as fallback
    try:
        return await try_pytubefix()
    except Exception as e1:
        try:
            return await try_ytdlp()
        except Exception as e2:
            raise HTTPException(
                status_code=500, 
                detail=f"Metadata extraction failed. pytubefix: {str(e1)[:100]}, yt-dlp: {str(e2)[:100]}"
            )
# Cache for trending videos
trending_cache = {"data": [], "timestamp": 0, "region": None}


@app.get("/trending")
async def trending(force: bool = False, region: str = "US"):
    """Return trending videos.

    Behavior:
    - If environment variable `YT_API_KEY` or `GOOGLE_API_KEY` is set, use the
      YouTube Data API `videos.list?chart=mostPopular` for reliable results.
    - If API key is missing or the API call fails, fall back to the existing
      yt-dlp scraping method.
    - Default cache TTL is 5 minutes (300s). Set `force=true` to bypass cache.
    - `region` parameter controls the YouTube `regionCode` for the API call.
    """
    import time
    import json
    import os
    import urllib.request
    import urllib.parse
    import asyncio
    import concurrent.futures

    CACHE_TTL = 300  # 5 minutes for fresher results

    # Use cache unless forced or expired or region changed
    if not force and trending_cache["data"] and (time.time() - trending_cache["timestamp"] < CACHE_TTL) and trending_cache.get("region") == region:
        return {"trending": trending_cache["data"], "source": "cache"}

    # Prefer official YouTube Data API if API key supplied
    api_key = os.environ.get("YT_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    videos = []
    if api_key:
        try:
            base = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                'part': 'snippet,contentDetails,statistics',
                'chart': 'mostPopular',
                'maxResults': '20',
                'regionCode': region,
                'key': api_key,
            }
            url = base + "?" + urllib.parse.urlencode(params)
            req = urllib.request.Request(url, headers={
                'User-Agent': 'ClipixTub/1.0',
                'Accept': 'application/json',
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.load(resp)

            items = data.get('items', [])
            for it in items:
                vid = it.get('id', '')
                snippet = it.get('snippet', {})
                stats = it.get('statistics', {})
                thumbnails = snippet.get('thumbnails', {})
                thumb = (thumbnails.get('high') or thumbnails.get('medium') or thumbnails.get('default') or {}).get('url', '')
                videos.append({
                    'id': vid,
                    'title': snippet.get('title', ''),
                    'thumbnailUrl': thumb,
                    'channel': snippet.get('channelTitle', ''),
                    'viewCount': stats.get('viewCount', '0'),
                    'duration': it.get('contentDetails', {}).get('duration', ''),
                })

            trending_cache["data"] = videos
            trending_cache["timestamp"] = time.time()
            trending_cache["region"] = region
            return {"trending": videos, "source": "youtube_api"}
        except Exception as e:
            print(f"YT API error, falling back to yt-dlp: {e}")

    # Fallback: use yt-dlp scraping similar to previous implementation
    async def fetch_trending_ytdlp():
        try:
            from yt_dlp import YoutubeDL
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
                'playlist_items': '1-50',
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            }

            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                with YoutubeDL(ydl_opts) as ydl:
                    url = "https://www.youtube.com/feed/trending"
                    info = await asyncio.wait_for(
                        loop.run_in_executor(executor, lambda: ydl.extract_info(url, download=False)),
                        timeout=30.0
                    )

            videos_local = []
            if 'entries' in info:
                for entry in info['entries']:
                    if not entry:
                        continue
                    vid = entry.get('id', '')
                    videos_local.append({
                        'id': vid,
                        'title': entry.get('title', ''),
                        'thumbnailUrl': f"https://img.youtube.com/vi/{vid}/mqdefault.jpg",
                        'channel': entry.get('uploader', ''),
                        'viewCount': str(entry.get('view_count', '0')),
                        'duration': str(entry.get('duration', '0'))
                    })

            return videos_local
        except Exception as e:
            print(f"Error fetching trending via yt-dlp fallback: {e}")
            return []

    data = await fetch_trending_ytdlp()
    trending_cache["data"] = data
    trending_cache["timestamp"] = time.time()
    trending_cache["region"] = region
    return {"trending": data, "source": "yt_dlp"}
