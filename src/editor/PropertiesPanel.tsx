import React from 'react';
import { useEditorStore } from './store';
import { AnyDevice } from '../simulation/types';

export interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className = '' }: PropertiesPanelProps) {
  const { selectedDevice, devices, updateDevice } = useEditorStore();
  
  const device = selectedDevice ? devices.find(d => d.id === selectedDevice) : null;
  
  if (!device) {
    return (
      <div className={`properties-panel ${className}`}>
        <h3>Properties</h3>
        <p>No device selected</p>
      </div>
    );
  }

  const handlePropertyChange = <K extends keyof AnyDevice>(
    property: K,
    value: any,
    validate?: (value: any) => boolean
  ) => {
    if (validate && !validate(value)) {
      return;
    }
    updateDevice(device.id, { [property]: value });
  };

  const commonFields = (
    <>
      <div className="property-group">
        <label htmlFor="device-id">ID</label>
        <input
          id="device-id"
          type="text"
          value={device.id}
          disabled
          className="property-input"
        />
      </div>
      
      <div className="property-group">
        <label htmlFor="device-type">Type</label>
        <select
          id="device-type"
          value={device.type}
          disabled
          className="property-input"
        >
          <option value="conveyor">Conveyor</option>
          <option value="source">Source</option>
          <option value="sink">Sink</option>
          <option value="junction">Junction</option>
        </select>
      </div>
      
      <div className="property-group">
        <label htmlFor="device-state">State</label>
        <select
          id="device-state"
          value={device.state}
          onChange={(e) => handlePropertyChange('state', e.target.value)}
          className="property-input"
        >
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="faulted">Faulted</option>
        </select>
      </div>
      
      <div className="property-group">
        <label htmlFor="device-x">X Position</label>
        <input
          id="device-x"
          type="number"
          value={device.position.x}
          onChange={(e) => handlePropertyChange('position', {
            ...device.position,
            x: parseInt(e.target.value) || 0
          })}
          className="property-input"
        />
      </div>
      
      <div className="property-group">
        <label htmlFor="device-y">Y Position</label>
        <input
          id="device-y"
          type="number"
          value={device.position.y}
          onChange={(e) => handlePropertyChange('position', {
            ...device.position,
            y: parseInt(e.target.value) || 0
          })}
          className="property-input"
        />
      </div>
      
      <div className="property-group">
        <label htmlFor="device-width">Width</label>
        <input
          id="device-width"
          type="number"
          min={20}
          max={200}
          value={device.width}
          onChange={(e) => handlePropertyChange('width', parseInt(e.target.value) || 60)}
          className="property-input"
        />
      </div>
      
      <div className="property-group">
        <label htmlFor="device-height">Height</label>
        <input
          id="device-height"
          type="number"
          min={20}
          max={200}
          value={device.height}
          onChange={(e) => handlePropertyChange('height', parseInt(e.target.value) || 40)}
          className="property-input"
        />
      </div>
    </>
  );

  const typeSpecificFields = () => {
    switch (device.type) {
      case 'conveyor':
        return (
          <>
            <div className="property-group">
              <label htmlFor="conveyor-speed">Speed</label>
              <input
                id="conveyor-speed"
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={device.speed}
                onChange={(e) => handlePropertyChange('speed', parseFloat(e.target.value) || 1.0)}
                className="property-input"
              />
            </div>
            
            <div className="property-group">
              <label htmlFor="conveyor-direction">Direction</label>
              <select
                id="conveyor-direction"
                value={device.direction}
                onChange={(e) => handlePropertyChange('direction', e.target.value)}
                className="property-input"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </div>
          </>
        );
        
      case 'source':
        return (
          <div className="property-group">
            <label htmlFor="source-rate">Generation Rate</label>
            <input
              id="source-rate"
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={device.generationRate}
              onChange={(e) => handlePropertyChange('generationRate', parseFloat(e.target.value) || 1.0)}
              className="property-input"
            />
          </div>
        );
        
      case 'junction':
        return (
          <div className="property-group">
            <label htmlFor="junction-direction">Output Direction</label>
            <select
              id="junction-direction"
              value={device.outputDirection}
              onChange={(e) => handlePropertyChange('outputDirection', e.target.value)}
              className="property-input"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
          </div>
        );
        
      case 'sink':
        return null; // No additional properties for sink
    }
  };

  return (
    <div className={`properties-panel ${className}`} data-testid="properties-panel">
      <h3>Properties</h3>
      
      <div className="property-section">
        <h4>Common</h4>
        {commonFields}
      </div>
      
      <div className="property-section">
        <h4>{device.type.charAt(0).toUpperCase() + device.type.slice(1)} Properties</h4>
        {typeSpecificFields()}
      </div>
      
      <div className="property-actions">
        <button
          onClick={() => {
            // Reset to defaults
            updateDevice(device.id, {
              speed: device.type === 'conveyor' ? 1.0 : undefined,
              generationRate: device.type === 'source' ? 1.0 : undefined,
              state: 'stopped'
            });
          }}
          className="reset-button"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}