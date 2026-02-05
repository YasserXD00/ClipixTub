import argparse
import sys
import os
import shutil

# Refresh PATH to include FFmpeg if installed via winget/chocolatey
# This ensures subprocess calls can find ffmpeg even if terminal wasn't restarted
if sys.platform == 'win32':
    import ctypes
    from ctypes import wintypes
    
    try:
        # Get updated PATH from registry
        import winreg
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as key:
            system_path = winreg.QueryValueEx(key, "PATH")[0]
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            try:
                user_path = winreg.QueryValueEx(key, "PATH")[0]
            except FileNotFoundError:
                user_path = ""
        
        # Merge and update PATH
        combined_path = f"{system_path};{user_path}" if user_path else system_path
        os.environ['PATH'] = combined_path
    except Exception:
        pass  # If registry access fails, continue with existing PATH

def _print(*args, **kwargs):
    # wrapped print to flush immediately so server captures logs in real time
    print(*args, **kwargs)
    try:
        sys.stdout.flush()
    except Exception:
        pass


def download_with_ytdlp(url, output_path='.', quality=None, format_type='mp4', audio_bitrate='192'):
    try:
        from yt_dlp import YoutubeDL
    except ImportError as e:
        _print(f"yt-dlp not available: {e}")
        _print("Please install yt-dlp: pip install yt-dlp")
        raise RuntimeError("yt-dlp is not installed") from e
    except Exception as e:
        _print(f"Error importing yt-dlp: {e}")
        raise

    os.makedirs(output_path, exist_ok=True)

    # Use title for filename to match video name exactly
    # Sanitize filename: remove invalid characters, limit length
    outfile_template = os.path.join(output_path, '%(title)s.%(ext)s')

    def progress_hook(d):
        status = d.get('status')
        if status == 'downloading':
            _print(f"[yt-dlp] downloading: {d.get('filename', '')} - {d.get('_percent_str', '').strip()} {d.get('_speed_str','').strip()} {d.get('_eta_str','').strip()}")
        elif status == 'finished':
            # d['filename'] may be available
            filepath = d.get('filename')
            _print(f"Download completed: {filepath}")

    # Determine format based on quality
    format_selector = None
    if format_type == 'mp3':
        # For MP3, we'll download best audio and convert
        format_selector = 'bestaudio/best'
    elif quality:
        quality_lower = quality.lower().replace('p', '').replace('k', '')
        if quality_lower == '4' or quality_lower == '2160':
            # 4K / 2160p - prefer best quality
            format_selector = 'bestvideo[height<=2160]+bestaudio/best[height<=2160]/best'
        elif quality_lower == '1080':
            format_selector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'
        elif quality_lower == '720':
            format_selector = 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'
        elif quality_lower == '480':
            format_selector = 'bestvideo[height<=480]+bestaudio/best[height<=480]/best'
        elif quality_lower == '360':
            format_selector = 'bestvideo[height<=360]+bestaudio/best[height<=360]/best'
        else:
            format_selector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'
    else:
        # Default: best quality up to 1080p
        format_selector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'

    # Configure yt-dlp with headers and user agents to bypass restrictions
    ydl_opts = {
        'outtmpl': outfile_template,
        'format': format_selector,
        'merge_output_format': 'mp4',
        'concurrent_fragment_downloads': 4,
        'noprogress': False,
        'quiet': False,
        'progress_hooks': [progress_hook],
        'no_warnings': False,
        'ignoreerrors': False,
        # Headers to bypass restrictions
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip,deflate',
            'Connection': 'keep-alive',
            'Referer': 'https://www.youtube.com/',
        },
        # Retry options
        'retries': 10,
        'fragment_retries': 10,
        'file_access_retries': 3,
        # Post-processor options for MP3
        'postprocessors': [],
        # Ensure we fail if post-processing fails
        'postprocessor_args': {
            'ffmpeg': ['-y']  # Overwrite files, don't prompt
        },
    }
    
    # Add MP3 post-processor if format is mp3
    if format_type == 'mp3':
        ydl_opts['postprocessors'].append({
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': audio_bitrate,
        })
        
        # Check if FFmpeg is available before attempting MP3 conversion
        try:
            import shutil
            ffmpeg_path = shutil.which('ffmpeg')
            if not ffmpeg_path:
                _print("WARNING: FFmpeg not found in PATH. MP3 conversion may fail.")
                _print("Please ensure FFmpeg is installed and accessible.")
        except Exception:
            pass

    _print(f"Starting yt-dlp for URL: {url}")
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # Check if download actually succeeded
            if not info:
                raise RuntimeError("yt-dlp extracted no information from URL")
        
        # info may be dict for video or playlist
        if isinstance(info, dict):
            # If playlist, let user handle; pick first
            if info.get('entries'):
                entry = info['entries'][0]
                title = entry.get('title')
                ext = entry.get('ext', 'mp4')
                filename = os.path.join(output_path, f"{title}.{ext}")
            else:
                title = info.get('title')
                ext = info.get('ext', 'mp4')
                filename = os.path.join(output_path, f"{title}.{ext}")
        else:
            filename = ''

        # Attempt to find the actual file on disk if filename blank
        if not filename or not os.path.exists(filename):
            # scan output_path for most recent file
            files = [os.path.join(output_path, f) for f in os.listdir(output_path)]
            files = [f for f in files if os.path.isfile(f)]
            if files:
                filename = max(files, key=os.path.getmtime)

        # normalize to absolute path for server consumption
        if filename:
            filename = os.path.abspath(filename)
        
        # If MP3 conversion was requested, the file might have .mp3 extension
        if format_type == 'mp3' and filename and os.path.exists(filename):
            # Check if MP3 file exists (yt-dlp might rename it)
            base_name = os.path.splitext(filename)[0]
            mp3_file = base_name + '.mp3'
            if os.path.exists(mp3_file):
                filename = mp3_file
            elif not filename.endswith('.mp3'):
                # Try to find MP3 file in output directory
                mp3_files = [f for f in os.listdir(output_path) if f.endswith('.mp3')]
                if mp3_files:
                    filename = os.path.abspath(os.path.join(output_path, max(mp3_files, key=os.path.getmtime)))
        
        if not filename or not os.path.exists(filename):
            raise RuntimeError(f"Download completed but file not found: {filename}")
        
        # Validate file size - reject suspiciously small files
        file_size = os.path.getsize(filename)
        min_size = 10 * 1024 if format_type == 'mp3' else 100 * 1024  # 10KB for audio, 100KB for video
        
        if file_size < min_size:
            # Try to read the file to see if it's an error message
            try:
                with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(200)  # Read first 200 chars
                    if 'error' in content.lower() or 'failed' in content.lower() or 'ffmpeg' in content.lower():
                        raise RuntimeError(f"Download failed - file contains error message: {content[:100]}")
            except Exception:
                pass
            
            raise RuntimeError(f"Downloaded file is too small ({file_size} bytes). Expected at least {min_size} bytes. This might indicate the download failed or FFmpeg merge/conversion failed.")
        
        _print(f"Final file: {filename} ({file_size} bytes)")
        _print(f"RESULT_FILE: {filename}")
        _print("Process exited with code 0.")
        return filename
    except Exception as e:
        error_msg = str(e)
        _print(f"yt-dlp extraction error: {error_msg}")
        # Provide more helpful error messages
        if "HTTP Error 403" in error_msg or "Forbidden" in error_msg:
            _print("Access forbidden. This may be due to age restrictions or regional blocking.")
        elif "HTTP Error 404" in error_msg or "Not Found" in error_msg:
            _print("Video not found. Please check the URL.")
        elif "Private video" in error_msg:
            _print("This video is private and cannot be downloaded.")
        elif "unavailable" in error_msg.lower():
            _print("Video is unavailable. It may have been removed or is not accessible.")
        raise


def download_video(url, output_path='.', quality=None, format_type='mp4', audio_bitrate='192'):
    try:
        return download_with_ytdlp(url, output_path=output_path, quality=quality, format_type=format_type, audio_bitrate=audio_bitrate)
    except Exception as e:
        _print(f"yt-dlp download failed: {e}")
        _print("Falling back to pytubefix if available...")
        try:
            from pytubefix import YouTube
            _print(f"Connecting to YouTube with pytubefix: {url}")
            yt = YouTube(url)
            _print(f"Title: {yt.title}")
            _print("Finding streams...")
            stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
            if not stream:
                _print("No progressive MP4 stream found. Trying adaptive streams...")
                stream = yt.streams.filter(file_extension='mp4').order_by('resolution').desc().first()

            if stream:
                _print(f"Downloading stream: {stream.resolution} ({stream.mime_type})")
                file_path = stream.download(output_path=output_path)
                _print(f"Download completed: {file_path}")
                _print(f"RESULT_FILE: {file_path}")
                _print("Process exited with code 0.")
                return file_path
            else:
                _print("Error: No suitable stream found.")
                raise RuntimeError("No suitable stream found with pytubefix")
        except ImportError:
            _print("pytubefix is not available for fallback.")
            raise RuntimeError(f"Download failed: {str(e)}. pytubefix fallback unavailable.")
        except Exception as e2:
            _print(f"Fallback to pytubefix failed: {e2}")
            # Combine errors for better debugging
            raise RuntimeError(f"All download methods failed. yt-dlp: {str(e)}, pytubefix: {str(e2)}") from e


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download YouTube video.')
    parser.add_argument('--url', required=True, help='YouTube video URL')
    parser.add_argument('--output', default='.', help='Output directory')
    parser.add_argument('--quality', default=None, help='Video quality (e.g., 1080p, 720p, 4k)')
    parser.add_argument('--format', default='mp4', choices=['mp4', 'mp3'], help='Output format')
    parser.add_argument('--audio-bitrate', default='192', help='Audio bitrate for MP3 (128, 192, 320)')

    args = parser.parse_args()

    download_video(args.url, args.output, quality=args.quality, format_type=args.format, audio_bitrate=args.audio_bitrate)