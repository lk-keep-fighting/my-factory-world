/**
 * Tests for token management utilities
 */

import type { Conveyor, EditorLayout, Source } from './types';
import { buildConnectivityGraph } from './graph';
import {
  advanceToken,
  createToken,
  createTokensAtSources,
  generateTokenId,
  getNextDeviceId,
  resetTokenIdCounter,
  shouldRemoveToken,
  transferToken,
  updateTokenPosition,
} from './tokens';
import { createPathSegment } from './path';

describe('Token Utilities', () => {
  beforeEach(() => {
    resetTokenIdCounter();
  });

  const createTestConveyor = (id: string = 'conveyor-1'): Conveyor => ({
    id,
    type: 'conveyor',
    position: { x: 100, y: 100 },
    width: 200,
    height: 50,
    state: 'running',
    speed: 100,
    direction: 'right',
  });

  const createTestSource = (id: string = 'source-1'): Source => ({
    id,
    type: 'source',
    position: { x: 0, y: 100 },
    width: 50,
    height: 50,
    state: 'running',
    generationRate: 1,
  });

  describe('generateTokenId', () => {
    it('generates unique sequential IDs', () => {
      const id1 = generateTokenId();
      const id2 = generateTokenId();
      const id3 = generateTokenId();

      expect(id1).toBe('token-1');
      expect(id2).toBe('token-2');
      expect(id3).toBe('token-3');
    });
  });

  describe('resetTokenIdCounter', () => {
    it('resets the counter to start fresh', () => {
      generateTokenId();
      generateTokenId();
      resetTokenIdCounter();
      
      const id = generateTokenId();
      expect(id).toBe('token-1');
    });
  });

  describe('createToken', () => {
    it('creates a token at device entry point', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      expect(token.id).toBe('token-1');
      expect(token.currentDeviceId).toBe('conveyor-1');
      expect(token.progress).toBe(0);
      expect(token.position).toEqual({ x: 100, y: 125 }); // Entry point
    });

    it('uses provided color', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor, '#ff0000');

      expect(token.color).toBe('#ff0000');
    });

    it('uses default color if not provided', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      expect(token.color).toBe('#3b82f6');
    });
  });

  describe('updateTokenPosition', () => {
    it('updates position based on segment and progress', () => {
      const conveyor = createTestConveyor();
      const segment = createPathSegment(conveyor);
      const token = createToken('conveyor-1', conveyor);
      
      // Manually set progress to 0.5
      const tokenWithProgress = { ...token, progress: 0.5 };
      const updated = updateTokenPosition(tokenWithProgress, segment);

      expect(updated.position.x).toBe(200); // Midpoint of conveyor
      expect(updated.position.y).toBe(125);
    });
  });

  describe('advanceToken', () => {
    it('advances token progress based on speed and time', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      // Speed 100, width 200, 1 second = progress 0.5
      const { token: advanced, completed } = advanceToken(token, conveyor, 1, 1);

      expect(advanced.progress).toBeCloseTo(0.5);
      expect(completed).toBe(false);
    });

    it('marks completed when progress reaches 1', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      // Speed 100, width 200, 2 seconds = progress 1.0
      const { token: advanced, completed } = advanceToken(token, conveyor, 2, 1);

      expect(advanced.progress).toBe(1);
      expect(completed).toBe(true);
    });

    it('clamps progress to 1', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      // Speed 100, width 200, 3 seconds = would be progress 1.5
      const { token: advanced } = advanceToken(token, conveyor, 3, 1);

      expect(advanced.progress).toBe(1);
    });

    it('does not advance when device is stopped', () => {
      const conveyor = { ...createTestConveyor(), state: 'stopped' as const };
      const token = createToken('conveyor-1', conveyor);

      const { token: advanced, completed } = advanceToken(token, conveyor, 1, 1);

      expect(advanced.progress).toBe(0);
      expect(completed).toBe(false);
    });

    it('applies time scale', () => {
      const conveyor = createTestConveyor();
      const token = createToken('conveyor-1', conveyor);

      // Speed 100, width 200, 1 second, scale 2 = progress 1.0
      const { completed } = advanceToken(token, conveyor, 1, 2);

      expect(completed).toBe(true);
    });
  });

  describe('transferToken', () => {
    it('transfers token to new device', () => {
      const conveyor1 = createTestConveyor('c1');
      const conveyor2 = { 
        ...createTestConveyor('c2'),
        position: { x: 300, y: 100 },
      };
      
      const token = createToken('c1', conveyor1);
      const transferred = transferToken(token, 'c2', conveyor2);

      expect(transferred.currentDeviceId).toBe('c2');
      expect(transferred.progress).toBe(0);
      expect(transferred.position).toEqual({ x: 300, y: 125 });
    });

    it('preserves token id and color', () => {
      const conveyor1 = createTestConveyor('c1');
      const conveyor2 = createTestConveyor('c2');
      
      const token = createToken('c1', conveyor1, '#ff0000');
      const transferred = transferToken(token, 'c2', conveyor2);

      expect(transferred.id).toBe(token.id);
      expect(transferred.color).toBe('#ff0000');
    });
  });

  describe('getNextDeviceId', () => {
    it('returns first connected output', () => {
      const layout: EditorLayout = {
        devices: [createTestConveyor('c1'), createTestConveyor('c2')],
        connections: [
          { fromDeviceId: 'c1', toDeviceId: 'c2', fromPort: 'output', toPort: 'input' },
        ],
      };

      const graph = buildConnectivityGraph(layout);
      const token = createToken('c1', layout.devices[0]);
      
      const nextId = getNextDeviceId(token, graph);
      expect(nextId).toBe('c2');
    });

    it('returns null when no outputs', () => {
      const layout: EditorLayout = {
        devices: [createTestConveyor('c1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const token = createToken('c1', layout.devices[0]);
      
      const nextId = getNextDeviceId(token, graph);
      expect(nextId).toBeNull();
    });
  });

  describe('shouldRemoveToken', () => {
    it('returns true when token completed and no outputs', () => {
      const layout: EditorLayout = {
        devices: [createTestConveyor('c1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const token = { ...createToken('c1', layout.devices[0]), progress: 1 };
      
      expect(shouldRemoveToken(token, graph)).toBe(true);
    });

    it('returns false when token not completed', () => {
      const layout: EditorLayout = {
        devices: [createTestConveyor('c1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const token = createToken('c1', layout.devices[0]);
      
      expect(shouldRemoveToken(token, graph)).toBe(false);
    });

    it('returns true when device not found', () => {
      const layout: EditorLayout = {
        devices: [],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const token = {
        id: 'token-1',
        position: { x: 0, y: 0 },
        currentDeviceId: 'nonexistent',
        progress: 0,
        color: '#000',
      };
      
      expect(shouldRemoveToken(token, graph)).toBe(true);
    });
  });

  describe('createTokensAtSources', () => {
    it('creates tokens at all running source devices', () => {
      const layout: EditorLayout = {
        devices: [
          createTestSource('s1'),
          createTestSource('s2'),
          createTestConveyor('c1'),
        ],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const tokens = createTokensAtSources(graph);

      expect(tokens).toHaveLength(2);
      expect(tokens.find(t => t.currentDeviceId === 's1')).toBeDefined();
      expect(tokens.find(t => t.currentDeviceId === 's2')).toBeDefined();
    });

    it('skips stopped source devices', () => {
      const stoppedSource = { ...createTestSource('s1'), state: 'stopped' as const };
      const layout: EditorLayout = {
        devices: [stoppedSource],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const tokens = createTokensAtSources(graph);

      expect(tokens).toHaveLength(0);
    });

    it('uses provided color', () => {
      const layout: EditorLayout = {
        devices: [createTestSource('s1')],
        connections: [],
      };

      const graph = buildConnectivityGraph(layout);
      const tokens = createTokensAtSources(graph, '#ff0000');

      expect(tokens[0].color).toBe('#ff0000');
    });
  });
});
