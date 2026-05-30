import React, { useState } from 'react';
import { Resource } from '@/types';
import { downloadAll, downloadAsZip } from '@/utils/download';
import { Download, Package, Loader2 } from 'lucide-react';

interface DownloadBarProps {
  resources: Resource[];
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getSelectedResources: () => Resource[];
}

export const DownloadBar: React.FC<DownloadBarProps> = ({
  resources,
  selectedCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  getSelectedResources,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSelectAll = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleDownloadSelected = async (asZip: boolean) => {
    const selected = getSelectedResources();
    if (selected.length === 0) return;

    setDownloading(true);
    setProgress({ current: 0, total: selected.length });

    try {
      if (asZip) {
        await downloadAsZip(selected, 'resources.zip', (current, total) => {
          setProgress({ current, total });
        });
      } else {
        await downloadAll(selected);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadAll = async (asZip: boolean) => {
    setDownloading(true);
    setProgress({ current: 0, total: resources.length });

    try {
      if (asZip) {
        await downloadAsZip(resources, 'all-resources.zip', (current, total) => {
          setProgress({ current, total });
        });
      } else {
        await downloadAll(resources);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      {/* 进度条 */}
      {downloading && progress.total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              下载中...
            </span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* 全选按钮 */}
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span>全选</span>
        </button>

        {/* 已选数量 */}
        {selectedCount > 0 && (
          <span className="text-sm text-gray-500">
            已选 {selectedCount} 项
          </span>
        )}

        <div className="flex-1" />

        {/* 下载按钮组 */}
        {selectedCount > 0 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDownloadSelected(false)}
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} />
              逐个下载
            </button>
            <button
              onClick={() => handleDownloadSelected(true)}
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Package size={14} />
              打包下载
            </button>
          </div>
        ) : resources.length > 0 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDownloadAll(false)}
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} />
              全部下载
            </button>
            <button
              onClick={() => handleDownloadAll(true)}
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Package size={14} />
              全部打包
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
