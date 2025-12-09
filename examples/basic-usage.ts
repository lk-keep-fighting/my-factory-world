/**
 * Basic usage example for the simulation engine
 * 
 * This example demonstrates how to:
 * - Create a layout with devices and connections
 * - Initialize the simulation engine
 * - Attach to a canvas for rendering
 * - Control play/pause/reset
 * - Handle events
 */

import {
  SimulationEngine,
  EditorLayout,
  Conveyor,
  Source,
  Sink,
} from '../src/simulation';

// Define a simple layout with a source, conveyors, and a sink
const layout: EditorLayout = {
  devices: [
    // Source device that generates tokens
    {
      id: 'source-1',
      type: 'source',
      position: { x: 50, y: 200 },
      width: 60,
      height: 60,
      state: 'running',
      generationRate: 1, // 1 token per second
    } as Source,
    
    // First conveyor
    {
      id: 'conveyor-1',
      type: 'conveyor',
      position: { x: 130, y: 212 },
      width: 200,
      height: 36,
      state: 'running',
      speed: 80,
      direction: 'right',
    } as Conveyor,
    
    // Second conveyor (going down)
    {
      id: 'conveyor-2',
      type: 'conveyor',
      position: { x: 330, y: 212 },
      width: 36,
      height: 150,
      state: 'running',
      speed: 60,
      direction: 'down',
    } as Conveyor,
    
    // Third conveyor (continuing right)
    {
      id: 'conveyor-3',
      type: 'conveyor',
      position: { x: 366, y: 326 },
      width: 200,
      height: 36,
      state: 'running',
      speed: 100,
      direction: 'right',
    } as Conveyor,
    
    // Sink that consumes tokens
    {
      id: 'sink-1',
      type: 'sink',
      position: { x: 590, y: 314 },
      width: 60,
      height: 60,
      state: 'running',
    } as Sink,
  ],
  connections: [
    { fromDeviceId: 'source-1', toDeviceId: 'conveyor-1', fromPort: 'output', toPort: 'input' },
    { fromDeviceId: 'conveyor-1', toDeviceId: 'conveyor-2', fromPort: 'output', toPort: 'input' },
    { fromDeviceId: 'conveyor-2', toDeviceId: 'conveyor-3', fromPort: 'output', toPort: 'input' },
    { fromDeviceId: 'conveyor-3', toDeviceId: 'sink-1', fromPort: 'output', toPort: 'input' },
  ],
};

// Create the simulation engine
const engine = new SimulationEngine(layout, {
  timeScale: 1.0,
  tokenColor: '#3b82f6',
  faultColor: '#ef4444',
  runningColor: '#22c55e',
  stoppedColor: '#6b7280',
});

// Example: Attach to a canvas (in browser environment)
// const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
// engine.attachRenderer(canvas);

// Listen for events
engine.on('statusChange', (event) => {
  console.log('Status changed:', event.data);
});

engine.on('tokenCreated', (event) => {
  console.log('Token created:', event.data);
});

engine.on('tokenMoved', (event) => {
  console.log('Token moved:', event.data);
});

engine.on('tokenRemoved', (event) => {
  console.log('Token removed:', event.data);
});

engine.on('deviceStateChange', (event) => {
  console.log('Device state changed:', event.data);
});

// Control functions that would be connected to UI buttons
export function play() {
  engine.play();
  console.log('Simulation started');
}

export function pause() {
  engine.pause();
  console.log('Simulation paused');
}

export function reset() {
  engine.reset();
  console.log('Simulation reset');
}

export function setTimeScale(scale: number) {
  engine.setTimeScale(scale);
  console.log(`Time scale set to ${engine.getTimeScale()}`);
}

export function stopConveyor(id: string) {
  engine.setDeviceState(id, 'stopped');
}

export function startConveyor(id: string) {
  engine.setDeviceState(id, 'running');
}

export function triggerFault(id: string, reason: string) {
  engine.setDeviceFault(id, reason);
}

export function clearFault(id: string) {
  engine.clearDeviceFault(id);
}

// Get current simulation status
export function getStatus() {
  return engine.getStatus();
}

// Get snapshot of current state
export function getSnapshot() {
  return engine.getSnapshot();
}

// Clean up
export function dispose() {
  engine.dispose();
}

// Export the engine for direct access
export { engine };
