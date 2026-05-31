import React, { useState } from 'react';
import { Resource } from '@/types';
import { ResourceItem } from './ResourceItem';
import { FolderOpen, Loader2 } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onClick: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
  loading?: boolean;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  selectedIds,
  onToggleSelect,
  onClick,
  onDownload,
  loading = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (resource: Resource) => {
    setActiveId(resource.id);
    onClick(resource);
  };

  if (loading && resources.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-gray-600">正在嗅探页面资源...</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FolderOpen size={64} className="mb-4" />
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
          isActive={activeId === resource.id}
          onToggleSelect={onToggleSelect}
          onClick={handleClick}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};
