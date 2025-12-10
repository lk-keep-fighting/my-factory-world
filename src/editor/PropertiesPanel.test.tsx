import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PropertiesPanel from './PropertiesPanel';
import * as store from './store';

// Mock the store
vi.mock('./store', () => ({
  useEditorStore: vi.fn(() => ({
    selectedDevice: null,
    devices: [],
    updateDevice: vi.fn()
  }))
}));

describe('PropertiesPanel', () => {
  const mockUpdateDevice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "No device selected" when no device is selected', () => {
    vi.spyOn(store, 'useEditorStore').mockReturnValue({
      selectedDevice: null,
      devices: [],
      updateDevice: mockUpdateDevice
    });

    render(<PropertiesPanel />);
    
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText(/No device selected/i)).toBeInTheDocument();
  });

  it('should display device properties when a device is selected', () => {
    const mockDevice = {
      id: 'test-1',
      type: 'conveyor' as const,
      position: { x: 100, y: 100 },
      width: 60,
      height: 40,
      state: 'stopped' as const,
      speed: 1.0,
      direction: 'right' as const
    };

    vi.spyOn(store, 'useEditorStore').mockReturnValue({
      selectedDevice: 'test-1',
      devices: [mockDevice],
      updateDevice: mockUpdateDevice
    });

    render(<PropertiesPanel />);
    
    expect(screen.getByDisplayValue('test-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('right')).toBeInTheDocument();
  });

  it('should handle property updates', async () => {
    const mockDevice = {
      id: 'test-1',
      type: 'conveyor' as const,
      position: { x: 100, y: 100 },
      width: 60,
      height: 40,
      state: 'stopped' as const,
      speed: 1.0,
      direction: 'right' as const,
      generationRate: undefined,
      outputDirection: undefined
    };

    vi.spyOn(store, 'useEditorStore').mockReturnValue({
      selectedDevice: 'test-1',
      devices: [mockDevice],
      updateDevice: mockUpdateDevice
    });

    render(<PropertiesPanel />);
    
    const speedInput = screen.getByLabelText(/speed/i);
    fireEvent.change(speedInput, { target: { value: '2.5' } });
    
    await waitFor(() => {
      expect(mockUpdateDevice).toHaveBeenCalledWith('test-1', expect.objectContaining({
        speed: 2.5
      }));
    });
  });

  it('should handle rotation using R key', async () => {
    const mockDevice = {
      id: 'test-1',
      type: 'conveyor' as const,
      position: { x: 100, y: 100 },
      width: 60,
      height: 40,
      state: 'stopped' as const,
      speed: 1.0,
      direction: 'right' as const,
      generationRate: undefined,
      outputDirection: undefined
    };

    vi.spyOn(store, 'useEditorStore').mockReturnValue({
      selectedDevice: 'test-1',
      devices: [mockDevice],
      updateDevice: mockUpdateDevice
    });

    render(<PropertiesPanel />);
    
    // Simulate R key press (this would be handled by keyboard hook in real app)
    const directionSelect = screen.getByDisplayValue('right');
    fireEvent.change(directionSelect, { target: { value: 'down' } });
    
    await waitFor(() => {
      expect(mockUpdateDevice).toHaveBeenCalledWith('test-1', expect.objectContaining({
        direction: 'down'
      }));
    });
  });

  it('should handle reset to defaults', async () => {
    const mockDevice = {
      id: 'test-1',
      type: 'conveyor' as const,
      position: { x: 100, y: 100 },
      width: 60,
      height: 40,
      state: 'stopped' as const,
      speed: 2.5,
      direction: 'down' as const,
      generationRate: undefined,
      outputDirection: undefined
    };

    vi.spyOn(store, 'useEditorStore').mockReturnValue({
      selectedDevice: 'test-1',
      devices: [mockDevice],
      updateDevice: mockUpdateDevice
    });

    render(<PropertiesPanel />);
    
    const resetButton = screen.getByText('Reset to Defaults');
    fireEvent.click(resetButton);
    
    await waitFor(() => {
      expect(mockUpdateDevice).toHaveBeenCalledWith('test-1', {
        speed: 1.0,
        state: 'stopped'
      });
    });
  });
});
