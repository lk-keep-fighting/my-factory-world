/**
 * Tests for path calculation utilities
 */

import type { AnyDevice, Conveyor } from './types';
import {
  calculateDistance,
  calculateProgressDelta,
  calculateTotalPathLength,
  createPathSegment,
  getDeviceCenter,
  getDeviceEntryPoint,
  getDeviceExitPoint,
  getDirectionVector,
  getEffectiveSpeed,
  getPositionOnSegment,
  lerpPosition,
  positionsEqual,
} from './path';

describe('Path Utilities', () => {
  // Helper to create a test conveyor
  const createTestConveyor = (
    direction: 'left' | 'right' | 'up' | 'down',
    overrides: Partial<Conveyor> = {}
  ): Conveyor => ({
    id: 'test-conveyor',
    type: 'conveyor',
    position: { x: 100, y: 100 },
    width: 200,
    height: 50,
    state: 'running',
    speed: 100,
    direction,
    ...overrides,
  });

  describe('getDeviceEntryPoint', () => {
    it('returns left edge center for right-moving conveyor', () => {
      const conveyor = createTestConveyor('right');
      const entry = getDeviceEntryPoint(conveyor);
      
      expect(entry.x).toBe(100);
      expect(entry.y).toBe(125);
    });

    it('returns right edge center for left-moving conveyor', () => {
      const conveyor = createTestConveyor('left');
      const entry = getDeviceEntryPoint(conveyor);
      
      expect(entry.x).toBe(300); // 100 + 200
      expect(entry.y).toBe(125);
    });

    it('returns top edge center for down-moving conveyor', () => {
      const conveyor = createTestConveyor('down');
      const entry = getDeviceEntryPoint(conveyor);
      
      expect(entry.x).toBe(200); // 100 + 100
      expect(entry.y).toBe(100);
    });

    it('returns bottom edge center for up-moving conveyor', () => {
      const conveyor = createTestConveyor('up');
      const entry = getDeviceEntryPoint(conveyor);
      
      expect(entry.x).toBe(200);
      expect(entry.y).toBe(150); // 100 + 50
    });
  });

  describe('getDeviceExitPoint', () => {
    it('returns right edge center for right-moving conveyor', () => {
      const conveyor = createTestConveyor('right');
      const exit = getDeviceExitPoint(conveyor);
      
      expect(exit.x).toBe(300); // 100 + 200
      expect(exit.y).toBe(125);
    });

    it('returns left edge center for left-moving conveyor', () => {
      const conveyor = createTestConveyor('left');
      const exit = getDeviceExitPoint(conveyor);
      
      expect(exit.x).toBe(100);
      expect(exit.y).toBe(125);
    });

    it('returns bottom edge center for down-moving conveyor', () => {
      const conveyor = createTestConveyor('down');
      const exit = getDeviceExitPoint(conveyor);
      
      expect(exit.x).toBe(200);
      expect(exit.y).toBe(150); // 100 + 50
    });

    it('returns top edge center for up-moving conveyor', () => {
      const conveyor = createTestConveyor('up');
      const exit = getDeviceExitPoint(conveyor);
      
      expect(exit.x).toBe(200);
      expect(exit.y).toBe(100);
    });
  });

  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      const distance = calculateDistance(
        { x: 0, y: 0 },
        { x: 3, y: 4 }
      );
      expect(distance).toBe(5);
    });

    it('returns zero for same point', () => {
      const distance = calculateDistance(
        { x: 10, y: 20 },
        { x: 10, y: 20 }
      );
      expect(distance).toBe(0);
    });

    it('works with negative coordinates', () => {
      const distance = calculateDistance(
        { x: -3, y: -4 },
        { x: 0, y: 0 }
      );
      expect(distance).toBe(5);
    });
  });

  describe('createPathSegment', () => {
    it('creates a segment with correct entry and exit points', () => {
      const conveyor = createTestConveyor('right');
      const segment = createPathSegment(conveyor);
      
      expect(segment.deviceId).toBe('test-conveyor');
      expect(segment.entryPoint).toEqual({ x: 100, y: 125 });
      expect(segment.exitPoint).toEqual({ x: 300, y: 125 });
      expect(segment.length).toBe(200);
    });

    it('calculates correct length for horizontal conveyor', () => {
      const conveyor = createTestConveyor('right', { width: 150 });
      const segment = createPathSegment(conveyor);
      
      expect(segment.length).toBe(150);
    });

    it('calculates correct length for vertical conveyor', () => {
      const conveyor = createTestConveyor('down', { height: 100 });
      const segment = createPathSegment(conveyor);
      
      expect(segment.length).toBe(100);
    });
  });

  describe('getPositionOnSegment', () => {
    const segment = {
      deviceId: 'test',
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 100, y: 0 },
      length: 100,
    };

    it('returns entry point at progress 0', () => {
      const pos = getPositionOnSegment(segment, 0);
      expect(pos).toEqual({ x: 0, y: 0 });
    });

    it('returns exit point at progress 1', () => {
      const pos = getPositionOnSegment(segment, 1);
      expect(pos).toEqual({ x: 100, y: 0 });
    });

    it('returns midpoint at progress 0.5', () => {
      const pos = getPositionOnSegment(segment, 0.5);
      expect(pos).toEqual({ x: 50, y: 0 });
    });

    it('clamps progress below 0', () => {
      const pos = getPositionOnSegment(segment, -0.5);
      expect(pos).toEqual({ x: 0, y: 0 });
    });

    it('clamps progress above 1', () => {
      const pos = getPositionOnSegment(segment, 1.5);
      expect(pos).toEqual({ x: 100, y: 0 });
    });

    it('handles diagonal segments', () => {
      const diagonalSegment = {
        deviceId: 'test',
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 100, y: 100 },
        length: Math.sqrt(20000),
      };
      const pos = getPositionOnSegment(diagonalSegment, 0.5);
      expect(pos.x).toBeCloseTo(50);
      expect(pos.y).toBeCloseTo(50);
    });
  });

  describe('getEffectiveSpeed', () => {
    it('returns conveyor speed when running', () => {
      const conveyor = createTestConveyor('right', { speed: 150 });
      expect(getEffectiveSpeed(conveyor)).toBe(150);
    });

    it('returns 0 when device is stopped', () => {
      const conveyor = createTestConveyor('right', { state: 'stopped' });
      expect(getEffectiveSpeed(conveyor)).toBe(0);
    });

    it('returns 0 when device is faulted', () => {
      const conveyor = createTestConveyor('right', { state: 'faulted' });
      expect(getEffectiveSpeed(conveyor)).toBe(0);
    });

    it('returns default speed for non-conveyor devices', () => {
      const source: AnyDevice = {
        id: 'source-1',
        type: 'source',
        position: { x: 0, y: 0 },
        width: 50,
        height: 50,
        state: 'running',
        generationRate: 1,
      };
      expect(getEffectiveSpeed(source)).toBe(100);
    });
  });

  describe('calculateProgressDelta', () => {
    const conveyor = createTestConveyor('right', { speed: 100 });
    const segment = createPathSegment(conveyor);

    it('calculates progress based on speed and time', () => {
      // Speed 100, segment length 200, 1 second, scale 1
      // Distance = 100, progress = 100/200 = 0.5
      const delta = calculateProgressDelta(conveyor, segment, 1, 1);
      expect(delta).toBe(0.5);
    });

    it('applies time scale', () => {
      // Speed 100, segment length 200, 1 second, scale 2
      // Distance = 200, progress = 200/200 = 1
      const delta = calculateProgressDelta(conveyor, segment, 1, 2);
      expect(delta).toBe(1);
    });

    it('returns 0 for stopped device', () => {
      const stoppedConveyor = createTestConveyor('right', { state: 'stopped' });
      const delta = calculateProgressDelta(stoppedConveyor, segment, 1, 1);
      expect(delta).toBe(0);
    });

    it('handles fractional delta times', () => {
      // Speed 100, segment length 200, 0.1 second, scale 1
      // Distance = 10, progress = 10/200 = 0.05
      const delta = calculateProgressDelta(conveyor, segment, 0.1, 1);
      expect(delta).toBeCloseTo(0.05);
    });
  });

  describe('getDirectionVector', () => {
    it('returns (1, 0) for right', () => {
      expect(getDirectionVector('right')).toEqual({ x: 1, y: 0 });
    });

    it('returns (-1, 0) for left', () => {
      expect(getDirectionVector('left')).toEqual({ x: -1, y: 0 });
    });

    it('returns (0, 1) for down', () => {
      expect(getDirectionVector('down')).toEqual({ x: 0, y: 1 });
    });

    it('returns (0, -1) for up', () => {
      expect(getDirectionVector('up')).toEqual({ x: 0, y: -1 });
    });
  });

  describe('positionsEqual', () => {
    it('returns true for identical positions', () => {
      expect(positionsEqual(
        { x: 10, y: 20 },
        { x: 10, y: 20 }
      )).toBe(true);
    });

    it('returns false for different positions', () => {
      expect(positionsEqual(
        { x: 10, y: 20 },
        { x: 10, y: 21 }
      )).toBe(false);
    });

    it('uses tolerance for comparison', () => {
      expect(positionsEqual(
        { x: 10, y: 20 },
        { x: 10.0001, y: 20.0001 },
        0.001
      )).toBe(true);
    });

    it('respects custom tolerance', () => {
      expect(positionsEqual(
        { x: 10, y: 20 },
        { x: 10.5, y: 20.5 },
        1
      )).toBe(true);
    });
  });

  describe('lerpPosition', () => {
    it('returns from position at t=0', () => {
      const result = lerpPosition(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        0
      );
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns to position at t=1', () => {
      const result = lerpPosition(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        1
      );
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('returns midpoint at t=0.5', () => {
      const result = lerpPosition(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        0.5
      );
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('handles t values outside 0-1', () => {
      const result = lerpPosition(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        2
      );
      expect(result).toEqual({ x: 200, y: 0 });
    });
  });

  describe('calculateTotalPathLength', () => {
    it('returns 0 for empty array', () => {
      expect(calculateTotalPathLength([])).toBe(0);
    });

    it('returns length of single device', () => {
      const conveyor = createTestConveyor('right', { width: 100 });
      expect(calculateTotalPathLength([conveyor])).toBe(100);
    });

    it('sums lengths of multiple devices', () => {
      const conveyor1 = createTestConveyor('right', { 
        id: 'c1',
        width: 100 
      });
      const conveyor2 = createTestConveyor('right', { 
        id: 'c2',
        width: 150 
      });
      expect(calculateTotalPathLength([conveyor1, conveyor2])).toBe(250);
    });
  });

  describe('getDeviceCenter', () => {
    it('returns center of device', () => {
      const conveyor = createTestConveyor('right', {
        position: { x: 100, y: 100 },
        width: 200,
        height: 50,
      });
      const center = getDeviceCenter(conveyor);
      expect(center).toEqual({ x: 200, y: 125 });
    });

    it('works with zero-origin device', () => {
      const conveyor = createTestConveyor('right', {
        position: { x: 0, y: 0 },
        width: 100,
        height: 100,
      });
      const center = getDeviceCenter(conveyor);
      expect(center).toEqual({ x: 50, y: 50 });
    });
  });
});
