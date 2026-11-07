const fs = require('fs');
const path = require('path');

const targetDirs = [
  'C:\\Users\\hasan\\Downloads\\Hasan_Habibullah_Career_Vault',
  'C:\\Users\\hasan\\Desktop\\Hasan_Habibullah_Career_Vault'
];

const subfolders = [
  '1_Tech_Operations_and_AI_Delivery_Lead',
  '2_QSR_and_Area_Manager',
  '3_Restaurant_Consulting_and_Menu_Audits',
  '4_Freelance_and_Upwork_Profile_With_Photo'
];

const guides = {
  'README_WHICH_CV_TO_USE.txt': `================================================================================
HASAN HABIBULLAH — MASTER CAREER VAULT GUIDE (WHICH CV TO USE)
================================================================================

1. FOLDER: 1_Tech_Operations_and_AI_Delivery_Lead
   FILE: Hasan_Habibullah_Tech_Operations_Delivery_Lead_CV.pdf
   USE FOR:
   - AI Training Data / Annotation Team Lead (Turing, Crossing Hurdles, Appen, Scale AI, Invisible Tech)
   - Remote Technical Operations Lead / Service Delivery Manager
   - Tech Platform Operations & Catalog Data QA Roles
   HIGHLIGHTS:
   - 11+ years total workforce leadership
   - Shift management (50-70+ staff), SOP checklists, 98%+ SLA accuracy benchmarks
   - OrderKing digital platform & data validation workflows

2. FOLDER: 2_QSR_and_Area_Manager
   FILE: Hasan_Habibullah_Area_Manager_QSR_CV.pdf
   USE FOR:
   - Multi-Unit Operations Manager / Area Manager (Pizza Hut, KFC, Burger King, Domino's, Subway)
   - Retail & QSR Chain Operations Lead
   HIGHLIGHTS:
   - Area Manager at Pizza Hut (8 outlets, 70+ staff)
   - Multi-Unit Manager at Burger King / Olayan Division, Riyadh (6 restaurants, 50 staff, $6M+ turnover)

3. FOLDER: 3_Restaurant_Consulting_and_Menu_Audits
   FILE: Hasan_Habibullah_Restaurant_Operations_Consultant_CV.pdf
   USE FOR:
   - Independent Restaurant Operations Consultant
   - Menu Engineering, Recipe & Portion Cost Audits, Food Cost Variance Reviews
   - Standard Operating Procedure (SOP) & Food Safety Audits

4. FOLDER: 4_Freelance_and_Upwork_Profile_With_Photo
   FILE: Hasan_Habibullah_Executive_Consultant_With_Photo_CV.pdf
   USE FOR:
   - Upwork, Contra, LinkedIn, and direct client contracts where a verified executive photo is required.
================================================================================`,

  '1_Tech_Operations_and_AI_Delivery_Lead/WHERE_TO_APPLY.txt': `APPLY WITH THIS CV TO:
- Turing x AI Labs (Team Lead role)
- Crossing Hurdles / Samvedh Grow applications
- Remote AI Data Annotation / Quality Control Operations
- Technical Delivery & Platform Operations Lead roles
Matches 11 years leadership experience entered on screening forms.`,

  '2_QSR_and_Area_Manager/WHERE_TO_APPLY.txt': `APPLY WITH THIS CV TO:
- Quick Service Restaurant (QSR) Area Manager / District Manager openings
- Multi-unit retail and food franchise operations (Pizza Hut, Burger King, Jubilant FoodWorks, Devyani International, Sapphire Foods)
- High-volume outlet leadership roles.`,

  '3_Restaurant_Consulting_and_Menu_Audits/WHERE_TO_APPLY.txt': `APPLY WITH THIS CV TO:
- Contract consulting for restaurant owners, cloud kitchens, and hospitality investors
- Food cost reduction, recipe yield testing, menu margin audits
- ServSafe compliance & kitchen operational audits.`,

  '4_Freelance_and_Upwork_Profile_With_Photo/WHERE_TO_APPLY.txt': `APPLY WITH THIS CV TO:
- Upwork client proposals (attach as PDF)
- Advisory & consulting requests requiring verified identity and executive photo
- Direct client outreach via LinkedIn / email.`
};

for (const baseDir of targetDirs) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  for (const sub of subfolders) {
    const fullSub = path.join(baseDir, sub);
    if (!fs.existsSync(fullSub)) {
      fs.mkdirSync(fullSub, { recursive: true });
    }
  }

  for (const [relPath, content] of Object.entries(guides)) {
    fs.writeFileSync(path.join(baseDir, relPath), content, 'utf-8');
  }

  // Copy CV 1
  const cv1Src = 'C:\\Users\\hasan\\OrderKing\\Hasan_Habibullah_CV.pdf';
  const cv1HtmlSrc = 'C:\\Users\\hasan\\OrderKing\\Hasan_Habibullah_CV.html';
  if (fs.existsSync(cv1Src)) {
    fs.copyFileSync(cv1Src, path.join(baseDir, '1_Tech_Operations_and_AI_Delivery_Lead', 'Hasan_Habibullah_Tech_Operations_Delivery_Lead_CV.pdf'));
    fs.copyFileSync(cv1HtmlSrc, path.join(baseDir, '1_Tech_Operations_and_AI_Delivery_Lead', 'Hasan_Habibullah_Tech_Operations_Delivery_Lead_CV.html'));
  }

  // Copy CV 2
  const cv2Src = 'C:\\Users\\hasan\\Downloads\\Hasan_Habibullah_Area_Manager_CV.pdf';
  if (fs.existsSync(cv2Src)) {
    fs.copyFileSync(cv2Src, path.join(baseDir, '2_QSR_and_Area_Manager', 'Hasan_Habibullah_Area_Manager_QSR_CV.pdf'));
  }

  // Copy CV 3
  const cv3Src = 'C:\\Users\\hasan\\Downloads\\Hasan_Habibullah_Restaurant-Specialist_CV.pdf';
  if (fs.existsSync(cv3Src)) {
    fs.copyFileSync(cv3Src, path.join(baseDir, '3_Restaurant_Consulting_and_Menu_Audits', 'Hasan_Habibullah_Restaurant_Operations_Consultant_CV.pdf'));
  }

  // Copy CV 4
  const cv4Src = 'C:\\Users\\hasan\\Downloads\\Hasan_Habibullah_Upwork_CV_With_Photo.pdf';
  if (fs.existsSync(cv4Src)) {
    fs.copyFileSync(cv4Src, path.join(baseDir, '4_Freelance_and_Upwork_Profile_With_Photo', 'Hasan_Habibullah_Executive_Consultant_With_Photo_CV.pdf'));
  }

  console.log(`Successfully organized Career Vault in: ${baseDir}`);
}
