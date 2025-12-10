import { create } from 'zustand';
import { AnyDevice, EditorLayout, Position } from '../simulation/types';

export const GRID_SIZE = 20;

export interface EditorHistoryState {
  devices: AnyDevice[];
  connections: any[];
  selectedDevice: string | null;
}

export interface HistoryEntry {
  timestamp: number;
  action: string;
  state: EditorHistoryState;
}

export interface EditorState extends EditorLayout {
  selectedDevice: string | null;
  dragState: {
    isDragging: boolean;
    dragType: string | null;
    dragOffset: Position;
  };
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxHistoryDepth: number;
  gridEnabled: boolean;
}

export interface EditorActions {
  // Device operations
  addDevice: (device: AnyDevice) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<AnyDevice>) => void;
  
  // Selection
  selectDevice: (deviceId: string | null) => void;
  
  // Drag and drop
  startDrag: (deviceType: string, offset?: Position) => void;
  endDrag: () => void;
  updateDrag: (position: Position) => void;
  
  // History management
  recordHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Grid operations
  snapToGrid: (position: Position) => Position;
  toggleGrid: () => void;
}

export type EditorStore = EditorState & EditorActions;

function createDeviceFromType(type: string, position: Position): AnyDevice {
  const baseId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const baseDevice = {
    id: baseId,
    type: type as any,
    position,
    width: 60,
    height: 40,
    state: 'stopped' as const
  };

  switch (type) {
    case 'conveyor':
      return {
        ...baseDevice,
        type: 'conveyor',
        speed: 1.0,
        direction: 'right'
      };
    case 'source':
      return {
        ...baseDevice,
        type: 'source',
        generationRate: 1.0
      };
    case 'sink':
      return {
        ...baseDevice,
        type: 'sink'
      };
    case 'junction':
      return {
        ...baseDevice,
        type: 'junction',
        outputDirection: 'right'
      };
    default:
      throw new Error(`Unknown device type: ${type}`);
  }
}

function cloneState(state: EditorState): EditorHistoryState {
  return {
    devices: JSON.parse(JSON.stringify(state.devices)),
    connections: JSON.parse(JSON.stringify(state.connections)),
    selectedDevice: state.selectedDevice
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  devices: [],
  connections: [],
  selectedDevice: null,
  dragState: {
    isDragging: false,
    dragType: null,
    dragOffset: { x: 0, y: 0 }
  },
  undoStack: [],
  redoStack: [],
  maxHistoryDepth: 50,
  gridEnabled: true,

  // Device operations
  addDevice: (device) => {
    const recordHistory = get().recordHistory;
    set((state) => ({
      ...state,
      devices: [...state.devices, device],
      selectedDevice: device.id
    }));
    recordHistory('addDevice');
  },

  removeDevice: (deviceId) => {
    const recordHistory = get().recordHistory;
    set((state) => ({
      ...state,
      devices: state.devices.filter(d => d.id !== deviceId),
      connections: state.connections.filter(
        c => c.fromDeviceId !== deviceId && c.toDeviceId !== deviceId
      ),
      selectedDevice: state.selectedDevice === deviceId ? null : state.selectedDevice
    }));
    recordHistory('removeDevice');
  },

  updateDevice: (deviceId, updates) => {
    const recordHistory = get().recordHistory;
    set((state) => ({
      ...state,
      devices: state.devices.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      )
    }));
    recordHistory('updateDevice');
  },

  selectDevice: (deviceId) => {
    set({ selectedDevice: deviceId });
  },

  startDrag: (deviceType, offset = { x: 0, y: 0 }) => {
    set({
      dragState: {
        isDragging: true,
        dragType: deviceType,
        dragOffset: offset
      }
    });
  },

  endDrag: () => {
    set({
      dragState: {
        isDragging: false,
        dragType: null,
        dragOffset: { x: 0, y: 0 }
      }
    });
  },

  snapToGrid: (position) => {
    const gridEnabled = get().gridEnabled;
    if (!gridEnabled) return position;
    return {
      x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
    };
  },

  toggleGrid: () => {
    set((state) => ({ gridEnabled: !state.gridEnabled }));
  },

  recordHistory: (action) => {
    const historyState = cloneState(get());
    const undoStack = get().undoStack;
    const maxHistoryDepth = get().maxHistoryDepth;
    
    const newEntry: HistoryEntry = {
      timestamp: Date.now(),
      action,
      state: historyState
    };

    set((state) => ({
      ...state,
      undoStack: [...state.undoStack, newEntry].slice(-maxHistoryDepth),
      redoStack: []
    }));
  },

  undo: () => {
    const { undoStack, redoStack, recordHistory } = get();
    if (undoStack.length === 0) return;

    const currentState = cloneState(get());
    const lastUndoEntry = undoStack[undoStack.length - 1];
    
    set((state) => ({
      ...state,
      redoStack: [...redoStack, {
        timestamp: Date.now(),
        action: 'undo',
        state: currentState
      }],
      undoStack: undoStack.slice(0, -1)
    }));

    // Restore previous state
    const previousState = lastUndoEntry.state;
    set({
      devices: previousState.devices,
      connections: previousState.connections,
      selectedDevice: previousState.selectedDevice
    });
  },

  redo: () => {
    const { undoStack, redoStack, recordHistory } = get();
    if (redoStack.length === 0) return;

    const currentState = cloneState(get());
    const lastRedoEntry = redoStack[redoStack.length - 1];
    
    set((state) => ({
      ...state,
      undoStack: [...undoStack, {
        timestamp: Date.now(),
        action: 'redo',
        state: currentState
      }],
      redoStack: redoStack.slice(0, -1)
    }));

    // Restore next state
    const nextState = lastRedoEntry.state;
    set({
      devices: nextState.devices,
      connections: nextState.connections,
      selectedDevice: nextState.selectedDevice
    });
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
  }
}));


// Convenience hook for drag and drop operations
export function useDragDrop() {
  const store = useEditorStore();
  
  return {
    startDrag: (deviceType: string, e?: React.DragEvent) => {
      const offset = e ? { x: e.offsetX, y: e.offsetY } : undefined;
      store.startDrag(deviceType, offset);
      e?.dataTransfer.setData('text/plain', deviceType);
    },
    
    handleDrop: (position: Position, e?: React.DragEvent) => {
      const snapToGrid = store.snapToGrid;
      const draggedType = e?.dataTransfer.getData('text/plain') || store.dragState.dragType;
      
      if (draggedType) {
        const snappedPosition = snapToGrid(position);
        const device = createDeviceFromType(draggedType, snappedPosition);
        store.addDevice(device);
      }
      store.endDrag();
    }
  };
}

// Hook for keyboard interactions
export function useKeyboardInteractions() {
  const store = useEditorStore();
  const selectedDeviceId = store.selectedDevice;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedDeviceId) return;

    switch (e.key.toLowerCase()) {
      case 'r':
        e.preventDefault();
        const device = store.devices.find(d => d.id === selectedDeviceId);
        if (device?.type === 'conveyor' || device?.type === 'junction') {
          const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
          const prop = device.type === 'conveyor' ? 'direction' : 'outputDirection';
          const currentDir = (device as any)[prop];
          const currentIndex = directions.indexOf(currentDir);
          const nextIndex = (currentIndex + 1) % directions.length;
          store.updateDevice(selectedDeviceId, { [prop]: directions[nextIndex] });
        }
        break;
        
      case 'delete':
      case 'backspace':
        e.preventDefault();
        store.removeDevice(selectedDeviceId);
        break;
        
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            store.redo();
          } else {
            store.undo();
          }
        }
        break;
    }
  };

  return { handleKeyDown };
}
