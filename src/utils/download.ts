import JSZip from 'jszip';
import { Resource } from '@/types';

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 单个文件下载
 */
export async function downloadSingle(resource: Resource): Promise<void> {
  try {
    const response = await fetch(resource.url);
    const blob = await response.blob();
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
    // 降级方案：直接打开链接
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
      const response = await fetch(resource.url);
      const blob = await response.blob();
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
