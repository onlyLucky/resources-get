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

// 存储当前高亮的元素
let currentHighlightedElement: Element | null = null;

/**
 * 注入高亮样式
 */
function injectHighlightStyle(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      border: 4px solid #ef4444 !important;
      transition: border 0.3s ease !important;
      position: relative !important;
      z-index: 999999 !important;
    }
    .${ACTIVE_HIGHLIGHT_CLASS} {
      border: 4px solid #3b82f6 !important;
      transition: border 0.3s ease !important;
      position: relative !important;
      z-index: 999999 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 清除所有高亮
 */
function clearAllHighlights(): void {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${ACTIVE_HIGHLIGHT_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS, ACTIVE_HIGHLIGHT_CLASS);
  });
  currentHighlightedElement = null;
}

/**
 * 高亮元素
 */
function highlightElement(element: Element, persistent: boolean = false): void {
  injectHighlightStyle();

  // 清除之前的高亮
  if (currentHighlightedElement && currentHighlightedElement !== element) {
    currentHighlightedElement.classList.remove(HIGHLIGHT_CLASS, ACTIVE_HIGHLIGHT_CLASS);
  }

  element.classList.add(HIGHLIGHT_CLASS);
  currentHighlightedElement = element;

  // 如果不是持久高亮，2.5 秒后移除
  if (!persistent) {
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
      if (currentHighlightedElement === element) {
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
 * 根据 URL 查找对应的 DOM 元素
 */
function findElementByUrl(url: string): Element | null {
  // 查找 img 标签
  const imgs = document.querySelectorAll('img');
  for (const img of imgs) {
    if (img.src === url || img.dataset.src === url || img.dataset.original === url) {
      return img;
    }
  }

  // 查找 video 标签
  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    if (video.src === url || video.poster === url) {
      return video;
    }
    const sources = video.querySelectorAll('source');
    for (const source of sources) {
      if (source.src === url) return video;
    }
  }

  // 查找 audio 标签
  const audios = document.querySelectorAll('audio');
  for (const audio of audios) {
    if (audio.src === url) return audio;
    const sources = audio.querySelectorAll('source');
    for (const source of sources) {
      if (source.src === url) return audio;
    }
  }

  // 查找 a 标签
  const links = document.querySelectorAll('a[href]');
  for (const link of links) {
    if ((link as HTMLAnchorElement).href === url) return link;
  }

  // 查找 embed/object 标签
  const embeds = document.querySelectorAll('embed, object');
  for (const embed of embeds) {
    const src = embed.getAttribute('src') || embed.getAttribute('data');
    if (src === url) return embed;
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
 * 获取文件大小
 */
async function fetchResourceSize(url: string): Promise<number> {
  // 首先尝试从 Performance API 获取
  const perfSize = getSizeFromPerformance(url);
  if (perfSize > 0) {
    return perfSize;
  }

  // 尝试 fetch 获取
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
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
          const element = findElementByUrl(message.data.url);
          if (element) {
            highlightElement(element, message.data.persistent || false);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Element not found' });
          }
        }
        break;

      case 'CLEAR_HIGHLIGHTS':
        clearAllHighlights();
        sendResponse({ success: true });
        break;
    }

    return true; // 保持消息通道开启
  }
);

// 初始化：注入高亮样式
injectHighlightStyle();

console.log('[Resource Sniffer] Content script loaded');

} // end of if __RESOURCE_SNIFFER_LOADED__
