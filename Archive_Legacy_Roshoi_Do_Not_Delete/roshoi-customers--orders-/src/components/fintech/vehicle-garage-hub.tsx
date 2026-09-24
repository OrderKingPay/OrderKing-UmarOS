import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Fuel,
  Info,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type VehicleCategory =
  | "2w"
  | "3w"
  | "4w"
  | "commercial_goods"
  | "commercial_passenger"
  | "tractor_agriculture"
  | "construction_heavy";

export type ChallanItem = {
  id: string;
  challanNumber: string;
  date: string;
  location: string;
  violation: string;
  amount: number;
  status: "unpaid" | "paid";
  convenienceFee: number;
  courtDate?: string;
  receiptNumber?: string;
};

export type InsuranceDetails = {
  policyNumber: string;
  provider: "Digit" | "Acko" | "ICICI Lombard" | "HDFC ERGO";
  expiryDate: string;
  daysRemaining: number;
  quoteAmount: number;
  status: "active" | "expiring_soon" | "expired";
  founderCommission: number;
};

export type PucDetails = {
  certNumber: string;
  expiryDate: string;
  daysRemaining: number;
  status: "valid" | "expiring_soon" | "expired";
  penaltyRisk: number;
};

export type FastagDetails = {
  tagId: string;
  bank: string;
  balance: number;
  status: "active" | "low_balance";
};

export type FitnessCertificateDetails = {
  certNumber: string;
  expiryDate: string;
  daysRemaining: number;
  status: "valid" | "expiring_soon" | "expired";
  penaltyRisk: number;
  inspectionFee: number;
};

export type PermitDetails = {
  permitNumber: string;
  permitType:
    | "National All-India Permit (AITP)"
    | "State Goods Carriage"
    | "Contract Carriage Permit"
    | "Agricultural Exempt";
  expiryDate: string;
  daysRemaining: number;
  status: "valid" | "expiring_soon" | "expired";
  renewalFee: number;
};

export type RoadTaxDetails = {
  taxType: "Quarterly" | "Annual" | "Lifetime / One-Time";
  validUpto: string;
  daysRemaining: number;
  status: "paid" | "due_soon" | "overdue";
  amountDue: number;
};

export type Vehicle = {
  id: string;
  regNumber: string;
  category: VehicleCategory;
  modelName: string;
  ownerName: string;
  rto: string;
  fuelType: "Petrol" | "Diesel" | "EV" | "CNG";
  registrationDate: string;
  insurance: InsuranceDetails;
  puc: PucDetails;
  challans: ChallanItem[];
  fastag?: FastagDetails;
  fitness?: FitnessCertificateDetails;
  permit?: PermitDetails;
  roadTax?: RoadTaxDetails;
};

export function getVehicleCategoryIcon(category: VehicleCategory): string {
  switch (category) {
    case "2w":
      return "🛵";
    case "3w":
      return "🛺";
    case "4w":
      return "🚗";
    case "commercial_goods":
      return "🚚";
    case "commercial_passenger":
      return "🚌";
    case "tractor_agriculture":
      return "🚜";
    case "construction_heavy":
      return "🏗️";
    default:
      return "🚗";
  }
}

export function getVehicleCategoryLabel(category: VehicleCategory): string {
  switch (category) {
    case "2w":
      return "2-Wheeler (Bike/Scooter/EV)";
    case "3w":
      return "3-Wheeler (Auto/E-Rickshaw/Toto)";
    case "4w":
      return "4-Wheeler (Car/SUV/EV)";
    case "commercial_goods":
      return "Goods Logistics (Truck/Pickup/Dumper)";
    case "commercial_passenger":
      return "Passenger (Cab/Bus/Traveler)";
    case "tractor_agriculture":
      return "Agriculture (Tractor/Harvester)";
    case "construction_heavy":
      return "Heavy Machinery (JCB/Excavator/Crane)";
    default:
      return "Vehicle";
  }
}

const DEFAULT_SAMPLE_VEHICLES: Vehicle[] = [
  // 1. 2-Wheeler
  {
    id: "veh_1",
    regNumber: "AS-10-AB-1234",
    category: "2w",
    modelName: "Royal Enfield Classic 350",
    ownerName: "Hasan Choudhury",
    rto: "DTO Silchar (AS-10)",
    fuelType: "Petrol",
    registrationDate: "14 Feb 2021",
    insurance: {
      policyNumber: "DIGIT-MOT-884192",
      provider: "Digit",
      expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 3,
      quoteAmount: 1399,
      status: "expiring_soon",
      founderCommission: 210, // 15% POSP commission
    },
    puc: {
      certNumber: "PUC-AS10-99214",
      expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 45,
      status: "valid",
      penaltyRisk: 10000,
    },
    challans: [
      {
        id: "chl_101",
        challanNumber: "AS10C2409210088",
        date: "12 Sep 2024, 04:30 PM",
        location: "Rangirkhari Point, Silchar",
        violation: "Riding without standard BIS safety helmet (Section 194D MV Act)",
        amount: 1000,
        status: "unpaid",
        convenienceFee: 49,
      },
    ],
    fastag: {
      tagId: "NETC-3419-8821-0012",
      bank: "SBI FASTag",
      balance: 340,
      status: "active",
    },
  },
  // 2. 3-Wheeler (Auto Rickshaw / E-Rickshaw)
  {
    id: "veh_3w",
    regNumber: "AS-10-TR-8822",
    category: "3w",
    modelName: "Bajaj RE Compact Auto (CNG)",
    ownerName: "Abdul Mannan",
    rto: "DTO Silchar (AS-10)",
    fuelType: "CNG",
    registrationDate: "18 Jun 2022",
    insurance: {
      policyNumber: "ICICI-3W-449102",
      provider: "ICICI Lombard",
      expiryDate: new Date(Date.now() + 25 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 25,
      quoteAmount: 3199,
      status: "expiring_soon",
      founderCommission: 480,
    },
    puc: {
      certNumber: "PUC-AS10-67123",
      expiryDate: new Date(Date.now() + 80 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 80,
      status: "valid",
      penaltyRisk: 10000,
    },
    fitness: {
      certNumber: "FC-AS10-88221",
      expiryDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 15,
      status: "expiring_soon",
      penaltyRisk: 5000,
      inspectionFee: 600,
    },
    permit: {
      permitNumber: "CC-AS10-2022-771",
      permitType: "Contract Carriage Permit",
      expiryDate: new Date(Date.now() + 140 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 140,
      status: "valid",
      renewalFee: 1200,
    },
    roadTax: {
      taxType: "Annual",
      validUpto: new Date(Date.now() + 40 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 40,
      status: "paid",
      amountDue: 1800,
    },
    challans: [],
    fastag: {
      tagId: "NETC-7712-9901-3321",
      bank: "Paytm Payments Bank",
      balance: 180,
      status: "active",
    },
  },
  // 3. 4-Wheeler (Car / SUV)
  {
    id: "veh_2",
    regNumber: "AS-01-EA-5566",
    category: "4w",
    modelName: "Hyundai Creta SX (O) Turbo",
    ownerName: "Hasan Choudhury",
    rto: "DTO Kamrup Metro Guwahati (AS-01)",
    fuelType: "Petrol",
    registrationDate: "20 Nov 2022",
    insurance: {
      policyNumber: "ACKO-CAR-771920",
      provider: "Acko",
      expiryDate: new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 120,
      quoteAmount: 6499,
      status: "active",
      founderCommission: 975,
    },
    puc: {
      certNumber: "PUC-AS01-44129",
      expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 5,
      status: "expiring_soon",
      penaltyRisk: 10000,
    },
    challans: [],
    fastag: {
      tagId: "NETC-8812-7740-9931",
      bank: "ICICI Bank FASTag",
      balance: 85,
      status: "low_balance",
    },
  },
  // 4. Commercial Goods (Truck / Pickup)
  {
    id: "veh_goods",
    regNumber: "AS-11-BC-9041",
    category: "commercial_goods",
    modelName: "Tata Ace Gold Mega (Chhota Hathi)",
    ownerName: "Barak Logistics Enterprise",
    rto: "DTO Karimganj / Sribhumi (AS-11)",
    fuelType: "Diesel",
    registrationDate: "10 Jan 2020",
    insurance: {
      policyNumber: "HDFC-COMM-552190",
      provider: "HDFC ERGO",
      expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 45,
      quoteAmount: 8950,
      status: "active",
      founderCommission: 1340,
    },
    puc: {
      certNumber: "PUC-AS11-99412",
      expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 20,
      status: "valid",
      penaltyRisk: 10000,
    },
    fitness: {
      certNumber: "FC-AS11-90411",
      expiryDate: new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 8,
      status: "expiring_soon",
      penaltyRisk: 5000,
      inspectionFee: 1000,
    },
    permit: {
      permitNumber: "SGP-AS11-2020-9912",
      permitType: "State Goods Carriage",
      expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 90,
      status: "valid",
      renewalFee: 2500,
    },
    roadTax: {
      taxType: "Quarterly",
      validUpto: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 12,
      status: "due_soon",
      amountDue: 2400,
    },
    challans: [
      {
        id: "chl_goods_1",
        challanNumber: "AS11C2408190012",
        date: "19 Aug 2024, 11:15 AM",
        location: "Badarpur Toll Gate",
        violation: "Commercial overload / No entry timing violation (Section 194 MV Act)",
        amount: 2000,
        status: "unpaid",
        convenienceFee: 49,
      },
    ],
    fastag: {
      tagId: "NETC-4412-8812-7711",
      bank: "SBI FASTag",
      balance: 1450,
      status: "active",
    },
  },
  // 5. Commercial Passenger (Bus / Cab)
  {
    id: "veh_passenger",
    regNumber: "AS-01-BP-4490",
    category: "commercial_passenger",
    modelName: "Volvo 9600 Intercity Multi-Axle Luxury Bus",
    ownerName: "Assam Royal Roadways",
    rto: "DTO Kamrup Metro Guwahati (AS-01)",
    fuelType: "Diesel",
    registrationDate: "12 May 2023",
    insurance: {
      policyNumber: "DIGIT-BUS-991230",
      provider: "Digit",
      expiryDate: new Date(Date.now() + 200 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 200,
      quoteAmount: 48500,
      status: "active",
      founderCommission: 7275,
    },
    puc: {
      certNumber: "PUC-AS01-88412",
      expiryDate: new Date(Date.now() + 150 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 150,
      status: "valid",
      penaltyRisk: 10000,
    },
    fitness: {
      certNumber: "FC-AS01-44901",
      expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 180,
      status: "valid",
      penaltyRisk: 5000,
      inspectionFee: 2000,
    },
    permit: {
      permitNumber: "AITP-AS01-2023-8890",
      permitType: "National All-India Permit (AITP)",
      expiryDate: new Date(Date.now() + 110 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 110,
      status: "valid",
      renewalFee: 15000,
    },
    roadTax: {
      taxType: "Annual",
      validUpto: new Date(Date.now() + 95 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 95,
      status: "paid",
      amountDue: 18500,
    },
    challans: [],
    fastag: {
      tagId: "NETC-9912-4410-0081",
      bank: "HDFC Bank FASTag",
      balance: 4200,
      status: "active",
    },
  },
  // 6. Agricultural Tractor
  {
    id: "veh_tractor",
    regNumber: "AS-10-AG-3310",
    category: "tractor_agriculture",
    modelName: "Mahindra 575 DI Sarpanch 45 HP Tractor",
    ownerName: "Cachar Kisan Samity",
    rto: "DTO Silchar (AS-10)",
    fuelType: "Diesel",
    registrationDate: "15 Mar 2021",
    insurance: {
      policyNumber: "ACKO-TRAC-112099",
      provider: "Acko",
      expiryDate: new Date(Date.now() + 75 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 75,
      quoteAmount: 4200,
      status: "active",
      founderCommission: 630,
    },
    puc: {
      certNumber: "PUC-AS10-11234",
      expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 60,
      status: "valid",
      penaltyRisk: 10000,
    },
    permit: {
      permitNumber: "AG-EXEMPT-AS10",
      permitType: "Agricultural Exempt",
      expiryDate: "Lifetime / Exempt",
      daysRemaining: 999,
      status: "valid",
      renewalFee: 0,
    },
    roadTax: {
      taxType: "Lifetime / One-Time",
      validUpto: "Lifetime Exempt",
      daysRemaining: 9999,
      status: "paid",
      amountDue: 0,
    },
    challans: [],
  },
  // 7. Heavy Construction & Mining (JCB / Excavator)
  {
    id: "veh_jcb",
    regNumber: "AS-11-CE-7788",
    category: "construction_heavy",
    modelName: "JCB 3DX Super Backhoe Loader (Earth Mover)",
    ownerName: "Barak Infra Buildcon",
    rto: "DTO Karimganj (AS-11)",
    fuelType: "Diesel",
    registrationDate: "05 Apr 2022",
    insurance: {
      policyNumber: "ICICI-CE-771239",
      provider: "ICICI Lombard",
      expiryDate: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 18,
      quoteAmount: 22400,
      status: "expiring_soon",
      founderCommission: 3360,
    },
    puc: {
      certNumber: "PUC-AS11-77881",
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 30,
      status: "valid",
      penaltyRisk: 10000,
    },
    fitness: {
      certNumber: "FC-AS11-77880",
      expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 14,
      status: "expiring_soon",
      penaltyRisk: 5000,
      inspectionFee: 1500,
    },
    roadTax: {
      taxType: "Annual",
      validUpto: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0]!,
      daysRemaining: 45,
      status: "paid",
      amountDue: 8500,
    },
    challans: [],
    fastag: {
      tagId: "NETC-7788-1209-4412",
      bank: "SBI FASTag (Class 12 Heavy Construction)",
      balance: 1200,
      status: "active",
    },
  },
];

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  onOpenScanner?: () => void;
};

export function VehicleGarageHub({
  walletBalance,
  onDeductWallet,
  onOpenScanner,
}: Props) {
  // Persistence
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kingpay_garage_vehicles");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_SAMPLE_VEHICLES;
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    () => vehicles[0]?.id || ""
  );

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    "all" | VehicleCategory
  >("all");

  const displayedVehicles =
    selectedCategoryFilter === "all"
      ? vehicles
      : vehicles.filter((v) => v.category === selectedCategoryFilter);

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputRegNo, setInputRegNo] = useState("");
  const [inputCategory, setInputCategory] = useState<VehicleCategory>("2w");
  const [isFetchingVahan, setIsFetchingVahan] = useState(false);

  // Challan Payment Modal
  const [selectedChallan, setSelectedChallan] = useState<{
    vehicle: Vehicle;
    challan: ChallanItem;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Insurance Renewal Modal
  const [selectedInsuranceVehicle, setSelectedInsuranceVehicle] =
    useState<Vehicle | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<
    "Digit" | "Acko" | "ICICI Lombard" | "HDFC ERGO"
  >("Digit");

  // FASTag Recharge Modal
  const [selectedFastagVehicle, setSelectedFastagVehicle] =
    useState<Vehicle | null>(null);
  const [fastagRechargeAmount, setFastagRechargeAmount] = useState<number>(500);

  // Save vehicles to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ok_kingpay_garage_vehicles",
        JSON.stringify(vehicles)
      );
    }
  }, [vehicles]);

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Global Compliance Alerts count
  const allUnpaidChallans = vehicles.flatMap((v) =>
    v.challans
      .filter((c) => c.status === "unpaid")
      .map((c) => ({ vehicle: v, challan: c }))
  );

  const allExpiringInsurance = vehicles.filter(
    (v) => v.insurance.status !== "active"
  );

  const allExpiringPuc = vehicles.filter((v) => v.puc.status !== "valid");

  const totalUnpaidAmount = allUnpaidChallans.reduce(
    (sum, item) => sum + item.challan.amount,
    0
  );

  // Format registration input (e.g. AS 10 AB 1234 -> AS-10-AB-1234)
  const handleRegInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 2) {
      setInputRegNo(clean);
    } else if (clean.length <= 4) {
      setInputRegNo(`${clean.slice(0, 2)}-${clean.slice(2)}`);
    } else if (clean.length <= 6) {
      setInputRegNo(
        `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`
      );
    } else {
      setInputRegNo(
        `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 10)}`
      );
    }
  };

  // Add vehicle with MoRTH Vahan simulation
  const handleFetchAndAddVehicle = () => {
    if (!inputRegNo || inputRegNo.length < 8) {
      toast.error("Please enter a valid Indian vehicle registration number.");
      return;
    }

    setIsFetchingVahan(true);

    setTimeout(() => {
      setIsFetchingVahan(false);

      // Model determination based on category & reg
      let model = "Honda Activa 6G (Smart Key)";
      let fuel: "Petrol" | "Diesel" | "EV" | "CNG" = "Petrol";
      let rto = "DTO Silchar (AS-10)";
      let quote = 1299;

      if (inputCategory === "3w") {
        model = "Bajaj RE Compact Auto (CNG)";
        fuel = "CNG";
        quote = 3199;
      } else if (inputCategory === "4w") {
        model = "Maruti Suzuki Swift ZXi";
        quote = 5499;
      } else if (inputCategory === "commercial_goods") {
        model = "Tata Ace Gold Mega (Chhota Hathi)";
        fuel = "Diesel";
        quote = 8950;
        rto = "DTO Sribhumi / Karimganj (AS-11)";
      } else if (inputCategory === "commercial_passenger") {
        model = "Force Tempo Traveler 3050 (17 Seater)";
        fuel = "Diesel";
        quote = 24500;
        rto = "DTO Kamrup Metro (AS-01)";
      } else if (inputCategory === "tractor_agriculture") {
        model = "Mahindra 575 DI Sarpanch 45HP Tractor";
        fuel = "Diesel";
        quote = 4200;
      } else if (inputCategory === "construction_heavy") {
        model = "JCB 3DX Super Backhoe Loader (Earth Mover)";
        fuel = "Diesel";
        quote = 22400;
      }

      if (inputRegNo.startsWith("AS-01")) {
        rto = "DTO Kamrup Metro (AS-01)";
      } else if (inputRegNo.startsWith("AS-11")) {
        rto = "DTO Karimganj / Sribhumi (AS-11)";
      } else if (inputRegNo.startsWith("AS-24")) {
        rto = "DTO Hailakandi (AS-24)";
      }

      const newVehicle: Vehicle = {
        id: `veh_${Date.now()}`,
        regNumber: inputRegNo,
        category: inputCategory,
        modelName: model,
        ownerName: "Verified Registered Owner",
        rto,
        fuelType: fuel,
        registrationDate: "10 Mar 2023",
        insurance: {
          policyNumber: `POL-${inputRegNo.replace(/-/g, "")}`,
          provider: "Digit",
          expiryDate: new Date(Date.now() + 60 * 86400000)
            .toISOString()
            .split("T")[0]!,
          daysRemaining: 60,
          quoteAmount: quote,
          status: "active",
          founderCommission: Math.round(quote * 0.15),
        },
        puc: {
          certNumber: `PUC-${Math.floor(10000 + Math.random() * 90000)}`,
          expiryDate: new Date(Date.now() + 90 * 86400000)
            .toISOString()
            .split("T")[0]!,
          daysRemaining: 90,
          status: "valid",
          penaltyRisk: 10000,
        },
        fitness:
          inputCategory === "3w" ||
          inputCategory === "commercial_goods" ||
          inputCategory === "commercial_passenger" ||
          inputCategory === "construction_heavy"
            ? {
                certNumber: `FC-${Math.floor(10000 + Math.random() * 90000)}`,
                expiryDate: new Date(Date.now() + 180 * 86400000)
                  .toISOString()
                  .split("T")[0]!,
                daysRemaining: 180,
                status: "valid",
                penaltyRisk: 5000,
                inspectionFee: 1200,
              }
            : undefined,
        permit:
          inputCategory === "3w" ||
          inputCategory === "commercial_goods" ||
          inputCategory === "commercial_passenger" ||
          inputCategory === "tractor_agriculture"
            ? {
                permitNumber: `PERMIT-${inputRegNo.replace(/-/g, "")}`,
                permitType:
                  inputCategory === "tractor_agriculture"
                    ? "Agricultural Exempt"
                    : inputCategory === "commercial_passenger"
                      ? "National All-India Permit (AITP)"
                      : "State Goods Carriage",
                expiryDate:
                  inputCategory === "tractor_agriculture"
                    ? "Lifetime / Exempt"
                    : new Date(Date.now() + 240 * 86400000)
                        .toISOString()
                        .split("T")[0]!,
                daysRemaining: inputCategory === "tractor_agriculture" ? 9999 : 240,
                status: "valid",
                renewalFee: inputCategory === "tractor_agriculture" ? 0 : 2500,
              }
            : undefined,
        roadTax: {
          taxType:
            inputCategory === "tractor_agriculture"
              ? "Lifetime / One-Time"
              : inputCategory === "commercial_goods"
                ? "Quarterly"
                : "Annual",
          validUpto:
            inputCategory === "tractor_agriculture"
              ? "Lifetime Exempt"
              : new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]!,
          daysRemaining: inputCategory === "tractor_agriculture" ? 9999 : 90,
          status: "paid",
          amountDue:
            inputCategory === "tractor_agriculture"
              ? 0
              : inputCategory === "commercial_goods"
                ? 2400
                : 3500,
        },
        challans: [],
        fastag:
          inputCategory !== "tractor_agriculture"
            ? {
                tagId: `NETC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                bank: "SBI FASTag",
                balance: 350,
                status: "active",
              }
            : undefined,
      };

      setVehicles((prev) => [newVehicle, ...prev]);
      setSelectedVehicleId(newVehicle.id);
      setShowAddModal(false);
      setInputRegNo("");
      toast.success(
        `✅ Vehicle ${newVehicle.regNumber} (${newVehicle.modelName}) successfully added to Garage!`
      );
    }, 900);
  };

  // Delete vehicle
  const handleDeleteVehicle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicles.length <= 1) {
      toast.error("You must have at least one vehicle in your garage.");
      return;
    }
    const filtered = vehicles.filter((v) => v.id !== id);
    setVehicles(filtered);
    if (selectedVehicleId === id) {
      setSelectedVehicleId(filtered[0]?.id || "");
    }
    toast.info("Vehicle removed from Garage.");
  };

  // Pay Traffic Challan
  const handlePayChallan = () => {
    if (!selectedChallan) return;
    const totalPayable =
      selectedChallan.challan.amount + selectedChallan.challan.convenienceFee;

    if (walletBalance < totalPayable) {
      toast.error(
        `Insufficient wallet balance. Total payable is ₹${totalPayable}. Please add money to your KingPay wallet.`
      );
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const ok = onDeductWallet(
        totalPayable,
        `Challan Clearance: ${selectedChallan.challan.challanNumber} (${selectedChallan.vehicle.regNumber})`
      );

      if (ok) {
        const receiptNo = `OK-CHL-${Date.now().toString().slice(-8)}`;
        setVehicles((prev) =>
          prev.map((v) => {
            if (v.id === selectedChallan.vehicle.id) {
              return {
                ...v,
                challans: v.challans.map((c) =>
                  c.id === selectedChallan.challan.id
                    ? {
                        ...c,
                        status: "paid",
                        receiptNumber: receiptNo,
                      }
                    : c
                ),
              };
            }
            return v;
          })
        );

        toast.success(
          `🎉 Challan ${selectedChallan.challan.challanNumber} successfully cleared! Receipt: ${receiptNo}`
        );
      }

      setIsProcessingPayment(false);
      setSelectedChallan(null);
    }, 1000);
  };

  // Renew Insurance
  const handleRenewInsurance = () => {
    if (!selectedInsuranceVehicle) return;
    const amount = selectedInsuranceVehicle.insurance.quoteAmount;

    if (walletBalance < amount) {
      toast.error(
        `Insufficient wallet balance. Policy premium is ₹${amount}. Please top up KingPay wallet.`
      );
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const ok = onDeductWallet(
        amount,
        `Motor Insurance Renewal (${selectedProvider}): ${selectedInsuranceVehicle.regNumber}`
      );

      if (ok) {
        const newPolicyNo = `${selectedProvider.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-7)}`;
        setVehicles((prev) =>
          prev.map((v) => {
            if (v.id === selectedInsuranceVehicle.id) {
              return {
                ...v,
                insurance: {
                  ...v.insurance,
                  policyNumber: newPolicyNo,
                  provider: selectedProvider,
                  expiryDate: new Date(Date.now() + 365 * 86400000)
                    .toISOString()
                    .split("T")[0]!,
                  daysRemaining: 365,
                  status: "active",
                },
              };
            }
            return v;
          })
        );

        toast.success(
          `🛡️ Insurance policy renewed instantly with ${selectedProvider}! Policy #${newPolicyNo}. 365 days coverage active.`
        );
      }

      setIsProcessingPayment(false);
      setSelectedInsuranceVehicle(null);
    }, 1200);
  };

  // Recharge FASTag
  const handleRechargeFastag = () => {
    if (!selectedFastagVehicle) return;

    if (walletBalance < fastagRechargeAmount) {
      toast.error(
        `Insufficient wallet balance. Please add money to KingPay first.`
      );
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const ok = onDeductWallet(
        fastagRechargeAmount,
        `FASTag Recharge: ${selectedFastagVehicle.regNumber}`
      );

      if (ok) {
        setVehicles((prev) =>
          prev.map((v) => {
            if (v.id === selectedFastagVehicle.id && v.fastag) {
              const newBal = v.fastag.balance + fastagRechargeAmount;
              return {
                ...v,
                fastag: {
                  ...v.fastag,
                  balance: newBal,
                  status: newBal >= 150 ? "active" : "low_balance",
                },
              };
            }
            return v;
          })
        );

        toast.success(
          `🚗 FASTag recharged with ₹${fastagRechargeAmount}! Available balance updated instantly.`
        );
      }

      setIsProcessingPayment(false);
      setSelectedFastagVehicle(null);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ADD VEHICLE ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-surface via-surface-2 to-amber-500/5 p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Car className="size-4" />
            </span>
            <h2 className="font-display text-lg font-black text-fg tracking-tight">
              Vehicle Garage &amp; RTO Compliance
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              MoRTH Vahan 4.0
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Track traffic challans, 0-paperwork insurance renewal, PUC expiry
            &amp; highway FASTag
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-bold px-3 py-2 rounded-xl shadow-xs shrink-0"
        >
          <Plus className="size-3.5" />
          <span>+ Add Vehicle</span>
        </Button>
      </div>

      {/* 2. HIGH-PRIORITY COMPLIANCE ALERTS BANNER (Zero Penalty Radar) */}
      {(allUnpaidChallans.length > 0 ||
        allExpiringInsurance.length > 0 ||
        allExpiringPuc.length > 0) && (
        <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-surface p-4 text-xs shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-rose-600 text-white animate-pulse shrink-0">
                <AlertTriangle className="size-3.5" />
              </span>
              <div>
                <h3 className="font-bold text-rose-950 dark:text-rose-200 text-sm">
                  Active RTO &amp; Traffic Compliance Alerts
                </h3>
                <p className="text-[11px] text-muted">
                  Settle pending dues immediately to prevent vehicle impounding
                  or heavy court penalties
                </p>
              </div>
            </div>
            {totalUnpaidAmount > 0 && (
              <span className="rounded-lg bg-rose-600 px-2.5 py-1 font-mono font-bold text-white text-xs shadow-xs">
                Total Due: ₹{totalUnpaidAmount.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Alert Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Challan Alert */}
            {allUnpaidChallans.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-surface/90 p-2.5">
                <div>
                  <p className="font-bold text-rose-600 dark:text-rose-400">
                    🚨 {allUnpaidChallans.length} Unpaid Challan
                  </p>
                  <p className="text-[10px] text-muted">
                    {allUnpaidChallans[0]?.vehicle.regNumber} · ₹
                    {allUnpaidChallans[0]?.challan.amount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (allUnpaidChallans[0]) {
                      setSelectedChallan(allUnpaidChallans[0]);
                    }
                  }}
                  className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition"
                >
                  Pay Now
                </button>
              </div>
            )}

            {/* Insurance Alert */}
            {allExpiringInsurance.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-surface/90 p-2.5">
                <div>
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    ⚠️ Insurance Expiring
                  </p>
                  <p className="text-[10px] text-muted">
                    {allExpiringInsurance[0]?.regNumber} · in{" "}
                    {allExpiringInsurance[0]?.insurance.daysRemaining} days
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedInsuranceVehicle(allExpiringInsurance[0] || null)
                  }
                  className="rounded-lg bg-amber-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-700 transition"
                >
                  Renew
                </button>
              </div>
            )}

            {/* PUC Alert */}
            {allExpiringPuc.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-surface/90 p-2.5">
                <div>
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    🌿 PUC Renewal Due
                  </p>
                  <p className="text-[10px] text-muted">
                    {allExpiringPuc[0]?.regNumber} · ₹10k penalty risk
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/search/PUC+testing+center+near+me"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition inline-flex items-center gap-1"
                >
                  <span>Locate</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VEHICLE TABS / GARAGE CAROUSEL SELECTOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-fg">Your Registered Vehicles:</span>
          <span className="text-muted">
            {vehicles.length} vehicle{vehicles.length > 1 ? "s" : ""} in garage
          </span>
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {(
            [
              { id: "all", label: "All Vehicles", icon: "🚘" },
              { id: "2w", label: "2W", icon: "🛵" },
              { id: "3w", label: "3W Auto", icon: "🛺" },
              { id: "4w", label: "4W Cars", icon: "🚗" },
              { id: "commercial_goods", label: "Goods", icon: "🚚" },
              { id: "commercial_passenger", label: "Bus/Cab", icon: "🚌" },
              { id: "tractor_agriculture", label: "Tractor", icon: "🚜" },
              { id: "construction_heavy", label: "Heavy JCB", icon: "🏗️" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition ${
                selectedCategoryFilter === cat.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-2 text-muted hover:text-fg border border-border/60"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {displayedVehicles.map((veh) => {
            const isSelected = veh.id === selectedVehicleId;
            const hasUnpaid = veh.challans.some((c) => c.status === "unpaid");
            const isInsExpiring = veh.insurance.status !== "active";

            return (
              <button
                key={veh.id}
                type="button"
                onClick={() => setSelectedVehicleId(veh.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-xl">
                  {getVehicleCategoryIcon(veh.category)}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-fg">
                      {veh.regNumber}
                    </span>
                    {(hasUnpaid || isInsExpiring) && (
                      <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted max-w-[140px] truncate">
                    {veh.modelName}
                  </p>
                </div>

                {vehicles.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteVehicle(veh.id, e)}
                    className="ml-1 text-muted/50 hover:text-rose-500 p-1 transition"
                    title="Remove vehicle"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted hover:border-primary hover:text-primary transition"
          >
            <Plus className="size-3.5" />
            <span>Add Any Vehicle</span>
          </button>
        </div>
      </div>

      {/* 4. ACTIVE VEHICLE DETAILED COMPLIANCE COCKPIT */}
      {activeVehicle && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm space-y-5">
          {/* Cockpit Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-primary/20 text-2xl shadow-inner">
                {getVehicleCategoryIcon(activeVehicle.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-lg font-black tracking-tight text-fg">
                    {activeVehicle.regNumber}
                  </h3>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted border border-border">
                    {activeVehicle.fuelType}
                  </span>
                  <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                    {getVehicleCategoryLabel(activeVehicle.category)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-fg/80">
                  {activeVehicle.modelName}
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-primary" />
                  <span>
                    {activeVehicle.rto} · Registered:{" "}
                    {activeVehicle.registrationDate}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Status Tag */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>Vahan 4.0 Verified</span>
              </span>
            </div>
          </div>

          {/* 4 COMPLIANCE QUADRANTS: CHALLANS, INSURANCE, PUC, FASTAG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QUADRANT 1: TRAFFIC E-CHALLAN RADAR */}
            <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚨</span>
                  <div>
                    <h4 className="font-bold text-xs text-fg">
                      Traffic e-Challan Radar
                    </h4>
                    <p className="text-[10px] text-muted">
                      Direct MoRTH / State Traffic Police Sync
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeVehicle.challans.filter((c) => c.status === "unpaid")
                      .length === 0
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse"
                  }`}
                >
                  {activeVehicle.challans.filter((c) => c.status === "unpaid")
                    .length === 0
                    ? "✓ 0 Unpaid Challan"
                    : `⚠️ ${activeVehicle.challans.filter((c) => c.status === "unpaid").length} Unpaid`}
                </span>
              </div>

              {activeVehicle.challans.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-800 dark:text-emerald-200">
                  <p className="font-bold">✨ Clean Driving Record!</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    No pending traffic violations found across national
                    checkposts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeVehicle.challans.map((chl) => (
                    <div
                      key={chl.id}
                      className={`rounded-lg border p-3 text-xs space-y-2 ${
                        chl.status === "unpaid"
                          ? "border-rose-500/30 bg-rose-500/5"
                          : "border-emerald-500/20 bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-fg">
                              #{chl.challanNumber}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                chl.status === "unpaid"
                                  ? "bg-rose-600 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {chl.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted mt-0.5">
                            📅 {chl.date} · 📍 {chl.location}
                          </p>
                        </div>
                        <span className="font-mono font-black text-sm text-fg">
                          ₹{chl.amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-fg/90">
                        {chl.violation}
                      </p>

                      {chl.status === "unpaid" ? (
                        <div className="flex items-center justify-between pt-1 border-t border-rose-500/20">
                          <span className="text-[10px] text-muted">
                            + ₹{chl.convenienceFee} digital convenience fee
                          </span>
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedChallan({
                                vehicle: activeVehicle,
                                challan: chl,
                              })
                            }
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1 rounded-lg"
                          >
                            Pay ₹{chl.amount + chl.convenienceFee} in 1-Tap
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold border-t border-emerald-500/20">
                          <span>✓ Cleared &amp; Closed</span>
                          <span>Receipt: {chl.receiptNumber}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUADRANT 2: MOTOR INSURANCE (0-Paperwork Instant Renewal) */}
            <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <h4 className="font-bold text-xs text-fg">
                      Motor Insurance Policy
                    </h4>
                    <p className="text-[10px] text-muted">
                      IRDAI Approved Digital Policy
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeVehicle.insurance.status === "active"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {activeVehicle.insurance.status === "active"
                    ? `✓ Active (${activeVehicle.insurance.daysRemaining}d)`
                    : `⚠️ Expiring in ${activeVehicle.insurance.daysRemaining}d`}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted uppercase">
                      Provider &amp; Policy:
                    </span>
                    <p className="font-bold text-fg">
                      {activeVehicle.insurance.provider} ·{" "}
                      <span className="font-mono text-[11px]">
                        {activeVehicle.insurance.policyNumber}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase">
                      Valid Till:
                    </span>
                    <p className="font-mono font-bold text-fg">
                      {activeVehicle.insurance.expiryDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div>
                    <p className="text-[10px] text-muted">1-Tap Renewal Quote:</p>
                    <p className="font-mono font-bold text-primary text-sm">
                      ₹
                      {activeVehicle.insurance.quoteAmount.toLocaleString(
                        "en-IN"
                      )}
                      /yr
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedInsuranceVehicle(activeVehicle)}
                    className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-3 py-1 rounded-lg"
                  >
                    Compare &amp; Renew ➔
                  </Button>
                </div>
              </div>
            </div>

            {/* QUADRANT 3: PUC (POLLUTION) TRACKER */}
            <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌿</span>
                  <div>
                    <h4 className="font-bold text-xs text-fg">
                      PUC (Pollution Under Control)
                    </h4>
                    <p className="text-[10px] text-muted">
                      Section 190(2) MV Act Compliance
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeVehicle.puc.status === "valid"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {activeVehicle.puc.status === "valid"
                    ? `✓ Valid (${activeVehicle.puc.daysRemaining}d)`
                    : `⚠️ Expiring in ${activeVehicle.puc.daysRemaining}d`}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted">Certificate:</span>
                    <p className="font-mono font-bold text-fg">
                      {activeVehicle.puc.certNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted">Expiry:</span>
                    <p className="font-mono font-bold text-fg">
                      {activeVehicle.puc.expiryDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                  <span className="text-rose-600 font-semibold">
                    Penalty Risk: ₹10,000 fine if expired
                  </span>
                  <a
                    href="https://www.google.com/maps/search/PUC+testing+center+near+me"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <span>Find Test Center</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* QUADRANT 4: FASTAG HIGHWAY PASS */}
            <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚗</span>
                  <div>
                    <h4 className="font-bold text-xs text-fg">
                      NETC FASTag Pass
                    </h4>
                    <p className="text-[10px] text-muted">
                      National Highway Toll &amp; Fuel Pay
                    </p>
                  </div>
                </div>
                {activeVehicle.fastag && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeVehicle.fastag.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse"
                    }`}
                  >
                    {activeVehicle.fastag.status === "active"
                      ? "✓ Active"
                      : "⚠️ Low Balance"}
                  </span>
                )}
              </div>

              {activeVehicle.fastag ? (
                <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted">
                        Tag ID &amp; Bank:
                      </span>
                      <p className="font-semibold text-fg">
                        {activeVehicle.fastag.bank}
                      </p>
                      <p className="font-mono text-[10px] text-muted">
                        {activeVehicle.fastag.tagId}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted">
                        Toll Balance:
                      </span>
                      <p className="font-mono font-black text-base text-fg">
                        ₹{activeVehicle.fastag.balance.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted">
                      1% Fuel Cashback on NHAI pumps
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedFastagVehicle(activeVehicle)}
                      className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-3 py-1 rounded-lg"
                    >
                      ⚡ Instant Top-Up
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-surface p-3 text-center text-xs text-muted">
                  <p>No FASTag linked for this vehicle.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setVehicles((prev) =>
                        prev.map((v) =>
                          v.id === activeVehicle.id
                            ? {
                                ...v,
                                fastag: {
                                  tagId: `NETC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                                  bank: "SBI FASTag",
                                  balance: 500,
                                  status: "active",
                                },
                              }
                            : v
                        )
                      );
                      toast.success(
                        `FASTag successfully activated for ${activeVehicle.regNumber}!`
                      );
                    }}
                    className="mt-2 text-xs font-bold"
                  >
                    Activate NETC FASTag
                  </Button>
                </div>
              )}
            </div>

            {/* QUADRANT 5: FITNESS CERTIFICATE (FC) TRACKER */}
            {activeVehicle.fitness && (
              <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <div>
                      <h4 className="font-bold text-xs text-fg">
                        Fitness Certificate (FC)
                      </h4>
                      <p className="text-[10px] text-muted">
                        Section 56 MV Act · Commercial &amp; Transport
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeVehicle.fitness.status === "valid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse"
                    }`}
                  >
                    {activeVehicle.fitness.status === "valid"
                      ? `✓ Valid (${activeVehicle.fitness.daysRemaining}d)`
                      : `⚠️ Expiring in ${activeVehicle.fitness.daysRemaining}d`}
                  </span>
                </div>

                <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted">FC Number:</span>
                      <p className="font-mono font-bold text-fg">
                        {activeVehicle.fitness.certNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted">Valid Upto:</span>
                      <p className="font-mono font-bold text-fg">
                        {activeVehicle.fitness.expiryDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                    <span className="text-rose-600 font-semibold">
                      Fine: ₹{activeVehicle.fitness.penaltyRisk.toLocaleString("en-IN")} if expired
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success(
                          `RTO Inspection Slot booked at ${activeVehicle.rto} for ${activeVehicle.regNumber}!`
                        );
                      }}
                      className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-2.5 py-1 rounded-lg"
                    >
                      Book Slot (₹{activeVehicle.fitness.inspectionFee})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* QUADRANT 6: NATIONAL / STATE PERMIT TRACKER */}
            {activeVehicle.permit && (
              <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📜</span>
                    <div>
                      <h4 className="font-bold text-xs text-fg">
                        Carriage &amp; Road Permit
                      </h4>
                      <p className="text-[10px] text-muted">
                        {activeVehicle.permit.permitType}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeVehicle.permit.status === "valid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {activeVehicle.permit.status === "valid"
                      ? "✓ Active Permit"
                      : "⚠️ Renewal Due"}
                  </span>
                </div>

                <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted">Permit ID:</span>
                      <p className="font-mono font-bold text-fg">
                        {activeVehicle.permit.permitNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted">Valid Upto:</span>
                      <p className="font-mono font-bold text-fg">
                        {activeVehicle.permit.expiryDate}
                      </p>
                    </div>
                  </div>

                  {activeVehicle.permit.renewalFee > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="text-muted">
                        Online State Renewal
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(
                            `Permit renewal application initiated with Transport Dept for ${activeVehicle.regNumber}!`
                          );
                        }}
                        className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-2.5 py-1 rounded-lg"
                      >
                        Renew Permit (₹{activeVehicle.permit.renewalFee.toLocaleString("en-IN")})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QUADRANT 7: ROAD TAX (MV TAX) TRACKER */}
            {activeVehicle.roadTax && (
              <div className="rounded-xl border border-border/80 bg-surface-2/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <div>
                      <h4 className="font-bold text-xs text-fg">
                        Motor Vehicle Road Tax
                      </h4>
                      <p className="text-[10px] text-muted">
                        {activeVehicle.roadTax.taxType} MV Tax Status
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeVehicle.roadTax.status === "paid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse"
                    }`}
                  >
                    {activeVehicle.roadTax.status === "paid"
                      ? "✓ Tax Paid"
                      : "⚠️ Tax Due Soon"}
                  </span>
                </div>

                <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted">Tax Period:</span>
                      <p className="font-semibold text-fg">
                        {activeVehicle.roadTax.taxType}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted">Valid Upto:</span>
                      <p className="font-mono font-bold text-fg">
                        {activeVehicle.roadTax.validUpto}
                      </p>
                    </div>
                  </div>

                  {activeVehicle.roadTax.amountDue > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="text-muted">
                        Due: ₹{activeVehicle.roadTax.amountDue.toLocaleString("en-IN")}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(
                            `Road Tax payment of ₹${activeVehicle.roadTax?.amountDue} processed via Assam Vahan Tax Portal!`
                          );
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg"
                      >
                        ⚡ Pay Tax (0 Fee)
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ADD VEHICLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚘</span>
                <h3 className="font-display font-bold text-base text-fg">
                  Add Any Vehicle to Garage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-fg text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Category selector */}
              <div>
                <label className="text-xs font-semibold text-fg block mb-1.5">
                  Select Vehicle Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setInputCategory("2w")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "2w"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🛵</span>
                    <span>2-Wheeler</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("3w")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "3w"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🛺</span>
                    <span>3W Auto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("4w")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "4w"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🚗</span>
                    <span>4W Car/SUV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("commercial_goods")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "commercial_goods"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🚚</span>
                    <span>Goods Truck</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("commercial_passenger")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "commercial_passenger"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🚌</span>
                    <span>Cab / Bus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("tractor_agriculture")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "tractor_agriculture"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🚜</span>
                    <span>Tractor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputCategory("construction_heavy")}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      inputCategory === "construction_heavy"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🏗️</span>
                    <span>Heavy JCB</span>
                  </button>
                </div>
              </div>

              {/* Registration Number input */}
              <div>
                <label className="text-xs font-semibold text-fg block mb-1">
                  Vehicle Registration Number:
                </label>
                <input
                  type="text"
                  value={inputRegNo}
                  onChange={(e) => handleRegInputChange(e.target.value)}
                  placeholder="e.g. AS-10-AB-1234"
                  maxLength={13}
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 font-mono text-base font-bold uppercase tracking-wider text-fg placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <p className="text-[10px] text-muted mt-1">
                  Works for all Assam (AS), Meghalaya (ML), Tripura (TR) &amp;
                  All-India RTO plates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isFetchingVahan || inputRegNo.length < 8}
                onClick={handleFetchAndAddVehicle}
                className="flex-1 bg-primary text-white hover:bg-primary/90 text-xs font-bold py-2 rounded-xl"
              >
                {isFetchingVahan ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Querying MoRTH...</span>
                  </span>
                ) : (
                  <span>Verify &amp; Add</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CHALLAN PAYMENT MODAL */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <h3 className="font-display font-bold text-base text-fg">
                    Clear Traffic Challan
                  </h3>
                  <p className="text-[10px] text-muted">
                    Instant MoRTH / eChallan Parivahan Clearance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChallan(null)}
                className="text-muted hover:text-fg text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border/80 bg-surface-2 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Vehicle Number:</span>
                  <span className="font-mono font-bold text-fg">
                    {selectedChallan.vehicle.regNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Challan Number:</span>
                  <span className="font-mono font-bold text-fg">
                    #{selectedChallan.challan.challanNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Location &amp; Date:</span>
                  <span className="font-medium text-fg text-right max-w-[200px] truncate">
                    {selectedChallan.challan.location} ·{" "}
                    {selectedChallan.challan.date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Violation:</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400 text-right max-w-[200px]">
                    {selectedChallan.challan.violation}
                  </span>
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="rounded-xl border border-border/60 bg-bg p-3 space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span>Challan Fine Amount:</span>
                  <span className="font-mono font-semibold text-fg">
                    ₹{selectedChallan.challan.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>KingPay Instant Clearance Fee:</span>
                  <span className="font-mono font-semibold text-fg">
                    ₹{selectedChallan.challan.convenienceFee}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-fg">
                  <span>Total Payable:</span>
                  <span className="font-mono text-primary font-black">
                    ₹
                    {(
                      selectedChallan.challan.amount +
                      selectedChallan.challan.convenienceFee
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted bg-surface-2 p-2 rounded-lg">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  Zero court appearance required. Instant digital Parivahan
                  receipt issued within 60 seconds.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setSelectedChallan(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isProcessingPayment}
                onClick={handlePayChallan}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Clearing Challan...</span>
                  </span>
                ) : (
                  <span>
                    Pay ₹
                    {selectedChallan.challan.amount +
                      selectedChallan.challan.convenienceFee}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MOTOR INSURANCE COMPARISON & RENEWAL MODAL */}
      {selectedInsuranceVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="font-display font-bold text-base text-fg">
                    Instant Insurance Renewal
                  </h3>
                  <p className="text-[10px] text-muted">
                    0 Paperwork · IRDAI Approved Digital Policy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInsuranceVehicle(null)}
                className="text-muted hover:text-fg text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted">
                Select your preferred insurer for{" "}
                <span className="font-bold text-fg">
                  {selectedInsuranceVehicle.regNumber} (
                  {selectedInsuranceVehicle.modelName})
                </span>
                :
              </p>

              {/* Insurer options */}
              <div className="space-y-2">
                {(
                  [
                    {
                      name: "Digit",
                      basePrice: selectedInsuranceVehicle.insurance.quoteAmount,
                      badge: "Most Popular",
                      idv: "₹2,85,000",
                    },
                    {
                      name: "Acko",
                      basePrice:
                        selectedInsuranceVehicle.insurance.quoteAmount - 100,
                      badge: "0-Paperwork",
                      idv: "₹2,75,000",
                    },
                    {
                      name: "ICICI Lombard",
                      basePrice:
                        selectedInsuranceVehicle.insurance.quoteAmount + 150,
                      badge: "98% Claim Settlement",
                      idv: "₹2,95,000",
                    },
                    {
                      name: "HDFC ERGO",
                      basePrice:
                        selectedInsuranceVehicle.insurance.quoteAmount + 80,
                      badge: "Cashless Garages",
                      idv: "₹2,90,000",
                    },
                  ] as const
                ).map((ins) => (
                  <button
                    key={ins.name}
                    type="button"
                    onClick={() => setSelectedProvider(ins.name)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      selectedProvider === ins.name
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                        : "border-border bg-surface-2 hover:bg-surface"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-fg">{ins.name}</span>
                        <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                          {ins.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted mt-0.5">
                        IDV: {ins.idv} · Comprehensive + 1-Yr OD
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-primary">
                        ₹{ins.basePrice.toLocaleString("en-IN")}
                      </span>
                      <p className="text-[9px] text-muted">+ 18% GST</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setSelectedInsuranceVehicle(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isProcessingPayment}
                onClick={handleRenewInsurance}
                className="flex-1 bg-primary text-white hover:bg-primary/90 text-xs font-bold py-2 rounded-xl"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Issuing Policy...</span>
                  </span>
                ) : (
                  <span>
                    Pay ₹
                    {selectedInsuranceVehicle.insurance.quoteAmount.toLocaleString(
                      "en-IN"
                    )}{" "}
                    &amp; Issue Policy
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. FASTAG RECHARGE MODAL */}
      {selectedFastagVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚗</span>
                <div>
                  <h3 className="font-display font-bold text-base text-fg">
                    Recharge NETC FASTag
                  </h3>
                  <p className="text-[10px] text-muted">
                    {selectedFastagVehicle.regNumber} ·{" "}
                    {selectedFastagVehicle.fastag?.bank}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFastagVehicle(null)}
                className="text-muted hover:text-fg text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-fg block mb-1.5">
                  Select Recharge Amount:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[200, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFastagRechargeAmount(amt)}
                      className={`rounded-xl border p-2.5 font-mono text-center text-xs font-bold transition ${
                        fastagRechargeAmount === amt
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                          : "border-border bg-surface-2 text-muted"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-surface-2 p-3 space-y-1 text-muted">
                <div className="flex justify-between">
                  <span>Current FASTag Balance:</span>
                  <span className="font-mono font-bold text-fg">
                    ₹{selectedFastagVehicle.fastag?.balance}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recharge Amount:</span>
                  <span className="font-mono font-bold text-fg">
                    ₹{fastagRechargeAmount}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-bold text-fg">
                  <span>New Balance:</span>
                  <span className="font-mono text-emerald-600">
                    ₹
                    {(selectedFastagVehicle.fastag?.balance || 0) +
                      fastagRechargeAmount}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setSelectedFastagVehicle(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isProcessingPayment}
                onClick={handleRechargeFastag}
                className="flex-1 bg-primary text-white hover:bg-primary/90 text-xs font-bold py-2 rounded-xl"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Recharging FASTag...</span>
                  </span>
                ) : (
                  <span>Recharge ₹{fastagRechargeAmount}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
