/**
 * Simulation Engine Module
 * 
 * A lightweight simulation engine for conveyor system visualization.
 * Consumes editor layout, builds connectivity graph, and animates
 * material tokens along conveyors using requestAnimationFrame.
 */

// Core engine
export { SimulationEngine } from './engine';

// Renderer
export { SimulationRenderer } from './renderer';

// Graph utilities
export {
  buildConnectivityGraph,
  findPath,
  getReachableDevices,
  getSourceDevices,
  getSinkDevices,
  hasCycle,
  topologicalSort,
} from './graph';

// Path utilities
export {
  getDeviceEntryPoint,
  getDeviceExitPoint,
  calculateDistance,
  createPathSegment,
  getPositionOnSegment,
  getEffectiveSpeed,
  calculateProgressDelta,
  getDirectionVector,
  positionsEqual,
  lerpPosition,
  calculateTotalPathLength,
  getDeviceCenter,
} from './path';

// Token utilities
export {
  generateTokenId,
  resetTokenIdCounter,
  createToken,
  updateTokenPosition,
  advanceToken,
  transferToken,
  getNextDeviceId,
  shouldRemoveToken,
  createTokensAtSources,
} from './tokens';

// Types
export type {
  Position,
  Direction,
  DeviceState,
  SimulationStatus,
  Device,
  Conveyor,
  Source,
  Sink,
  Junction,
  AnyDevice,
  Connection,
  EditorLayout,
  Token,
  GraphNode,
  ConnectivityGraph,
  PathSegment,
  SimulationConfig,
  SimulationSnapshot,
  SimulationEventType,
  SimulationEvent,
  SimulationEventListener,
} from './types';
