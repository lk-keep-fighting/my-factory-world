/**
 * Device library state management using Zustand
 */

import { create } from 'zustand';
import { DeviceLibraryState, DeviceTemplate, Position } from './types';
import { getAllDeviceTemplates } from './library';

export interface DeviceLibraryActions {
  // Template selection
  setSelectedTemplate: (template: DeviceTemplate | null) => void;
  
  // Drag and drop state
  setDragging: (isDragging: boolean) => void;
  setDragData: (data: DeviceLibraryState['dragData'] | null) => void;
  
  // Template management
  addTemplate: (template: DeviceTemplate) => void;
  removeTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<DeviceTemplate>) => void;
  
  // Utility functions
  reset: () => void;
  getTemplatesByCategory: (category: DeviceTemplate['category']) => DeviceTemplate[];
}

export type DeviceLibraryStore = DeviceLibraryState & DeviceLibraryActions;

const defaultTemplates = getAllDeviceTemplates();

export const useDeviceLibraryStore = create<DeviceLibraryStore>((set, get) => ({
  // Initial state
  templates: defaultTemplates,
  selectedTemplate: null,
  isDragging: false,
  dragData: null,

  // Template selection actions
  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
  },

  // Drag and drop actions
  setDragging: (isDragging) => {
    set({ isDragging });
    if (!isDragging) {
      set({ dragData: null });
    }
  },

  setDragData: (dragData) => {
    set({ dragData });
  },

  // Template management actions
  addTemplate: (template) => {
    const { templates } = get();
    
    // Check for duplicate IDs
    if (templates.some(t => t.id === template.id)) {
      throw new Error(`Template with ID "${template.id}" already exists`);
    }
    
    set({
      templates: [...templates, template]
    });
  },

  removeTemplate: (templateId) => {
    const { templates, selectedTemplate } = get();
    
    set({
      templates: templates.filter(t => t.id !== templateId),
      selectedTemplate: selectedTemplate?.id === templateId ? null : selectedTemplate
    });
  },

  updateTemplate: (templateId, updates) => {
    const { templates, selectedTemplate } = get();
    
    const updatedTemplates = templates.map(template => 
      template.id === templateId 
        ? { ...template, ...updates }
        : template
    );
    
    set({
      templates: updatedTemplates,
      selectedTemplate: selectedTemplate?.id === templateId 
        ? { ...selectedTemplate, ...updates }
        : selectedTemplate
    });
  },

  // Utility functions
  reset: () => {
    set({
      selectedTemplate: null,
      isDragging: false,
      dragData: null,
      templates: defaultTemplates
    });
  },

  getTemplatesByCategory: (category) => {
    const { templates } = get();
    return templates.filter(template => template.category === category);
  }
}));

// Convenience hook for device library drag and drop
export function useDeviceLibraryDragDrop() {
  const store = useDeviceLibraryStore();
  
  return {
    startDrag: (template: DeviceTemplate, event?: React.DragEvent) => {
      const dragData = {
        template,
        startPosition: event ? { x: event.clientX, y: event.clientY } : { x: 0, y: 0 }
      };
      
      store.setDragData(dragData);
      store.setDragging(true);
      
      if (event) {
        event.dataTransfer.setData('text/plain', template.id);
        event.dataTransfer.setData('application/json', JSON.stringify({
          type: 'device-template',
          templateId: template.id,
          template
        }));
      }
    },
    
    endDrag: () => {
      store.setDragging(false);
      store.setDragData(null);
    },
    
    isDragging: store.isDragging,
    dragData: store.dragData
  };
}

// Hook for template operations
export function useDeviceTemplates() {
  const store = useDeviceLibraryStore();
  
  return {
    templates: store.templates,
    selectedTemplate: store.selectedTemplate,
    setSelectedTemplate: store.setSelectedTemplate,
    addTemplate: store.addTemplate,
    removeTemplate: store.removeTemplate,
    updateTemplate: store.updateTemplate,
    getTemplatesByCategory: store.getTemplatesByCategory,
    reset: store.reset
  };
}