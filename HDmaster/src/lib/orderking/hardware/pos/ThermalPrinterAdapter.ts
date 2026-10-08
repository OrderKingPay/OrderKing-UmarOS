import * as net from 'net';

export interface OrderCartItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

export interface OrderCart {
  id: string;
  customerName?: string;
  items: OrderCartItem[];
  total: number;
  timestamp: string;
}

export interface PrinterConnectionConfig {
  type: 'tcp' | 'bluetooth';
  host?: string;
  port?: number;
  macAddress?: string;
}

export class ThermalPrinterAdapter {
  private config: PrinterConnectionConfig;

  // ESC/POS Commands
  private readonly CMD_INIT = Buffer.from([0x1b, 0x40]);
  private readonly CMD_NEWLINE = Buffer.from([0x0a]);
  private readonly CMD_CUT_PAPER = Buffer.from([0x1d, 0x56, 0x41, 0x00]); // Full cut
  private readonly CMD_ALIGN_CENTER = Buffer.from([0x1b, 0x61, 0x01]);
  private readonly CMD_ALIGN_LEFT = Buffer.from([0x1b, 0x61, 0x00]);
  private readonly CMD_BOLD_ON = Buffer.from([0x1b, 0x45, 0x01]);
  private readonly CMD_BOLD_OFF = Buffer.from([0x1b, 0x45, 0x00]);
  private readonly CMD_DOUBLE_SIZE = Buffer.from([0x1d, 0x21, 0x11]);
  private readonly CMD_NORMAL_SIZE = Buffer.from([0x1d, 0x21, 0x00]);

  constructor(config: PrinterConnectionConfig) {
    this.config = config;
  }

  /**
   * Compiles the order cart into ESC/POS raw bytes.
   */
  public compileOrder(cart: OrderCart): Buffer {
    const buffers: Buffer[] = [];

    // Initialize
    buffers.push(this.CMD_INIT);

    // Header
    buffers.push(this.CMD_ALIGN_CENTER);
    buffers.push(this.CMD_DOUBLE_SIZE);
    buffers.push(this.CMD_BOLD_ON);
    buffers.push(Buffer.from('KITCHEN TICKET\n'));
    buffers.push(this.CMD_BOLD_OFF);
    buffers.push(this.CMD_NORMAL_SIZE);
    buffers.push(this.CMD_NEWLINE);

    buffers.push(this.CMD_ALIGN_LEFT);
    buffers.push(Buffer.from(`Order ID: ${cart.id}\n`));
    if (cart.customerName) {
      buffers.push(Buffer.from(`Customer: ${cart.customerName}\n`));
    }
    buffers.push(Buffer.from(`Time: ${new Date(cart.timestamp).toLocaleString()}\n`));
    buffers.push(this.CMD_NEWLINE);
    buffers.push(Buffer.from('--------------------------------\n'));

    // Items
    for (const item of cart.items) {
      buffers.push(this.CMD_BOLD_ON);
      buffers.push(Buffer.from(`${item.quantity}x ${item.name}\n`));
      buffers.push(this.CMD_BOLD_OFF);
      
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          buffers.push(Buffer.from(`  - ${mod}\n`));
        }
      }
    }

    buffers.push(Buffer.from('--------------------------------\n'));
    buffers.push(this.CMD_NEWLINE);
    
    // Cut Paper
    buffers.push(this.CMD_CUT_PAPER);

    return Buffer.concat(buffers);
  }

  /**
   * Sends the compiled ESC/POS bytes to the physical printer.
   */
  public async printOrder(cart: OrderCart): Promise<void> {
    const payload = this.compileOrder(cart);

    if (this.config.type === 'tcp') {
      await this.sendOverTcp(payload);
    } else if (this.config.type === 'bluetooth') {
      await this.sendOverBluetooth(payload);
    } else {
      throw new Error('Unsupported printer connection type');
    }
  }

  private sendOverTcp(payload: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.host || !this.config.port) {
        return reject(new Error('TCP host and port are required'));
      }

      const client = new net.Socket();
      
      client.connect(this.config.port, this.config.host, () => {
        client.write(payload, (err) => {
          if (err) {
            client.destroy();
            return reject(err);
          }
          client.end();
        });
      });

      client.on('close', () => {
        resolve();
      });

      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });
    });
  }

  private async sendOverBluetooth(payload: Buffer): Promise<void> {
    if (!this.config.macAddress) {
      throw new Error('Bluetooth MAC address is required');
    }
    
    // In a real Node environment, this would require a package like 'bluetooth-serial-port'
    // or native bindings to write to the RFCOMM channel.
    // For this engine, we will stub the native call or assume a theoretical implementation.
    // E.g.
    // const btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
    // btSerial.findSerialPortChannel(...)
    
    console.warn('Bluetooth printing is not fully implemented in this environment without native dependencies.');
    console.log(`[Bluetooth -> ${this.config.macAddress}] Sending ${payload.length} bytes.`);
    
    // Stub implementation to represent the real hardware interaction
    return Promise.resolve();
  }
}
