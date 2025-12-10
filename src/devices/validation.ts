/**
 * Device schema validation helpers
 */

import { 
  DeviceTemplate, 
  DeviceInstance, 
  ValidationResult, 
  DeviceSchemaValidator,
  ConnectorDirection 
} from './types';

/** Basic device schema validator implementation */
export class BasicDeviceSchemaValidator implements DeviceSchemaValidator {
  validateTemplate(template: DeviceTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!template.id) {
      errors.push('Device template must have an ID');
    }
    if (!template.displayName) {
      errors.push('Device template must have a display name');
    }
    if (!template.category) {
      errors.push('Device template must have a category');
    }
    if (!template.defaultProps || typeof template.defaultProps !== 'object') {
      errors.push('Device template must have default properties object');
    }
    if (!template.thumbnail) {
      errors.push('Device template must have a thumbnail');
    }
    if (!template.connectors || !Array.isArray(template.connectors)) {
      errors.push('Device template must have connectors array');
    }

    // ID format validation
    if (template.id && !/^[a-z][a-z0-9-]*$/.test(template.id)) {
      errors.push('Device ID must start with lowercase letter and contain only lowercase letters, numbers, and hyphens');
    }

    // Category validation
    const validCategories = ['conveyor', 'automation', 'sensors', 'storage'];
    if (template.category && !validCategories.includes(template.category)) {
      errors.push(`Invalid category: ${template.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Thumbnail validation
    if (template.thumbnail) {
      if (!template.thumbnail.width || template.thumbnail.width <= 0) {
        errors.push('Thumbnail width must be positive');
      }
      if (!template.thumbnail.height || template.thumbnail.height <= 0) {
        errors.push('Thumbnail height must be positive');
      }
      if (!template.thumbnail.pixels || !Array.isArray(template.thumbnail.pixels)) {
        errors.push('Thumbnail must have pixels array');
      }
    }

    // Connectors validation
    if (template.connectors) {
      const validDirections: ConnectorDirection[] = ['left', 'right', 'up', 'down', 'top', 'bottom'];
      template.connectors.forEach((connector, index) => {
        if (!connector.direction) {
          errors.push(`Connector at index ${index} must have direction`);
        } else if (!validDirections.includes(connector.direction)) {
          errors.push(`Connector at index ${index} has invalid direction: ${connector.direction}`);
        }
        if (!connector.position || typeof connector.position.x !== 'number' || typeof connector.position.y !== 'number') {
          errors.push(`Connector at index ${index} must have valid position with x, y coordinates`);
        }
      });
    }

    // Warnings for missing properties
    if (template.category === 'conveyor' && !('speed' in template.defaultProps)) {
      warnings.push('Conveyor devices should have a speed property');
    }
    if (template.category === 'sensors' && !('range' in template.defaultProps)) {
      warnings.push('Sensor devices should have a range property');
    }
    if (template.category === 'storage' && !('capacity' in template.defaultProps)) {
      warnings.push('Storage devices should have a capacity property');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateInstance(instance: DeviceInstance): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!instance.id) {
      errors.push('Device instance must have an ID');
    }
    if (!instance.type) {
      errors.push('Device instance must have a type');
    }
    if (!instance.template) {
      errors.push('Device instance must have a template reference');
    }
    if (!instance.position) {
      errors.push('Device instance must have a position');
    }
    if (typeof instance.rotation !== 'number' || instance.rotation < 0) {
      errors.push('Device instance must have valid rotation (non-negative number)');
    }
    if (!instance.customProps || typeof instance.customProps !== 'object') {
      errors.push('Device instance must have custom properties object');
    }
    if (!instance.state) {
      errors.push('Device instance must have a state');
    }

    // Position validation
    if (instance.position) {
      if (typeof instance.position.x !== 'number' || !isFinite(instance.position.x)) {
        errors.push('Device position x must be a finite number');
      }
      if (typeof instance.position.y !== 'number' || !isFinite(instance.position.y)) {
        errors.push('Device position y must be a finite number');
      }
    }

    // Rotation validation
    if (typeof instance.rotation === 'number') {
      if (instance.rotation % 90 !== 0) {
        warnings.push('Device rotation should be in 90-degree increments for optimal grid alignment');
      }
      if (instance.rotation < 0 || instance.rotation >= 360) {
        errors.push('Device rotation must be between 0 and 359 degrees');
      }
    }

    // State validation
    const validStates = ['running', 'stopped', 'faulted'];
    if (instance.state && !validStates.includes(instance.state)) {
      errors.push(`Invalid device state: ${instance.state}. Must be one of: ${validStates.join(', ')}`);
    }

    // Template validation
    if (instance.template) {
      const templateValidation = this.validateTemplate(instance.template);
      if (!templateValidation.isValid) {
        errors.push('Associated device template is invalid');
        errors.push(...templateValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateConnection(fromDevice: DeviceInstance, toDevice: DeviceInstance, direction: ConnectorDirection): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!fromDevice || !toDevice) {
      errors.push('Both fromDevice and toDevice must be provided');
      return { isValid: false, errors, warnings };
    }

    if (fromDevice.id === toDevice.id) {
      errors.push('Device cannot connect to itself');
    }

    // Direction validation
    const validDirections: ConnectorDirection[] = ['left', 'right', 'up', 'down', 'top', 'bottom'];
    if (!validDirections.includes(direction)) {
      errors.push(`Invalid connection direction: ${direction}`);
    }

    // Template validation
    if (fromDevice.template && toDevice.template) {
      // Check if fromDevice has connector in the specified direction
      const fromConnector = fromDevice.template.connectors.find(c => c.direction === direction);
      if (!fromConnector) {
        warnings.push(`From device does not have a connector in direction: ${direction}`);
      }

      // Check if toDevice has a compatible connector
      const oppositeDirection = this.getOppositeDirection(direction);
      const toConnector = toDevice.template.connectors.find(c => c.direction === oppositeDirection);
      if (!toConnector) {
        warnings.push(`To device does not have a connector in opposite direction: ${oppositeDirection}`);
      }

      // Check if devices are compatible types
      if (fromDevice.template.category === 'conveyor' && toDevice.template.category === 'storage') {
        warnings.push('Connecting conveyor directly to storage may cause overflow');
      }

      if (fromDevice.template.category === 'sensors' && toDevice.template.category === 'conveyor') {
        warnings.push('Sensor to conveyor connection may cause performance issues');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getOppositeDirection(direction: ConnectorDirection): ConnectorDirection {
    const opposites: Record<ConnectorDirection, ConnectorDirection> = {
      'left': 'right',
      'right': 'left',
      'up': 'down',
      'down': 'up',
      'top': 'bottom',
      'bottom': 'top'
    };
    return opposites[direction];
  }
}

/** JSON serialization validation for devices */
export class JSONSerializationValidator {
  static validateTemplateJSON(template: DeviceTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test serialization
      const jsonString = JSON.stringify(template);
      if (!jsonString) {
        errors.push('Template cannot be serialized to JSON');
      }

      // Test deserialization
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        errors.push('Template JSON cannot be parsed back to object');
      }

      // Check for non-serializable properties
      const jsonString2 = JSON.stringify(template, (key, value) => {
        if (typeof value === 'function') {
          errors.push(`Property "${key}" contains a function which cannot be serialized`);
          return `[Function: ${value.name}]`;
        }
        return value;
      });

      // Check for circular references
      const seen = new WeakSet();
      try {
        JSON.stringify(template, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              errors.push(`Circular reference detected at property "${key}"`);
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        });
      } catch (circularRefError) {
        errors.push('Template contains circular references that prevent JSON serialization');
      }

    } catch (error) {
      errors.push(`JSON serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateInstanceJSON(instance: DeviceInstance): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test serialization
      const jsonString = JSON.stringify(instance);
      if (!jsonString) {
        errors.push('Instance cannot be serialized to JSON');
      }

      // Test deserialization
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        errors.push('Instance JSON cannot be parsed back to object');
      }

      // Check for non-serializable properties
      JSON.stringify(instance, (key, value) => {
        if (typeof value === 'function') {
          errors.push(`Property "${key}" contains a function which cannot be serialized`);
          return `[Function: ${value.name}]`;
        }
        return value;
      });

      // Check for circular references
      const seen = new WeakSet();
      try {
        JSON.stringify(instance, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              errors.push(`Circular reference detected at property "${key}"`);
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        });
      } catch (circularRefError) {
        errors.push('Instance contains circular references that prevent JSON serialization');
      }

    } catch (error) {
      errors.push(`JSON serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/** Utility functions for device validation */
export const ValidationUtils = {
  /** Check if a device template is valid */
  isTemplateValid(template: DeviceTemplate): boolean {
    const validator = new BasicDeviceSchemaValidator();
    return validator.validateTemplate(template).isValid;
  },

  /** Check if a device instance is valid */
  isInstanceValid(instance: DeviceInstance): boolean {
    const validator = new BasicDeviceSchemaValidator();
    return validator.validateInstance(instance).isValid;
  },

  /** Check if a connection is valid */
  isConnectionValid(fromDevice: DeviceInstance, toDevice: DeviceInstance, direction: ConnectorDirection): boolean {
    const validator = new BasicDeviceSchemaValidator();
    return validator.validateConnection(fromDevice, toDevice, direction).isValid;
  },

  /** Validate template for JSON serialization */
  isTemplateJSONValid(template: DeviceTemplate): boolean {
    return JSONSerializationValidator.validateTemplateJSON(template).isValid;
  },

  /** Validate instance for JSON serialization */
  isInstanceJSONValid(instance: DeviceInstance): boolean {
    return JSONSerializationValidator.validateInstanceJSON(instance).isValid;
  }
};