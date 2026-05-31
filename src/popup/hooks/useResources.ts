import { useState, useCallback, useEffect } from 'react';
import { Resource, ResourceCategory, SortBy } from '@/types';

// 缓存 key
const CACHE_KEY = 'resource-sniffer-cache';

/**
 * 资源管理 Hook
 */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ResourceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('size-desc');
  const [hasExtracted, setHasExtracted] = useState(false);

  // 获取当前标签页的 URL
  const getCurrentTabUrl = useCallback(async (): Promise<string | null> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab.url || null;
    } catch {
      return null;
    }
  }, []);

  // 获取网站域名（用于比较是否是同一个网站）
  const getDomain = useCallback((url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }, []);

  // 加载缓存的资源
  useEffect(() => {
    const loadCache = async () => {
      if (!chrome?.storage?.local) return;

      const currentUrl = await getCurrentTabUrl();
      if (!currentUrl) return;

      const currentDomain = getDomain(currentUrl);

      chrome.storage.local.get([CACHE_KEY], (result) => {
        if (result[CACHE_KEY]) {
          const cached = result[CACHE_KEY];
          const cachedDomain = getDomain(cached.url || '');

          // 检查是否是同一个网站，且缓存在 5 分钟内有效
          const now = Date.now();
          const isValid = cachedDomain === currentDomain &&
                          cached.timestamp &&
                          now - cached.timestamp < 5 * 60 * 1000;

          if (isValid) {
            setResources(cached.resources || []);
            setHasExtracted(true);
          } else {
            // 不是同一个网站，清除缓存
            setResources([]);
            setHasExtracted(false);
          }
        }
      });
    };

    loadCache();
  }, [getCurrentTabUrl, getDomain]);

  // 保存资源到缓存
  const saveToCache = useCallback(async (resourcesToSave: Resource[]) => {
    if (chrome?.storage?.local) {
      const currentUrl = await getCurrentTabUrl();
      chrome.storage.local.set({
        [CACHE_KEY]: {
          resources: resourcesToSave,
          url: currentUrl || '',
          timestamp: Date.now(),
        }
      });
    }
  }, [getCurrentTabUrl]);

  // 清除缓存
  const clearCache = useCallback(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.remove(CACHE_KEY);
    }
  }, []);

  // 提取资源（用户点击嗅探按钮时调用）
  const extractResources = useCallback(async (forceRefresh: boolean = true) => {
    setLoading(true);
    setError(null);

    // 如果是强制刷新，清空列表
    if (forceRefresh) {
      setResources([]);
      clearCache();
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab');

      // 发送消息到 Content Script，如果失败则注入后重试
      const sendMessageToContent = async (): Promise<any> => {
        try {
          return await chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT_RESOURCES' });
        } catch {
          // Content Script 可能未加载，尝试注入
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ['content.js'],
            });
            // 等待脚本加载
            await new Promise(resolve => setTimeout(resolve, 200));
            return await chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT_RESOURCES' });
          } catch {
            throw new Error('无法连接到页面，请刷新页面后重试');
          }
        }
      };

      const response = await sendMessageToContent();

      if (response.success) {
        setResources(response.data);
        setHasExtracted(true);
        // 保存到缓存
        saveToCache(response.data);
      } else {
        throw new Error(response.error || 'Failed to extract resources');
      }
    } catch (err) {
      setError(String(err));
      console.error('Extract resources error:', err);
    } finally {
      setLoading(false);
    }
  }, [saveToCache, clearCache]);

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
    hasExtracted,
    setCategory,
    setSearchQuery,
    setSortBy,
    extractResources,
    clearCache,
  };
}
