/**
 * Main simulation engine
 */

import type {
  AnyDevice,
  ConnectivityGraph,
  DeviceState,
  EditorLayout,
  SimulationConfig,
  SimulationEvent,
  SimulationEventListener,
  SimulationEventType,
  SimulationSnapshot,
  SimulationStatus,
  Source,
  Token,
} from './types';
import { buildConnectivityGraph } from './graph';
import { createPathSegment } from './path';
import {
  advanceToken,
  createToken,
  getNextDeviceId,
  resetTokenIdCounter,
  shouldRemoveToken,
  transferToken,
} from './tokens';
import { SimulationRenderer } from './renderer';

/** Default simulation configuration */
const DEFAULT_CONFIG: SimulationConfig = {
  timeScale: 1.0,
  tokenColor: '#3b82f6',
  faultColor: '#ef4444',
  runningColor: '#22c55e',
  stoppedColor: '#6b7280',
};

/**
 * The main simulation engine class
 * Handles animation loop, token management, and device state
 */
export class SimulationEngine {
  private layout: EditorLayout;
  private graph: ConnectivityGraph;
  private tokens: Token[] = [];
  private status: SimulationStatus = 'stopped';
  private config: SimulationConfig;
  private elapsedTime: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private renderer: SimulationRenderer | null = null;
  private listeners: Map<SimulationEventType, Set<SimulationEventListener>> = new Map();
  private sourceTimers: Map<string, number> = new Map();

  constructor(layout: EditorLayout, config: Partial<SimulationConfig> = {}) {
    this.layout = layout;
    this.graph = buildConnectivityGraph(layout);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Attaches a canvas renderer
   */
  attachRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new SimulationRenderer(canvas, this.config);
  }

  /**
   * Detaches the renderer
   */
  detachRenderer(): void {
    this.renderer = null;
  }

  /**
   * Starts or resumes the simulation
   */
  play(): void {
    if (this.status === 'running') {
      return;
    }

    const previousStatus = this.status;
    this.status = 'running';
    this.lastFrameTime = performance.now();

    if (previousStatus === 'stopped') {
      // Initialize source timers
      this.initializeSourceTimers();
    }

    this.emit('statusChange', { 
      previousStatus, 
      newStatus: this.status 
    });
    
    this.scheduleFrame();
  }

  /**
   * Pauses the simulation
   */
  pause(): void {
    if (this.status !== 'running') {
      return;
    }

    const previousStatus = this.status;
    this.status = 'paused';
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.emit('statusChange', { 
      previousStatus, 
      newStatus: this.status 
    });
  }

  /**
   * Resets the simulation to initial state
   */
  reset(): void {
    const previousStatus = this.status;
    this.status = 'stopped';
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear all tokens
    for (const token of this.tokens) {
      this.emit('tokenRemoved', { token });
    }
    this.tokens = [];
    
    // Reset timing
    this.elapsedTime = 0;
    this.lastFrameTime = 0;
    this.sourceTimers.clear();
    resetTokenIdCounter();

    // Reset device states
    for (const device of this.layout.devices) {
      if (device.state === 'faulted') {
        device.state = 'stopped';
      }
    }

    this.emit('statusChange', { 
      previousStatus, 
      newStatus: this.status 
    });

    // Render cleared state
    this.render();
  }

  /**
   * Gets the current simulation status
   */
  getStatus(): SimulationStatus {
    return this.status;
  }

  /**
   * Gets the current tokens
   */
  getTokens(): Token[] {
    return [...this.tokens];
  }

  /**
   * Gets the current snapshot of the simulation
   */
  getSnapshot(): SimulationSnapshot {
    return {
      status: this.status,
      tokens: [...this.tokens],
      elapsedTime: this.elapsedTime,
      timeScale: this.config.timeScale,
    };
  }

  /**
   * Sets the time scale
   */
  setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(0.1, Math.min(10, scale));
  }

  /**
   * Gets the time scale
   */
  getTimeScale(): number {
    return this.config.timeScale;
  }

  /**
   * Sets a device's run state
   */
  setDeviceState(deviceId: string, state: DeviceState): void {
    const node = this.graph.getNode(deviceId);
    if (node) {
      const previousState = node.device.state;
      node.device.state = state;
      this.emit('deviceStateChange', {
        deviceId,
        previousState,
        newState: state,
      });
    }
  }

  /**
   * Sets a device to faulted state with a reason
   */
  setDeviceFault(deviceId: string, reason: string): void {
    const node = this.graph.getNode(deviceId);
    if (node) {
      const previousState = node.device.state;
      node.device.state = 'faulted';
      node.device.faultReason = reason;
      this.emit('deviceStateChange', {
        deviceId,
        previousState,
        newState: 'faulted',
        faultReason: reason,
      });
    }
  }

  /**
   * Clears a device fault
   */
  clearDeviceFault(deviceId: string): void {
    const node = this.graph.getNode(deviceId);
    if (node && node.device.state === 'faulted') {
      node.device.state = 'stopped';
      node.device.faultReason = undefined;
      this.emit('deviceStateChange', {
        deviceId,
        previousState: 'faulted',
        newState: 'stopped',
      });
    }
  }

  /**
   * Adds an event listener
   */
  on(eventType: SimulationEventType, listener: SimulationEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  /**
   * Removes an event listener
   */
  off(eventType: SimulationEventType, listener: SimulationEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  /**
   * Updates the layout and rebuilds the graph
   */
  updateLayout(layout: EditorLayout): void {
    this.layout = layout;
    this.graph = buildConnectivityGraph(layout);
  }

  /**
   * Gets the connectivity graph
   */
  getGraph(): ConnectivityGraph {
    return this.graph;
  }

  /**
   * Initializes source device timers
   */
  private initializeSourceTimers(): void {
    this.sourceTimers.clear();
    
    for (const device of this.layout.devices) {
      if (device.type === 'source') {
        this.sourceTimers.set(device.id, 0);
      }
    }
  }

  /**
   * Schedules the next animation frame
   */
  private scheduleFrame(): void {
    this.animationFrameId = requestAnimationFrame((timestamp) => {
      this.tick(timestamp);
    });
  }

  /**
   * Main simulation tick
   */
  private tick(timestamp: number): void {
    if (this.status !== 'running') {
      return;
    }

    const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = timestamp;
    this.elapsedTime += deltaTime * this.config.timeScale;

    // Generate tokens from sources
    this.processSourceDevices(deltaTime);

    // Update token positions
    this.updateTokens(deltaTime);

    // Emit tick event
    this.emit('tick', {
      deltaTime,
      elapsedTime: this.elapsedTime,
      tokenCount: this.tokens.length,
    });

    // Render
    this.render();

    // Schedule next frame
    this.scheduleFrame();
  }

  /**
   * Processes source devices to generate new tokens
   */
  private processSourceDevices(deltaTime: number): void {
    for (const device of this.layout.devices) {
      if (device.type !== 'source' || device.state !== 'running') {
        continue;
      }

      const source = device as Source;
      const timer = this.sourceTimers.get(device.id) ?? 0;
      const newTimer = timer + deltaTime * this.config.timeScale;
      
      const interval = 1 / source.generationRate;
      
      if (newTimer >= interval) {
        // Create a new token
        const token = createToken(device.id, device, this.config.tokenColor);
        this.tokens.push(token);
        this.emit('tokenCreated', { token });
        
        // Reset timer (keep remainder for accurate timing)
        this.sourceTimers.set(device.id, newTimer % interval);
      } else {
        this.sourceTimers.set(device.id, newTimer);
      }
    }
  }

  /**
   * Updates all token positions
   */
  private updateTokens(deltaTime: number): void {
    const tokensToRemove: Token[] = [];
    const updatedTokens: Token[] = [];

    for (const token of this.tokens) {
      const node = this.graph.getNode(token.currentDeviceId);
      
      if (!node) {
        tokensToRemove.push(token);
        continue;
      }

      const device = node.device;
      
      // Advance token through current device
      const { token: advancedToken, completed } = advanceToken(
        token,
        device,
        deltaTime,
        this.config.timeScale
      );

      if (completed) {
        // Check if token should be removed
        if (shouldRemoveToken(advancedToken, this.graph)) {
          tokensToRemove.push(advancedToken);
          continue;
        }

        // Try to transfer to next device
        const nextDeviceId = getNextDeviceId(advancedToken, this.graph);
        
        if (nextDeviceId) {
          const nextNode = this.graph.getNode(nextDeviceId);
          
          if (nextNode) {
            const transferredToken = transferToken(
              advancedToken,
              nextDeviceId,
              nextNode.device
            );
            updatedTokens.push(transferredToken);
            this.emit('tokenMoved', { 
              token: transferredToken, 
              fromDevice: token.currentDeviceId,
              toDevice: nextDeviceId,
            });
            continue;
          }
        }

        // No next device, remove token
        tokensToRemove.push(advancedToken);
      } else {
        updatedTokens.push(advancedToken);
      }
    }

    // Remove tokens
    for (const token of tokensToRemove) {
      this.emit('tokenRemoved', { token });
    }

    this.tokens = updatedTokens;
  }

  /**
   * Renders the current state
   */
  private render(): void {
    if (!this.renderer) {
      return;
    }

    this.renderer.clear();
    
    // Render connections first (below devices)
    this.renderer.renderConnections(
      this.layout.devices,
      this.layout.connections
    );
    
    // Render devices
    this.renderer.renderDevices(this.layout.devices);
    
    // Render tokens on top
    this.renderer.renderTokens(this.tokens);
    
    // Render status indicator
    this.renderer.renderStatus(this.status, 10, 10);
  }

  /**
   * Emits an event to listeners
   */
  private emit(type: SimulationEventType, data: unknown): void {
    const event: SimulationEvent = {
      type,
      timestamp: performance.now(),
      data,
    };

    const eventListeners = this.listeners.get(type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in simulation event listener for ${type}:`, error);
        }
      }
    }
  }

  /**
   * Manually triggers a render (useful when paused)
   */
  forceRender(): void {
    this.render();
  }

  /**
   * Disposes of the simulation engine
   */
  dispose(): void {
    this.reset();
    this.listeners.clear();
    this.renderer = null;
  }
}
