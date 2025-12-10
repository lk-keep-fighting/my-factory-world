import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import {
  CameraState,
  screenToGridCell,
  gridCellToScreen,
  getRenderedGridSize,
  clampCamera,
} from './coordinates';

export interface CanvasStageProps {
  /** Width of the canvas in pixels */
  width?: number;
  /** Height of the canvas in pixels */
  height?: number;
  /** Size of each grid cell in pixels */
  gridSize?: number;
  /** Initial camera state */
  initialCamera?: CameraState;
  /** Callback when a cell is clicked */
  onCellClick?: (gridX: number, gridY: number) => void;
  /** Callback when a cell is hovered */
  onCellHover?: (gridX: number, gridY: number) => void;
  /** Optional CSS class name */
  className?: string;
  /** Major grid line interval (how many minor grid lines between major lines) */
  majorGridInterval?: number;
  /** Background color */
  backgroundColor?: string;
  /** Minor grid line color */
  minorGridColor?: string;
  /** Major grid line color */
  majorGridColor?: string;
  /** Origin axes color */
  originAxisColor?: string;
  /** Hovered cell highlight color */
  cellHighlightColor?: string;
}

export interface CanvasStageHandle {
  camera: CameraState;
  setCamera: (camera: CameraState) => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const DEFAULT_GRID_SIZE = 20;
const DEFAULT_MAJOR_GRID_INTERVAL = 5;
const DEFAULT_BG_COLOR = '#1e1e1e';
const DEFAULT_MINOR_GRID_COLOR = '#333333';
const DEFAULT_MAJOR_GRID_COLOR = '#555555';
const DEFAULT_ORIGIN_AXIS_COLOR = '#00ff00';
const DEFAULT_CELL_HIGHLIGHT_COLOR = 'rgba(255, 255, 0, 0.3)';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_SPEED = 0.1;
const PAN_BUTTON = 1; // Middle mouse button

const CanvasStage = React.forwardRef<CanvasStageHandle, CanvasStageProps>(
  (
    {
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      gridSize = DEFAULT_GRID_SIZE,
      initialCamera = { offsetX: 0, offsetY: 0, scale: 1 },
      onCellClick,
      onCellHover,
      className,
      majorGridInterval = DEFAULT_MAJOR_GRID_INTERVAL,
      backgroundColor = DEFAULT_BG_COLOR,
      minorGridColor = DEFAULT_MINOR_GRID_COLOR,
      majorGridColor = DEFAULT_MAJOR_GRID_COLOR,
      originAxisColor = DEFAULT_ORIGIN_AXIS_COLOR,
      cellHighlightColor = DEFAULT_CELL_HIGHLIGHT_COLOR,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [camera, setCamera] = useState<CameraState>(initialCamera);
    const [hoveredCell, setHoveredCell] = useState<{
      gridX: number;
      gridY: number;
    } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Expose camera state via ref
    React.useImperativeHandle(ref, () => ({
      camera,
      setCamera,
    }));

    // Draw the canvas
    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const renderedGridSize = getRenderedGridSize(gridSize, camera);

      // Draw grid
      ctx.strokeStyle = minorGridColor;
      ctx.lineWidth = 1;

      // Calculate visible grid range
      const minGridX = Math.floor(-camera.offsetX / renderedGridSize) - 1;
      const maxGridX = Math.ceil((width - camera.offsetX) / renderedGridSize) + 1;
      const minGridY = Math.floor(-camera.offsetY / renderedGridSize) - 1;
      const maxGridY = Math.ceil((height - camera.offsetY) / renderedGridSize) + 1;

      // Draw minor grid lines
      for (let x = minGridX; x <= maxGridX; x++) {
        if (x % majorGridInterval === 0) continue; // Skip major lines
        const screenX = x * renderedGridSize + camera.offsetX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
        ctx.stroke();
      }

      for (let y = minGridY; y <= maxGridY; y++) {
        if (y % majorGridInterval === 0) continue; // Skip major lines
        const screenY = y * renderedGridSize + camera.offsetY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
        ctx.stroke();
      }

      // Draw major grid lines
      ctx.strokeStyle = majorGridColor;
      ctx.lineWidth = 2;

      for (let x = minGridX; x <= maxGridX; x++) {
        if (x % majorGridInterval !== 0) continue;
        const screenX = x * renderedGridSize + camera.offsetX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
        ctx.stroke();
      }

      for (let y = minGridY; y <= maxGridY; y++) {
        if (y % majorGridInterval !== 0) continue;
        const screenY = y * renderedGridSize + camera.offsetY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
        ctx.stroke();
      }

      // Draw origin axes (if visible)
      const originScreenX = camera.offsetX;
      const originScreenY = camera.offsetY;

      if (originScreenX >= 0 && originScreenX <= width) {
        ctx.strokeStyle = originAxisColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originScreenX, 0);
        ctx.lineTo(originScreenX, height);
        ctx.stroke();
      }

      if (originScreenY >= 0 && originScreenY <= height) {
        ctx.strokeStyle = originAxisColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, originScreenY);
        ctx.lineTo(width, originScreenY);
        ctx.stroke();
      }

      // Draw hovered cell highlight
      if (hoveredCell) {
        const cellScreen = gridCellToScreen(
          hoveredCell.gridX,
          hoveredCell.gridY,
          gridSize,
          camera
        );
        ctx.fillStyle = cellHighlightColor;
        ctx.fillRect(
          cellScreen.screenX,
          cellScreen.screenY,
          renderedGridSize,
          renderedGridSize
        );
      }
    }, [
      width,
      height,
      camera,
      gridSize,
      hoveredCell,
      majorGridInterval,
      backgroundColor,
      minorGridColor,
      majorGridColor,
      originAxisColor,
      cellHighlightColor,
    ]);

    // Redraw on state changes
    useEffect(() => {
      draw();
    }, [draw]);

    // Handle mouse move
    const handleMouseMove = useCallback(
      (e: ReactMouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Update hovered cell
        const cell = screenToGridCell(screenX, screenY, camera, gridSize);
        setHoveredCell(cell);

        // Handle panning
        if (isPanning) {
          const dx = e.clientX - panStart.x;
          const dy = e.clientY - panStart.y;

          const newCamera = {
            offsetX: camera.offsetX + dx,
            offsetY: camera.offsetY + dy,
            scale: camera.scale,
          };

          setCamera(newCamera);
          setPanStart({ x: e.clientX, y: e.clientY });
        }

        onCellHover?.(cell.gridX, cell.gridY);
      },
      [camera, gridSize, isPanning, panStart, onCellHover]
    );

    // Handle mouse down
    const handleMouseDown = useCallback(
      (e: ReactMouseEvent<HTMLCanvasElement>) => {
        if (e.button === PAN_BUTTON) {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          e.preventDefault();
        }
      },
      []
    );

    // Handle mouse up
    const handleMouseUp = useCallback((e: ReactMouseEvent<HTMLCanvasElement>) => {
      if (e.button === PAN_BUTTON) {
        setIsPanning(false);
      }
    }, []);

    // Handle click
    const handleClick = useCallback(
      (e: ReactMouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const cell = screenToGridCell(screenX, screenY, camera, gridSize);
        onCellClick?.(cell.gridX, cell.gridY);
      },
      [camera, gridSize, onCellClick]
    );

    // Handle wheel (zoom)
    const handleWheel = useCallback(
      (e: ReactWheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Determine zoom direction
        const zoomIn = e.deltaY < 0;
        const zoomAmount = zoomIn ? ZOOM_SPEED : -ZOOM_SPEED;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.scale + zoomAmount));

        // Zoom towards mouse position
        const scaleFactor = newScale / camera.scale;
        const newOffsetX = screenX - (screenX - camera.offsetX) * scaleFactor;
        const newOffsetY = screenY - (screenY - camera.offsetY) * scaleFactor;

        const newCamera = {
          offsetX: newOffsetX,
          offsetY: newOffsetY,
          scale: newScale,
        };

        setCamera(newCamera);
      },
      [camera]
    );

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
      setHoveredCell(null);
      setIsPanning(false);
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}
        className={className}
        style={{
          cursor: isPanning ? 'grabbing' : 'crosshair',
          display: 'block',
          border: '1px solid #444',
        }}
      />
    );
  }
);

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
