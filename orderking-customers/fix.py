import re

def fix_founder_command():
    path = r"C:\Users\hasan\OrderKing\orderking-customers\src\routes\app\founder-command.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove AI imports
    content = re.sub(r"import\s+\{[^}]+\}\s+from\s+['\"]@/components/ai/[^'\"]+['\"];?\s*", "", content)
    
    # Remove AI JSX tags (even multiline)
    components = [
        "SupremeFounderAIChat", "FounderCRMHub", "RemoteWorkBoard", "AppFactoryWorkspace",
        "OpportunityRadarHub", "ClientPortalHub", "CompanyFactoryHub", "MoneyEngineDashboard",
        "ServiceProductizerHub", "DeliveryTaskGraphHub", "SupremeTaskExecutorHub",
        "BusinessIntelligenceHub", "KnowledgeMemoryHub", "CapabilityBenchmarkHub",
        "DependencyInspectorHub", "EmergencyRecoveryHub", "RevenueGrowthCostHub"
    ]
    for comp in components:
        content = re.sub(rf"<{comp}[^>]*/>", "{/* removed */}", content)
    
    # Fix the false | {} TS2322 issue
    content = re.sub(r"(activeModule === '[^']+') && \{\}", r"\1 && <div>Removed</div>", content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_king_pay():
    path = r"C:\Users\hasan\OrderKing\orderking-customers\src\routes\king-pay.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r"import\s+\{[^}]+\}\s+from\s+['\"]@/components/ai/[^'\"]+['\"];?\s*", "", content)
    content = re.sub(r"<RoyalAIConcierge[^>]*/>", "{/* removed */}", content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_founder_command()
fix_king_pay()
