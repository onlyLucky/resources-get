import React from 'react';
import { Resource } from '@/types';
import { formatFileSize } from '@/utils/fileSize';

interface ResourceItemProps {
  resource: Resource;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
}

// 资源类型图标
const typeIcons: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  document: '📄',
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
        {resource.type === 'image' && resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.name}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-2xl">{typeIcons[resource.type] || '📁'}</span>
        )}
      </div>

      {/* 信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{resource.name}</span>
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${typeColors[resource.type]}`}>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </button>
    </div>
  );
};
