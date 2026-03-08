const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://clipixtub.onrender.com';

type StartResp = { status: string; job_id?: string };

interface DownloadOptions {
  quality?: string;
  format?: string;
  audioBitrate?: string;
}

async function startDownload(
  url: string,
  output = 'downloads',
  options?: DownloadOptions
): Promise<StartResp> {
  const body: any = { url, output };
  if (options?.quality) body.quality = options.quality;
  if (options?.format) body.format = options.format;
  if (options?.audioBitrate) body.audio_bitrate = options.audioBitrate;

  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

async function getLogs(jobId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/logs/${jobId}`);
  if (!res.ok) throw new Error(`Logs not found: ${res.status}`);
  const data = await res.json();
  return data.logs || [];
}

async function getStatus(jobId: string): Promise<{ status: string; exit_code: number | null }> {
  const res = await fetch(`${API_BASE}/status/${jobId}`);
  if (!res.ok) throw new Error(`Status not found: ${res.status}`);
  return res.json();
}

function getFileUrl(jobId: string) {
  return `${API_BASE}/files/${jobId}`;
}

async function fetchFileBlob(jobId: string): Promise<Blob> {
  const res = await fetch(getFileUrl(jobId));
  if (!res.ok) throw new Error(`File not available: ${res.status}`);
  return await res.blob();
}

export { startDownload, getLogs, getStatus, getFileUrl, fetchFileBlob };
