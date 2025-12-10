/**
 * Coordinate conversion utilities for canvas grid
 * Handles transformation between world (grid) and screen (pixel) coordinates
 */

export interface CameraState {
  /** Horizontal offset in pixels from world origin */
  offsetX: number;
  /** Vertical offset in pixels from world origin */
  offsetY: number;
  /** Zoom level (1.0 = 100%, 2.0 = 200%, etc.) */
  scale: number;
}

export interface GridCoordinate {
  /** Grid x coordinate */
  gridX: number;
  /** Grid y coordinate */
  gridY: number;
}

export interface ScreenCoordinate {
  /** Screen x coordinate in pixels */
  screenX: number;
  /** Screen y coordinate in pixels */
  screenY: number;
}

/**
 * Convert screen coordinates to world (grid) coordinates
 * @param screenX - X position in screen pixels
 * @param screenY - Y position in screen pixels
 * @param camera - Current camera state
 * @returns Grid coordinate
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: CameraState
): GridCoordinate {
  const worldX = (screenX - camera.offsetX) / camera.scale;
  const worldY = (screenY - camera.offsetY) / camera.scale;
  
  return {
    gridX: worldX,
    gridY: worldY
  };
}

/**
 * Convert world coordinates to grid cell coordinates
 * @param worldX - X position in world units
 * @param worldY - Y position in world units
 * @param gridSize - Size of each grid cell in pixels
 * @returns Grid cell coordinate (grid cell indices)
 */
export function worldToGridCell(
  worldX: number,
  worldY: number,
  gridSize: number
): GridCoordinate {
  return {
    gridX: Math.floor(worldX / gridSize),
    gridY: Math.floor(worldY / gridSize)
  };
}

/**
 * Convert grid cell coordinates to world coordinates (center of cell)
 * @param gridX - Grid cell X index
 * @param gridY - Grid cell Y index
 * @param gridSize - Size of each grid cell in pixels
 * @returns World coordinate at center of grid cell
 */
export function gridCellToWorld(
  gridX: number,
  gridY: number,
  gridSize: number
): { worldX: number; worldY: number } {
  return {
    worldX: gridX * gridSize + gridSize / 2,
    worldY: gridY * gridSize + gridSize / 2
  };
}

/**
 * Convert world coordinates to screen coordinates
 * @param worldX - X position in world units
 * @param worldY - Y position in world units
 * @param camera - Current camera state
 * @returns Screen coordinate
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState
): ScreenCoordinate {
  const screenX = worldX * camera.scale + camera.offsetX;
  const screenY = worldY * camera.scale + camera.offsetY;
  
  return {
    screenX,
    screenY
  };
}

/**
 * Get the screen coordinate of a grid cell's top-left corner
 * @param gridX - Grid cell X index
 * @param gridY - Grid cell Y index
 * @param gridSize - Size of each grid cell in pixels
 * @param camera - Current camera state
 * @returns Screen coordinate of cell top-left
 */
export function gridCellToScreen(
  gridX: number,
  gridY: number,
  gridSize: number,
  camera: CameraState
): ScreenCoordinate {
  const worldX = gridX * gridSize;
  const worldY = gridY * gridSize;
  return worldToScreen(worldX, worldY, camera);
}

/**
 * Convert screen coordinates directly to grid cell coordinates
 * @param screenX - X position in screen pixels
 * @param screenY - Y position in screen pixels
 * @param camera - Current camera state
 * @param gridSize - Size of each grid cell in pixels
 * @returns Grid cell coordinate
 */
export function screenToGridCell(
  screenX: number,
  screenY: number,
  camera: CameraState,
  gridSize: number
): GridCoordinate {
  const world = screenToWorld(screenX, screenY, camera);
  return worldToGridCell(world.gridX, world.gridY, gridSize);
}

/**
 * Get grid cell dimensions at current zoom level
 * @param gridSize - Base grid size in pixels
 * @param camera - Current camera state
 * @returns Rendered grid cell size in pixels
 */
export function getRenderedGridSize(
  gridSize: number,
  camera: CameraState
): number {
  return gridSize * camera.scale;
}

/**
 * Clamp camera position to prevent excessive panning
 * @param camera - Camera state
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param worldBounds - Optional world bounds { minX, maxX, minY, maxY }
 * @returns Clamped camera state
 */
export function clampCamera(
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number,
  worldBounds?: { minX: number; maxX: number; minY: number; maxY: number }
): CameraState {
  let { offsetX, offsetY, scale } = camera;

  if (worldBounds) {
    const minScreenX = worldBounds.minX * scale;
    const maxScreenX = worldBounds.maxX * scale;
    const minScreenY = worldBounds.minY * scale;
    const maxScreenY = worldBounds.maxY * scale;

    // Clamp offset to keep world bounds mostly visible
    offsetX = Math.max(
      minScreenX - canvasWidth,
      Math.min(maxScreenX, offsetX)
    );
    offsetY = Math.max(
      minScreenY - canvasHeight,
      Math.min(maxScreenY, offsetY)
    );
  }

  return { offsetX, offsetY, scale };
}
