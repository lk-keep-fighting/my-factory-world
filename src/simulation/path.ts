/**
 * Path calculation utilities for token movement
 */

import type {
  AnyDevice,
  Conveyor,
  Direction,
  PathSegment,
  Position,
} from './types';

/**
 * Gets the entry point for a device based on its direction
 */
export function getDeviceEntryPoint(device: AnyDevice): Position {
  const { x, y } = device.position;
  const { width, height } = device;

  if (device.type === 'conveyor') {
    const conveyor = device as Conveyor;
    switch (conveyor.direction) {
      case 'right':
        return { x, y: y + height / 2 };
      case 'left':
        return { x: x + width, y: y + height / 2 };
      case 'down':
        return { x: x + width / 2, y };
      case 'up':
        return { x: x + width / 2, y: y + height };
    }
  }

  // Default: enter from center-left
  return { x, y: y + height / 2 };
}

/**
 * Gets the exit point for a device based on its direction
 */
export function getDeviceExitPoint(device: AnyDevice): Position {
  const { x, y } = device.position;
  const { width, height } = device;

  if (device.type === 'conveyor') {
    const conveyor = device as Conveyor;
    switch (conveyor.direction) {
      case 'right':
        return { x: x + width, y: y + height / 2 };
      case 'left':
        return { x, y: y + height / 2 };
      case 'down':
        return { x: x + width / 2, y: y + height };
      case 'up':
        return { x: x + width / 2, y };
    }
  }

  // Default: exit from center-right
  return { x: x + width, y: y + height / 2 };
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Creates a path segment for a device
 */
export function createPathSegment(device: AnyDevice): PathSegment {
  const entryPoint = getDeviceEntryPoint(device);
  const exitPoint = getDeviceExitPoint(device);
  const length = calculateDistance(entryPoint, exitPoint);

  return {
    deviceId: device.id,
    entryPoint,
    exitPoint,
    length,
  };
}

/**
 * Calculates position along a path segment based on progress (0-1)
 */
export function getPositionOnSegment(
  segment: PathSegment,
  progress: number
): Position {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  return {
    x: segment.entryPoint.x + (segment.exitPoint.x - segment.entryPoint.x) * clampedProgress,
    y: segment.entryPoint.y + (segment.exitPoint.y - segment.entryPoint.y) * clampedProgress,
  };
}

/**
 * Gets the effective speed of a device
 * Returns 0 if device is stopped or faulted
 */
export function getEffectiveSpeed(device: AnyDevice): number {
  if (device.state !== 'running') {
    return 0;
  }

  if (device.type === 'conveyor') {
    return (device as Conveyor).speed;
  }

  // Default speed for other device types
  return 100;
}

/**
 * Calculates how much progress a token makes in a given time delta
 */
export function calculateProgressDelta(
  device: AnyDevice,
  segment: PathSegment,
  deltaTimeSeconds: number,
  timeScale: number
): number {
  const speed = getEffectiveSpeed(device);
  
  if (speed === 0 || segment.length === 0) {
    return 0;
  }

  const distance = speed * deltaTimeSeconds * timeScale;
  return distance / segment.length;
}

/**
 * Gets the direction vector for a device
 */
export function getDirectionVector(direction: Direction): Position {
  switch (direction) {
    case 'right':
      return { x: 1, y: 0 };
    case 'left':
      return { x: -1, y: 0 };
    case 'down':
      return { x: 0, y: 1 };
    case 'up':
      return { x: 0, y: -1 };
  }
}

/**
 * Checks if two positions are approximately equal
 */
export function positionsEqual(
  a: Position,
  b: Position,
  tolerance: number = 0.001
): boolean {
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance
  );
}

/**
 * Interpolates between two positions
 */
export function lerpPosition(
  from: Position,
  to: Position,
  t: number
): Position {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

/**
 * Calculates the total path length through a series of devices
 */
export function calculateTotalPathLength(devices: AnyDevice[]): number {
  return devices.reduce((total, device) => {
    const segment = createPathSegment(device);
    return total + segment.length;
  }, 0);
}

/**
 * Gets the path center point for a device (for rendering labels etc.)
 */
export function getDeviceCenter(device: AnyDevice): Position {
  return {
    x: device.position.x + device.width / 2,
    y: device.position.y + device.height / 2,
  };
}
