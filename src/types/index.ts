// 资源类型
export type ResourceType = 'image' | 'video' | 'audio' | 'document';

// 资源分类
export type ResourceCategory = 'all' | 'image' | 'media' | 'document';

// 资源信息接口
export interface Resource {
  id: string;                    // 唯一标识
  url: string;                   // 资源 URL
  name: string;                  // 文件名
  type: ResourceType;            // 资源类型
  size: number;                  // 文件大小 (bytes)
  mimeType: string;              // MIME 类型
  thumbnail?: string;            // 缩略图 URL
  location?: {                   // 元素在页面中的位置
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 排序方式
export type SortBy = 'name' | 'size-asc' | 'size-desc' | 'type';

// 通信消息类型
export interface Message {
  type: 'EXTRACT_RESOURCES' | 'SCROLL_TO_ELEMENT' | 'HIGHLIGHT_ELEMENT' | 'RESOURCES_EXTRACTED';
  data?: any;
}
