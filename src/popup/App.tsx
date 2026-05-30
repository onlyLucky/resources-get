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

  // 自动嗅探
  useEffect(() => {
    if (autoDetect) {
      extractResources();
    }
  }, [autoDetect, extractResources]);

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

      // 高亮元素
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        data: { url: resource.url },
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
          <AutoDetectToggle enabled={autoDetect} onChange={setAutoDetect} />
          <button
            onClick={extractResources}
            disabled={loading}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                嗅探中...
              </span>
            ) : (
              '嗅探'
            )}
          </button>
        </div>
      </div>

      {/* Tab 栏 */}
      <TabBar
        activeCategory={category}
        counts={counts}
        onCategoryChange={setCategory}
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
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 资源列表 */}
      <ResourceList
        resources={resources}
        selectedIds={new Set(getSelectedResources(resources).map(r => r.id))}
        onToggleSelect={toggleSelection}
        onClick={handleResourceClick}
        onDownload={handleDownloadSingle}
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
