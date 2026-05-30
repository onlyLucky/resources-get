import React from 'react';
import { Resource } from '@/types';
import { ResourceItem } from './ResourceItem';
import { FolderOpen } from 'lucide-react';

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
          onToggleSelect={onToggleSelect}
          onClick={onClick}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};
