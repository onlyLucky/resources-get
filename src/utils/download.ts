import JSZip from 'jszip';
import { Resource } from '@/types';

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理文件名（移除不支持的字符）
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

/**
 * 通过 Content Script 下载（会自动携带 cookies）
 */
function downloadViaContentScript(resource: Resource): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) {
          resolve(false);
          return;
        }

        const fileName = sanitizeFileName(resource.name);
        console.log('[Download] Via content script:', resource.url, fileName);

        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'DOWNLOAD_RESOURCE',
            data: { url: resource.url, fileName },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('[Download] Content script error:', chrome.runtime.lastError);
              resolve(false);
            } else {
              console.log('[Download] Content script response:', response);
              resolve(response?.success || false);
            }
          }
        );
      });
    } catch (error) {
      console.error('[Download] Content script exception:', error);
      resolve(false);
    }
  });
}

/**
 * 带 credentials 的 fetch 请求
 */
async function fetchWithCredentials(url: string): Promise<Blob> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  return response.blob();
}

/**
 * 单个文件下载
 */
export async function downloadSingle(resource: Resource): Promise<void> {
  try {
    console.log('[Download] Starting download:', resource.name, resource.url);

    // 优先通过 Content Script 下载（会自动携带 cookies）
    const success = await downloadViaContentScript(resource);
    if (success) return;

    // 最后降级：直接打开链接
    console.log('[Download] Falling back to window.open');
    window.open(resource.url, '_blank');
  } catch (error) {
    console.error('[Download] Download failed:', error);
    window.open(resource.url, '_blank');
  }
}

/**
 * 批量逐个下载
 */
export async function downloadAll(resources: Resource[]): Promise<void> {
  for (const resource of resources) {
    await downloadSingle(resource);
    await delay(500);
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
      console.error('Failed to fetch ' + resource.url + ':', error);
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
