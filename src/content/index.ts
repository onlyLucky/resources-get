import { Resource, Message } from '@/types';
import { extractImages } from './extractors/imageExtractor';
import { extractMedia } from './extractors/mediaExtractor';
import { extractDocuments } from './extractors/documentExtractor';

// 高亮样式
const HIGHLIGHT_STYLE_ID = 'resource-sniffer-highlight-style';
const HIGHLIGHT_CLASS = 'resource-sniffer-highlight';

/**
 * 注入高亮样式
 */
function injectHighlightStyle(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.3) !important;
      transition: outline 0.3s ease, box-shadow 0.3s ease !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 高亮元素
 */
function highlightElement(element: Element): void {
  injectHighlightStyle();
  element.classList.add(HIGHLIGHT_CLASS);

  // 2.5 秒后移除高亮
  setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS);
  }, 2500);
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
 * 提取所有资源
 */
function extractAllResources(): Resource[] {
  const images = extractImages();
  const media = extractMedia();
  const documents = extractDocuments();

  return [...images, ...media, ...documents];
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case 'EXTRACT_RESOURCES':
        try {
          const resources = extractAllResources();
          sendResponse({ success: true, data: resources });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
        break;

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
            highlightElement(element);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Element not found' });
          }
        }
        break;
    }

    return true; // 保持消息通道开启
  }
);

// 初始化：注入高亮样式
injectHighlightStyle();

console.log('[Resource Sniffer] Content script loaded');
