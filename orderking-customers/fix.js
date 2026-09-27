const fs = require('fs');
const path = require('path');

function fixFounderCommand() {
    const filePath = path.join('C:', 'Users', 'hasan', 'OrderKing', 'orderking-customers', 'src', 'routes', 'app', 'founder-command.tsx');
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove AI imports
    content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]@\/components\/ai\/[^'"]+['"];?\s*/g, '');

    // Remove AI JSX tags (even multiline)
    const components = [
        "SupremeFounderAIChat", "FounderCRMHub", "RemoteWorkBoard", "AppFactoryWorkspace",
        "OpportunityRadarHub", "ClientPortalHub", "CompanyFactoryHub", "MoneyEngineDashboard",
        "ServiceProductizerHub", "DeliveryTaskGraphHub", "SupremeTaskExecutorHub",
        "BusinessIntelligenceHub", "KnowledgeMemoryHub", "CapabilityBenchmarkHub",
        "DependencyInspectorHub", "EmergencyRecoveryHub", "RevenueGrowthCostHub"
    ];
    for (const comp of components) {
        const regex = new RegExp(`<${comp}[^>]*/>`, 'g');
        content = content.replace(regex, '{/* removed */}');
    }

    // Fix the false | {} TS2322 issue
    content = content.replace(/(activeModule === '[^']+') && \{\}/g, '$1 && <div>Removed</div>');

    fs.writeFileSync(filePath, content, 'utf-8');
}

function fixKingPay() {
    const filePath = path.join('C:', 'Users', 'hasan', 'OrderKing', 'orderking-customers', 'src', 'routes', 'king-pay.tsx');
    let content = fs.readFileSync(filePath, 'utf-8');

    content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]@\/components\/ai\/[^'"]+['"];?\s*/g, '');
    content = content.replace(/<RoyalAIConcierge[^>]*\/>/g, '{/* removed */}');

    fs.writeFileSync(filePath, content, 'utf-8');
}

fixFounderCommand();
fixKingPay();
