/**
 * Core types for the simulation engine
 */

/** 2D position coordinate */
export interface Position {
  x: number;
  y: number;
}

/** Direction of conveyor flow */
export type Direction = 'left' | 'right' | 'up' | 'down';

/** Device operational state */
export type DeviceState = 'running' | 'stopped' | 'faulted';

/** Simulation status */
export type SimulationStatus = 'running' | 'paused' | 'stopped';

/** Base device interface */
export interface Device {
  id: string;
  type: 'conveyor' | 'source' | 'sink' | 'junction';
  position: Position;
  width: number;
  height: number;
  state: DeviceState;
  faultReason?: string;
}

/** Conveyor device with speed and direction */
export interface Conveyor extends Device {
  type: 'conveyor';
  speed: number; // units per second
  direction: Direction;
}

/** Source device that generates tokens */
export interface Source extends Device {
  type: 'source';
  generationRate: number; // tokens per second
}

/** Sink device that consumes tokens */
export interface Sink extends Device {
  type: 'sink';
}

/** Junction device that routes tokens */
export interface Junction extends Device {
  type: 'junction';
  outputDirection: Direction;
}

/** Any device type */
export type AnyDevice = Conveyor | Source | Sink | Junction;

/** Connection between devices */
export interface Connection {
  fromDeviceId: string;
  toDeviceId: string;
  fromPort: 'input' | 'output';
  toPort: 'input' | 'output';
}

/** Editor layout containing all devices and connections */
export interface EditorLayout {
  devices: AnyDevice[];
  connections: Connection[];
}

/** Material token being transported */
export interface Token {
  id: string;
  position: Position;
  currentDeviceId: string;
  progress: number; // 0-1 progress through current device
  color: string;
}

/** Node in the connectivity graph */
export interface GraphNode {
  deviceId: string;
  device: AnyDevice;
  inputs: string[]; // device IDs
  outputs: string[]; // device IDs
}

/** Connectivity graph representation */
export interface ConnectivityGraph {
  nodes: Map<string, GraphNode>;
  getNode(deviceId: string): GraphNode | undefined;
  getConnectedOutputs(deviceId: string): string[];
  getConnectedInputs(deviceId: string): string[];
  getPath(fromDeviceId: string, toDeviceId: string): string[] | null;
}

/** Path segment for token movement */
export interface PathSegment {
  deviceId: string;
  entryPoint: Position;
  exitPoint: Position;
  length: number;
}

/** Simulation configuration */
export interface SimulationConfig {
  timeScale: number; // 1.0 = real-time
  tokenColor: string;
  faultColor: string;
  runningColor: string;
  stoppedColor: string;
}

/** Simulation state snapshot */
export interface SimulationSnapshot {
  status: SimulationStatus;
  tokens: Token[];
  elapsedTime: number;
  timeScale: number;
}

/** Event types emitted by simulation */
export type SimulationEventType = 
  | 'statusChange'
  | 'tokenCreated'
  | 'tokenMoved'
  | 'tokenRemoved'
  | 'deviceStateChange'
  | 'tick';

/** Simulation event data */
export interface SimulationEvent {
  type: SimulationEventType;
  timestamp: number;
  data: unknown;
}

/** Event listener callback */
export type SimulationEventListener = (event: SimulationEvent) => void;
