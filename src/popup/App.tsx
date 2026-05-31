import React, { useState, useEffect, useRef } from 'react';
import { Resource } from '@/types';
import { downloadSingle } from '@/utils/download';
import { formatFileSize } from '@/utils/fileSize';
import { useResources } from './hooks/useResources';
import { useSelection } from './hooks/useSelection';
import { TabBar } from './components/TabBar';
import { SearchBar } from './components/SearchBar';
import { ResourceList } from './components/ResourceList';
import { DownloadBar } from './components/DownloadBar';
import { AutoDetectToggle } from './components/AutoDetectToggle';
import { Loader2, Search, AlertCircle, RefreshCw, PanelRightOpen } from 'lucide-react';

const App: React.FC = () => {
  const {
    resources,
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
  const isPopupOpen = useRef(true);

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

  // 自动嗅探（仅在状态加载完成后且开启时执行，且未嗅探过时）
  useEffect(() => {
    if (autoDetectLoaded && autoDetect && !hasExtracted) {
      extractResources();
    }
  }, [autoDetectLoaded, autoDetect, hasExtracted, extractResources]);

  // popup 关闭时清除高亮标记
  useEffect(() => {
    const handleBeforeUnload = () => {
      isPopupOpen.current = false;
      // 清除高亮标记
      clearAllHighlights();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时也清除高亮
      clearAllHighlights();
    };
  }, []);

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

      // 高亮元素（持久高亮），传递文件名和大小
      // Content Script 会自动处理滚动和高亮
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        data: {
          url: resource.url,
          persistent: true,
          fileName: resource.name,
          fileSize: resource.size > 0 ? formatFileSize(resource.size) : undefined,
          location: resource.location,
        },
      });
    } catch (error) {
      console.error('Failed to scroll/highlight:', error);
    }
  };

  // 单个下载
  const handleDownloadSingle = async (resource: Resource) => {
    await downloadSingle(resource);
  };

  // 打开侧边栏
  const openSidePanel = async () => {
    try {
      if (chrome?.sidePanel?.open) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          await chrome.sidePanel.open({ tabId: tab.id });
          // 关闭 popup
          window.close();
        }
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">资源嗅探器</h1>
        <div className="flex items-center gap-2">
          <AutoDetectToggle enabled={autoDetect} onChange={handleAutoDetectChange} />
          <button
            onClick={() => extractResources(true)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <button
            onClick={openSidePanel}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="在侧边栏中打开"
          >
            <PanelRightOpen size={18} />
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

      {/* 错误提示 */}
      {error && (
        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => extractResources(true)}
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
