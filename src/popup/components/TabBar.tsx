import React from 'react';
import { ResourceCategory } from '@/types';
import { Package, Image, Film, FileText } from 'lucide-react';

interface TabBarProps {
  activeCategory: ResourceCategory;
  counts: Record<ResourceCategory, number>;
  onCategoryChange: (category: ResourceCategory) => void;
}

const tabs: { key: ResourceCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Package size={18} /> },
  { key: 'image', label: '图片', icon: <Image size={18} /> },
  { key: 'media', label: '媒体', icon: <Film size={18} /> },
  { key: 'document', label: '文档', icon: <FileText size={18} /> },
];

export const TabBar: React.FC<TabBarProps> = ({ activeCategory, counts, onCategoryChange }) => {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap
            ${activeCategory === tab.key
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          onClick={() => onCategoryChange(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {counts[tab.key] > 0 && (
            <span className={`ml-0.5 px-1 py-0.5 text-xs rounded-full flex-shrink-0
              ${activeCategory === tab.key
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
              }`}>
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
