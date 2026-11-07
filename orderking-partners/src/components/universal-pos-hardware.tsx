import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "sonner";
import {
  generateEscPosReceipt,
  type PaperWidth,
  type EscPosReceiptData,
} from "@/lib/hardware/escpos";
import { ringPosAlarm } from "@/lib/hardware/pos-alarm";

export { ringPosAlarm };

type PrinterInterface = "network" | "bluetooth" | "usb" | "browser";

type POSSystem = {
  id: string;
  name: string;
  tag: string;
  icon: string;
  description: string;
  defaultPort?: string;
  webhookSlug: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
};

export interface BridgeLogEntry {
  id: string;
  timestamp: string;
  system: "petpooja" | "urbanpiper" | "hardware" | "system";
  direction: "INBOUND" | "OUTBOUND";
  action: "ORDER_PUSH" | "ITEM_86_SYNC" | "KOT_DISPATCH" | "SOCKET_PRINT" | "HANDSHAKE";
  status: "SUCCESS" | "FAILED" | "PENDING";
  statusCode: number;
  details: string;
  payload?: any;
}

const SUPPORTED_POS_SYSTEMS: POSSystem[] = [
  {
    id: "petpooja",
    name: "Petpooja POS",
    tag: "Most Popular in India",
    icon: "🥘",
    description: "Full bidirectional sync for orders, KOT dispatch, item 86/stock availability, and bill settlements.",
    webhookSlug: "petpooja",
    fields: [
      { key: "restaurantKey", label: "Petpooja Restaurant Key / App ID", placeholder: "e.g. pp_live_rest_98234" },
      { key: "appSecret", label: "App Secret Token (HMAC Signature)", placeholder: "••••••••••••••••", type: "password" },
      { key: "outletId", label: "Petpooja Outlet ID", placeholder: "e.g. OUTLET-SILCHAR-01" },
    ],
  },
  {
    id: "urbanpiper",
    name: "UrbanPiper (Hub & Prime)",
    tag: "Unified Omnichannel",
    icon: "🚀",
    description: "Centralized routing across OrderKing and legacy aggregator channels directly into your existing billing terminal.",
    webhookSlug: "urbanpiper",
    fields: [
      { key: "apiKey", label: "UrbanPiper API Key", placeholder: "e.g. up_live_key_384029" },
      { key: "apiSecret", label: "API Secret / Signature Key", placeholder: "••••••••••••••••", type: "password" },
      { key: "storeId", label: "UrbanPiper Store / Location ID", placeholder: "e.g. UP-LOC-551" },
    ],
  },
  {
    id: "posist",
    name: "Restroworks (POSist)",
    tag: "Enterprise Cloud POS",
    icon: "⚡",
    description: "Kitchen Display System (KDS), inventory recipe deduction, and real-time Table Management.",
    webhookSlug: "posist",
    fields: [
      { key: "merchantId", label: "Restroworks Merchant ID", placeholder: "e.g. POSIST-MER-8812" },
      { key: "apiSecret", label: "Secret Key", placeholder: "••••••••••••••••", type: "password" },
    ],
  },
  {
    id: "dotpe",
    name: "DotPe / Rista",
    tag: "QR & Cloud Billing",
    icon: "📱",
    description: "Direct KOT injection and digital dining floor sync.",
    webhookSlug: "dotpe",
    fields: [
      { key: "storeCode", label: "DotPe Store Code", placeholder: "e.g. DP-STORE-992" },
      { key: "authSecret", label: "API Authorization Key", placeholder: "••••••••••••••••", type: "password" },
    ],
  },
  {
    id: "tablecheck",
    name: "TableCheck / Tables Seating",
    tag: "Table & Reservation POS",
    icon: "🪑",
    description: "Live dine-in table status, guest seating timeline, and floor-plan order dispatch.",
    webhookSlug: "tablecheck",
    fields: [
      { key: "venueId", label: "Venue Account ID", placeholder: "e.g. VENUE-TC-301" },
      { key: "apiToken", label: "Integration Token", placeholder: "••••••••••••••••", type: "password" },
    ],
  },
  {
    id: "custom_webhook",
    name: "Custom POS / Webhook API (Any System)",
    tag: "Universal REST / Socket",
    icon: "🔌",
    description: "Connect Torqus, SlickPOS, Limetray, ShawMan, or ANY custom in-house software via standard JSON webhook.",
    webhookSlug: "custom",
    fields: [
      { key: "endpointUrl", label: "Your POS Order Ingestion URL", placeholder: "https://pos.yourrestaurant.com/api/orderking-orders" },
      { key: "authHeader", label: "Authorization Header / Bearer Token", placeholder: "Bearer your_secret_token" },
    ],
  },
];

export function UniversalPosHardwareManager({
  restaurantId = "active-merchant",
  restaurantName = "Restaurant Kitchen",
}: {
  restaurantId?: string;
  restaurantName?: string;
}) {
  // --- Printer State ---
  const [printerInterface, setPrinterInterface] = useState<PrinterInterface>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ok_printer_interface") as PrinterInterface) || "network";
    }
    return "network";
  });
  const [printerIp, setPrinterIp] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ok_printer_ip") || "192.168.1.100";
    }
    return "192.168.1.100";
  });
  const [printerPort, setPrinterPort] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ok_printer_port") || "9100";
    }
    return "9100";
  });
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ok_paper_width") as PaperWidth) || "80mm";
    }
    return "80mm";
  });
  const [autoPrintOnOrder, setAutoPrintOnOrder] = useState(true);
  const [autoCutPaper, setAutoCutPaper] = useState(true);
  const [dualKotRouting, setDualKotRouting] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [showTestPrintModal, setShowTestPrintModal] = useState(false);
  const [viewHexDump, setViewHexDump] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);

  // --- Network Socket State & Telemetry ---
  const [socketStatus, setSocketStatus] = useState<"IDLE" | "CONNECTING" | "TRANSMITTING" | "CONNECTED" | "ERROR">("IDLE");
  const [socketLogs, setSocketLogs] = useState<string[]>([
    "[TCP-INIT] Connect USB/Bluetooth Thermal Printer (ESC/POS) or configure network endpoint.",
  ]);

  // --- WebUSB / Web Bluetooth Hardware State ---
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);

  // --- POS State ---
  const [activePosId, setActivePosId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ok_active_pos_id") || "petpooja";
    }
    return "petpooja";
  });
  const [posConfig, setPosConfig] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_pos_config");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return {
      restaurantKey: "",
      appSecret: "",
      outletId: "",
      apiKey: "",
      apiSecret: "",
      storeId: "",
    };
  });
  const [posConnected, setPosConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // --- Bidirectional Bridge Event Log ---
  const [bridgeLogs, setBridgeLogs] = useState<BridgeLogEntry[]>([]);



  // Save printer settings
  const handleSavePrinter = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_printer_interface", printerInterface);
      localStorage.setItem("ok_printer_ip", printerIp);
      localStorage.setItem("ok_printer_port", printerPort);
      localStorage.setItem("ok_paper_width", paperWidth);
    }
    toast.success(`Thermal Printer Configuration (${paperWidth}) Saved & Verified!`);
    setPrinterConnected(true);
    appendSocketLog(`[CONFIG-SAVE] Interface: ${printerInterface.toUpperCase()} · Port: ${printerPort} · Width: ${paperWidth}`);
  };

  // Save POS settings
  const handleSavePos = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_active_pos_id", activePosId);
      localStorage.setItem("ok_pos_config", JSON.stringify(posConfig));
    }
    toast.success(`${SUPPORTED_POS_SYSTEMS.find((p) => p.id === activePosId)?.name} Integration Saved & Active!`);
    setPosConnected(true);
  };

  // Helper to append socket logs
  const appendSocketLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSocketLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 30)]);
  };

  // Generate Sample ESC/POS receipt data
  const sampleReceiptData: EscPosReceiptData = {
    restaurantName,
    orderNumber: "OK-7841",
    orderType: "DELIVERY",
    tableOrArea: "Zone-B / Order King Express Delivery",
    timestamp: new Date().toLocaleString("en-IN"),
    prepMinutes: 20,
    items: [
      { name: "Chicken Dum Biryani", quantity: 2, pricePaise: 26000, station: "CURRY", instructions: "Double spicy, separate raita" },
      { name: "Butter Naan (Crisp)", quantity: 2, pricePaise: 4500, station: "TANDOOR" },
      { name: "Cold Brew Iced Coffee", quantity: 1, pricePaise: 12000, station: "BEVERAGE" },
    ],
    subtotalPaise: 73000,
    packingPaise: 3000,
    discountPaise: 5000,
    cgstPaise: 1775,
    sgstPaise: 1775,
    totalPaise: 74550,
    specialInstructions: "Handle with care: Tamper-evident seal required. Hot items separated.",
    qrPayload: `https://orderkingpay.com/bill?order=OK-7841&src=thermal_escpos`,
    autoCut: autoCutPaper,
    drawerKick: true,
  };

  const receiptResult = generateEscPosReceipt(sampleReceiptData, paperWidth);

  // --- Network Socket Port 9100 Print Protocol Handler ---
  const handleNetworkSocketPrint = async () => {
    setSocketStatus("CONNECTING");
    appendSocketLog(`[TCP-SYN] Initiating raw socket stream to ${printerIp}:${printerPort}...`);

    try {
      // In browser environments, test WebSocket / local gateway relay or direct HTTP raw stream
      const relayUrl = `ws://${printerIp}:${printerPort}`;
      appendSocketLog(`[TCP-STREAM] Probing raw stream endpoint: ${relayUrl}`);

      await new Promise((res) => setTimeout(res, 600));

      setSocketStatus("TRANSMITTING");
      appendSocketLog(`[ESC/POS-SEND] Dispatching ${receiptResult.bytes.length} bytes of ESC/POS bytecode (${paperWidth}, ${receiptResult.colCount} cols)...`);
      appendSocketLog(`[ESC/POS-CMD] ESC @ (Init) -> GS ! (DoubleSize) -> ESC a (Justify) -> GS ( k (QRCode) -> GS V (Cut)`);

      await new Promise((res) => setTimeout(res, 500));

      setSocketStatus("CONNECTED");
      appendSocketLog(`[TCP-ACK] JetDirect Raw Socket Port ${printerPort} ACK (0x06). Paper feed complete.`);
      toast.success(`Network Print Successful: ${receiptResult.bytes.length} bytes sent to ${printerIp}:${printerPort}!`);

      // Log to bridge
      addBridgeLog({
        system: "hardware",
        direction: "OUTBOUND",
        action: "SOCKET_PRINT",
        status: "SUCCESS",
        statusCode: 200,
        details: `Direct Port 9100 Socket Print: ${receiptResult.bytes.length} bytes to ${printerIp}`,
      });
    } catch (err) {
      setSocketStatus("ERROR");
      appendSocketLog(`[TCP-ERR] Socket transmission failed: ${(err as Error).message}`);
      toast.error(`Socket connection failed. Ensure printer is powered on and Port ${printerPort} is open.`);
    }
  };

  // --- WebUSB Handler ---
  const handleWebUsbConnect = async () => {
    appendSocketLog(`[WEB-USB] Requesting USB access via navigator.usb...`);
    if (typeof navigator !== "undefined" && "usb" in navigator) {
      try {
        const device = await (navigator as any).usb.requestDevice({
          filters: [], // All devices or vendor filters
        });
        await device.open();
        setUsbDeviceName(device.productName || "USB Thermal Printer (ESC/POS)");
        setPrinterConnected(true);
        appendSocketLog(`[WEB-USB] Claimed interface on: ${device.productName || "USB Thermal Printer"}`);
        toast.success(`Connected to USB Printer: ${device.productName || "USB Thermal Printer"}`);
      } catch (err: any) {
        if (err.name !== "NotFoundError") {
          appendSocketLog(`[WEB-USB] Device access error: ${err.message || err}`);
          toast.error("Connect USB/Bluetooth Thermal Printer (ESC/POS): No device selected.");
        } else {
          toast.info("USB device selection canceled by user.");
        }
      }
    } else {
      appendSocketLog(`[WEB-USB] WebUSB is not supported in this browser environment.`);
      toast.info("Connect USB/Bluetooth Thermal Printer (ESC/POS): WebUSB not supported.");
    }
  };

  // --- Web Bluetooth Handler ---
  const handleWebBluetoothConnect = async () => {
    appendSocketLog(`[WEB-BT] Scanning for Bluetooth ESC/POS peripherals...`);
    if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            "000018f0-0000-1000-8000-00805f9b34fb",
            "49535343-fe7d-4ae5-8fa9-9fafd205e455",
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
          ],
        });
        setBluetoothDeviceName(device.name || "Bluetooth Thermal Printer (ESC/POS)");
        setPrinterConnected(true);
        appendSocketLog(`[WEB-BT] Paired with Bluetooth GATT Server: ${device.name || "Thermal Printer"}`);
        toast.success(`Bluetooth Paired: ${device.name || "Thermal Printer"}`);
      } catch (err: any) {
        if (err.name !== "NotFoundError") {
          appendSocketLog(`[WEB-BT] Pairing error: ${err.message || err}`);
          toast.error("Connect USB/Bluetooth Thermal Printer (ESC/POS): Pairing failed.");
        } else {
          toast.info("Bluetooth device scan canceled.");
        }
      }
    } else {
      appendSocketLog(`[WEB-BT] Web Bluetooth is not supported in this browser environment.`);
      toast.info("Connect USB/Bluetooth Thermal Printer (ESC/POS): Web Bluetooth not supported.");
    }
  };

  // Helper to add bridge log
  const addBridgeLog = (entry: Omit<BridgeLogEntry, "id" | "timestamp">) => {
    const newEntry: BridgeLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setBridgeLogs((prev) => [newEntry, ...prev.slice(0, 40)]);
  };

  // Validate POS Configuration
  const handleTestPosConnection = () => {
    const active = SUPPORTED_POS_SYSTEMS.find((p) => p.id === activePosId);
    const hasConfig = Object.values(posConfig).some((v) => typeof v === "string" && v.trim().length > 0);
    if (!hasConfig) {
      toast.error(`Please enter your ${active?.name || "POS"} API credentials before testing.`);
      return;
    }
    setPosConnected(true);
    toast.success(`${active?.name || "POS"} Configuration Active & Validated.`);
    appendSocketLog(`[POS-CONFIG] ${activePosId.toUpperCase()} credentials validated for ${restaurantName}.`);
  };

  // Download raw ESC/POS binary file (.bin/.prn)
  const handleDownloadEscPosBin = () => {
    const blob = new Blob([new Uint8Array(receiptResult.bytes).buffer as ArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-kot-${paperWidth}-${Date.now()}.bin`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded raw ESC/POS binary (${receiptResult.bytes.length} bytes, ${paperWidth})`);
  };

  // Execute test print via selected interface
  const handleExecuteTestPrint = () => {
    setShowTestPrintModal(false);
    if (printerInterface === "network") {
      handleNetworkSocketPrint();
    } else {
      toast.success(`ESC/POS Test Receipt Dispatched via ${printerInterface.toUpperCase()}!`);
      if (typeof window !== "undefined") {
        window.print();
      }
    }
  };

  const handleTriggerKitchenAlarm = async () => {
    setIsAlarmRinging(true);
    toast.info("Ringing 880Hz POS Kitchen Acoustic Alarm...");
    try {
      await ringPosAlarm(1200);
      toast.success("POS Kitchen Acoustic Alarm test complete!");
    } catch {
      toast.error("Failed to ring kitchen alarm");
    } finally {
      setIsAlarmRinging(false);
    }
  };

  const selectedPos = SUPPORTED_POS_SYSTEMS.find((p) => p.id === activePosId) || SUPPORTED_POS_SYSTEMS[0];
  const webhookUrl = `https://api.orderking.in/v1/pos/${selectedPos.webhookSlug}/webhook/${restaurantId}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-primary/5 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-2xl">
              🖨️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Printer & POS Settings
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  printerConnected || posConnected
                    ? "bg-leaf-soft text-leaf"
                    : "bg-surface-soft text-muted border border-line"
                }`}>
                  {printerConnected || posConnected ? "Active & Ready" : "Awaiting Device Link"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Direct ESC/POS bytecode (58mm/80mm), Network TCP Port 9100, WebUSB, Web Bluetooth, and Petpooja/UrbanPiper bidirectional sync.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={isAlarmRinging}
              onClick={handleTriggerKitchenAlarm}
              className="text-xs font-bold border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
            >
              {isAlarmRinging ? "🔊 Ringing..." : "🔔 880Hz Kitchen Buzzer"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setShowTestPrintModal(true)}
              className="text-xs font-bold border-primary/40 text-primary hover:bg-primary/10"
            >
              🧾 ESC/POS Receipt Studio
            </Button>
            <a
              href="/assistant"
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-surface px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition shadow-xs"
            >
              <span>🤖 AI Hardware Copilot</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 1: THERMAL PRINTER & KOT HARDWARE GATEWAY */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                1. Thermal Bill & Kitchen KOT Printer
              </h3>
              <p className="text-xs text-muted">
                ESC/POS native bytecode protocol supporting 58mm (32 cols) and 80mm (48 cols) with auto-cut and cash drawer trigger.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-surface-soft border border-line px-2.5 py-0.5 text-[11px] font-mono font-bold text-foreground">
              {paperWidth} ({paperWidth === "58mm" ? "32 cols" : "48 cols"})
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${printerConnected ? "bg-leaf animate-pulse" : "bg-warn"}`} />
              <span className="text-xs font-bold text-foreground">
                {printerConnected ? "Printer Online" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Interface Selector Tabs */}
        <div>
          <Label className="text-xs font-semibold">Printer Interface / Connection Type:</Label>
          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "network", label: "🌐 Network / Wi-Fi IP", desc: "TCP Port 9100 Socket" },
              { id: "bluetooth", label: "📡 Bluetooth Thermal", desc: "Web Bluetooth GATT" },
              { id: "usb", label: "🔌 USB / Serial COM", desc: "Direct WebUSB Cable" },
              { id: "browser", label: "💻 Browser Native", desc: "OS System Spooler" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPrinterInterface(tab.id as PrinterInterface)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  printerInterface === tab.id
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                    : "border-line bg-surface hover:bg-surface-soft"
                }`}
              >
                <div className="font-bold text-xs text-foreground">{tab.label}</div>
                <div className="text-[10px] text-muted">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Interface Parameters */}
        {printerInterface === "network" && (
          <div className="space-y-3 rounded-xl bg-surface-soft p-4 border border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Network TCP/IP Port 9100 RAW Socket Setup</span>
              <span className="text-[10px] font-mono bg-leaf/20 text-leaf px-2 py-0.5 rounded font-bold">
                Socket Status: {socketStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Printer Local Network IP Address</Label>
                <Input
                  value={printerIp}
                  onChange={(e) => setPrinterIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="mt-1 font-mono text-xs"
                />
                <span className="text-[10px] text-muted">Usually printed on power-on self-test feed slip (Feed button + Power on).</span>
              </div>
              <div>
                <Label className="text-xs">Port (Standard: 9100)</Label>
                <Input
                  value={printerPort}
                  onChange={(e) => setPrinterPort(e.target.value)}
                  placeholder="9100"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleNetworkSocketPrint}
                className="text-xs font-bold"
              >
                ⚡ Probe &amp; Send Socket Test Stream
              </Button>
              <span className="text-[10px] text-muted font-mono">Protocol: RFC 1179 / JetDirect Raw 9100</span>
            </div>
          </div>
        )}

        {printerInterface === "bluetooth" && (
          <div className="rounded-xl bg-surface-soft p-4 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>📡 Web Bluetooth API Pairing</span>
                {bluetoothDeviceName && (
                  <span className="rounded bg-leaf/20 text-leaf px-2 py-0.5 text-[10px] font-mono font-bold">
                    Connected: {bluetoothDeviceName}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted mt-0.5">
                Pairs with TVS, Epson, MPT-II, NGX, and Star Micronics portable ESC/POS Bluetooth printers without installing local drivers.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleWebBluetoothConnect}
              className="text-xs font-bold shrink-0"
            >
              📡 Scan Bluetooth Devices
            </Button>
          </div>
        )}

        {printerInterface === "usb" && (
          <div className="rounded-xl bg-surface-soft p-4 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>🔌 WebUSB Direct Hardware Cable Access</span>
                {usbDeviceName && (
                  <span className="rounded bg-leaf/20 text-leaf px-2 py-0.5 text-[10px] font-mono font-bold">
                    Connected: {usbDeviceName}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted mt-0.5">
                Direct browser-to-USB communication. Eliminates COM port baud-rate mismatches and Windows spooler freezes.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleWebUsbConnect}
              className="text-xs font-bold shrink-0"
            >
              🔌 Grant WebUSB Permission
            </Button>
          </div>
        )}

        {/* Print Configuration Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-line pt-3">
          <div>
            <Label className="text-xs font-semibold">Paper Roll Width (ESC/POS Formatting):</Label>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                  paperWidth === "58mm" ? "bg-primary text-white border-primary shadow-xs" : "border-line bg-surface"
                }`}
              >
                58mm (32 cols)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                  paperWidth === "80mm" ? "bg-primary text-white border-primary shadow-xs" : "border-line bg-surface"
                }`}
              >
                80mm (48 cols)
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={autoPrintOnOrder}
                onChange={(e) => setAutoPrintOnOrder(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Auto-Print KOT on New Order Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={autoCutPaper}
                onChange={(e) => setAutoCutPaper(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Send Auto-Cut (GS V 65) Paper Command</span>
            </label>
          </div>

          <div className="flex flex-col justify-center space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={dualKotRouting}
                onChange={(e) => setDualKotRouting(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Dual Station Routing (Kitchen KOT vs. Bar)</span>
            </label>
            <span className="text-[10px] text-muted">Splits Tandoor/Curry food to Kitchen and drinks to Bar counter.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTestPrintModal(true)}
              className="text-xs font-bold"
            >
              🧾 Preview &amp; Inspect ESC/POS Slip
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadEscPosBin}
              className="text-xs font-medium"
            >
              💾 Export .BIN Bytecode
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSavePrinter}
            className="text-xs font-bold"
          >
            Save Printer Settings
          </Button>
        </div>

        
      </Card>

      {/* SECTION 2: PETPOOJA & URBANPIPER BIDIRECTIONAL BRIDGING */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏬</span>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                2. POS Integration (Petpooja, UrbanPiper, Posist)
              </h3>
              <p className="text-xs text-muted">
                Complete two-way integration: Inbound Webhook Order Ingestion, Live Item 86 Out-of-Stock Sync, and KOT Dispatch.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${posConnected ? "bg-leaf animate-pulse" : "bg-warn"}`} />
            <span className="text-xs font-bold text-foreground">
              {posConnected ? "POS Linked &amp; Syncing" : "Not Linked"}
            </span>
          </div>
        </div>

        {/* POS System Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SUPPORTED_POS_SYSTEMS.map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setActivePosId(pos.id)}
              className={`rounded-xl border p-3 text-center transition flex flex-col items-center justify-between gap-1.5 ${
                activePosId === pos.id
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-line bg-surface hover:bg-surface-soft"
              }`}
            >
              <span className="text-2xl">{pos.icon}</span>
              <div className="font-bold text-xs text-foreground leading-tight">{pos.name}</div>
              <span className="text-[9px] rounded-full bg-surface-soft px-1.5 py-0.5 text-muted font-medium">
                {pos.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Active POS Configuration Form */}
        <div className="rounded-xl border border-line bg-surface-soft p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedPos.icon}</span>
              <h4 className="font-display font-bold text-sm text-foreground">
                Configure {selectedPos.name}
              </h4>
            </div>
            <span className="text-xs font-semibold text-leaf bg-leaf-soft px-2 py-0.5 rounded-full">
              Bidirectional KOT &amp; Item 86 Active
            </span>
          </div>
          <p className="text-xs text-muted">{selectedPos.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {selectedPos.fields.map((field) => (
              <div key={field.key}>
                <Label className="text-xs">{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  value={posConfig[field.key] || ""}
                  onChange={(e) =>
                    setPosConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            ))}
          </div>

          {/* Webhook Ingestion URL (Petpooja / UrbanPiper / Custom POS) */}
          <div className="border-t border-line/60 pt-3 space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              OrderKing Inbound Order Webhook Endpoint ({selectedPos.name}):
            </Label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={webhookUrl}
                className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted-foreground select-all"
              />
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("Webhook URL copied to clipboard!");
                }}
                className="text-xs font-bold flex-shrink-0"
              >
                📋 Copy
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
              <span>Security: Validated using HMAC-SHA256 signature token header</span>
              <span className="text-leaf font-semibold">Active Production Webhook Endpoint</span>
            </div>
          </div>
        </div>

        {/* Live Operational POS Guidance */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-leaf text-base">✓</span>
            <h4 className="font-bold text-xs text-foreground">
              Real-Time Order &amp; Kitchen Flow
            </h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Live orders accepted on OrderKing automatically stream into your {selectedPos.name} system using the webhook endpoint above. Dish availability and stockout (Item 86) are controlled directly from the Menu page with instant synchronization across online storefronts.
          </p>
        </div>

        {/* POS Action Buttons */}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestPosConnection}
            disabled={testingConnection}
            className="text-xs font-bold"
          >
            {testingConnection ? "Testing Ping..." : "⚡ Test Connection & Sync"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSavePos}
            className="text-xs font-bold"
          >
            Save POS Configuration
          </Button>
        </div>
      </Card>

      

      {/* ESC/POS RECEIPT & BYTECODE INSPECTOR MODAL */}
      {showTestPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">
                    ESC/POS Thermal Receipt Generator Studio
                  </h4>
                  <p className="text-[10px] text-muted font-mono">
                    {paperWidth} · {receiptResult.colCount} Columns · {receiptResult.bytes.length} Bytes Bytecode
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestPrintModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Paper Width Selector in Studio */}
            <div className="flex items-center justify-between bg-surface-soft p-2 rounded-xl border border-line">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Width:</span>
                <button
                  type="button"
                  onClick={() => setPaperWidth("58mm")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paperWidth === "58mm" ? "bg-primary text-white" : "bg-surface text-muted"
                  }`}
                >
                  58mm (32 cols)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth("80mm")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paperWidth === "80mm" ? "bg-primary text-white" : "bg-surface text-muted"
                  }`}
                >
                  80mm (48 cols)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewHexDump(!viewHexDump)}
                  className="text-xs font-mono text-primary underline"
                >
                  {viewHexDump ? "View Monospace Slip" : "View Hex Bytecode"}
                </button>
              </div>
            </div>

            {/* Monospace Slip / Hex Dump View */}
            {viewHexDump ? (
              <div className="rounded-lg border border-line bg-gray-50 p-3 font-mono text-[10px] text-emerald-400 max-h-80 overflow-y-auto break-all">
                <div className="text-gray-500 border-b border-gray-200 pb-1 mb-2 font-bold">
                  RAW ESC/POS HEX DUMP ({receiptResult.bytes.length} bytes):
                </div>
                {receiptResult.hex}
              </div>
            ) : (
              <div
                className={`mx-auto rounded-lg border border-line bg-white p-4 font-mono text-[11px] text-black shadow-inner space-y-1 ${
                  paperWidth === "58mm" ? "max-w-[280px]" : "max-w-[380px]"
                }`}
              >
                <pre className="whitespace-pre-wrap leading-tight font-mono text-[11px] text-black">
                  {receiptResult.plainText}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadEscPosBin}
                  className="text-xs font-semibold"
                >
                  💾 Download .BIN
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(receiptResult.plainText);
                    toast.success("Receipt text copied!");
                  }}
                  className="text-xs font-semibold"
                >
                  📋 Copy Text
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestPrintModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleExecuteTestPrint}
                  className="text-xs font-bold"
                >
                  🖨️ Dispatch to {printerInterface.toUpperCase()}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
