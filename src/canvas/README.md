# Canvas Module

A high-performance Minecraft-like grid canvas component for React with support for panning, zooming, and coordinate transformations.

## Features

- **Minecraft-like Grid**: Renders a clean 2D grid with major and minor grid lines
- **Pan & Zoom**: Smooth panning with middle-mouse button and zoom with mouse wheel
- **Responsive Events**: Cell click and hover callbacks with grid coordinates
- **Origin Axes**: Highlighted green axes at the world origin (0, 0)
- **Hovered Cell Highlighting**: Visual feedback showing which cell the cursor is over
- **Customizable Colors**: Full control over grid colors, background, and highlights
- **Coordinate Conversion**: Robust utilities for converting between screen and world coordinates

## Components

### CanvasStage

React component that renders the canvas with grid and handles all interactions.

#### Props

```typescript
interface CanvasStageProps {
  width?: number;                    // Canvas width in pixels (default: 800)
  height?: number;                   // Canvas height in pixels (default: 600)
  gridSize?: number;                 // Size of each grid cell (default: 20)
  initialCamera?: CameraState;       // Initial camera position and zoom
  onCellClick?: (gridX: number, gridY: number) => void;
  onCellHover?: (gridX: number, gridY: number) => void;
  className?: string;                // Optional CSS class
  majorGridInterval?: number;        // Major grid interval (default: 5)
  backgroundColor?: string;          // Grid background color
  minorGridColor?: string;           // Minor grid line color
  majorGridColor?: string;           // Major grid line color
  originAxisColor?: string;          // Origin axes color
  cellHighlightColor?: string;       // Hovered cell highlight color
}
```

#### Ref Handle

```typescript
interface CanvasStageHandle {
  camera: CameraState;
  setCamera: (camera: CameraState) => void;
}
```

## Coordinate Conversion Utilities

### Core Functions

- **screenToWorld(screenX, screenY, camera)**: Convert screen pixels to world coordinates
- **worldToGridCell(worldX, worldY, gridSize)**: Convert world coordinates to grid cell indices
- **gridCellToWorld(gridX, gridY, gridSize)**: Convert grid cell indices to world coordinates
- **worldToScreen(worldX, worldY, camera)**: Convert world coordinates to screen pixels
- **gridCellToScreen(gridX, gridY, gridSize, camera)**: Convert grid cell to screen pixels
- **screenToGridCell(screenX, screenY, camera, gridSize)**: Convert screen pixels directly to grid cells
- **getRenderedGridSize(gridSize, camera)**: Get grid cell size at current zoom level
- **clampCamera(camera, canvasWidth, canvasHeight, worldBounds?)**: Clamp camera to prevent excessive panning

## Usage Examples

### Basic Grid Canvas

```typescript
import CanvasStage from './canvas/CanvasStage';

export function GridEditor() {
  return (
    <CanvasStage
      width={800}
      height={600}
      gridSize={20}
      onCellClick={(x, y) => console.log(`Clicked: ${x}, ${y}`)}
    />
  );
}
```

### With Camera Control

```typescript
import CanvasStage, { CanvasStageHandle } from './canvas/CanvasStage';
import { useRef } from 'react';

export function EditorWithControls() {
  const canvasRef = useRef<CanvasStageHandle>(null);

  const resetCamera = () => {
    canvasRef.current?.setCamera({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    });
  };

  return (
    <>
      <button onClick={resetCamera}>Reset View</button>
      <CanvasStage ref={canvasRef} width={800} height={600} />
    </>
  );
}
```

### With Custom Colors

```typescript
<CanvasStage
  width={800}
  height={600}
  backgroundColor="#0a0e27"
  minorGridColor="#1a1f3a"
  majorGridColor="#2a3f5f"
  originAxisColor="#00ff88"
  cellHighlightColor="rgba(0, 255, 136, 0.2)"
/>
```

## Coordinate System

The coordinate system uses:
- **Grid Cells**: Integer indices (gridX, gridY) representing discrete cells
- **World Coordinates**: Floating-point (worldX, worldY) in world units
- **Screen Coordinates**: Floating-point (screenX, screenY) in pixel positions

Conversions properly account for:
- Camera panning (offsetX, offsetY)
- Camera zoom (scale)
- Grid cell size

## Interaction

### Pan
- **Middle Mouse Button**: Click and drag with middle mouse button to pan
- Cursor changes to "grabbing" during pan operation

### Zoom
- **Mouse Wheel**: Scroll up to zoom in, scroll down to zoom out
- Zoom range: 0.1x to 10x
- Zoom is centered on mouse cursor position

### Click & Hover
- **Click**: Calls `onCellClick` with grid coordinates
- **Move**: Continuously calls `onCellHover` as cursor moves
- Hovered cell is highlighted with semi-transparent overlay

## Testing

The module includes comprehensive tests:

- **39 coordinate conversion tests**: All conversion functions with edge cases
- **21 component specification tests**: Props, features, and behaviors
- All tests pass with 100% coverage of core functionality

Run tests:
```bash
npm test src/canvas/
```

## Camera State

The camera state controls the view:

```typescript
interface CameraState {
  offsetX: number;  // Horizontal offset in pixels
  offsetY: number;  // Vertical offset in pixels
  scale: number;    // Zoom level (1.0 = 100%)
}
```

The camera can be:
- Read via the ref handle: `canvasRef.current.camera`
- Updated via the ref handle: `canvasRef.current.setCamera(newCamera)`
- Automatically updated by user interactions (pan/zoom)

## Performance Considerations

- Uses requestAnimationFrame for smooth rendering
- Only renders visible grid cells
- Efficient canvas drawing with minimal redraws
- Optimized coordinate transformations

## Browser Compatibility

Works in all modern browsers supporting:
- HTML5 Canvas
- React 16.8+ (hooks)
- ES2020+ JavaScript

## Integration with Editor Store

The canvas can be easily integrated with the editor store:

```typescript
import { useEditorStore } from '../editor/store';

export function CanvasEditor() {
  const { selectDevice, addDevice } = useEditorStore();

  const handleCellClick = (gridX, gridY) => {
    // Add device or select existing device at this location
    // Use the editor store to manage state
  };

  return (
    <CanvasStage
      onCellClick={handleCellClick}
      // ... other props
    />
  );
}
```
