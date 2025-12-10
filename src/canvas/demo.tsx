/**
 * Demo and usage examples for CanvasStage component
 */

import React, { useRef } from 'react';
import CanvasStage, { CanvasStageHandle } from './CanvasStage';
import { useEditorStore } from '../editor/store';

/**
 * Simple demo showing grid canvas with pan and zoom
 */
export const CanvasGridDemo = () => {
  const canvasRef = useRef<CanvasStageHandle>(null);

  const handleCellClick = (gridX: number, gridY: number) => {
    console.log(`Clicked cell: (${gridX}, ${gridY})`);
  };

  const handleCellHover = (gridX: number, gridY: number) => {
    console.log(`Hovering cell: (${gridX}, ${gridY})`);
  };

  const resetCamera = () => {
    if (canvasRef.current) {
      canvasRef.current.setCamera({
        offsetX: 0,
        offsetY: 0,
        scale: 1,
      });
    }
  };

  const zoomIn = () => {
    if (canvasRef.current) {
      const camera = canvasRef.current.camera;
      canvasRef.current.setCamera({
        ...camera,
        scale: Math.min(10, camera.scale + 0.5),
      });
    }
  };

  const zoomOut = () => {
    if (canvasRef.current) {
      const camera = canvasRef.current.camera;
      canvasRef.current.setCamera({
        ...camera,
        scale: Math.max(0.1, camera.scale - 0.5),
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Canvas Grid Demo</h2>
        <p>
          Instructions: Use middle-mouse button to pan, scroll wheel to zoom.
          Click a cell to select it.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={resetCamera}>Reset Camera</button>
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button>
      </div>

      <CanvasStage
        ref={canvasRef}
        width={800}
        height={600}
        gridSize={20}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
        majorGridInterval={5}
      />

      {canvasRef.current && (
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Camera: offset=({canvasRef.current.camera.offsetX},
          {canvasRef.current.camera.offsetY}), scale=
          {canvasRef.current.camera.scale.toFixed(2)}x
        </div>
      )}
    </div>
  );
};

/**
 * Example showing canvas integration with editor store
 */
export const CanvasWithEditorIntegration = () => {
  const canvasRef = useRef<CanvasStageHandle>(null);
  const { selectDevice, addDevice } = useEditorStore();

  const handleCellClick = (gridX: number, gridY: number) => {
    console.log(`Cell clicked at grid coordinates: (${gridX}, ${gridY})`);
    // Can be used to add devices or select existing ones
  };

  const handleCellHover = (gridX: number, gridY: number) => {
    // Can be used for preview or UI feedback
    console.log(`Currently hovering: (${gridX}, ${gridY})`);
  };

  return (
    <CanvasStage
      ref={canvasRef}
      width={1000}
      height={700}
      gridSize={25}
      onCellClick={handleCellClick}
      onCellHover={handleCellHover}
      majorGridInterval={4}
      backgroundColor="#0a0e27"
      minorGridColor="#1a1f3a"
      majorGridColor="#2a3f5f"
      originAxisColor="#00ff88"
      cellHighlightColor="rgba(0, 255, 136, 0.2)"
    />
  );
};

/**
 * Example showing custom styling
 */
export const CanvasWithCustomStyling = () => {
  return (
    <CanvasStage
      width={600}
      height={400}
      gridSize={15}
      majorGridInterval={10}
      backgroundColor="#1a1a2e"
      minorGridColor="#16213e"
      majorGridColor="#0f3460"
      originAxisColor="#e94560"
      cellHighlightColor="rgba(233, 69, 96, 0.3)"
      onCellClick={(x, y) => console.log(`Clicked: ${x}, ${y}`)}
    />
  );
};
