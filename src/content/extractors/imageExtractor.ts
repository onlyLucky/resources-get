import { Resource } from '@/types';
import { getFileName, guessMimeType } from '@/utils/fileType';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 提取页面中的所有图片资源
 */
export function extractImages(): Resource[] {
  const images: Resource[] = [];
  const seenUrls = new Set<string>();

  // 1. 提取 img 标签
  document.querySelectorAll('img').forEach(img => {
    const url = img.src || img.dataset.src || img.dataset.original;
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      const rect = img.getBoundingClientRect();
      images.push({
        id: generateId(),
        url,
        name: getFileName(url),
        type: 'image',
        size: 0, // 需要异步获取
        mimeType: guessMimeType(url),
        thumbnail: url,
        location: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
      });
    }

    // 提取 srcset 中的图片
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach(item => {
        const parts = item.trim().split(/\s+/);
        const srcUrl = parts[0];
        if (srcUrl && !seenUrls.has(srcUrl)) {
          seenUrls.add(srcUrl);
          images.push({
            id: generateId(),
            url: srcUrl,
            name: getFileName(srcUrl),
            type: 'image',
            size: 0,
            mimeType: guessMimeType(srcUrl),
            thumbnail: srcUrl,
          });
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
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          images.push({
            id: generateId(),
            url,
            name: getFileName(url),
            type: 'image',
            size: 0,
            mimeType: guessMimeType(url),
            thumbnail: url,
          });
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
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          const rect = element.getBoundingClientRect();
          images.push({
            id: generateId(),
            url,
            name: getFileName(url),
            type: 'image',
            size: 0,
            mimeType: guessMimeType(url),
            thumbnail: url,
            location: {
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
            },
          });
        }
      }
    }
  });

  // 4. 提取 SVG 图片
  document.querySelectorAll('svg image').forEach(image => {
    const href = image.getAttribute('href') || image.getAttribute('xlink:href');
    if (href && !seenUrls.has(href)) {
      seenUrls.add(href);
      images.push({
        id: generateId(),
        url: href,
        name: getFileName(href),
        type: 'image',
        size: 0,
        mimeType: guessMimeType(href),
        thumbnail: href,
      });
    }
  });

  // 5. 提取 a 标签中的图片链接
  document.querySelectorAll('a[href]').forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    const ext = href.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
      if (!seenUrls.has(href)) {
        seenUrls.add(href);
        images.push({
          id: generateId(),
          url: href,
          name: getFileName(href),
          type: 'image',
          size: 0,
          mimeType: guessMimeType(href),
          thumbnail: href,
        });
      }
    }
  });

  return images;
}

/**
 * 获取图片的实际大小
 */
export async function getImageSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
}
