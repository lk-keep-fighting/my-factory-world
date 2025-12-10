/**
 * DeviceLibraryPanel component - displays available devices for selection and drag operations
 */

import React, { useState } from 'react';
import { 
  DeviceTemplate, 
  DeviceLibraryPanelProps, 
  PixelArtThumbnail,
  ConnectorDirection 
} from './types';
import { getAllDeviceTemplates } from './library';
import { useDeviceLibraryStore } from './store';
import './styles.css';

function PixelArtRenderer({ thumbnail }: { thumbnail: PixelArtThumbnail }) {
  return (
    <svg 
      width={thumbnail.width} 
      height={thumbnail.height} 
      viewBox={`0 0 ${thumbnail.width} ${thumbnail.height}`}
      className="device-thumbnail"
    >
      {thumbnail.pixels.map((pixel, index) => (
        <rect
          key={index}
          x={pixel.x}
          y={pixel.y}
          width={1}
          height={1}
          fill={pixel.color}
        />
      ))}
    </svg>
  );
}

function DeviceItem({ 
  template, 
  isSelected, 
  onSelect, 
  onDragStart 
}: {
  template: DeviceTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (event: React.DragEvent) => void;
}) {
  return (
    <div 
      className={`device-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      title={template.displayName}
    >
      <div className="device-thumbnail-container">
        <PixelArtRenderer thumbnail={template.thumbnail} />
      </div>
      <div className="device-info">
        <span className="device-name">{template.displayName}</span>
        <span className={`device-category device-category-${template.category}`}>
          {template.category}
        </span>
      </div>
    </div>
  );
}

function CategorySection({ 
  category, 
  templates, 
  selectedTemplate, 
  onTemplateSelect, 
  onDragStart 
}: {
  category: string;
  templates: DeviceTemplate[];
  selectedTemplate: DeviceTemplate | null;
  onTemplateSelect: (template: DeviceTemplate | null) => void;
  onDragStart: (template: DeviceTemplate) => (event: React.DragEvent) => void;
}) {
  return (
    <div className="category-section">
      <h4 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
      <div className="device-grid">
        {templates.map(template => (
          <DeviceItem
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={() => onTemplateSelect(template)}
            onDragStart={(event) => onDragStart(template)(event)}
          />
        ))}
      </div>
    </div>
  );
}

export function DeviceLibraryPanel({ 
  selectedTemplate, 
  onTemplateSelect, 
  onDragStart,
  className = '' 
}: DeviceLibraryPanelProps) {
  const { 
    templates, 
    isDragging, 
    dragData,
    setDragging, 
    setDragData 
  } = useDeviceLibraryStore();

  const [filter, setFilter] = useState<string>('');

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (filter && !template.displayName.toLowerCase().includes(filter.toLowerCase()) &&
        !template.category.includes(filter.toLowerCase())) {
      return acc;
    }
    
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, DeviceTemplate[]>);

  const handleDragStart = (template: DeviceTemplate) => (event: React.DragEvent) => {
    const dragData = {
      template,
      startPosition: { x: event.clientX, y: event.clientY }
    };
    
    setDragData(dragData);
    setDragging(true);
    
    // Set drag data for HTML5 drag and drop
    event.dataTransfer.setData('text/plain', template.id);
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'device-template',
      templateId: template.id,
      template: template
    }));
    
    // Call the parent's onDragStart handler
    onDragStart(template, event);
  };

  const handleDragEnd = () => {
    setDragData(null);
    setDragging(false);
  };

  React.useEffect(() => {
    // Clean up drag state on unmount
    return () => {
      setDragData(null);
      setDragging(false);
    };
  }, [setDragData, setDragging]);

  return (
    <div className={`device-library-panel ${className}`} data-testid="device-library-panel">
      <div className="library-header">
        <h3>Device Library</h3>
        <div className="library-controls">
          <input
            type="text"
            placeholder="Search devices..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="library-content">
        {Object.keys(templatesByCategory).length === 0 ? (
          <div className="no-devices-message">
            {filter ? 'No devices match your search' : 'No devices available'}
          </div>
        ) : (
          Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <CategorySection
              key={category}
              category={category}
              templates={categoryTemplates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={onTemplateSelect}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>

      <div className="library-footer">
        <div className="selection-info">
          {selectedTemplate ? (
            <span>
              Selected: {selectedTemplate.displayName}
            </span>
          ) : (
            <span>No device selected</span>
          )}
        </div>
        
        {isDragging && dragData && (
          <div className="drag-preview">
            <div className="drag-info">
              Dragging: {dragData.template.displayName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceLibraryPanel;