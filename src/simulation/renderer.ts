/**
 * Token and device renderer for canvas
 */

import type { AnyDevice, DeviceState, SimulationConfig, Token } from './types';

/** Default rendering configuration */
const DEFAULT_CONFIG: SimulationConfig = {
  timeScale: 1.0,
  tokenColor: '#3b82f6',
  faultColor: '#ef4444',
  runningColor: '#22c55e',
  stoppedColor: '#6b7280',
};

/**
 * Renderer class for drawing simulation state on a canvas
 */
export class SimulationRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: SimulationConfig;
  private tokenRadius: number = 8;

  constructor(
    canvas: HTMLCanvasElement,
    config: Partial<SimulationConfig> = {}
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = context;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Clears the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Gets the color for a device based on its state
   */
  getDeviceColor(state: DeviceState): string {
    switch (state) {
      case 'running':
        return this.config.runningColor;
      case 'stopped':
        return this.config.stoppedColor;
      case 'faulted':
        return this.config.faultColor;
    }
  }

  /**
   * Renders a single device
   */
  renderDevice(device: AnyDevice): void {
    const { x, y } = device.position;
    const { width, height } = device;
    const color = this.getDeviceColor(device.state);

    this.ctx.save();
    
    // Draw device body
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2;
    
    if (device.type === 'conveyor') {
      // Draw conveyor as rounded rectangle
      this.roundRect(x, y, width, height, 4);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Draw direction indicator
      this.drawDirectionIndicator(device);
    } else if (device.type === 'source') {
      // Draw source as circle
      this.ctx.beginPath();
      this.ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (device.type === 'sink') {
      // Draw sink as square with X
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeRect(x, y, width, height);
      
      // Draw X
      this.ctx.beginPath();
      this.ctx.moveTo(x + 4, y + 4);
      this.ctx.lineTo(x + width - 4, y + height - 4);
      this.ctx.moveTo(x + width - 4, y + 4);
      this.ctx.lineTo(x + 4, y + height - 4);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
    } else {
      // Default rectangle
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeRect(x, y, width, height);
    }

    // Draw fault indicator
    if (device.state === 'faulted') {
      this.drawFaultIndicator(device);
    }

    this.ctx.restore();
  }

  /**
   * Draws a direction indicator on a conveyor
   */
  private drawDirectionIndicator(device: AnyDevice): void {
    if (device.type !== 'conveyor') return;
    
    const { x, y } = device.position;
    const { width, height } = device;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const arrowSize = 8;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();

    const conveyor = device as import('./types').Conveyor;
    switch (conveyor.direction) {
      case 'right':
        this.ctx.moveTo(centerX + arrowSize, centerY);
        this.ctx.lineTo(centerX - arrowSize / 2, centerY - arrowSize / 2);
        this.ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize / 2);
        break;
      case 'left':
        this.ctx.moveTo(centerX - arrowSize, centerY);
        this.ctx.lineTo(centerX + arrowSize / 2, centerY - arrowSize / 2);
        this.ctx.lineTo(centerX + arrowSize / 2, centerY + arrowSize / 2);
        break;
      case 'down':
        this.ctx.moveTo(centerX, centerY + arrowSize);
        this.ctx.lineTo(centerX - arrowSize / 2, centerY - arrowSize / 2);
        this.ctx.lineTo(centerX + arrowSize / 2, centerY - arrowSize / 2);
        break;
      case 'up':
        this.ctx.moveTo(centerX, centerY - arrowSize);
        this.ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize / 2);
        this.ctx.lineTo(centerX + arrowSize / 2, centerY + arrowSize / 2);
        break;
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draws a fault indicator on a device
   */
  private drawFaultIndicator(device: AnyDevice): void {
    const { x, y } = device.position;
    const size = 16;

    // Draw warning triangle
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(x + size / 2, y - size);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw exclamation mark
    this.ctx.fillStyle = '#1f2937';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('!', x + size / 2, y - 3);
  }

  /**
   * Renders a single token
   */
  renderToken(token: Token): void {
    const { x, y } = token.position;
    
    this.ctx.save();
    
    // Draw token shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(x + 2, y + 2, this.tokenRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw token body
    this.ctx.fillStyle = token.color;
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.tokenRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x - 2, y - 2, this.tokenRadius / 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * Renders all tokens
   */
  renderTokens(tokens: Token[]): void {
    for (const token of tokens) {
      this.renderToken(token);
    }
  }

  /**
   * Renders all devices
   */
  renderDevices(devices: AnyDevice[]): void {
    for (const device of devices) {
      this.renderDevice(device);
    }
  }

  /**
   * Renders connections between devices
   */
  renderConnections(
    devices: AnyDevice[],
    connections: Array<{ fromDeviceId: string; toDeviceId: string }>
  ): void {
    const deviceMap = new Map(devices.map(d => [d.id, d]));

    this.ctx.save();
    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    for (const conn of connections) {
      const from = deviceMap.get(conn.fromDeviceId);
      const to = deviceMap.get(conn.toDeviceId);

      if (from && to) {
        const fromX = from.position.x + from.width;
        const fromY = from.position.y + from.height / 2;
        const toX = to.position.x;
        const toY = to.position.y + to.height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  /**
   * Renders the simulation status indicator
   */
  renderStatus(status: string, x: number, y: number): void {
    this.ctx.save();
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.roundRect(x, y, 100, 30, 4);
    this.ctx.fill();
    
    // Status indicator dot
    const dotColor = status === 'running' ? '#22c55e' : 
                     status === 'paused' ? '#fbbf24' : '#6b7280';
    this.ctx.fillStyle = dotColor;
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 15, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Status text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(status.toUpperCase(), x + 28, y + 19);
    
    this.ctx.restore();
  }

  /**
   * Helper to draw rounded rectangles
   */
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Sets the token radius
   */
  setTokenRadius(radius: number): void {
    this.tokenRadius = radius;
  }

  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
