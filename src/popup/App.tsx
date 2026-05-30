import React, { useState, useEffect } from 'react';
import { Resource } from '@/types';
import { downloadSingle } from '@/utils/download';
import { useResources } from './hooks/useResources';
import { useSelection } from './hooks/useSelection';
import { TabBar } from './components/TabBar';
import { SearchBar } from './components/SearchBar';
import { ResourceList } from './components/ResourceList';
import { DownloadBar } from './components/DownloadBar';
import { AutoDetectToggle } from './components/AutoDetectToggle';
import { Loader2, Search, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const {
    resources,
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
  } = useResources();

  const {
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedResources,
    isAllSelected,
  } = useSelection();

  const [autoDetect, setAutoDetect] = useState(false);
  const [autoDetectLoaded, setAutoDetectLoaded] = useState(false);

  // 加载自动嗅探状态
  useEffect(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['autoDetect'], (result) => {
        if (result.autoDetect !== undefined) {
          setAutoDetect(result.autoDetect);
        }
        setAutoDetectLoaded(true);
      });
    } else {
      // chrome.storage 不可用时直接标记为已加载
      setAutoDetectLoaded(true);
    }
  }, []);

  // 保存自动嗅探状态
  const handleAutoDetectChange = (value: boolean) => {
    setAutoDetect(value);
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ autoDetect: value });
    }
  };

  // 自动嗅探（仅在状态加载完成后且开启时执行）
  useEffect(() => {
    if (autoDetectLoaded && autoDetect) {
      extractResources();
    }
  }, [autoDetectLoaded, autoDetect, extractResources]);

  // 清除所有高亮标记
  const clearAllHighlights = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
      }
    } catch (error) {
      console.error('Failed to clear highlights:', error);
    }
  };

  // 切换分类时清除高亮
  const handleCategoryChange = (newCategory: typeof category) => {
    clearAllHighlights();
    setCategory(newCategory);
  };

  // 点击资源项 - 滚动到元素并高亮
  const handleResourceClick = async (resource: Resource) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // 滚动到元素位置
      if (resource.location) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SCROLL_TO_ELEMENT',
          data: { location: resource.location },
        });
      }

      // 高亮元素（持久高亮）
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        data: { url: resource.url, persistent: true },
      });
    } catch (error) {
      console.error('Failed to scroll/highlight:', error);
    }
  };

  // 单个下载
  const handleDownloadSingle = async (resource: Resource) => {
    await downloadSingle(resource);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">资源嗅探器</h1>
        <div className="flex items-center gap-3">
          <AutoDetectToggle enabled={autoDetect} onChange={handleAutoDetectChange} />
          <button
            onClick={extractResources}
            disabled={loading}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <Loader2 size={16} className="animate-spin" />
                嗅探中...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Search size={16} />
                嗅探
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 栏 */}
      <TabBar
        activeCategory={category}
        counts={counts}
        onCategoryChange={handleCategoryChange}
      />

      {/* 搜索和排序 */}
      <SearchBar
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
      />

      {/* 加载状态 */}
      {loading && resources.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-gray-600">正在嗅探页面资源...</p>
          <p className="text-xs text-gray-400 mt-1">请稍候</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={extractResources}
                className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <RefreshCw size={12} />
                重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 资源列表 */}
      <ResourceList
        resources={resources}
        selectedIds={new Set(getSelectedResources(resources).map(r => r.id))}
        onToggleSelect={toggleSelection}
        onClick={handleResourceClick}
        onDownload={handleDownloadSingle}
        loading={loading}
      />

      {/* 下载操作栏 */}
      <DownloadBar
        resources={resources}
        selectedCount={selectedCount}
        isAllSelected={isAllSelected(resources)}
        onSelectAll={() => selectAll(resources)}
        onDeselectAll={deselectAll}
        getSelectedResources={() => getSelectedResources(resources)}
      />
    </div>
  );
};

export default App;
