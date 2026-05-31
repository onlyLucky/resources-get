import JSZip from 'jszip';
import { Resource } from '@/types';

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取当前页面的 cookies（用于带 cookies 的请求）
 */
async function fetchWithCredentials(url: string): Promise<Blob> {
  // 使用带有 credentials 的 fetch 请求
  const response = await fetch(url, {
    credentials: 'include', // 包含 cookies
    headers: {
      'Referer': window.location.href,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.blob();
}

/**
 * 清理文件名（移除不支持的字符）
 */
function sanitizeFileName(fileName: string): string {
  // 移除路径分隔符和特殊字符
  return fileName
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200); // 限制文件名长度
}

/**
 * 使用 chrome.downloads API 下载（会使用浏览器的 cookies）
 */
async function downloadByChromeAPI(resource: Resource): Promise<boolean> {
  return new Promise((resolve) => {
    if (chrome?.downloads?.download) {
      const fileName = sanitizeFileName(resource.name);
      chrome.downloads.download({
        url: resource.url,
        filename: fileName,
        saveAs: false,
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome download error:', chrome.runtime.lastError);
          resolve(false);
        } else {
          resolve(!!downloadId);
        }
      });
    } else {
      resolve(false);
    }
  });
}

/**
 * 单个文件下载
 */
export async function downloadSingle(resource: Resource): Promise<void> {
  try {
    // 优先使用 chrome.downloads API（会自动使用浏览器 cookies）
    const success = await downloadByChromeAPI(resource);
    if (success) return;

    // 降级方案：使用 fetch 带 credentials
    const blob = await fetchWithCredentials(resource.url);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = resource.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    // 最后降级：直接打开链接
    window.open(resource.url, '_blank');
  }
}

/**
 * 批量逐个下载
 */
export async function downloadAll(resources: Resource[]): Promise<void> {
  for (const resource of resources) {
    await downloadSingle(resource);
    await delay(500); // 防止下载限制
  }
}

/**
 * ZIP 打包下载
 */
export async function downloadAsZip(
  resources: Resource[],
  zipName: string = 'resources.zip',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    try {
      const blob = await fetchWithCredentials(resource.url);
      zip.file(resource.name, blob);
    } catch (error) {
      console.error(`Failed to fetch ${resource.url}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, resources.length);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
