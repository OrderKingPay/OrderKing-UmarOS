import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  PersistentKotPrinterManager,
  kotHardware,
  buildEscPosKotBytes,
  BLUETOOTH_PRINTER_SERVICE_UUID,
  BLUETOOTH_PRINTER_CHARACTERISTIC_UUID,
  type BluetoothDeviceLike,
} from "../lib/printer/persistent-kot-printer";

// Audio mocks for Node test runner
class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

let activeMockAudioCtx: MockAudioContext;

class MockAudioContext {
  state = "suspended";
  currentTime = 0;
  destination = new MockAudioNode();
  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];

  constructor() {
    activeMockAudioCtx = this;
  }

  createOscillator = vi.fn(() => {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc as unknown as OscillatorNode;
  });

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain as unknown as GainNode;
  });

  resume = vi.fn(async () => {
    this.state = "running";
  });
}

describe("Persistent KOT Printer & Kitchen Audio Hardware Specialist", () => {
  let mockStorage: Record<string, string> = {};
  let mockVibrate: ReturnType<typeof vi.fn>;
  let mockWakeLockRequest: ReturnType<typeof vi.fn>;
  let dispatchedCustomEvents: CustomEvent[] = [];

  beforeEach(() => {
    mockStorage = {};
    dispatchedCustomEvents = [];
    mockVibrate = vi.fn();

    const mockWakeLockSentinel = {
      released: false,
      release: vi.fn(async () => {
        mockWakeLockSentinel.released = true;
      }),
      addEventListener: vi.fn(),
    };
    mockWakeLockRequest = vi.fn(async () => mockWakeLockSentinel);

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });

    vi.stubGlobal("AudioContext", MockAudioContext);

    vi.stubGlobal("navigator", {
      vibrate: mockVibrate,
      wakeLock: {
        request: mockWakeLockRequest,
      },
    });

    const listeners: Record<string, Function[]> = {};
    vi.stubGlobal("window", {
      AudioContext: MockAudioContext,
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = String(value);
        },
      },
      addEventListener: (event: string, cb: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
      },
      removeEventListener: vi.fn(),
      dispatchEvent: (evt: CustomEvent) => {
        dispatchedCustomEvents.push(evt);
        return true;
      },
    });

    const docListeners: Record<string, Function[]> = {};
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: (event: string, cb: Function) => {
        if (!docListeners[event]) docListeners[event] = [];
        docListeners[event].push(cb);
      },
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    kotHardware.stopIncomingOrderSiren();
    kotHardware.disconnectBluetooth();
  });

  it("exports a singleton kotHardware instance and correct service UUIDs", () => {
    expect(kotHardware).toBeInstanceOf(PersistentKotPrinterManager);
    expect(BLUETOOTH_PRINTER_SERVICE_UUID).toBe("000018f0-0000-1000-8000-00805f9b34fb");
    expect(BLUETOOTH_PRINTER_CHARACTERISTIC_UUID).toBe("00002af1-0000-1000-8000-00805f9b34fb");
  });

  it("manages persistent Bluetooth GATT connection and MTU chunked writing", async () => {
    const manager = new PersistentKotPrinterManager();
    const writtenChunks: Uint8Array[] = [];

    const mockChar = {
      uuid: BLUETOOTH_PRINTER_CHARACTERISTIC_UUID,
      properties: { write: true, writeWithoutResponse: true },
      writeValueWithoutResponse: vi.fn(async (chunk: BufferSource) => {
        writtenChunks.push(new Uint8Array(chunk as ArrayBuffer));
      }),
      writeValue: vi.fn(),
    };

    const mockService = {
      uuid: BLUETOOTH_PRINTER_SERVICE_UUID,
      getCharacteristics: vi.fn(async () => [mockChar]),
    };

    const mockGattServer = {
      connected: true,
      connect: vi.fn(async () => mockGattServer),
      disconnect: vi.fn(() => {
        mockGattServer.connected = false;
      }),
      getPrimaryServices: vi.fn(async () => [mockService]),
    };

    const mockDevice: BluetoothDeviceLike = {
      id: "bt-thermal-printer-01",
      name: "TVS RP-3160 Gold",
      gatt: mockGattServer,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    const connected = await manager.connectBluetooth(mockDevice);
    expect(connected).toBe(true);
    expect(manager.isConnected()).toBe(true);
    expect(manager.getDevice()?.name).toBe("TVS RP-3160 Gold");

    // Write a test 300-byte payload to verify 128-byte chunking
    const testBytes = new Uint8Array(300);
    for (let i = 0; i < 300; i++) testBytes[i] = i % 256;

    const writeSuccess = await manager.writeBytes(testBytes);
    expect(writeSuccess).toBe(true);
    // 300 bytes in 128-byte chunks = 128, 128, 44 => 3 chunks
    expect(writtenChunks.length).toBe(3);
    expect(writtenChunks[0].length).toBe(128);
    expect(writtenChunks[1].length).toBe(128);
    expect(writtenChunks[2].length).toBe(44);

    manager.disconnectBluetooth();
    expect(manager.isConnected()).toBe(false);
  });

  it("unlocks AudioContext and establishes 0.001Hz sub-audible keep-alive oscillator", async () => {
    const manager = new PersistentKotPrinterManager();
    const audioCtx = await manager.unlockAudio();

    expect(audioCtx).not.toBeNull();
    expect(activeMockAudioCtx.resume).toHaveBeenCalled();

    // Verify sub-audible keepalive oscillator configuration
    expect(activeMockAudioCtx.createOscillator).toHaveBeenCalled();
    const keepAliveOsc = activeMockAudioCtx.createdOscillators[0];
    expect(keepAliveOsc.type).toBe("sine");
    expect(keepAliveOsc.frequency.setValueAtTime).toHaveBeenCalledWith(0.001, expect.any(Number));

    const keepAliveGain = activeMockAudioCtx.createdGains[0];
    expect(keepAliveGain.gain.setValueAtTime).toHaveBeenCalledWith(0.00001, expect.any(Number));
    expect(keepAliveOsc.start).toHaveBeenCalled();
  });

  it("acquires screen WakeLock and tracks its active state", async () => {
    const manager = new PersistentKotPrinterManager();
    expect(manager.isWakeLockActive()).toBe(false);

    const acquired = await manager.requestWakeLock();
    expect(acquired).toBe(true);
    expect(manager.isWakeLockActive()).toBe(true);
    expect(mockWakeLockRequest).toHaveBeenCalledWith("screen");

    await manager.releaseWakeLock();
    expect(manager.isWakeLockActive()).toBe(false);
  });

  it("builds valid ESC/POS byte sequence with items, taxes, packaging, and cutter commands", () => {
    const order = {
      orderNumber: "OK-8921",
      orderType: "DELIVERY",
      customerArea: "Indiranagar 100ft Road, Bengaluru",
      prepMinutes: 20,
      lines: [
        {
          itemName: "Hyderabadi Dum Biryani",
          quantity: 2,
          unitPricePaise: 38000,
          station: "Biryani Counter",
          specialInstructions: "Extra raita, double masala",
        },
        {
          itemName: "Mirchi Ka Salan",
          quantity: 1,
          unitPricePaise: 4000,
        },
      ],
      prices: {
        foodValuePaise: 80000,
        packingPaise: 3000,
        taxPaise: 4150,
        customerTotalPaise: 87150,
      },
      specialInstructions: "Handle with care, keep gravy cups upright",
    };

    const bytes = buildEscPosKotBytes(order, {
      restaurantName: "Biryani Royal Express",
      paperWidth: "80mm",
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);

    // ESC @ (0x1B, 0x40): Initialize printer command at beginning
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);

    // Verify ESC/POS cutter command (0x1D, 0x56) is present in the byte buffer
    let hasCutCommand = false;
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0x1d && bytes[i + 1] === 0x56) {
        hasCutCommand = true;
        break;
      }
    }
    expect(hasCutCommand).toBe(true);

    // Decode textual content from binary buffer
    const decodedText = new TextDecoder().decode(bytes);
    expect(decodedText).toContain("BIRYANI ROYAL EXPRESS");
    expect(decodedText).toContain("ORDER #OK-8921");
    expect(decodedText).toContain("Hyderabadi Dum Biryani");
    expect(decodedText).toContain("Biryani Counter");
    expect(decodedText).toContain("Extra raita, double masala");
    expect(decodedText).toContain("Packaging:");
    expect(decodedText).toContain("CGST §9(5)");
    expect(decodedText).toContain("SGST §9(5)");
    expect(decodedText).toContain("TOTAL:");
    expect(decodedText).toContain("POWERED BY ORDERKING POS");
  });

  it("activates dual-oscillator sawtooth siren (960Hz-1320Hz) and native vibration", () => {
    const manager = new PersistentKotPrinterManager();
    expect(manager.isSirenActive()).toBe(false);

    manager.startIncomingOrderSiren();
    expect(manager.isSirenActive()).toBe(true);

    // Native vibration pattern check
    expect(mockVibrate).toHaveBeenCalledWith([400, 200, 400, 200, 800]);

    // Check dual sawtooth oscillators were initialized and started
    const sawtoothOscs = activeMockAudioCtx.createdOscillators.filter(
      (o) => o.type === "sawtooth"
    );
    expect(sawtoothOscs.length).toBe(2);

    // Both sawtooth oscillators started
    expect(sawtoothOscs[0].start).toHaveBeenCalled();
    expect(sawtoothOscs[1].start).toHaveBeenCalled();

    // Check center frequencies around 1140Hz with sweep
    expect(sawtoothOscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(1140, expect.any(Number));
    expect(sawtoothOscs[1].frequency.setValueAtTime).toHaveBeenCalledWith(1144, expect.any(Number));

    // Stopping siren disconnects oscillators and cancels vibration
    manager.stopIncomingOrderSiren();
    expect(manager.isSirenActive()).toBe(false);
    expect(sawtoothOscs[0].stop).toHaveBeenCalled();
    expect(sawtoothOscs[1].stop).toHaveBeenCalled();
    expect(mockVibrate).toHaveBeenCalledWith(0);
  });

  it("autoPrintEscPos generates bytes, triggers fallback/telemetry, and persists to localStorage", async () => {
    const manager = new PersistentKotPrinterManager();

    const sampleOrder = {
      id: "ord_kot_test_1234",
      order_number: "OK-5501",
      customer_area: "Whitefield, Bengaluru",
      food_value_paise: 25000,
      tax_paise: 1250,
      customer_total_paise: 26250,
      lines: [
        { item_name: "Paneer Butter Masala", quantity: 1, unitPricePaise: 25000 },
      ],
    };

    const res = await manager.autoPrintEscPos(sampleOrder, {
      restaurantName: "Punjab Grill Express",
      paperWidth: "80mm",
    });

    expect(res.success).toBe(true);
    expect(res.orderNumber).toBe("OK-5501");
    expect(res.bytes.length).toBeGreaterThan(50);

    // Verify localStorage audit snapshot
    const saved = mockStorage["ok_last_printed_kot"];
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved);
    expect(parsed.orderNumber).toBe("OK-5501");
    expect(parsed.byteCount).toBe(res.bytes.length);

    // Verify custom event was dispatched
    const customEvent = dispatchedCustomEvents.find(
      (e) => e.type === "orderking:kot_auto_print"
    );
    expect(customEvent).toBeDefined();
    expect(customEvent?.detail?.orderNumber).toBe("OK-5501");
  });
});
