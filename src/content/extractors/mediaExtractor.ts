import { Resource, ResourceType } from '@/types';
import { getFileName, guessMimeType } from '@/utils/fileType';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 提取页面中的所有媒体资源（视频和音频）
 */
export function extractMedia(): Resource[] {
  const media: Resource[] = [];
  const seenUrls = new Set<string>();

  // 1. 提取 video 标签
  document.querySelectorAll('video').forEach(video => {
    const src = video.src;
    if (src && !seenUrls.has(src)) {
      seenUrls.add(src);
      const rect = video.getBoundingClientRect();
      media.push({
        id: generateId(),
        url: src,
        name: getFileName(src),
        type: 'video',
        size: 0,
        mimeType: guessMimeType(src),
        thumbnail: video.poster,
        location: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
      });
    }

    // 提取 source 子元素
    video.querySelectorAll('source').forEach(source => {
      const sourceSrc = source.src;
      if (sourceSrc && !seenUrls.has(sourceSrc)) {
        seenUrls.add(sourceSrc);
        media.push({
          id: generateId(),
          url: sourceSrc,
          name: getFileName(sourceSrc),
          type: 'video',
          size: 0,
          mimeType: source.type || guessMimeType(sourceSrc),
        });
      }
    });
  });

  // 2. 提取 audio 标签
  document.querySelectorAll('audio').forEach(audio => {
    const src = audio.src;
    if (src && !seenUrls.has(src)) {
      seenUrls.add(src);
      media.push({
        id: generateId(),
        url: src,
        name: getFileName(src),
        type: 'audio',
        size: 0,
        mimeType: guessMimeType(src),
      });
    }

    // 提取 source 子元素
    audio.querySelectorAll('source').forEach(source => {
      const sourceSrc = source.src;
      if (sourceSrc && !seenUrls.has(sourceSrc)) {
        seenUrls.add(sourceSrc);
        media.push({
          id: generateId(),
          url: sourceSrc,
          name: getFileName(sourceSrc),
          type: 'audio',
          size: 0,
          mimeType: source.type || guessMimeType(sourceSrc),
        });
      }
    });
  });

  // 3. 提取 embed 和 object 标签
  document.querySelectorAll('embed, object').forEach(element => {
    const src = element.getAttribute('src') || element.getAttribute('data');
    if (src && !seenUrls.has(src)) {
      seenUrls.add(src);
      const mimeType = element.getAttribute('type') || guessMimeType(src);
      const type: ResourceType = mimeType.startsWith('video/') ? 'video' :
                                  mimeType.startsWith('audio/') ? 'audio' : 'document';
      if (type !== 'document') {
        media.push({
          id: generateId(),
          url: src,
          name: getFileName(src),
          type,
          size: 0,
          mimeType,
        });
      }
    }
  });

  // 4. 提取 iframe 中的视频（常见视频平台）
  document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.src;
    if (src && isVideoPlatformUrl(src)) {
      if (!seenUrls.has(src)) {
        seenUrls.add(src);
        const rect = iframe.getBoundingClientRect();
        media.push({
          id: generateId(),
          url: src,
          name: getVideoPlatformName(src),
          type: 'video',
          size: 0,
          mimeType: 'text/html',
          location: {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
          },
        });
      }
    }
  });

  // 5. 提取 a 标签中的媒体链接
  document.querySelectorAll('a[href]').forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    const ext = href.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];

    if (ext) {
      if (videoExts.includes(ext) && !seenUrls.has(href)) {
        seenUrls.add(href);
        media.push({
          id: generateId(),
          url: href,
          name: getFileName(href),
          type: 'video',
          size: 0,
          mimeType: guessMimeType(href),
        });
      } else if (audioExts.includes(ext) && !seenUrls.has(href)) {
        seenUrls.add(href);
        media.push({
          id: generateId(),
          url: href,
          name: getFileName(href),
          type: 'audio',
          size: 0,
          mimeType: guessMimeType(href),
        });
      }
    }
  });

  return media;
}

/**
 * 判断是否是视频平台 URL
 */
function isVideoPlatformUrl(url: string): boolean {
  const videoPlatforms = [
    'youtube.com/embed',
    'player.bilibili.com',
    'v.qq.com',
    'player.youku.com',
    'vimeo.com/video',
  ];
  return videoPlatforms.some(platform => url.includes(platform));
}

/**
 * 获取视频平台名称
 */
function getVideoPlatformName(url: string): string {
  if (url.includes('youtube')) return 'YouTube Video';
  if (url.includes('bilibili')) return 'Bilibili Video';
  if (url.includes('v.qq.com')) return '腾讯视频';
  if (url.includes('youku')) return '优酷视频';
  if (url.includes('vimeo')) return 'Vimeo Video';
  return 'Embedded Video';
}

/**
 * 获取媒体文件的实际大小
 */
export async function getMediaSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
}
