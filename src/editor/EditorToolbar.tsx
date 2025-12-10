import React from 'react';
import { useEditorStore } from './store';

export interface EditorToolbarProps {
  className?: string;
  availableDevices?: string[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  className = '',
  availableDevices = ['conveyor', 'source', 'sink', 'junction']
}) => {
  const { 
    undoStack, 
    redoStack, 
    gridEnabled,
    toggleGrid,
    undo,
    redo,
    startDrag,
    endDrag
  } = useEditorStore();

  const handleDeviceDragStart = (deviceType: string, e: React.DragEvent) => {
    startDrag(deviceType, { x: e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetHeight / 2 });
    e.dataTransfer.setData('text/plain', deviceType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    endDrag();
  };

  return (
    <div className={`editor-toolbar ${className}`} data-testid="editor-toolbar">
      <div className="toolbar-section">
        <h4>Devices</h4>
        <div className="toolbar-device-list">
          {availableDevices.map(deviceType => (
            <div
              key={deviceType}
              className="toolbar-device-item"
              draggable
              onDragStart={(e) => handleDeviceDragStart(deviceType, e)}
              onDragEnd={handleDragEnd}
              data-device-type={deviceType}
            >
              {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="toolbar-section">
        <h4>Actions</h4>
        <div className="toolbar-action-buttons">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="toolbar-button"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo ({undoStack.length})
          </button>
          
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="toolbar-button"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo ({redoStack.length})
          </button>
          
          <button
            onClick={toggleGrid}
            className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
            title="Toggle Grid (G)"
          >
            ⊞ Grid
          </button>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h4>Shortcuts</h4>
        <div className="toolbar-shortcuts">
          <div className="shortcut-item">
            <kbd>R</kbd> Rotate device
          </div>
          <div className="shortcut-item">
            <kbd>Del</kbd> Delete device
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl+Z</kbd> Undo
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl+Shift+Z</kbd> Redo
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;