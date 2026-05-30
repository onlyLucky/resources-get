import React from 'react';
import { Resource } from '@/types';
import { ResourceItem } from './ResourceItem';

interface ResourceListProps {
  resources: Resource[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onClick: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  selectedIds,
  onToggleSelect,
  onClick,
  onDownload,
}) => {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-sm">暂无资源</p>
        <p className="text-xs mt-1">点击"嗅探"按钮开始扫描</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {resources.map(resource => (
        <ResourceItem
          key={resource.id}
          resource={resource}
          isSelected={selectedIds.has(resource.id)}
          onToggleSelect={onToggleSelect}
          onClick={onClick}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};
