// Standalone Section Separation & App Exporter Engine
// Enables Founder to extract and separate ANY section of HDmaster into an independent website, micro-app, or PWA

export type ExportableSectionId =
  | "crm"
  | "app_factory"
  | "kingpay"
  | "media_studio"
  | "revenue_os"
  | "chat"
  | "integrations"
  | "purifier"
  | "hospital"
  | "marketplace";

export interface ExportableSection {
  id: ExportableSectionId;
  title: string;
  category: string;
  description: string;
  icon: string;
  suggestedDomain: string;
  features: string[];
}

export interface StandalonePackage {
  sectionId: ExportableSectionId;
  title: string;
  htmlContent: string;
  manifestJson: string;
  embedIframeCode: string;
  directStandaloneUrl: string;
  fileSizeBytes: number;
}

export class StandaloneSectionExporter {
  private sections: ExportableSection[] = [
    {
      id: "crm",
      title: "OrderKing Client CRM & High-Ticket Sales Machine",
      category: "Sales & Client Acquisition",
      description: "Extract the complete 15-stage CRM, automated WhatsApp pitches, and deal pipeline into an independent sales app.",
      icon: "Users",
      suggestedDomain: "crm.orderking.in",
      features: ["15-Stage Pipeline", "WhatsApp Pitch Generator", "Commission Calculator", "Offline Sync"],
    },
    {
      id: "app_factory",
      title: "HDmaster App Factory & Enterprise Blueprint Studio",
      category: "Software Engineering",
      description: "Deploy an isolated full-stack software development engine that generates multi-file architectures with edge previews.",
      icon: "Code2",
      suggestedDomain: "build.orderking.in",
      features: ["Multi-File Generation", "Edge Virtual Previews", "GitHub Direct Sync", "ZIP Export"],
    },
    {
      id: "kingpay",
      title: "King Pay 0% Fee UPI Gateway & Sovereign Soundbox",
      category: "Fintech & Payments",
      description: "Separate the zero-fee UPI collection engine, QR code matrices, and audio soundbox into a standalone payment portal.",
      icon: "QrCode",
      suggestedDomain: "pay.orderking.in",
      features: ["0% Gateway Fees", "Section 79 Compliant", "Direct Bank Settlements", "Soundbox Voice Alerts"],
    },
    {
      id: "media_studio",
      title: "Supreme AI Image & Kinetic Video Studio",
      category: "Creative Media & AI Studio",
      description: "Standalone production studio for photorealistic 8K imagery, cinematic motion videos, and long commercial stitching.",
      icon: "Sparkles",
      suggestedDomain: "studio.orderking.in",
      features: ["Unlimited 8K Images", "9:16 & 16:9 Videos", "Multi-Scene Stitcher", "Sovereign Media Vault"],
    },
    {
      id: "revenue_os",
      title: "Planetary Revenue Operating System (30 Directives)",
      category: "Executive Governance",
      description: "Independent executive dashboard monitoring double-entry ledgers, opportunity radar, and legal revenue harvesting.",
      icon: "DollarSign",
      suggestedDomain: "revenue.orderking.in",
      features: ["30 Sovereign Directives", "Hash-Chained Audit Ledger", "MeitY Subsidies", "Zero-Fabrication QA"],
    },
    {
      id: "chat",
      title: "Supreme Founder AI Executive Chat & Voice Partner",
      category: "AI Executive Assistant",
      description: "Extract the ChatGPT-styled dark mode chat interface with young female voice synthesis and multi-model switching.",
      icon: "Crown",
      suggestedDomain: "ai.orderking.in",
      features: ["8 Top-Tier AI Models", "Full-Duplex Voice Call", "Universal File Attachments", "Executive Pinned Prompts"],
    },
    {
      id: "integrations",
      title: "Universal Platform Integrator & Connector Hub",
      category: "Automation & API Bridge",
      description: "Standalone integration control center managing GitHub, Upwork, WhatsApp, Stripe, and universal webhooks.",
      icon: "Plug",
      suggestedDomain: "connect.orderking.in",
      features: ["Multi-Platform Sync", "HMAC Webhooks", "Sandboxed Execution", "Audit Logs"],
    },
    {
      id: "purifier",
      title: "Sovereign Cache & Storage Purifier Cockpit",
      category: "System & Optimization",
      description: "Standalone storage purifier, duplicate remover, memory leak cleaner, and self-healing system optimizer.",
      icon: "Zap",
      suggestedDomain: "purifier.orderking.in",
      features: ["100x Browser Cleaner", "Zero Data Loss Guarantee", "Granular Cache Purge", "Auto-Clean Engine"],
    },
    {
      id: "hospital",
      title: "Autonomous Hospital Management ERP",
      category: "Healthcare Enterprise",
      description: "Complete hospital outpatient, triage queue, doctor tele-care, and ABDM digital health records portal.",
      icon: "Activity",
      suggestedDomain: "hospital.orderking.in",
      features: ["ABDM Compliant", "Real-Time OPD Queue", "Doctor Tele-Consult", "0% Fee Medical Billing"],
    },
    {
      id: "marketplace",
      title: "Hyperlocal Multi-Vendor Marketplace",
      category: "E-Commerce & Food",
      description: "Autonomous customer ordering, merchant kitchen dashboard, and 15-min delivery fleet dispatch system.",
      icon: "ShoppingBag",
      suggestedDomain: "market.orderking.in",
      features: ["0% Commission", "True Price Parity", "Fleet Telematics", "1-Tap King Pay Checkout"],
    },
  ];

  public listSections(): ExportableSection[] {
    return this.sections;
  }

  public getSection(id: ExportableSectionId): ExportableSection | undefined {
    return this.sections.find((s) => s.id === id);
  }

  public generateStandalonePackage(sectionId: ExportableSectionId): StandalonePackage {
    const section = this.getSection(sectionId) || this.sections[0];
    const origin = typeof window !== "undefined" ? window.location.origin : "https://orderking.in";
    const directStandaloneUrl = `${origin}/standalone?section=${section.id}`;

    const manifestJson = JSON.stringify(
      {
        name: section.title,
        short_name: section.id.toUpperCase(),
        start_url: directStandaloneUrl,
        display: "standalone",
        background_color: "#050e0b",
        theme_color: "#f59e0b",
        description: section.description,
        icons: [
          {
            src: "https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=OrderKing",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      null,
      2
    );

    const embedIframeCode = `<iframe src="${directStandaloneUrl}" width="100%" height="800px" frameborder="0" allow="microphone; camera; clipboard-write;" style="border-radius: 16px; border: 2px solid #f59e0b; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"></iframe>`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${section.title} — Standalone Edition</title>
  <link rel="manifest" href="manifest.json">
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      padding: 0;
      background: #050e0b;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(245, 158, 11, 0.3);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      color: #f59e0b;
      font-size: 16px;
    }
    .badge {
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #fde68a;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-family: monospace;
    }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #0a1b14;
      border: 2px solid rgba(245, 158, 11, 0.4);
      border-radius: 20px;
      padding: 32px;
      max-width: 600px;
      box-shadow: 0 0 50px rgba(245, 158, 11, 0.15);
    }
    h1 { margin: 0 0 12px; font-size: 24px; color: #fff; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 28px;
    }
    .feature-tag {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .btn {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #000;
      border: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
    }
    .btn:hover { background: #fbbf24; }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <span>👑</span>
      <span>HDmaster Sovereign Section</span>
    </div>
    <span class="badge">STANDALONE EDITION</span>
  </header>
  <main>
    <div class="card">
      <h1>${section.title}</h1>
      <p>${section.description}</p>
      <div class="features">
        ${section.features.map((f) => `<span class="feature-tag">✓ ${f}</span>`).join("\n        ")}
      </div>
      <a href="${directStandaloneUrl}" class="btn" target="_blank">Launch Full-Screen App ➔</a>
    </div>
  </main>
</body>
</html>`;

    return {
      sectionId,
      title: section.title,
      htmlContent,
      manifestJson,
      embedIframeCode,
      directStandaloneUrl,
      fileSizeBytes: htmlContent.length,
    };
  }

  public downloadStandalonePackage(sectionId: ExportableSectionId): void {
    if (typeof window === "undefined") return;
    const pkg = this.generateStandalonePackage(sectionId);
    const blob = new Blob([pkg.htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sectionId}-standalone-app.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const standaloneSectionExporter = new StandaloneSectionExporter();
