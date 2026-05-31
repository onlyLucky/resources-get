import { Resource } from '@/types';
import { getFileName, guessMimeType } from '@/utils/fileType';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// 文档文件扩展名
const DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'rtf', 'odt', 'ods', 'odp',
  'zip', 'rar', '7z', 'tar', 'gz',
  'epub', 'mobi',
];

/**
 * 提取页面中的所有文档资源
 */
export function extractDocuments(): Resource[] {
  const documents: Resource[] = [];
  const seenUrls = new Set<string>();

  // 1. 提取 a 标签中的文档链接
  document.querySelectorAll('a[href]').forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    const ext = href.split('.').pop()?.toLowerCase();

    if (ext && DOCUMENT_EXTENSIONS.includes(ext)) {
      if (!seenUrls.has(href)) {
        seenUrls.add(href);
        const rect = link.getBoundingClientRect();
        documents.push({
          id: generateId(),
          url: href,
          name: getFileName(href),
          type: 'document',
          size: 0,
          mimeType: guessMimeType(href),
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

  // 2. 提取 iframe 中嵌入的文档
  document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.src;
    if (src && isDocumentUrl(src)) {
      if (!seenUrls.has(src)) {
        seenUrls.add(src);
        const rect = iframe.getBoundingClientRect();
        documents.push({
          id: generateId(),
          url: src,
          name: getDocumentName(src),
          type: 'document',
          size: 0,
          mimeType: guessMimeType(src),
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

  // 3. 提取 embed/object 中的文档
  document.querySelectorAll('embed, object').forEach(element => {
    const src = element.getAttribute('src') || element.getAttribute('data');
    if (src) {
      const mimeType = element.getAttribute('type') || guessMimeType(src);
      if (isDocumentMimeType(mimeType) && !seenUrls.has(src)) {
        seenUrls.add(src);
        documents.push({
          id: generateId(),
          url: src,
          name: getFileName(src),
          type: 'document',
          size: 0,
          mimeType,
        });
      }
    }
  });

  // 4. 提取 Google Docs 嵌入
  document.querySelectorAll('iframe[src*="docs.google.com"]').forEach(iframe => {
    const src = iframe.getAttribute('src');
    if (src && !seenUrls.has(src)) {
      seenUrls.add(src);
      documents.push({
        id: generateId(),
        url: src,
        name: 'Google Doc',
        type: 'document',
        size: 0,
        mimeType: 'text/html',
      });
    }
  });

  return documents;
}

/**
 * 判断是否是文档 URL
 */
function isDocumentUrl(url: string): boolean {
  const docPatterns = [
    'docs.google.com',
    'view.officeapps.live.com',
    'pdf',
    'document',
  ];
  return docPatterns.some(pattern => url.includes(pattern));
}

/**
 * 判断是否是文档 MIME 类型
 */
function isDocumentMimeType(mimeType: string): boolean {
  const docMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.oasis.opendocument',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];
  return docMimes.some(mime => mimeType.includes(mime));
}

/**
 * 获取文档名称
 */
function getDocumentName(url: string): string {
  if (url.includes('docs.google.com')) return 'Google Doc';
  if (url.includes('view.officeapps.live.com')) return 'Office Online';
  return getFileName(url);
}

/**
 * 获取文档文件的实际大小
 */
export async function getDocumentSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
}
