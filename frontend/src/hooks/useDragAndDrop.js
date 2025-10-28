import { useState, useCallback } from 'react';

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = useCallback((e, item, sourceColumn) => {
    setDraggedItem({ item, sourceColumn });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }, []);

  const handleDragOver = useCallback((e, targetColumn) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(targetColumn);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear drag over if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetColumn, onMove) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.sourceColumn !== targetColumn) {
      onMove(draggedItem.item, draggedItem.sourceColumn, targetColumn);
    }
    
    setDraggedItem(null);
    setDragOverColumn(null);
  }, [draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverColumn(null);
  }, []);

  return {
    draggedItem,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
};
