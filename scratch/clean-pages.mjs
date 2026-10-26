import fs from 'node:fs';

const file = 'c:/Users/hasan/OrderKing/HDmaster/src/components/command/pages.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove import
content = content.replace(`import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";\n`, '');
content = content.replace(`import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";\r\n`, '');

content = content.replace(`const EducationDashboard = lazyWithRetry(() => import("../education/EducationDashboard"), "EducationDashboard");\n`, '');
content = content.replace(`const EducationDashboard = lazyWithRetry(() => import("../education/EducationDashboard"), "EducationDashboard");\r\n`, '');

content = content.replace(`const TravelPage = lazyWithRetry(() => import("../travel/TravelPage"), "TravelPage");\n`, '');
content = content.replace(`const TravelPage = lazyWithRetry(() => import("../travel/TravelPage"), "TravelPage");\r\n`, '');

content = content.replace(`const WorkMarketplaceControlCenter = lazyWithRetry(() => import("../jobs/WorkMarketplaceControlCenter"), "WorkMarketplaceControlCenter");\n`, '');
content = content.replace(`const WorkMarketplaceControlCenter = lazyWithRetry(() => import("../jobs/WorkMarketplaceControlCenter"), "WorkMarketplaceControlCenter");\r\n`, '');

// Remove modules
content = content.replace(/if\s*\(module === "travel"\) return [^\n]+;\r?\n/, '');
content = content.replace(/if\s*\(module === "education"\) return [^\n]+;\r?\n/, '');
content = content.replace(/if\s*\(module === "jobs"\) return [^\n]+;\r?\n/, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated pages.tsx');
