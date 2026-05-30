import { useState, useCallback } from 'react';
import { Resource, ResourceCategory, SortBy } from '@/types';

/**
 * 资源管理 Hook
 */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ResourceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // 提取资源
  const extractResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab');

      // 先尝试注入 Content Script（如果已经注入会跳过）
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
      } catch (e) {
        // 忽略注入错误（可能已经注入了）
        console.log('Content script may already be injected');
      }

      // 等待一小段时间确保脚本加载
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_RESOURCES' });

      if (response.success) {
        setResources(response.data);
      } else {
        throw new Error(response.error || 'Failed to extract resources');
      }
    } catch (err) {
      setError(String(err));
      console.error('Extract resources error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 过滤资源
  const filteredResources = resources.filter(resource => {
    // 分类过滤
    if (category !== 'all') {
      if (category === 'image' && resource.type !== 'image') return false;
      if (category === 'media' && resource.type !== 'video' && resource.type !== 'audio') return false;
      if (category === 'document' && resource.type !== 'document') return false;
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.name.toLowerCase().includes(query) ||
        resource.url.toLowerCase().includes(query) ||
        resource.mimeType.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 排序资源
  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size-asc':
        return a.size - b.size;
      case 'size-desc':
        return b.size - a.size;
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // 统计各分类数量
  const counts = {
    all: resources.length,
    image: resources.filter(r => r.type === 'image').length,
    media: resources.filter(r => r.type === 'video' || r.type === 'audio').length,
    document: resources.filter(r => r.type === 'document').length,
  };

  return {
    resources: sortedResources,
    loading,
    error,
    category,
    searchQuery,
    sortBy,
    counts,
    setCategory,
    setSearchQuery,
    setSortBy,
    extractResources,
  };
}
