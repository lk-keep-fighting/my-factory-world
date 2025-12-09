# Simulation Engine

A lightweight simulation engine for conveyor system visualization. Consumes editor layouts, builds connectivity graphs, and animates material tokens along conveyors using `requestAnimationFrame`.

## Features

- **Connectivity Graph**: Automatically builds a directed graph from device connections
- **Token Animation**: Smooth animation of material tokens through conveyors
- **Play/Pause/Reset**: Full control over simulation state
- **Time Scaling**: Adjust simulation speed (0.1x to 10x)
- **Device States**: Support for running, stopped, and faulted states
- **Fault Coloring**: Visual indication of device faults
- **Event System**: Subscribe to simulation events
- **Canvas Rendering**: Built-in renderer for canvas-based visualization

## Installation

```bash
npm install
```

## Usage

### Basic Setup

```typescript
import { SimulationEngine, EditorLayout } from './src/simulation';

// Define your layout
const layout: EditorLayout = {
  devices: [
    {
      id: 'source-1',
      type: 'source',
      position: { x: 0, y: 100 },
      width: 50,
      height: 50,
      state: 'running',
      generationRate: 1,
    },
    {
      id: 'conveyor-1',
      type: 'conveyor',
      position: { x: 60, y: 100 },
      width: 200,
      height: 50,
      state: 'running',
      speed: 100,
      direction: 'right',
    },
    {
      id: 'sink-1',
      type: 'sink',
      position: { x: 270, y: 100 },
      width: 50,
      height: 50,
      state: 'running',
    },
  ],
  connections: [
    { fromDeviceId: 'source-1', toDeviceId: 'conveyor-1', fromPort: 'output', toPort: 'input' },
    { fromDeviceId: 'conveyor-1', toDeviceId: 'sink-1', fromPort: 'output', toPort: 'input' },
  ],
};

// Create engine
const engine = new SimulationEngine(layout);

// Attach to canvas for rendering
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
engine.attachRenderer(canvas);

// Control simulation
engine.play();   // Start animation
engine.pause();  // Pause animation
engine.reset();  // Reset to initial state
```

### Time Scaling

```typescript
// Speed up simulation (2x speed)
engine.setTimeScale(2);

// Slow down simulation (0.5x speed)
engine.setTimeScale(0.5);
```

### Device State Management

```typescript
// Stop a conveyor
engine.setDeviceState('conveyor-1', 'stopped');

// Start a conveyor
engine.setDeviceState('conveyor-1', 'running');

// Set a fault
engine.setDeviceFault('conveyor-1', 'Motor overheated');

// Clear a fault
engine.clearDeviceFault('conveyor-1');
```

### Event Handling

```typescript
// Listen for status changes
engine.on('statusChange', (event) => {
  console.log('Status:', event.data);
});

// Listen for token creation
engine.on('tokenCreated', (event) => {
  console.log('New token:', event.data);
});

// Listen for token movement
engine.on('tokenMoved', (event) => {
  console.log('Token moved:', event.data);
});

// Listen for token removal
engine.on('tokenRemoved', (event) => {
  console.log('Token removed:', event.data);
});

// Listen for device state changes
engine.on('deviceStateChange', (event) => {
  console.log('Device state:', event.data);
});

// Remove listener
engine.off('statusChange', myListener);
```

### Getting Simulation State

```typescript
// Get current status
const status = engine.getStatus(); // 'running' | 'paused' | 'stopped'

// Get full snapshot
const snapshot = engine.getSnapshot();
// {
//   status: 'running',
//   tokens: [...],
//   elapsedTime: 5.234,
//   timeScale: 1.0
// }

// Get current tokens
const tokens = engine.getTokens();

// Get connectivity graph
const graph = engine.getGraph();
```

## Device Types

### Source
Generates tokens at a specified rate.

```typescript
{
  id: 'source-1',
  type: 'source',
  position: { x: 0, y: 0 },
  width: 50,
  height: 50,
  state: 'running',
  generationRate: 2, // tokens per second
}
```

### Conveyor
Transports tokens at a specified speed and direction.

```typescript
{
  id: 'conveyor-1',
  type: 'conveyor',
  position: { x: 60, y: 0 },
  width: 200,
  height: 50,
  state: 'running',
  speed: 100, // units per second
  direction: 'right', // 'left' | 'right' | 'up' | 'down'
}
```

### Sink
Consumes tokens that reach it.

```typescript
{
  id: 'sink-1',
  type: 'sink',
  position: { x: 270, y: 0 },
  width: 50,
  height: 50,
  state: 'running',
}
```

### Junction
Routes tokens based on output direction.

```typescript
{
  id: 'junction-1',
  type: 'junction',
  position: { x: 150, y: 0 },
  width: 50,
  height: 50,
  state: 'running',
  outputDirection: 'right',
}
```

## API Reference

### SimulationEngine

#### Constructor
```typescript
new SimulationEngine(layout: EditorLayout, config?: Partial<SimulationConfig>)
```

#### Methods
- `play()` - Start or resume the simulation
- `pause()` - Pause the simulation
- `reset()` - Reset simulation to initial state
- `getStatus()` - Get current status ('running' | 'paused' | 'stopped')
- `getTokens()` - Get array of current tokens
- `getSnapshot()` - Get full simulation state snapshot
- `setTimeScale(scale: number)` - Set time scale (0.1 to 10)
- `getTimeScale()` - Get current time scale
- `setDeviceState(deviceId: string, state: DeviceState)` - Set device state
- `setDeviceFault(deviceId: string, reason: string)` - Set device to faulted
- `clearDeviceFault(deviceId: string)` - Clear device fault
- `on(eventType, listener)` - Add event listener
- `off(eventType, listener)` - Remove event listener
- `attachRenderer(canvas: HTMLCanvasElement)` - Attach canvas for rendering
- `detachRenderer()` - Detach canvas renderer
- `updateLayout(layout: EditorLayout)` - Update layout and rebuild graph
- `getGraph()` - Get connectivity graph
- `forceRender()` - Force a render (useful when paused)
- `dispose()` - Clean up resources

### Graph Utilities

- `buildConnectivityGraph(layout)` - Build graph from layout
- `findPath(nodes, from, to)` - Find path between devices
- `getReachableDevices(graph, startId)` - Get all downstream devices
- `getSourceDevices(graph)` - Get devices with no inputs
- `getSinkDevices(graph)` - Get devices with no outputs
- `hasCycle(graph)` - Check for cycles
- `topologicalSort(graph)` - Get topological ordering

### Path Utilities

- `getDeviceEntryPoint(device)` - Get entry position
- `getDeviceExitPoint(device)` - Get exit position
- `calculateDistance(from, to)` - Calculate distance between points
- `createPathSegment(device)` - Create path segment for device
- `getPositionOnSegment(segment, progress)` - Get position at progress
- `getEffectiveSpeed(device)` - Get device speed (0 if stopped)
- `calculateProgressDelta(device, segment, deltaTime, timeScale)` - Calculate progress change

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT
