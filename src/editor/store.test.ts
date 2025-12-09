import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from './store';
import { AnyDevice } from '../simulation/types';

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.clearHistory();
      result.current.selectDevice(null);
    });
  });

  describe('Device operations', () => {
    it('should add a device', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const newDevice: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      act(() => {
        result.current.addDevice(newDevice);
      });

      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0]).toEqual(newDevice);
      expect(result.current.selectedDevice).toBe('test-1');
    });

    it('should remove a device', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device1: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };
      
      const device2: AnyDevice = {
        id: 'test-2',
        type: 'source',
        position: { x: 200, y: 200 },
        width: 60,
        height: 40,
        state: 'stopped',
        generationRate: 1.0
      };

      act(() => {
        result.current.addDevice(device1);
        result.current.addDevice(device2);
        result.current.selectDevice('test-1');
        result.current.removeDevice('test-1');
      });

      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].id).toBe('test-2');
      expect(result.current.selectedDevice).toBeNull();
    });

    it('should update a device', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      act(() => {
        result.current.addDevice(device);
        result.current.updateDevice('test-1', { speed: 2.5 });
      });

      expect(result.current.devices[0].speed).toBe(2.5);
    });

    it('should select a device', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.selectDevice('test-1');
      });

      expect(result.current.selectedDevice).toBe('test-1');
    });
  });

  describe('Drag and drop', () => {
    it('should start and end drag', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.startDrag('conveyor', { x: 10, y: 10 });
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.dragType).toBe('conveyor');
      expect(result.current.dragState.dragOffset).toEqual({ x: 10, y: 10 });

      act(() => {
        result.current.endDrag();
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.dragType).toBeNull();
      expect(result.current.dragState.dragOffset).toEqual({ x: 0, y: 0 });
    });

    it('should snap positions to grid', () => {
      const { result } = renderHook(() => useEditorStore());
      
      let snappedPosition = result.current.snapToGrid({ x: 15, y: 23 });
      expect(snappedPosition).toEqual({ x: 20, y: 20 });

      // Test with grid disabled
      act(() => {
        result.current.toggleGrid();
      });

      snappedPosition = result.current.snapToGrid({ x: 15, y: 23 });
      expect(snappedPosition).toEqual({ x: 15, y: 23 });
    });

    it('should toggle grid', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const initialGridEnabled = result.current.gridEnabled;
      
      act(() => {
        result.current.toggleGrid();
      });

      expect(result.current.gridEnabled).toBe(!initialGridEnabled);
    });
  });

  describe('History management', () => {
    it('should record history when adding devices', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      act(() => {
        result.current.addDevice(device);
      });

      expect(result.current.undoStack).toHaveLength(1);
      expect(result.current.undoStack[0].action).toBe('addDevice');
      expect(result.current.redoStack).toHaveLength(0);
    });

    it('should undo and redo operations', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device1: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      act(() => {
        result.current.addDevice(device1);
      });

      // Add a second device
      const device2: AnyDevice = {
        id: 'test-2',
        type: 'source',
        position: { x: 200, y: 200 },
        width: 60,
        height: 40,
        state: 'stopped',
        generationRate: 1.0
      };

      act(() => {
        result.current.addDevice(device2);
      });

      expect(result.current.devices).toHaveLength(2);

      // Undo last operation (add device2)
      act(() => {
        result.current.undo();
      });

      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].id).toBe('test-1');
      expect(result.current.redoStack).toHaveLength(1);

      // Redo the operation
      act(() => {
        result.current.redo();
      });

      expect(result.current.devices).toHaveLength(2);
      expect(result.current.undoStack).toHaveLength(2);
    });

    it('should limit history depth', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      // Set small max history and add many devices
      act(() => {
        result.current.maxHistoryDepth = 3;
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.addDevice({
            ...device,
            id: `test-${i + 1}`
          });
        });
      }

      expect(result.current.undoStack).toHaveLength(3);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const device: AnyDevice = {
        id: 'test-1',
        type: 'conveyor',
        position: { x: 100, y: 100 },
        width: 60,
        height: 40,
        state: 'stopped',
        speed: 1.0,
        direction: 'right'
      };

      act(() => {
        result.current.addDevice(device);
        result.current.updateDevice('test-1', { speed: 2.0 });
      });

      expect(result.current.undoStack).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.undoStack).toHaveLength(0);
      expect(result.current.redoStack).toHaveLength(0);
    });
  });
});

export {};
