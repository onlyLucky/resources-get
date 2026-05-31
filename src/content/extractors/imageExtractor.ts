import { Resource } from '@/types';
import { getFileName, guessMimeType } from '@/utils/fileType';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 检查 URL 是否有效（过滤掉无效的 URL）
 */
function isValidUrl(url: string): boolean {
  if (!url || url === '' || url === 'about:blank') return false;
  if (url.startsWith('data:') && url.length < 50) return false; // 过滤掉很小的 data URL
  if (url.startsWith('blob:')) return false; // 过滤掉 blob URL
  try {
    new URL(url);
    return true;
  } catch {
    // 相对路径可能是有效的
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * 提取页面中的所有图片资源
 */
export function extractImages(): Resource[] {
  const images: Resource[] = [];
  const seenUrls = new Set<string>();

  /**
   * 添加图片资源（检查 URL 有效性）
   */
  const addImage = (url: string, location?: { x: number; y: number; width: number; height: number }) => {
    // 过滤无效 URL
    if (!isValidUrl(url)) return;
    // 过滤 data URL 中的 base64（太长无法下载）
    if (url.startsWith('data:') && url.length > 1000) return;
    // 去重
    if (seenUrls.has(url)) return;

    seenUrls.add(url);
    images.push({
      id: generateId(),
      url,
      name: getFileName(url),
      type: 'image',
      size: 0,
      mimeType: guessMimeType(url),
      thumbnail: url,
      location,
    });
  };

  // 1. 提取 img 标签
  document.querySelectorAll('img').forEach(img => {
    const url = img.src || img.dataset.src || img.dataset.original;
    if (url) {
      const rect = img.getBoundingClientRect();
      // 只添加有实际大小的图片
      if (rect.width > 0 && rect.height > 0) {
        addImage(url, {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        });
      } else {
        addImage(url);
      }
    }

    // 提取 srcset 中的图片
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach(item => {
        const parts = item.trim().split(/\s+/);
        const srcUrl = parts[0];
        if (srcUrl) {
          addImage(srcUrl);
        }
      });
    }
  });

  // 2. 提取 picture 标签中的 source
  document.querySelectorAll('picture source').forEach(source => {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach(item => {
        const parts = item.trim().split(/\s+/);
        const url = parts[0];
        if (url) {
          addImage(url);
        }
      });
    }
  });

  // 3. 提取背景图片
  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;

    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          addImage(url, {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
          });
        } else {
          addImage(url);
        }
      }
    }
  });

  // 4. 提取 SVG 图片
  document.querySelectorAll('svg image').forEach(image => {
    const href = image.getAttribute('href') || image.getAttribute('xlink:href');
    if (href) {
      addImage(href);
    }
  });

  // 5. 提取 a 标签中的图片链接
  document.querySelectorAll('a[href]').forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    const ext = href.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
      addImage(href);
    }
  });

  return images;
}
