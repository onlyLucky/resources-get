import React from 'react';
import { SortBy } from '@/types';

interface SearchBarProps {
  searchQuery: string;
  sortBy: SortBy;
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: SortBy) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  sortBy,
  onSearchChange,
  onSortChange,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
      {/* 搜索框 */}
      <div className="relative flex-1">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索资源..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => onSearchChange('')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 排序选择 */}
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value as SortBy)}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="name">按名称</option>
        <option value="size-desc">大小 ↓</option>
        <option value="size-asc">大小 ↑</option>
        <option value="type">按类型</option>
      </select>
    </div>
  );
};
