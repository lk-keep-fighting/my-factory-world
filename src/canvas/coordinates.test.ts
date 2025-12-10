/**
 * Tests for coordinate conversion utilities
 */
import {
  screenToWorld,
  worldToGridCell,
  gridCellToWorld,
  worldToScreen,
  gridCellToScreen,
  screenToGridCell,
  getRenderedGridSize,
  clampCamera,
  CameraState,
} from './coordinates';

const GRID_SIZE = 20;

describe('Coordinate Conversion Utilities', () => {
  describe('screenToWorld', () => {
    it('converts screen coordinates to world coordinates at default camera', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = screenToWorld(100, 50, camera);
      
      expect(result.gridX).toBe(100);
      expect(result.gridY).toBe(50);
    });

    it('converts screen coordinates with positive camera offset', () => {
      const camera: CameraState = { offsetX: 50, offsetY: 30, scale: 1 };
      const result = screenToWorld(100, 100, camera);
      
      expect(result.gridX).toBe(50);
      expect(result.gridY).toBe(70);
    });

    it('converts screen coordinates with zoom', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2 };
      const result = screenToWorld(200, 100, camera);
      
      expect(result.gridX).toBe(100);
      expect(result.gridY).toBe(50);
    });

    it('converts screen coordinates with offset and zoom', () => {
      const camera: CameraState = { offsetX: 100, offsetY: 50, scale: 2 };
      const result = screenToWorld(200, 150, camera);
      
      expect(result.gridX).toBe(50);
      expect(result.gridY).toBe(50);
    });

    it('handles negative world coordinates', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = screenToWorld(-100, -50, camera);
      
      expect(result.gridX).toBe(-100);
      expect(result.gridY).toBe(-50);
    });
  });

  describe('worldToGridCell', () => {
    it('converts world coordinates to grid cell at origin', () => {
      const result = worldToGridCell(0, 0, GRID_SIZE);
      
      expect(result.gridX).toBe(0);
      expect(result.gridY).toBe(0);
    });

    it('converts world coordinates within first grid cell', () => {
      const result = worldToGridCell(10, 15, GRID_SIZE);
      
      expect(result.gridX).toBe(0);
      expect(result.gridY).toBe(0);
    });

    it('converts world coordinates at grid boundary', () => {
      const result = worldToGridCell(GRID_SIZE, GRID_SIZE, GRID_SIZE);
      
      expect(result.gridX).toBe(1);
      expect(result.gridY).toBe(1);
    });

    it('converts world coordinates to distant grid cells', () => {
      const result = worldToGridCell(100, 200, GRID_SIZE);
      
      expect(result.gridX).toBe(5);
      expect(result.gridY).toBe(10);
    });

    it('handles negative world coordinates', () => {
      const result = worldToGridCell(-50, -30, GRID_SIZE);
      
      expect(result.gridX).toBe(-3);
      expect(result.gridY).toBe(-2);
    });

    it('handles fractional coordinates', () => {
      const result = worldToGridCell(25.5, 35.7, GRID_SIZE);
      
      expect(result.gridX).toBe(1);
      expect(result.gridY).toBe(1);
    });
  });

  describe('gridCellToWorld', () => {
    it('converts grid cell to world coordinates at origin', () => {
      const result = gridCellToWorld(0, 0, GRID_SIZE);
      
      expect(result.worldX).toBe(GRID_SIZE / 2);
      expect(result.worldY).toBe(GRID_SIZE / 2);
    });

    it('converts grid cell to world coordinates for other cells', () => {
      const result = gridCellToWorld(2, 3, GRID_SIZE);
      
      expect(result.worldX).toBe(2 * GRID_SIZE + GRID_SIZE / 2);
      expect(result.worldY).toBe(3 * GRID_SIZE + GRID_SIZE / 2);
    });

    it('converts negative grid cells', () => {
      const result = gridCellToWorld(-1, -1, GRID_SIZE);
      
      expect(result.worldX).toBe(-GRID_SIZE / 2);
      expect(result.worldY).toBe(-GRID_SIZE / 2);
    });
  });

  describe('worldToScreen', () => {
    it('converts world to screen at default camera', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = worldToScreen(100, 50, camera);
      
      expect(result.screenX).toBe(100);
      expect(result.screenY).toBe(50);
    });

    it('converts world to screen with camera offset', () => {
      const camera: CameraState = { offsetX: 50, offsetY: 30, scale: 1 };
      const result = worldToScreen(100, 100, camera);
      
      expect(result.screenX).toBe(150);
      expect(result.screenY).toBe(130);
    });

    it('converts world to screen with zoom', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2 };
      const result = worldToScreen(100, 50, camera);
      
      expect(result.screenX).toBe(200);
      expect(result.screenY).toBe(100);
    });

    it('converts world to screen with offset and zoom', () => {
      const camera: CameraState = { offsetX: 100, offsetY: 50, scale: 2 };
      const result = worldToScreen(100, 50, camera);
      
      expect(result.screenX).toBe(300);
      expect(result.screenY).toBe(150);
    });
  });

  describe('Round-trip conversions', () => {
    it('screen -> world -> screen returns original coordinates', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const originalScreen = { screenX: 200, screenY: 150 };
      
      const world = screenToWorld(originalScreen.screenX, originalScreen.screenY, camera);
      const screen = worldToScreen(world.gridX, world.gridY, camera);
      
      expect(screen.screenX).toBe(originalScreen.screenX);
      expect(screen.screenY).toBe(originalScreen.screenY);
    });

    it('screen -> world -> screen with zoom', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2.5 };
      const originalScreen = { screenX: 250, screenY: 350 };
      
      const world = screenToWorld(originalScreen.screenX, originalScreen.screenY, camera);
      const screen = worldToScreen(world.gridX, world.gridY, camera);
      
      expect(screen.screenX).toBeCloseTo(originalScreen.screenX);
      expect(screen.screenY).toBeCloseTo(originalScreen.screenY);
    });

    it('screen -> world -> screen with offset and zoom', () => {
      const camera: CameraState = { offsetX: 150, offsetY: 100, scale: 1.5 };
      const originalScreen = { screenX: 300, screenY: 200 };
      
      const world = screenToWorld(originalScreen.screenX, originalScreen.screenY, camera);
      const screen = worldToScreen(world.gridX, world.gridY, camera);
      
      expect(screen.screenX).toBeCloseTo(originalScreen.screenX);
      expect(screen.screenY).toBeCloseTo(originalScreen.screenY);
    });

    it('world -> grid -> world returns similar coordinates', () => {
      const world = { worldX: 45, worldY: 65 };
      const grid = worldToGridCell(world.worldX, world.worldY, GRID_SIZE);
      const backToWorld = gridCellToWorld(grid.gridX, grid.gridY, GRID_SIZE);
      
      expect(backToWorld.worldX).toBe(50);
      expect(backToWorld.worldY).toBe(70);
    });
  });

  describe('gridCellToScreen', () => {
    it('converts grid cell to screen at default camera', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = gridCellToScreen(0, 0, GRID_SIZE, camera);
      
      expect(result.screenX).toBe(0);
      expect(result.screenY).toBe(0);
    });

    it('converts grid cell to screen with zoom', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2 };
      const result = gridCellToScreen(1, 1, GRID_SIZE, camera);
      
      expect(result.screenX).toBe(40);
      expect(result.screenY).toBe(40);
    });

    it('converts grid cell to screen with offset and zoom', () => {
      const camera: CameraState = { offsetX: 100, offsetY: 50, scale: 2 };
      const result = gridCellToScreen(2, 1, GRID_SIZE, camera);
      
      expect(result.screenX).toBe(180);
      expect(result.screenY).toBe(90);
    });
  });

  describe('screenToGridCell', () => {
    it('converts screen coordinates to grid cell at default camera', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = screenToGridCell(50, 30, camera, GRID_SIZE);
      
      expect(result.gridX).toBe(2);
      expect(result.gridY).toBe(1);
    });

    it('converts screen coordinates to grid cell with zoom', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2 };
      const result = screenToGridCell(40, 60, camera, GRID_SIZE);
      
      expect(result.gridX).toBe(1);
      expect(result.gridY).toBe(1);
    });

    it('converts screen coordinates to grid cell with offset and zoom', () => {
      const camera: CameraState = { offsetX: 100, offsetY: 50, scale: 2 };
      const result = screenToGridCell(140, 110, camera, GRID_SIZE);
      
      expect(result.gridX).toBe(1);
      expect(result.gridY).toBe(1);
    });
  });

  describe('getRenderedGridSize', () => {
    it('returns base grid size at zoom 1', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = getRenderedGridSize(GRID_SIZE, camera);
      
      expect(result).toBe(GRID_SIZE);
    });

    it('returns scaled grid size at zoom 2', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 2 };
      const result = getRenderedGridSize(GRID_SIZE, camera);
      
      expect(result).toBe(GRID_SIZE * 2);
    });

    it('returns scaled grid size at zoom 0.5', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 0.5 };
      const result = getRenderedGridSize(GRID_SIZE, camera);
      
      expect(result).toBe(GRID_SIZE * 0.5);
    });
  });

  describe('clampCamera', () => {
    it('does not modify camera within valid range', () => {
      const camera: CameraState = { offsetX: 100, offsetY: 100, scale: 1 };
      const result = clampCamera(camera, 800, 600);
      
      expect(result.offsetX).toBe(100);
      expect(result.offsetY).toBe(100);
      expect(result.scale).toBe(1);
    });

    it('clamps camera with world bounds', () => {
      const camera: CameraState = { offsetX: 2000, offsetY: 2000, scale: 1 };
      const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      const result = clampCamera(camera, 800, 600, bounds);
      
      expect(result.offsetX).toBeLessThanOrEqual(100);
      expect(result.offsetY).toBeLessThanOrEqual(100);
    });

    it('preserves scale when clamping', () => {
      const camera: CameraState = { offsetX: 1000, offsetY: 1000, scale: 2 };
      const bounds = { minX: -100, maxX: 100, minY: -100, maxY: 100 };
      const result = clampCamera(camera, 800, 600, bounds);
      
      expect(result.scale).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('handles very small zoom levels', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 0.1 };
      const result = screenToWorld(100, 100, camera);
      
      expect(result.gridX).toBe(1000);
      expect(result.gridY).toBe(1000);
    });

    it('handles very large zoom levels', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 10 };
      const result = screenToWorld(1000, 1000, camera);
      
      expect(result.gridX).toBe(100);
      expect(result.gridY).toBe(100);
    });

    it('handles zero world coordinates', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = worldToScreen(0, 0, camera);
      
      expect(result.screenX).toBe(0);
      expect(result.screenY).toBe(0);
    });

    it('handles large positive coordinates', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = screenToGridCell(10000, 10000, camera, GRID_SIZE);
      
      expect(result.gridX).toBe(500);
      expect(result.gridY).toBe(500);
    });

    it('handles large negative coordinates', () => {
      const camera: CameraState = { offsetX: 0, offsetY: 0, scale: 1 };
      const result = screenToGridCell(-5000, -5000, camera, GRID_SIZE);
      
      expect(result.gridX).toBe(-250);
      expect(result.gridY).toBe(-250);
    });
  });
});
