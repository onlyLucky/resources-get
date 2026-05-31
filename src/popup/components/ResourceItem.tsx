import React, { useState, useEffect } from 'react';
import { Resource } from '@/types';
import { formatFileSize } from '@/utils/fileSize';
import { Image, Film, Music, File, Folder, Download } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface ResourceItemProps {
  resource: Resource;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
}

// 资源类型图标
const typeIcons: Record<string, React.ReactNode> = {
  image: <Image size={24} className="text-green-500" />,
  video: <Film size={24} className="text-purple-500" />,
  audio: <Music size={24} className="text-orange-500" />,
  document: <File size={24} className="text-blue-500" />,
};

// 资源类型标签颜色
const typeColors: Record<string, string> = {
  image: 'bg-green-100 text-green-700',
  video: 'bg-purple-100 text-purple-700',
  audio: 'bg-orange-100 text-orange-700',
  document: 'bg-blue-100 text-blue-700',
};

export const ResourceItem: React.FC<ResourceItemProps> = ({
  resource,
  isSelected,
  onToggleSelect,
  onClick,
  onDownload,
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(resource.thumbnail);
  const [imageError, setImageError] = useState(false);

  // 当图片加载失败时，通过 content script 获取图片
  useEffect(() => {
    if (resource.type === 'image' && imageError && resource.thumbnail) {
      // 通过 content script 获取图片数据
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) return;

        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'FETCH_IMAGE',
            data: { url: resource.thumbnail },
          },
          (response) => {
            if (response?.success && response.data) {
              setImageSrc(response.data);
            }
          }
        );
      });
    }
  }, [resource, imageError]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelect(resource.id);
  };

  const handleClick = () => {
    onClick(resource);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(resource);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageSrc(undefined);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
      onClick={handleClick}
    >
      {/* 复选框 */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleCheckboxChange}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />

      {/* 预览图/图标 */}
      <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
        {resource.type === 'image' && imageSrc ? (
          <img
            src={imageSrc}
            alt={resource.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          typeIcons[resource.type] || <Folder size={24} className="text-gray-400" />
        )}
      </div>

      {/* 信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Tooltip content={resource.name}>
            <span className="text-sm font-medium text-gray-900 truncate block max-w-[200px]">
              {resource.name}
            </span>
          </Tooltip>
          <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${typeColors[resource.type]}`}>
            {resource.type}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{formatFileSize(resource.size)}</span>
          <span>•</span>
          <span className="truncate">{resource.mimeType}</span>
        </div>
      </div>

      {/* 下载按钮 */}
      <button
        onClick={handleDownload}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="下载"
      >
        <Download size={16} />
      </button>
    </div>
  );
};
