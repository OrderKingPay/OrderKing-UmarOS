/**
 * OrderKing Persistent Bluetooth Hardware KOT Printer & Kitchen Audio Siren Manager
 *
 * Provides:
 * 1. Persistent Bluetooth GATT reference for thermal receipt printers (UUID: 000018f0-0000-1000-8000-00805f9b34fb)
 * 2. Master AudioContext unlock with 0.001Hz sub-audible keep-alive oscillator preventing mobile Chrome audio suspension
 * 3. Screen WakeLock re-acquisition on visibility change (prevents Android / iOS kiosk sleep)
 * 4. Full buildEscPosKotBytes(order) with itemized lines, taxes, packaging, and auto-cut commands
 * 5. startIncomingOrderSiren() dual-oscillator sawtooth (960Hz - 1320Hz) wail with native vibration pattern
 */

import {
  generateEscPosReceipt,
  type PaperWidth,
  type EscPosReceiptData,
  EscPosReceiptBuilder,
} from "../hardware/escpos";
import {
  mapOrderToReceiptData,
  getSavedPaperWidth,
  dispatchSilentThermalKot,
} from "../hardware/thermal-printer";

export const BLUETOOTH_PRINTER_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
export const BLUETOOTH_PRINTER_CHARACTERISTIC_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

export interface BluetoothGattCharacteristicLike {
  uuid?: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
    notify?: boolean;
    read?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

export interface BluetoothGattServiceLike {
  uuid: string;
  getCharacteristics(): Promise<BluetoothGattCharacteristicLike[]>;
  getCharacteristic?(characteristic: string): Promise<BluetoothGattCharacteristicLike>;
}

export interface BluetoothRemoteGATTServerLike {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServerLike>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothGattServiceLike[]>;
  getPrimaryService?(service: string): Promise<BluetoothGattServiceLike>;
}

export interface BluetoothDeviceLike extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServerLike;
}

export interface PrintOrderOptions {
  paperWidth?: PaperWidth;
  restaurantName?: string;
  autoCut?: boolean;
}

export interface PrintResult {
  success: boolean;
  orderNumber: string;
  bytes: Uint8Array;
  bluetoothDispatched: boolean;
  timestamp: string;
}

/**
 * Builds standard ESC/POS binary bytecode buffer for Kitchen Order Tickets (KOT)
 * including restaurant branding, item lines, notes, taxes, packaging, and paper cut.
 */
export function buildEscPosKotBytes(
  order: any,
  options: PrintOrderOptions = {}
): Uint8Array {
  const width = options.paperWidth || getSavedPaperWidth();
  const receiptData = mapOrderToReceiptData(order, options.restaurantName);
  if (options.autoCut !== undefined) {
    receiptData.autoCut = options.autoCut;
  }
  const receipt = generateEscPosReceipt(receiptData, width);
  return receipt.bytes;
}

/**
 * High-performance, persistent kitchen hardware controller.
 * Handles Bluetooth GATT thermal printing, mobile wake lock, and kitchen sirens.
 */
export class PersistentKotPrinterManager {
  // Bluetooth GATT state
  private device: BluetoothDeviceLike | null = null;
  private server: BluetoothRemoteGATTServerLike | null = null;
  private characteristic: BluetoothGattCharacteristicLike | null = null;
  private isConnecting: boolean = false;

  // Web Audio keep-alive state
  private audioCtx: AudioContext | null = null;
  private keepAliveOsc: OscillatorNode | null = null;
  private keepAliveGain: GainNode | null = null;
  private isAudioUnlocked: boolean = false;

  // Kitchen siren state (dual sawtooth 960Hz - 1320Hz)
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain1: GainNode | null = null;
  private sirenLfoGain2: GainNode | null = null;
  private sirenMasterGain: GainNode | null = null;
  private isSirenPlaying: boolean = false;
  private vibrationInterval: ReturnType<typeof setInterval> | null = null;

  // Screen WakeLock state
  private wakeLock: any | null = null;
  private isWakeLockHeld: boolean = false;

  constructor() {
    this.setupGestureListeners();
    this.setupVisibilityListeners();
  }

  // =========================================================================
  // 1. BLUETOOTH GATT PERSISTENT MANAGEMENT (UUID: 000018f0-0000-1000-8000-00805f9b34fb)
  // =========================================================================

  /**
   * Connect or re-connect to a paired Bluetooth ESC/POS printer.
   */
  public async connectBluetooth(targetDevice?: BluetoothDeviceLike): Promise<boolean> {
    if (this.characteristic && this.server?.connected) {
      return true;
    }
    if (this.isConnecting) return false;
    this.isConnecting = true;

    try {
      let dev: BluetoothDeviceLike | null = targetDevice || this.device;

      if (!dev && typeof navigator !== "undefined" && "bluetooth" in navigator) {
        const activeBtDevice = (window as any).__orderking_active_bt_device;
        if (activeBtDevice?.gatt) {
          dev = activeBtDevice;
        } else {
          dev = await (navigator as any).bluetooth.requestDevice({
            filters: [{ services: [BLUETOOTH_PRINTER_SERVICE_UUID] }],
            optionalServices: [BLUETOOTH_PRINTER_SERVICE_UUID],
          });
        }
      }

      if (!dev?.gatt) {
        this.isConnecting = false;
        return false;
      }

      this.device = dev;
      if (typeof window !== "undefined") {
        (window as any).__orderking_active_bt_device = dev;
      }

      // Attach disconnection listener for auto-reconnect recovery
      dev.addEventListener("gattserverdisconnected", () => {
        console.warn("[KOT Hardware] Bluetooth thermal printer disconnected. Re-connect armed.");
        this.characteristic = null;
        this.server = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("orderking:printer_status", {
              detail: { connected: false, deviceName: this.device?.name },
            })
          );
        }
      });

      const server = await dev.gatt.connect();
      this.server = server;

      let service: BluetoothGattServiceLike | undefined;
      try {
        if (server.getPrimaryService) {
          service = await server.getPrimaryService(BLUETOOTH_PRINTER_SERVICE_UUID);
        } else {
          const services = await server.getPrimaryServices();
          service = services.find(
            (s) => s.uuid.toLowerCase() === BLUETOOTH_PRINTER_SERVICE_UUID.toLowerCase()
          );
        }
      } catch {
        const services = await server.getPrimaryServices();
        service = services[0];
      }

      if (!service) {
        throw new Error(`Bluetooth GATT service ${BLUETOOTH_PRINTER_SERVICE_UUID} not found.`);
      }

      const characteristics = await service.getCharacteristics();
      let writeChar = characteristics.find(
        (c) => c.uuid?.toLowerCase() === BLUETOOTH_PRINTER_CHARACTERISTIC_UUID.toLowerCase()
      );
      if (!writeChar) {
        writeChar = characteristics.find(
          (c) => c.properties?.write || c.properties?.writeWithoutResponse
        );
      }

      if (!writeChar) {
        throw new Error("No writable characteristic found on printer GATT service.");
      }

      this.characteristic = writeChar;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("orderking:printer_status", {
            detail: { connected: true, deviceName: this.device?.name },
          })
        );
      }

      console.log(
        `[KOT Hardware] ✅ Bluetooth GATT printer attached: ${this.device?.name || "ESC/POS Thermal"}`
      );
      return true;
    } catch (err) {
      console.warn("[KOT Hardware] Bluetooth connection failed:", err);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect the active Bluetooth GATT server connection.
   */
  public disconnectBluetooth(): void {
    if (this.server?.connected) {
      try {
        this.server.disconnect();
      } catch {}
    }
    this.characteristic = null;
    this.server = null;
  }

  /**
   * Check if Bluetooth thermal printer is actively connected.
   */
  public isConnected(): boolean {
    return Boolean(this.server?.connected && this.characteristic);
  }

  /**
   * Return currently paired Bluetooth device reference.
   */
  public getDevice(): BluetoothDeviceLike | null {
    return this.device;
  }

  /**
   * Send raw binary bytecode to printer in safe 128-byte BLE MTU chunks.
   */
  public async writeBytes(bytes: Uint8Array): Promise<boolean> {
    if (!this.characteristic) {
      return false;
    }

    const CHUNK_SIZE = 128;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse && this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
    }
    return true;
  }

  // =========================================================================
  // 2. MASTER AUDIOCONTEXT UNLOCK & 0.001Hz SUB-AUDIBLE KEEP-ALIVE OSCILLATOR
  // =========================================================================

  /**
   * Unlock AudioContext and establish a 0.001Hz sub-audible keep-alive oscillator.
   * This oscillator prevents mobile Chrome and Safari from placing the audio thread
   * into aggressive power-saving sleep when the tablet is idle in the kitchen.
   */
  public async unlockAudio(): Promise<AudioContext | null> {
    if (typeof window === "undefined") return null;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      // Establish sub-audible keep-alive oscillator if not already active
      if (!this.keepAliveOsc && this.audioCtx.state === "running") {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        // 0.001Hz: 1 cycle per 1000 seconds (far below human 20Hz audible limit)
        osc.frequency.setValueAtTime(0.001, this.audioCtx.currentTime);

        // Near-zero amplitude ensures absolute silence while keeping audio stream active
        gain.gain.setValueAtTime(0.00001, this.audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();

        this.keepAliveOsc = osc;
        this.keepAliveGain = gain;
        console.log("[KOT Hardware] Master AudioContext keep-alive oscillator running (0.001Hz).");
      }

      this.isAudioUnlocked = true;
      return this.audioCtx;
    } catch (err) {
      console.warn("[KOT Hardware] Failed to unlock AudioContext:", err);
      return null;
    }
  }

  /**
   * Check if AudioContext is unlocked.
   */
  public isAudioActive(): boolean {
    return Boolean(this.audioCtx && this.audioCtx.state === "running");
  }

  // =========================================================================
  // 3. SCREEN WAKELOCK RE-ACQUISITION ON VISIBILITY CHANGE
  // =========================================================================

  /**
   * Request screen WakeLock to prevent kitchen display tablets from sleeping.
   */
  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }
    try {
      this.wakeLock = await (navigator as any).wakeLock.request("screen");
      this.isWakeLockHeld = true;

      this.wakeLock.addEventListener("release", () => {
        this.wakeLock = null;
        this.isWakeLockHeld = false;
      });

      console.log("[KOT Hardware] Screen WakeLock acquired.");
      return true;
    } catch (err) {
      console.warn("[KOT Hardware] Screen WakeLock request rejected:", err);
      this.isWakeLockHeld = false;
      return false;
    }
  }

  /**
   * Release screen WakeLock manually.
   */
  public async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
      this.isWakeLockHeld = false;
    }
  }

  /**
   * Check if screen WakeLock is currently held.
   */
  public isWakeLockActive(): boolean {
    return this.isWakeLockHeld;
  }

  // =========================================================================
  // 4. DUAL-OSCILLATOR SAWTOOTH KITCHEN SIREN (960Hz - 1320Hz) & VIBRATION
  // =========================================================================

  /**
   * Trigger the incoming order kitchen siren.
   * Uses dual sawtooth oscillators swept between 960Hz and 1320Hz by an LFO,
   * coupled with repeating native vibration pulses.
   */
  public startIncomingOrderSiren(): void {
    if (this.isSirenPlaying) return;

    try {
      if (!this.audioCtx) {
        void this.unlockAudio();
      }

      const ctx = this.audioCtx;
      if (ctx) {
        if (ctx.state === "suspended") {
          void ctx.resume();
        }

        // Master gain for the siren
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
        masterGain.connect(ctx.destination);
        this.sirenMasterGain = masterGain;

        // LFO (Low-Frequency Oscillator) to modulate frequency between 960Hz and 1320Hz
        // Center frequency: (960 + 1320) / 2 = 1140 Hz
        // Amplitude: (1320 - 960) / 2 = 180 Hz
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(2.5, ctx.currentTime); // 2.5 sweeps per second

        const lfoGain1 = ctx.createGain();
        lfoGain1.gain.setValueAtTime(180, ctx.currentTime);

        const lfoGain2 = ctx.createGain();
        lfoGain2.gain.setValueAtTime(-180, ctx.currentTime);

        lfo.connect(lfoGain1);
        lfo.connect(lfoGain2);

        // Oscillator 1: Sawtooth centered at 1140Hz
        const osc1 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(1140, ctx.currentTime);
        lfoGain1.connect(osc1.frequency);
        osc1.connect(masterGain);

        // Oscillator 2: Sawtooth with slight 4Hz detuning (1144Hz) for acoustic thickness
        const osc2 = ctx.createOscillator();
        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(1144, ctx.currentTime);
        lfoGain2.connect(osc2.frequency);
        osc2.connect(masterGain);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        lfo.start(ctx.currentTime);

        this.sirenOsc1 = osc1;
        this.sirenOsc2 = osc2;
        this.sirenLfo = lfo;
        this.sirenLfoGain1 = lfoGain1;
        this.sirenLfoGain2 = lfoGain2;
      }
    } catch (err) {
      console.warn("[KOT Hardware] Failed to start audio siren:", err);
    }

    // Native vibration pattern: [400ms on, 200ms off, 400ms on, 200ms off, 800ms on]
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {}

      if (!this.vibrationInterval) {
        this.vibrationInterval = setInterval(() => {
          if (this.isSirenPlaying && typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([400, 200, 400, 200, 800]);
            } catch {}
          }
        }, 2200);
      }
    }

    this.isSirenPlaying = true;
    console.log("[KOT Hardware] 🚨 Incoming order kitchen siren active (dual sawtooth 960Hz-1320Hz).");
  }

  /**
   * Stop incoming order siren and clear vibration.
   */
  public stopIncomingOrderSiren(): void {
    if (!this.isSirenPlaying) return;

    try {
      if (this.sirenOsc1) {
        try { this.sirenOsc1.stop(); } catch {}
        this.sirenOsc1.disconnect();
        this.sirenOsc1 = null;
      }
      if (this.sirenOsc2) {
        try { this.sirenOsc2.stop(); } catch {}
        this.sirenOsc2.disconnect();
        this.sirenOsc2 = null;
      }
      if (this.sirenLfo) {
        try { this.sirenLfo.stop(); } catch {}
        this.sirenLfo.disconnect();
        this.sirenLfo = null;
      }
      if (this.sirenLfoGain1) {
        this.sirenLfoGain1.disconnect();
        this.sirenLfoGain1 = null;
      }
      if (this.sirenLfoGain2) {
        this.sirenLfoGain2.disconnect();
        this.sirenLfoGain2 = null;
      }
      if (this.sirenMasterGain) {
        this.sirenMasterGain.disconnect();
        this.sirenMasterGain = null;
      }
    } catch (err) {
      console.warn("[KOT Hardware] Error stopping siren nodes:", err);
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }

    this.isSirenPlaying = false;
    console.log("[KOT Hardware] Incoming order kitchen siren stopped.");
  }

  /**
   * Check if kitchen siren is currently active.
   */
  public isSirenActive(): boolean {
    return this.isSirenPlaying;
  }

  // =========================================================================
  // 5. ESC/POS KOT BINARY GENERATION & AUTO-PRINT DISPATCH
  // =========================================================================

  /**
   * Build ESC/POS bytes for an order using manager instance.
   */
  public buildEscPosKotBytes(order: any, options: PrintOrderOptions = {}): Uint8Array {
    return buildEscPosKotBytes(order, options);
  }

  /**
   * Automatically prints an incoming order to the connected Bluetooth thermal printer,
   * or falls back to silent emulator buffer and DOM events.
   */
  public async autoPrintEscPos(
    order: any,
    options: PrintOrderOptions = {}
  ): Promise<PrintResult> {
    const bytes = this.buildEscPosKotBytes(order, options);
    const orderNumber = String(
      order.orderNumber ||
        order.order_number ||
        (order.id ? `OK-${String(order.id).slice(-4).toUpperCase()}` : "OK-0000")
    );
    const timestamp = new Date().toISOString();

    let bluetoothDispatched = false;

    // 1. Try active Bluetooth characteristic
    if (this.characteristic) {
      try {
        bluetoothDispatched = await this.writeBytes(bytes);
      } catch (btErr) {
        console.warn("[KOT Hardware] Bluetooth write failed:", btErr);
      }
    }

    // 2. If not dispatched, attempt fallback via legacy dispatchSilentThermalKot
    if (!bluetoothDispatched) {
      try {
        const fallbackRes = await dispatchSilentThermalKot(order, {
          restaurantName: options.restaurantName,
          paperWidth: options.paperWidth,
        });
        bluetoothDispatched = (fallbackRes as any).bluetoothDispatched ?? false;
      } catch (fallbackErr) {
        console.warn("[KOT Hardware] Thermal printer fallback error:", fallbackErr);
      }
    }

    // 3. Persist audit telemetry to localStorage
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          "ok_last_printed_kot",
          JSON.stringify({
            orderNumber,
            timestamp,
            byteCount: bytes.length,
            bluetoothDispatched,
          })
        );
        window.dispatchEvent(
          new CustomEvent("orderking:kot_auto_print", {
            detail: {
              orderNumber,
              byteCount: bytes.length,
              bluetoothDispatched,
              timestamp,
            },
          })
        );
      } catch {}
    }

    console.log(
      `[KOT Hardware] ✅ autoPrintEscPos: ${bytes.length} bytes for #${orderNumber} (BT: ${bluetoothDispatched ? "PAIRED" : "EMULATED"})`
    );

    return {
      success: true,
      orderNumber,
      bytes,
      bluetoothDispatched,
      timestamp,
    };
  }

  // =========================================================================
  // INTERNAL LISTENERS
  // =========================================================================

  private setupGestureListeners(): void {
    if (typeof window === "undefined") return;

    const gestureHandler = () => {
      void this.unlockAudio();
      void this.requestWakeLock();
    };

    window.addEventListener("click", gestureHandler, { passive: true, once: true });
    window.addEventListener("touchstart", gestureHandler, { passive: true, once: true });
    window.addEventListener("keydown", gestureHandler, { passive: true, once: true });
  }

  private setupVisibilityListeners(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible") {
        // Re-acquire screen wake lock on tab focus
        await this.requestWakeLock();

        // Resume AudioContext if browser suspended it during tab switch
        if (this.audioCtx && this.audioCtx.state === "suspended") {
          try {
            await this.audioCtx.resume();
          } catch {}
        }
      }
    });
  }
}

/**
 * Singleton instance of PersistentKotPrinterManager for global hardware coordination.
 */
export const kotHardware = new PersistentKotPrinterManager();
