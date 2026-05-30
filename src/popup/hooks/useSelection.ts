import { useState, useCallback } from 'react';
import { Resource } from '@/types';

/**
 * 资源选择状态管理 Hook
 */
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 切换选择状态
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全选
  const selectAll = useCallback((resources: Resource[]) => {
    setSelectedIds(new Set(resources.map(r => r.id)));
  }, []);

  // 取消全选
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 是否已选中
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  // 获取选中的资源
  const getSelectedResources = useCallback((resources: Resource[]) => {
    return resources.filter(r => selectedIds.has(r.id));
  }, [selectedIds]);

  // 是否全选
  const isAllSelected = useCallback((resources: Resource[]) => {
    return resources.length > 0 && resources.every(r => selectedIds.has(r.id));
  }, [selectedIds]);

  // 已选数量
  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedResources,
    isAllSelected,
  };
}
