/**
 * Tests for connectivity graph utilities
 */

import type { Conveyor, EditorLayout, Source, Sink } from './types';
import {
  buildConnectivityGraph,
  findPath,
  getReachableDevices,
  getSourceDevices,
  getSinkDevices,
  hasCycle,
  topologicalSort,
} from './graph';

describe('Graph Utilities', () => {
  // Helper to create test devices
  const createSource = (id: string): Source => ({
    id,
    type: 'source',
    position: { x: 0, y: 0 },
    width: 50,
    height: 50,
    state: 'running',
    generationRate: 1,
  });

  const createConveyor = (id: string): Conveyor => ({
    id,
    type: 'conveyor',
    position: { x: 100, y: 0 },
    width: 200,
    height: 50,
    state: 'running',
    speed: 100,
    direction: 'right',
  });

  const createSink = (id: string): Sink => ({
    id,
    type: 'sink',
    position: { x: 350, y: 0 },
    width: 50,
    height: 50,
    state: 'running',
  });

  describe('buildConnectivityGraph', () => {
    it('creates nodes for all devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createSink('sink1'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);

      expect(graph.nodes.size).toBe(3);
      expect(graph.getNode('s1')).toBeDefined();
      expect(graph.getNode('c1')).toBeDefined();
      expect(graph.getNode('sink1')).toBeDefined();
    });

    it('establishes connections between devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);

      expect(graph.getConnectedOutputs('s1')).toContain('c1');
      expect(graph.getConnectedInputs('c1')).toContain('s1');
    });

    it('handles multiple outputs from one device', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createConveyor('c2'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 's1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const outputs = graph.getConnectedOutputs('s1');

      expect(outputs).toHaveLength(2);
      expect(outputs).toContain('c1');
      expect(outputs).toContain('c2');
    });

    it('handles disconnected devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);

      expect(graph.getConnectedOutputs('s1')).toHaveLength(0);
      expect(graph.getConnectedInputs('c1')).toHaveLength(0);
    });
  });

  describe('findPath', () => {
    it('finds direct path between connected devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const path = graph.getPath('s1', 'c1');

      expect(path).toEqual(['s1', 'c1']);
    });

    it('finds path through multiple devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createConveyor('c2'),
          createSink('sink1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'sink1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const path = graph.getPath('s1', 'sink1');

      expect(path).toEqual(['s1', 'c1', 'c2', 'sink1']);
    });

    it('returns null when no path exists', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const path = graph.getPath('s1', 'c1');

      expect(path).toBeNull();
    });

    it('returns single-element path for same device', () => {
      const layout: EditorLayout = {
        devices: [createSource('s1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const path = graph.getPath('s1', 's1');

      expect(path).toEqual(['s1']);
    });

    it('finds shortest path when multiple paths exist', () => {
      // s1 -> c1 -> c3
      //  \-> c2 ->/
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createConveyor('c2'),
          createConveyor('c3'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 's1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c1', toDeviceId: 'c3', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'c3', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const path = graph.getPath('s1', 'c3');

      expect(path).toHaveLength(3);
      expect(path![0]).toBe('s1');
      expect(path![2]).toBe('c3');
    });
  });

  describe('getReachableDevices', () => {
    it('returns all downstream devices', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createConveyor('c2'),
          createSink('sink1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'sink1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const reachable = getReachableDevices(graph, 's1');

      expect(reachable).toHaveLength(3);
      expect(reachable).toContain('c1');
      expect(reachable).toContain('c2');
      expect(reachable).toContain('sink1');
    });

    it('does not include starting device', () => {
      const layout: EditorLayout = {
        devices: [createSource('s1'), createConveyor('c1')],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const reachable = getReachableDevices(graph, 's1');

      expect(reachable).not.toContain('s1');
    });

    it('returns empty array for isolated device', () => {
      const layout: EditorLayout = {
        devices: [createSource('s1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const reachable = getReachableDevices(graph, 's1');

      expect(reachable).toHaveLength(0);
    });
  });

  describe('getSourceDevices', () => {
    it('returns devices with type source', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createSource('s2'),
          createConveyor('c1'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const sources = getSourceDevices(graph);

      expect(sources).toHaveLength(3); // s1, s2, and c1 (no inputs)
      expect(sources.find(d => d.id === 's1')).toBeDefined();
      expect(sources.find(d => d.id === 's2')).toBeDefined();
    });

    it('includes devices with no inputs', () => {
      const layout: EditorLayout = {
        devices: [
          createConveyor('c1'),
          createConveyor('c2'),
        ],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const sources = getSourceDevices(graph);

      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe('c1');
    });
  });

  describe('getSinkDevices', () => {
    it('returns devices with type sink', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createSink('sink1'),
          createSink('sink2'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const sinks = getSinkDevices(graph);

      expect(sinks.find(d => d.id === 'sink1')).toBeDefined();
      expect(sinks.find(d => d.id === 'sink2')).toBeDefined();
    });

    it('includes devices with no outputs', () => {
      const layout: EditorLayout = {
        devices: [
          createConveyor('c1'),
          createConveyor('c2'),
        ],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const sinks = getSinkDevices(graph);

      expect(sinks).toHaveLength(1);
      expect(sinks[0].id).toBe('c2');
    });
  });

  describe('hasCycle', () => {
    it('returns false for acyclic graph', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createSink('sink1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c1', toDeviceId: 'sink1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      expect(hasCycle(graph)).toBe(false);
    });

    it('returns true for graph with cycle', () => {
      const layout: EditorLayout = {
        devices: [
          createConveyor('c1'),
          createConveyor('c2'),
          createConveyor('c3'),
        ],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'c3', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c3', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      expect(hasCycle(graph)).toBe(true);
    });

    it('returns true for self-loop', () => {
      const layout: EditorLayout = {
        devices: [createConveyor('c1')],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      expect(hasCycle(graph)).toBe(true);
    });

    it('returns false for empty graph', () => {
      const layout: EditorLayout = {
        devices: [],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      expect(hasCycle(graph)).toBe(false);
    });
  });

  describe('topologicalSort', () => {
    it('returns valid topological order for acyclic graph', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createConveyor('c2'),
          createSink('sink1'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'sink1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const sorted = topologicalSort(graph);

      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(4);
      
      // Verify ordering: each device comes before its outputs
      const indexOf = (id: string) => sorted!.indexOf(id);
      expect(indexOf('s1')).toBeLessThan(indexOf('c1'));
      expect(indexOf('c1')).toBeLessThan(indexOf('c2'));
      expect(indexOf('c2')).toBeLessThan(indexOf('sink1'));
    });

    it('returns null for graph with cycle', () => {
      const layout: EditorLayout = {
        devices: [
          createConveyor('c1'),
          createConveyor('c2'),
        ],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 'c2', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const sorted = topologicalSort(graph);

      expect(sorted).toBeNull();
    });

    it('handles disconnected components', () => {
      const layout: EditorLayout = {
        devices: [
          createSource('s1'),
          createConveyor('c1'),
          createSource('s2'),
          createConveyor('c2'),
        ],
        connections: [
          { fromDeviceId: 's1', toDeviceId: 'c1', fromPort: 'output', toPort: 'input' },
          { fromDeviceId: 's2', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const sorted = topologicalSort(graph);

      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(4);
    });
  });
});
