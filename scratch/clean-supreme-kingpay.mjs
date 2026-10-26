import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove travel/tutor imports
content = content.replace(/import\s*\{\s*[\s\S]*?extractStationCode[\s\S]*?\}\s*from\s*["']\.\/travel-autosuggest["'];\r?\n/, '');
content = content.replace(/import\s*\{\s*TP_MARKER,\s*TP_WL_DOMAIN\s*\}\s*from\s*["']@\/lib\/travel\/travelpayouts-config["'];\r?\n/, '');

// Remove icons that are no longer needed (Plane, GraduationCap, Briefcase, Train)
content = content.replace(/\bPlane,\r?\n/g, '');
content = content.replace(/\bGraduationCap,\r?\n/g, '');
content = content.replace(/\bBriefcase,\r?\n/g, '');
content = content.replace(/\bTrain,\r?\n/g, '');

// Remove Quick Station State
content = content.replace(/\/\/\s*Quick Station State[\s\S]*?const trainToCode = extractStationCode\(trainTo\) \|\| "BSB";\r?\n/, '');

// Replace Pillars 2, 3, 4 with real fintech cards
const oldPillarsRegex = /\{\/\* Pillar 2: Book Travel \*\/\}[\s\S]*?\{\/\* Pillar 4: Jobs & Careers \*\/\}[\s\S]*?<\/Link>\s*<\/div>/;
const newPillars = `{/* Action 2: Scan BharatQR */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="group rounded-2xl border border-sky-500/30 bg-[#0d111a]/90 hover:border-sky-400/70 p-4 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[110px] sm:min-h-[125px] shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
                <ScanLine className="size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-sky-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                Scan BharatQR
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instant Camera Scanner
              </p>
            </div>
          </button>

          {/* Action 3: Add Money */}
          <button
            type="button"
            onClick={() => setIsAddMoneyOpen(true)}
            className="group rounded-2xl border border-emerald-500/30 bg-[#0d111a]/90 hover:border-emerald-400/70 p-4 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[110px] sm:min-h-[125px] shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <Plus className="size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-emerald-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                Load Wallet
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                UPI / NetBanking / Cards
              </p>
            </div>
          </button>

          {/* Action 4: Passbook & Ledger */}
          <a
            href="#live-ledger"
            className="group rounded-2xl border border-purple-500/30 bg-[#0d111a]/90 hover:border-purple-400/70 p-4 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[110px] sm:min-h-[125px] shadow-sm no-underline"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                <Receipt className="size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-purple-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                Passbook & Ledger
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time Audit Ledger
              </p>
            </div>
          </a>
        </div>`;

content = content.replace(oldPillarsRegex, newPillars);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated supreme-kingpay-experience.tsx');
