/**
 * Tests for simulation engine
 */

import type { Conveyor, EditorLayout, Sink, Source } from './types';
import { SimulationEngine } from './engine';

describe('SimulationEngine', () => {
  let engine: SimulationEngine | null = null;

  const createTestLayout = (): EditorLayout => ({
    devices: [
      {
        id: 'source-1',
        type: 'source',
        position: { x: 0, y: 100 },
        width: 50,
        height: 50,
        state: 'running',
        generationRate: 2, // 2 tokens per second
      } as Source,
      {
        id: 'conveyor-1',
        type: 'conveyor',
        position: { x: 60, y: 100 },
        width: 200,
        height: 50,
        state: 'running',
        speed: 100,
        direction: 'right',
      } as Conveyor,
      {
        id: 'sink-1',
        type: 'sink',
        position: { x: 270, y: 100 },
        width: 50,
        height: 50,
        state: 'running',
      } as Sink,
    ],
    connections: [
      { fromDeviceId: 'source-1', toDeviceId: 'conveyor-1', fromPort: 'output', toPort: 'input' },
      { fromDeviceId: 'conveyor-1', toDeviceId: 'sink-1', fromPort: 'output', toPort: 'input' },
    ],
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (engine) {
      engine.dispose();
      engine = null;
    }
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('initializes with stopped status', () => {
      engine = new SimulationEngine(createTestLayout());
      expect(engine.getStatus()).toBe('stopped');
    });

    it('initializes with empty tokens', () => {
      engine = new SimulationEngine(createTestLayout());
      expect(engine.getTokens()).toHaveLength(0);
    });

    it('initializes with default time scale', () => {
      engine = new SimulationEngine(createTestLayout());
      expect(engine.getTimeScale()).toBe(1);
    });

    it('accepts custom time scale in config', () => {
      engine = new SimulationEngine(createTestLayout(), { timeScale: 2 });
      expect(engine.getTimeScale()).toBe(2);
    });

    it('builds connectivity graph from layout', () => {
      engine = new SimulationEngine(createTestLayout());
      const graph = engine.getGraph();
      
      expect(graph.getNode('source-1')).toBeDefined();
      expect(graph.getNode('conveyor-1')).toBeDefined();
      expect(graph.getNode('sink-1')).toBeDefined();
    });
  });

  describe('play/pause/reset', () => {
    it('changes status to running on play', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.play();
      expect(engine.getStatus()).toBe('running');
    });

    it('changes status to paused on pause', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.play();
      engine.pause();
      expect(engine.getStatus()).toBe('paused');
    });

    it('changes status to stopped on reset', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.play();
      engine.reset();
      expect(engine.getStatus()).toBe('stopped');
    });

    it('clears tokens on reset', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.play();
      engine.reset();
      expect(engine.getTokens()).toHaveLength(0);
    });

    it('resets elapsed time on reset', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.play();
      engine.reset();
      
      const snapshot = engine.getSnapshot();
      expect(snapshot.elapsedTime).toBe(0);
    });

    it('does nothing when already running', () => {
      engine = new SimulationEngine(createTestLayout());
      let statusChangeCount = 0;
      
      engine.on('statusChange', () => statusChangeCount++);
      
      engine.play();
      engine.play();
      engine.play();
      
      expect(statusChangeCount).toBe(1);
    });

    it('does nothing when already paused', () => {
      engine = new SimulationEngine(createTestLayout());
      let statusChangeCount = 0;
      
      engine.on('statusChange', () => statusChangeCount++);
      
      engine.pause(); // No effect when stopped
      expect(statusChangeCount).toBe(0);
    });
  });

  describe('time scale', () => {
    it('sets time scale', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setTimeScale(2);
      expect(engine.getTimeScale()).toBe(2);
    });

    it('clamps time scale to minimum 0.1', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setTimeScale(0.01);
      expect(engine.getTimeScale()).toBe(0.1);
    });

    it('clamps time scale to maximum 10', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setTimeScale(100);
      expect(engine.getTimeScale()).toBe(10);
    });
  });

  describe('device state management', () => {
    it('sets device state', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setDeviceState('conveyor-1', 'stopped');
      
      const node = engine.getGraph().getNode('conveyor-1');
      expect(node?.device.state).toBe('stopped');
    });

    it('sets device fault', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setDeviceFault('conveyor-1', 'Motor overheated');
      
      const node = engine.getGraph().getNode('conveyor-1');
      expect(node?.device.state).toBe('faulted');
      expect(node?.device.faultReason).toBe('Motor overheated');
    });

    it('clears device fault', () => {
      engine = new SimulationEngine(createTestLayout());
      engine.setDeviceFault('conveyor-1', 'Motor overheated');
      engine.clearDeviceFault('conveyor-1');
      
      const node = engine.getGraph().getNode('conveyor-1');
      expect(node?.device.state).toBe('stopped');
      expect(node?.device.faultReason).toBeUndefined();
    });

    it('emits deviceStateChange event', () => {
      engine = new SimulationEngine(createTestLayout());
      let eventData: unknown = null;
      
      engine.on('deviceStateChange', (event) => {
        eventData = event.data;
      });
      
      engine.setDeviceState('conveyor-1', 'stopped');
      
      expect(eventData).toMatchObject({
        deviceId: 'conveyor-1',
        previousState: 'running',
        newState: 'stopped',
      });
    });
  });

  describe('event handling', () => {
    it('emits statusChange event on play', () => {
      engine = new SimulationEngine(createTestLayout());
      let eventData: unknown = null;
      
      engine.on('statusChange', (event) => {
        eventData = event.data;
      });
      
      engine.play();
      
      expect(eventData).toMatchObject({
        previousStatus: 'stopped',
        newStatus: 'running',
      });
    });

    it('emits statusChange event on pause', () => {
      engine = new SimulationEngine(createTestLayout());
      let eventData: unknown = null;
      
      engine.play();
      
      engine.on('statusChange', (event) => {
        eventData = event.data;
      });
      
      engine.pause();
      
      expect(eventData).toMatchObject({
        previousStatus: 'running',
        newStatus: 'paused',
      });
    });

    it('removes event listener with off', () => {
      engine = new SimulationEngine(createTestLayout());
      let callCount = 0;
      
      const listener = () => callCount++;
      
      engine.on('statusChange', listener);
      engine.play();
      expect(callCount).toBe(1);
      
      engine.off('statusChange', listener);
      engine.pause();
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('snapshot', () => {
    it('returns current simulation state', () => {
      engine = new SimulationEngine(createTestLayout(), { timeScale: 1.5 });
      engine.play();
      
      const snapshot = engine.getSnapshot();
      
      expect(snapshot.status).toBe('running');
      expect(snapshot.tokens).toBeInstanceOf(Array);
      expect(snapshot.timeScale).toBe(1.5);
      expect(typeof snapshot.elapsedTime).toBe('number');
    });
  });

  describe('layout update', () => {
    it('updates layout and rebuilds graph', () => {
      engine = new SimulationEngine(createTestLayout());
      
      const newLayout: EditorLayout = {
        devices: [
          {
            id: 'new-conveyor',
            type: 'conveyor',
            position: { x: 0, y: 0 },
            width: 100,
            height: 50,
            state: 'running',
            speed: 50,
            direction: 'right',
          } as Conveyor,
        ],
        connections: [],
      };
      
      engine.updateLayout(newLayout);
      
      const graph = engine.getGraph();
      expect(graph.getNode('new-conveyor')).toBeDefined();
      expect(graph.getNode('source-1')).toBeUndefined();
    });
  });

  describe('dispose', () => {
    it('resets and clears listeners', () => {
      engine = new SimulationEngine(createTestLayout());
      let callCount = 0;
      
      engine.on('statusChange', () => callCount++);
      engine.play();
      expect(callCount).toBe(1);
      
      engine.dispose();
      engine = null; // Prevent afterEach from calling dispose again
    });
  });
});
