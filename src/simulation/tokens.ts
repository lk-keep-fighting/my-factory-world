/**
 * Token management utilities
 */

import type { AnyDevice, ConnectivityGraph, Token } from './types';
import type { PathSegment } from './types';
import {
  calculateProgressDelta,
  createPathSegment,
  getPositionOnSegment,
} from './path';

let tokenIdCounter = 0;

/**
 * Generates a unique token ID
 */
export function generateTokenId(): string {
  return `token-${++tokenIdCounter}`;
}

/**
 * Resets the token ID counter (useful for testing)
 */
export function resetTokenIdCounter(): void {
  tokenIdCounter = 0;
}

/**
 * Creates a new token at the start of a device
 */
export function createToken(
  deviceId: string,
  device: AnyDevice,
  color: string = '#3b82f6'
): Token {
  const segment = createPathSegment(device);
  
  return {
    id: generateTokenId(),
    position: { ...segment.entryPoint },
    currentDeviceId: deviceId,
    progress: 0,
    color,
  };
}

/**
 * Updates a token's position based on progress
 */
export function updateTokenPosition(
  token: Token,
  segment: PathSegment
): Token {
  const newPosition = getPositionOnSegment(segment, token.progress);
  
  return {
    ...token,
    position: newPosition,
  };
}

/**
 * Moves a token forward by a time delta
 * Returns the updated token and whether it has completed the current device
 */
export function advanceToken(
  token: Token,
  device: AnyDevice,
  deltaTimeSeconds: number,
  timeScale: number
): { token: Token; completed: boolean } {
  const segment = createPathSegment(device);
  const progressDelta = calculateProgressDelta(
    device,
    segment,
    deltaTimeSeconds,
    timeScale
  );

  const newProgress = token.progress + progressDelta;
  const completed = newProgress >= 1;
  
  const clampedProgress = Math.min(newProgress, 1);
  const newPosition = getPositionOnSegment(segment, clampedProgress);

  return {
    token: {
      ...token,
      progress: clampedProgress,
      position: newPosition,
    },
    completed,
  };
}

/**
 * Transfers a token to the next device
 */
export function transferToken(
  token: Token,
  nextDeviceId: string,
  nextDevice: AnyDevice
): Token {
  const segment = createPathSegment(nextDevice);
  
  return {
    ...token,
    currentDeviceId: nextDeviceId,
    progress: 0,
    position: { ...segment.entryPoint },
  };
}

/**
 * Gets the next device ID for a token
 * Returns null if there are no connected outputs
 */
export function getNextDeviceId(
  token: Token,
  graph: ConnectivityGraph
): string | null {
  const outputs = graph.getConnectedOutputs(token.currentDeviceId);
  
  if (outputs.length === 0) {
    return null;
  }

  // For now, just take the first output
  // Could be extended to support routing logic
  return outputs[0];
}

/**
 * Checks if a token should be removed (reached sink or no more outputs)
 */
export function shouldRemoveToken(
  token: Token,
  graph: ConnectivityGraph
): boolean {
  const node = graph.getNode(token.currentDeviceId);
  
  if (!node) {
    return true;
  }

  // Remove if token completed current device and there are no outputs
  if (token.progress >= 1 && node.outputs.length === 0) {
    return true;
  }

  // Remove if device is a sink and token reached it
  if (node.device.type === 'sink' && token.progress >= 1) {
    return true;
  }

  return false;
}

/**
 * Creates a batch of tokens at source devices
 */
export function createTokensAtSources(
  graph: ConnectivityGraph,
  color: string = '#3b82f6'
): Token[] {
  const tokens: Token[] = [];

  for (const [deviceId, node] of graph.nodes) {
    if (node.device.type === 'source' && node.device.state === 'running') {
      tokens.push(createToken(deviceId, node.device, color));
    }
  }

  return tokens;
}
