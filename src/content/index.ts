import { Resource, Message } from '@/types';
import { extractImages } from './extractors/imageExtractor';
import { extractMedia } from './extractors/mediaExtractor';
import { extractDocuments } from './extractors/documentExtractor';

// 防止重复注入
if ((window as any).__RESOURCE_SNIFFER_LOADED__) {
  console.log('[Resource Sniffer] Already loaded, skipping...');
} else {
  (window as any).__RESOURCE_SNIFFER_LOADED__ = true;

// 高亮样式
const HIGHLIGHT_STYLE_ID = 'resource-sniffer-highlight-style';
const HIGHLIGHT_CLASS = 'resource-sniffer-highlight';
const ACTIVE_HIGHLIGHT_CLASS = 'resource-sniffer-highlight-active';
const LABEL_CLASS = 'resource-sniffer-label';

// 存储当前高亮的元素和标签
let currentHighlightedElement: Element | null = null;
let currentLabel: HTMLElement | null = null;

/**
 * 截断文件名（最多10个字符）
 */
function truncateFileName(name: string, maxLength: number = 10): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

/**
 * 注入高亮样式
 */
function injectHighlightStyle(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      border: 2px solid #ef4444 !important;
      transition: border 0.3s ease !important;
      box-sizing: border-box !important;
    }
    .${ACTIVE_HIGHLIGHT_CLASS} {
      border: 2px solid #3b82f6 !important;
      transition: border 0.3s ease !important;
      box-sizing: border-box !important;
    }
    .${LABEL_CLASS} {
      position: fixed !important;
      display: flex !important;
      justify-content: flex-start !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      gap: 4px !important;
    }
    .${LABEL_CLASS}-name {
      background: #ef4444 !important;
      color: white !important;
      padding: 2px 8px !important;
      border-radius: 4px 4px 0 0 !important;
      font-size: 12px !important;
      line-height: 20px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 120px !important;
    }
    .${LABEL_CLASS}-size {
      background: #6b7280 !important;
      color: white !important;
      padding: 2px 8px !important;
      border-radius: 4px 4px 0 0 !important;
      font-size: 12px !important;
      line-height: 20px !important;
      white-space: nowrap !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 创建文件名标签（添加到 body，使用 fixed 定位）
 * 标签放在元素上方
 */
function createLabel(element: Element, fileName: string, fileSize?: string): HTMLElement {
  // 移除旧标签
  if (currentLabel) {
    currentLabel.remove();
    currentLabel = null;
  }

  const label = document.createElement('div');
  label.className = LABEL_CLASS;

  const nameSpan = document.createElement('span');
  nameSpan.className = `${LABEL_CLASS}-name`;
  nameSpan.textContent = truncateFileName(fileName);
  label.appendChild(nameSpan);

  if (fileSize) {
    const sizeSpan = document.createElement('span');
    sizeSpan.className = `${LABEL_CLASS}-size`;
    sizeSpan.textContent = fileSize;
    label.appendChild(sizeSpan);
  }

  // 添加到 body，使用 fixed 定位
  document.body.appendChild(label);

  // 计算标签位置（元素顶部上方）
  const updatePosition = () => {
    const rect = element.getBoundingClientRect();
    const labelHeight = label.offsetHeight || 24;

    // 默认标签放在元素顶部上方
    let top = rect.top - labelHeight - 4;
    let left = rect.left;

    // 如果标签超出视口顶部，放在元素底部下方
    if (top < 0) {
      top = rect.bottom + 4;
    }

    // 如果标签超出视口底部，调整到元素内部
    if (top + labelHeight > window.innerHeight) {
      top = window.innerHeight - labelHeight - 4;
    }

    // 如果标签超出视口右侧，向左偏移
    const labelWidth = label.offsetWidth || 150;
    if (left + labelWidth > window.innerWidth) {
      left = window.innerWidth - labelWidth - 8;
    }

    // 如果标签超出视口左侧，向右偏移
    if (left < 0) {
      left = 4;
    }

    label.style.top = `${top}px`;
    label.style.left = `${left}px`;
  };

  // 初始定位
  updatePosition();

  // 监听滚动和 resize 事件，更新标签位置
  const handleUpdate = () => {
    requestAnimationFrame(updatePosition);
  };
  window.addEventListener('scroll', handleUpdate, { passive: true });
  window.addEventListener('resize', handleUpdate, { passive: true });

  // 存储清理函数
  (label as any).__cleanup = () => {
    window.removeEventListener('scroll', handleUpdate);
    window.removeEventListener('resize', handleUpdate);
  };

  currentLabel = label;

  return label;
}

/**
 * 检查元素是否可见
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  // 检查 display、visibility、opacity
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity) === 0) return false;

  // 检查元素大小
  if (rect.width === 0 && rect.height === 0) return false;

  return true;
}

/**
 * 查找最近的可见父元素
 */
function findVisibleAncestor(element: Element): Element {
  let current: Element | null = element;

  while (current && current !== document.body) {
    if (isElementVisible(current)) {
      const rect = current.getBoundingClientRect();
      // 确保元素有足够的大小来显示标记
      if (rect.width > 0 && rect.height > 0) {
        return current;
      }
    }
    current = current.parentElement;
  }

  // 如果都找不到可见的父元素，返回原始元素
  return element;
}

/**
 * 清除所有高亮
 */
function clearAllHighlights(): void {
  // 清除高亮样式
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${ACTIVE_HIGHLIGHT_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS, ACTIVE_HIGHLIGHT_CLASS);
  });

  // 清除所有标签（并清理事件监听器）
  document.querySelectorAll(`.${LABEL_CLASS}`).forEach(el => {
    if ((el as any).__cleanup) {
      (el as any).__cleanup();
    }
    el.remove();
  });

  currentHighlightedElement = null;
  currentLabel = null;
}

/**
 * 高亮元素并滚动到其位置
 */
function highlightElement(element: Element, persistent: boolean = false, fileName?: string, fileSize?: string): void {
  injectHighlightStyle();

  // 查找可见的元素（可能是父元素）
  const visibleElement = findVisibleAncestor(element);

  // 清除之前的高亮
  if (currentHighlightedElement && currentHighlightedElement !== visibleElement) {
    currentHighlightedElement.classList.remove(HIGHLIGHT_CLASS, ACTIVE_HIGHLIGHT_CLASS);
    if (currentLabel) {
      currentLabel.remove();
      currentLabel = null;
    }
  }

  // 滚动到元素位置
  visibleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

  visibleElement.classList.add(HIGHLIGHT_CLASS);
  currentHighlightedElement = visibleElement;

  // 添加文件名标签
  if (fileName) {
    createLabel(visibleElement, fileName, fileSize);
  }

  // 如果不是持久高亮，2.5 秒后移除
  if (!persistent) {
    setTimeout(() => {
      visibleElement.classList.remove(HIGHLIGHT_CLASS);
      if (currentLabel) {
        currentLabel.remove();
        currentLabel = null;
      }
      if (currentHighlightedElement === visibleElement) {
        currentHighlightedElement = null;
      }
    }, 2500);
  }
}

/**
 * 滚动到元素位置
 */
function scrollToElement(location: { x: number; y: number; width: number; height: number }): void {
  const centerY = location.y + location.height / 2 - window.innerHeight / 2;
  window.scrollTo({
    top: Math.max(0, centerY),
    behavior: 'smooth',
  });
}

/**
 * 获取 URL 的基础路径（去除查询参数和 hash）
 */
function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

/**
 * 比较两个 URL 是否匹配（支持忽略查询参数）
 */
function isUrlMatch(elementUrl: string, targetUrl: string): boolean {
  if (!elementUrl || !targetUrl) return false;

  // 完全匹配
  if (elementUrl === targetUrl) return true;

  // 基础路径匹配（忽略查询参数）
  const elementBase = getBaseUrl(elementUrl);
  const targetBase = getBaseUrl(targetUrl);
  if (elementBase === targetBase) return true;

  // 目标 URL 是元素 URL 的子集（元素 URL 包含目标 URL 的路径）
  if (elementUrl.includes(targetBase) || targetUrl.includes(elementBase)) return true;

  return false;
}

/**
 * 根据 URL 查找对应的 DOM 元素
 */
function findElementByUrl(url: string): Element | null {
  // 查找 img 标签
  const imgs = document.querySelectorAll('img');
  for (const img of imgs) {
    if (isUrlMatch(img.src, url) ||
        isUrlMatch(img.dataset.src || '', url) ||
        isUrlMatch(img.dataset.original || '', url)) {
      return img;
    }
  }

  // 查找 video 标签
  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    if (isUrlMatch(video.src, url) || isUrlMatch(video.poster, url)) {
      return video;
    }
    const sources = video.querySelectorAll('source');
    for (const source of sources) {
      if (isUrlMatch(source.src, url)) return video;
    }
  }

  // 查找 audio 标签
  const audios = document.querySelectorAll('audio');
  for (const audio of audios) {
    if (isUrlMatch(audio.src, url)) return audio;
    const sources = audio.querySelectorAll('source');
    for (const source of sources) {
      if (isUrlMatch(source.src, url)) return audio;
    }
  }

  // 查找 a 标签
  const links = document.querySelectorAll('a[href]');
  for (const link of links) {
    if (isUrlMatch((link as HTMLAnchorElement).href, url)) return link;
  }

  // 查找 embed/object 标签
  const embeds = document.querySelectorAll('embed, object');
  for (const embed of embeds) {
    const src = embed.getAttribute('src') || embed.getAttribute('data');
    if (isUrlMatch(src || '', url)) return embed;
  }

  // 查找背景图片
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (urlMatch && urlMatch[1] && isUrlMatch(urlMatch[1], url)) {
        return element;
      }
    }
  }

  return null;
}

/**
 * 从 Performance API 获取资源大小
 */
function getSizeFromPerformance(url: string): number {
  try {
    const entries = performance.getEntriesByName(url);
    if (entries.length > 0) {
      const entry = entries[0] as PerformanceResourceTiming;
      return entry.transferSize || entry.encodedBodySize || 0;
    }
  } catch {
    // 忽略错误
  }
  return 0;
}

/**
 * 通过 Image 对象预加载图片资源
 */
function preloadImage(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 等待一小段时间让 Performance API 记录
      setTimeout(() => {
        const size = getSizeFromPerformance(url);
        resolve(size);
      }, 100);
    };
    img.onerror = () => resolve(0);
    img.src = url;

    // 超时处理
    setTimeout(() => resolve(0), 3000);
  });
}

/**
 * 通过 fetch 获取文件大小
 */
async function getSizeByFetch(url: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 先尝试 HEAD 请求
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 如果是 403 或其他错误状态，直接返回 0
    if (!response.ok) {
      return 0;
    }

    let contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // HEAD 请求没有 content-length，尝试 GET 请求
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

    response = await fetch(url, {
      method: 'GET',
      signal: controller2.signal,
    });
    clearTimeout(timeoutId2);

    // 如果是 403 或其他错误状态，直接返回 0
    if (!response.ok) {
      return 0;
    }

    contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // 如果还是没有，尝试读取 blob 大小
    const blob = await response.blob();
    return blob.size;
  } catch {
    return 0;
  }
}

/**
 * 获取文件大小
 */
async function fetchResourceSize(url: string): Promise<number> {
  // 首先尝试从 Performance API 获取
  const perfSize = getSizeFromPerformance(url);
  if (perfSize > 0) {
    return perfSize;
  }

  // 尝试通过 Image 对象预加载获取（仅图片）
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
  if (imageExts.includes(ext)) {
    const preloadSize = await preloadImage(url);
    if (preloadSize > 0) {
      return preloadSize;
    }
  }

  // 尝试 fetch 获取
  const fetchSize = await getSizeByFetch(url);
  if (fetchSize > 0) {
    return fetchSize;
  }

  return 0;
}

/**
 * 提取所有资源并获取大小
 */
async function extractAllResources(): Promise<Resource[]> {
  const images = extractImages();
  const media = extractMedia();
  const documents = extractDocuments();
  const allResources = [...images, ...media, ...documents];

  // 并发获取所有资源的大小（限制并发数）
  const batchSize = 10;
  for (let i = 0; i < allResources.length; i += batchSize) {
    const batch = allResources.slice(i, i + batchSize);
    const sizes = await Promise.all(
      batch.map(resource => fetchResourceSize(resource.url))
    );
    batch.forEach((resource, index) => {
      resource.size = sizes[index];
    });
  }

  return allResources;
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case 'EXTRACT_RESOURCES':
        extractAllResources()
          .then(resources => {
            sendResponse({ success: true, data: resources });
          })
          .catch(error => {
            sendResponse({ success: false, error: String(error) });
          });
        return true; // 保持消息通道开启，等待异步响应

      case 'SCROLL_TO_ELEMENT':
        if (message.data?.location) {
          scrollToElement(message.data.location);
          sendResponse({ success: true });
        }
        break;

      case 'HIGHLIGHT_ELEMENT':
        if (message.data?.url) {
          console.log('[Content] Looking for element:', message.data.url);
          const element = findElementByUrl(message.data.url);
          if (element) {
            console.log('[Content] Element found, highlighting');
            highlightElement(
              element,
              message.data.persistent || false,
              message.data.fileName,
              message.data.fileSize
            );
            sendResponse({ success: true });
          } else {
            console.log('[Content] Element not found');
            sendResponse({ success: false, error: 'Element not found' });
          }
        }
        break;

      case 'CLEAR_HIGHLIGHTS':
        clearAllHighlights();
        sendResponse({ success: true });
        break;

      case 'DOWNLOAD_RESOURCE':
        // 在 Content Script 中下载文件（会自动携带 cookies）
        downloadResource(message.data.url, message.data.fileName)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: String(error) }));
        return true; // 保持消息通道开启，等待异步响应

      case 'FETCH_IMAGE':
        // 获取图片数据（用于 403 图片预览）
        fetchImageAsDataUrl(message.data.url)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: String(error) }));
        return true; // 保持消息通道开启，等待异步响应

      case 'FETCH_RESOURCE_BLOB':
        // 获取资源数据（用于打包下载）
        fetchResourceAsBlob(message.data.url)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: String(error) }));
        return true; // 保持消息通道开启，等待异步响应
    }

    return true; // 保持消息通道开启
  }
);

/**
 * 获取图片数据并转换为 data URL
 */
async function fetchImageAsDataUrl(url: string): Promise<{ success: boolean; data?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function() {
      if (xhr.status === 200) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ success: true, data: reader.result as string });
        };
        reader.onerror = () => resolve({ success: false });
        reader.readAsDataURL(xhr.response);
      } else {
        resolve({ success: false });
      }
    };

    xhr.onerror = function() {
      resolve({ success: false });
    };

    xhr.send();
  });
}

/**
 * 获取资源数据并转换为 base64
 */
async function fetchResourceAsBlob(url: string): Promise<{ success: boolean; data?: string; type?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function() {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ success: true, data: base64, type: blob.type });
        };
        reader.onerror = () => resolve({ success: false });
        reader.readAsDataURL(blob);
      } else {
        resolve({ success: false });
      }
    };

    xhr.onerror = function() {
      resolve({ success: false });
    };

    xhr.send();
  });
}

/**
 * 在 Content Script 中下载文件
 * 使用 XMLHttpRequest 或直接创建 a 标签下载
 */
async function downloadResource(url: string, fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Content] Downloading resource:', url);

    // 方法1：使用 XMLHttpRequest（自动携带 cookies 和 Referer）
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      xhr.onload = function() {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

          console.log('[Content] Download started:', fileName);
          resolve({ success: true });
        } else {
          console.error('[Content] XHR failed:', xhr.status);
          resolve({ success: false, error: 'HTTP ' + xhr.status });
        }
      };

      xhr.onerror = function() {
        console.error('[Content] XHR error');
        resolve({ success: false, error: 'Network error' });
      };

      xhr.send();
    });
  } catch (error) {
    console.error('[Content] Download failed:', error);
    return { success: false, error: String(error) };
  }
}

// 初始化：注入高亮样式
injectHighlightStyle();

console.log('[Resource Sniffer] Content script loaded');

} // end of if __RESOURCE_SNIFFER_LOADED__
