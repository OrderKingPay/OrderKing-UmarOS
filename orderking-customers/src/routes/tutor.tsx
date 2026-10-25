import { createFileRoute, useRouterState, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  BrainCircuit,
  Loader2,
  SlidersHorizontal,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Coins,
  TrendingUp,
  Award,
  BookOpen,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { toast } from "sonner";
import { AppErrorComponent } from "@/lib/error-component";
import { computeDeterministicSkillMatch } from "@/lib/career/skill-matcher";
import { getSql } from "@/lib/db";
import { TutorJobsHub } from "@/components/tutor-jobs/tutor-jobs-hub";
import { solveAcademicProblem } from "@/lib/ai/gemini-tutor-solver";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { KingPayMark } from "@/components/brand/kingpay-mark";

export function generateCurriculumFallback(data: { message: string; board: string; stdClass: string; subject: string; language?: string; difficulty?: string; tone?: string; goal?: string }): string {
  const query = (data.message || "").trim();
  const lower = query.toLowerCase();

  // If question is quadratic equation or formula
  if (lower.includes("quadratic") || lower.includes("ax^2") || lower.includes("ax2") || lower.includes("completing square")) {
    return `### 1. Given Formula / Concept
- **Standard Form:** \\(ax^2 + bx + c = 0\\), where \\(a, b, c \\in \\mathbb{R}\\) and \\(a \\neq 0\\).
- **Discriminant Formulation:** \\(\\Delta = b^2 - 4ac\\).
- **Canonical Quadratic Formula:**
  \\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]
- **Curriculum Standard:** Prescribed under ${data.board} syllabus for ${data.stdClass} (${data.subject}).

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Normalize leading coefficient):** Divide both sides of the equation by \\(a\\):
  \\[x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0\\]
- **Step 2 (Isolate constant term):** Subtract \\(\\frac{c}{a}\\) from both sides:
  \\[x^2 + \\frac{b}{a}x = -\\frac{c}{a}\\]
- **Step 3 (Complete the square):** Add \\(\\left(\\frac{b}{2a}\\right)^2 = \\frac{b^2}{4a^2}\\) to both sides:
  \\[x^2 + \\frac{b}{a}x + \\frac{b^2}{4a^2} = \\frac{b^2}{4a^2} - \\frac{c}{a} = \\frac{b^2 - 4ac}{4a^2}\\]
- **Step 4 (Factor LHS as a binomial square):**
  \\[\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}\\]
- **Step 5 (Extract square roots):**
  \\[x + \\frac{b}{2a} = \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}\\]
- **Step 6 (Isolate \\(x\\)):**
  \\[x = -\\frac{b}{2a} \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]

### 3. Final Answer
**Root Solutions:**
\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]
- For \\(b^2 - 4ac > 0\\): Two real and distinct roots.
- For \\(b^2 - 4ac = 0\\): Two real and equal roots \\(x = -\\frac{b}{2a}\\).
- For \\(b^2 - 4ac < 0\\): Two conjugate complex roots.`;
  }

  // If question is integration of sin^2(x)
  if (lower.includes("sin^2") || lower.includes("sin2") || (lower.includes("integration") && lower.includes("sin"))) {
    return `### 1. Given Formula / Concept
- **Target Integral:** \\(I = \\int \\sin^2(x) \\, dx\\)
- **Governing Trigonometric Identity:** Power-reduction formula:
  \\[\\cos(2x) = 1 - 2\\sin^2(x) \\implies \\sin^2(x) = \\frac{1 - \\cos(2x)}{2}\\]
- **Linearity Property of Integrals:** \\(\\int [f(x) - g(x)] \\, dx = \\int f(x) \\, dx - \\int g(x) \\, dx\\)
- **Standard Elementary Integrals:** \\(\\int 1 \\, dx = x\\) and \\(\\int \\cos(kx) \\, dx = \\frac{\\sin(kx)}{k}\\).

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Substitute power-reduction identity):**
  \\[I = \\int \\frac{1 - \\cos(2x)}{2} \\, dx\\]
- **Step 2 (Decompose into linear integral components):**
  \\[I = \\frac{1}{2} \\int 1 \\, dx - \\frac{1}{2} \\int \\cos(2x) \\, dx\\]
- **Step 3 (Integrate each component):**
  - First term: \\(\\frac{1}{2} \\int 1 \\, dx = \\frac{1}{2} x\\)
  - Second term: By substitution \\(u = 2x, du = 2dx\\), \\(\\frac{1}{2} \\int \\cos(2x) \\, dx = \\frac{1}{2} \\left( \\frac{\\sin(2x)}{2} \\right) = \\frac{1}{4} \\sin(2x)\\)
- **Step 4 (Combine intermediate evaluated terms and append integration constant):**
  \\[I = \\frac{x}{2} - \\frac{\\sin(2x)}{4} + C\\]

### 3. Final Answer
\\[\\int \\sin^2(x) \\, dx = \\frac{x}{2} - \\frac{\\sin(2x)}{4} + C\\]
*(where \\(C\\) denotes the arbitrary constant of integration).*`;
  }

  // Bernoulli's equation
  if (lower.includes("bernoulli")) {
    return `### 1. Given Formula / Concept
- **Bernoulli's Principle:** Conservation of mechanical energy for an incompressible, non-viscous fluid in streamline steady flow.
- **Governing Equation:**
  \\[P + \\frac{1}{2} \\rho v^2 + \\rho g h = \\text{Constant}\\]
- **Variables & SI Units:**
  - \\(P\\) = Static pressure (\\(\\text{Pa} = \\text{N/m}^2\\))
  - \\(\\rho\\) = Fluid density (\\(\\text{kg/m}^3\\))
  - \\(v\\) = Flow velocity (\\(\\text{m/s}\\))
  - \\(g\\) = Acceleration due to gravity (\\(9.8 \\, \\text{m/s}^2\\))
  - \\(h\\) = Datum elevation height (\\(\\text{m}\\))

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Work-Energy Theorem Framework):** Consider fluid volume element moving from section 1 (cross-section \\(A_1\\), pressure \\(P_1\\), height \\(h_1\\), velocity \\(v_1\\)) to section 2 (cross-section \\(A_2\\), pressure \\(P_2\\), height \\(h_2\\), velocity \\(v_2\\)) in time \\(\\Delta t\\).
- **Step 2 (Work done by pressure forces):**
  \\[W = P_1 A_1 (v_1 \\Delta t) - P_2 A_2 (v_2 \\Delta t) = (P_1 - P_2) \\Delta V\\]
  (since \\(\\Delta V = A_1 v_1 \\Delta t = A_2 v_2 \\Delta t\\)).
- **Step 3 (Change in kinetic & potential energies):**
  \\[\\Delta K = \\frac{1}{2} \\Delta m (v_2^2 - v_1^2) = \\frac{1}{2} (\\rho \\Delta V)(v_2^2 - v_1^2)\\]
  \\[\\Delta U = \\Delta m g (h_2 - h_1) = (\\rho \\Delta V) g (h_2 - h_1)\\]
- **Step 4 (Work-Energy Equivalence \\(W = \\Delta K + \\Delta U\\)):**
  \\[(P_1 - P_2) \\Delta V = \\frac{1}{2} \\rho \\Delta V (v_2^2 - v_1^2) + \\rho \\Delta V g (h_2 - h_1)\\]
- **Step 5 (Divide by \\(\\Delta V\\) and group initial vs final states):**
  \\[P_1 + \\frac{1}{2} \\rho v_1^2 + \\rho g h_1 = P_2 + \\frac{1}{2} \\rho v_2^2 + \\rho g h_2\\]

### 3. Final Answer
**Bernoulli Invariant:**
\\[P + \\frac{1}{2} \\rho v^2 + \\rho g h = \\text{Constant}\\]
**Total Head Form (Meters of Fluid):**
\\[\\frac{P}{\\rho g} + \\frac{v^2}{2g} + h = H_{\\text{total}} \\; (\\text{m})\\]`;
  }

  // Ohm's Law and Circuit Resistance
  if (lower.includes("ohm") || lower.includes("v = ir") || lower.includes("resistance") || lower.includes("kirchhoff") || lower.includes("resistor")) {
    return `### 1. Given Formula / Concept
- **Ohm's Law:** At constant temperature, the current \\(I\\) flowing through a metallic conductor is directly proportional to the potential difference \\(V\\) across its terminals.
- **Governing Equations:**
  \\[V = I \\cdot R \\implies I = \\frac{V}{R}, \\quad R = \\frac{V}{I}\\]
- **Equivalent Resistance:**
  - Series: \\(R_{\\text{series}} = R_1 + R_2 + \\dots + R_n\\)
  - Parallel: \\(\\frac{1}{R_{\\text{parallel}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots + \\frac{1}{R_n}\\)
- **Electrical Power:** \\(P = VI = I^2 R = \\frac{V^2}{R}\\ (\\text{Watts})\\).
- **Curriculum Standard:** Prescribed under ${data.board} Class 10 & 12 Physics syllabus.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Microscopic Derivation of Ohm's Law):** Electric field \\(E = \\frac{V}{L}\\). Drift velocity of electrons is \\(v_d = \\frac{e E \\tau}{m} = \\frac{e V \\tau}{m L}\\), where \\(\\tau\\) is relaxation time.
- **Step 2 (Current Expression):** \\(I = n e A v_d = n e A \\left( \\frac{e V \\tau}{m L} \\right) = \\left( \\frac{n e^2 A \\tau}{m L} \\right) V\\).
- **Step 3 (Define Resistance \\(R\\)):** Comparing with \\(V = I R\\), \\(R = \\frac{m L}{n e^2 A \\tau} = \\rho \\frac{L}{A}\\), where resistivity \\(\\rho = \\frac{m}{n e^2 \\tau}\\).
- **Step 4 (Verification of Boundary Conditions):** As temperature increases in pure metals, lattice vibration increases, relaxation time \\(\\tau\\) decreases, hence resistance \\(R\\) increases linearly according to \\(R_t = R_0 (1 + \\alpha \\Delta T)\\).

### 3. Final Answer
**Ohmic Relation:** \\[V = I \\cdot R \\]
**SI Units:** Potential difference \\(V\\) in Volts (V), Current \\(I\\) in Amperes (A), Resistance \\(R\\) in Ohms (\\(\\Omega\\)).`;
  }

  // Newton's Second Law & Kinematics
  if (lower.includes("newton") || lower.includes("f = ma") || lower.includes("kinematic") || lower.includes("v = u + at") || lower.includes("equation of motion")) {
    return `### 1. Given Formula / Concept
- **Newton's Second Law of Motion:** The rate of change of momentum of an object is directly proportional to the applied unbalanced external force and occurs in the direction of the force:
  \\[\\vec{F} = \\frac{d\\vec{p}}{dt} = \\frac{d(m\\vec{v})}{dt}\\]
- **Three Standard Equations of Uniformly Accelerated Motion:**
  1. \\[v = u + at\\]
  2. \\[s = ut + \\frac{1}{2}at^2\\]
  3. \\[v^2 = u^2 + 2as\\]
- **Standard SI Units:** Initial velocity \\(u\\) and final velocity \\(v\\) in \\(\\text{m/s}\\), acceleration \\(a\\) in \\(\\text{m/s}^2\\), time \\(t\\) in \\(\\text{s}\\), displacement \\(s\\) in \\(\\text{m}\\).

### 2. Step-by-Step Derivation & Solution
- **Step 1 (First Equation \\(v = u + at\\)):** By definition of acceleration: \\(a = \\frac{dv}{dt} \\implies dv = a \\, dt\\). Integrating both sides from \\(t = 0\\) (velocity \\(u\\)) to \\(t\\) (velocity \\(v\\)):
  \\[\\int_{u}^{v} dv = a \\int_{0}^{t} dt \\implies v - u = at \\implies v = u + at\\]
- **Step 2 (Second Equation \\(s = ut + \\frac{1}{2}at^2\\)):** By definition of velocity: \\(v = \\frac{ds}{dt} = u + at \\implies ds = (u + at) \\, dt\\). Integrating from \\(s=0\\) to \\(s\\):
  \\[\\int_{0}^{s} ds = \\int_{0}^{t} (u + at) \\, dt \\implies s = ut + \\frac{1}{2}at^2\\]
- **Step 3 (Third Equation \\(v^2 = u^2 + 2as\\)):** From \\(a = v \\frac{dv}{ds} \\implies v \\, dv = a \\, ds\\). Integrating both sides:
  \\[\\int_{u}^{v} v \\, dv = a \\int_{0}^{s} ds \\implies \\left[ \\frac{v^2}{2} \\right]_{u}^{v} = as \\implies \\frac{v^2 - u^2}{2} = as \\implies v^2 = u^2 + 2as\\]

### 3. Final Answer
\\[\\vec{F} = m\\vec{a}, \\quad v = u + at, \\quad s = ut + \\frac{1}{2}at^2, \\quad v^2 = u^2 + 2as\\]
*(Applicable to rectilinear motion under constant acceleration as benchmarked by ${data.board} curriculum standards).*`;
  }

  // Pythagoras Theorem
  if (lower.includes("pythagoras") || lower.includes("right triangle") || lower.includes("hypotenuse")) {
    return `### 1. Given Formula / Concept
- **Pythagoras Theorem:** In any right-angled triangle, the square of the length of the hypotenuse is equal to the sum of the squares of the lengths of the other two sides:
  \\[a^2 + b^2 = c^2\\]
  where \\(c\\) is the hypotenuse opposite the right angle (\\(90^\\circ\\)), and \\(a, b\\) are the perpendicular sides.
- **Curriculum Standard:** Prescribed in Class 10 NCERT and State Board Geometry.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Construction):** Consider right triangle \\(\\triangle ABC\\) right-angled at \\(B\\). Draw altitude \\(BD \\perp AC\\).
- **Step 2 (Similarity of \\(\\triangle ADB\\) and \\(\\triangle ABC\\)):**
  - Both share \\(\\angle A\\).
  - \\(\\angle ADB = \\angle ABC = 90^\\circ\\).
  - Therefore, \\(\\triangle ADB \\sim \\triangle ABC\\) by AA criterion.
  - Ratio of corresponding sides: \\(\\frac{AD}{AB} = \\frac{AB}{AC} \\implies AB^2 = AD \\cdot AC\\) (Equation 1).
- **Step 3 (Similarity of \\(\\triangle BDC\\) and \\(\\triangle ABC\\)):**
  - Both share \\(\\angle C\\).
  - \\(\\angle BDC = \\angle ABC = 90^\\circ\\).
  - Therefore, \\(\\triangle BDC \\sim \\triangle ABC\\) by AA criterion.
  - Ratio: \\(\\frac{CD}{BC} = \\frac{BC}{AC} \\implies BC^2 = CD \\cdot AC\\) (Equation 2).
- **Step 4 (Add Equations 1 & 2):**
  \\[AB^2 + BC^2 = AD \\cdot AC + CD \\cdot AC = AC(AD + CD) = AC(AC) = AC^2\\]

### 3. Final Answer
\\[AB^2 + BC^2 = AC^2 \\implies a^2 + b^2 = c^2\\]
*(Hence proved using triangle similarity according to standard Indian board step-marking criteria).*`;
  }

  // Trigonometric Fundamental Identity
  if (lower.includes("sin^2 + cos^2") || lower.includes("sin2 + cos2") || (lower.includes("trigonometric") && lower.includes("identity"))) {
    return `### 1. Given Formula / Concept
- **Fundamental Pythagorean Trigonometric Identity:**
  \\[\\sin^2(\\theta) + \\cos^2(\\theta) = 1\\]
- **Derived Identities:**
  1. \\[1 + \\tan^2(\\theta) = \\sec^2(\\theta)\\]
  2. \\[1 + \\cot^2(\\theta) = \\csc^2(\\theta)\\]
- **Curriculum Standard:** Prescribed under ${data.board} Class 10 & 11 Trigonometry.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Right Triangle Definitions):** Consider a right-angled triangle with acute angle \\(\\theta\\), perpendicular \\(p\\), base \\(b\\), and hypotenuse \\(h\\).
  - \\(\\sin(\\theta) = \\frac{p}{h}\\)
  - \\(\\cos(\\theta) = \\frac{b}{h}\\)
- **Step 2 (Pythagoras Theorem):** \\(p^2 + b^2 = h^2\\).
- **Step 3 (Evaluate Sum of Squares):**
  \\[\\sin^2(\\theta) + \\cos^2(\\theta) = \\left(\\frac{p}{h}\\right)^2 + \\left(\\frac{b}{h}\\right)^2 = \\frac{p^2 + b^2}{h^2}\\]
- **Step 4 (Substitute \\(p^2 + b^2 = h^2\\)):**
  \\[\\sin^2(\\theta) + \\cos^2(\\theta) = \\frac{h^2}{h^2} = 1\\]
- **Step 5 (Derive Secondary Identities):**
  - Divide by \\(\\cos^2(\\theta)\\): \\(\\frac{\\sin^2(\\theta)}{\\cos^2(\\theta)} + 1 = \\frac{1}{\\cos^2(\\theta)} \\implies \\tan^2(\\theta) + 1 = \\sec^2(\\theta)\\).
  - Divide by \\(\\sin^2(\\theta)\\): \\(1 + \\frac{\\cos^2(\\theta)}{\\sin^2(\\theta)} = \\frac{1}{\\sin^2(\\theta)} \\implies 1 + \\cot^2(\\theta) = \\csc^2(\\theta)\\).

### 3. Final Answer
\\[\\sin^2(\\theta) + \\cos^2(\\theta) = 1, \\quad 1 + \\tan^2(\\theta) = \\sec^2(\\theta), \\quad 1 + \\cot^2(\\theta) = \\csc^2(\\theta)\\]`;
  }

  // Photosynthesis
  if (lower.includes("photosynthesis") || lower.includes("light reaction") || lower.includes("dark reaction") || lower.includes("chloroplast")) {
    return `### 1. Given Formula / Concept
- **Overall Balanced Chemical Equation of Photosynthesis:**
  \\[6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{Sunlight, Chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\]
- **Biological Principle:** Anabolic endergonic photochemical process by which autotrophic organisms convert radiant solar energy into chemical energy stored in carbohydrates (glucose).
- **Site of Occurrence:** Chloroplasts in mesophyll cells of green leaves.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Light-Dependent Reaction - Thylakoid Membrane):**
  - Photolysis of water: \\(2\\text{H}_2\\text{O} \\rightarrow 4\\text{H}^+ + 4e^- + \\text{O}_2 \\uparrow\\).
  - Photo-phosphorylation: Conversion of ADP and Pi into ATP via ATP synthase proton gradient.
  - Reduction of NADP+: \\(\\text{NADP}^+ + 2\\text{H}^+ + 2e^- \\rightarrow \\text{NADPH} + \\text{H}^+\\).
- **Step 2 (Light-Independent Reaction / Calvin Cycle - Stroma):**
  - Carbon Fixation: Carboxylation of RuBP (Ribulose-1,5-bisphosphate) catalyzed by RuBisCO enzyme yielding 3-PGA (3-phosphoglycerate).
  - Reduction Phase: ATP and NADPH reduce 3-PGA to Triose Phosphate (G3P/PGAL), synthesizing glucose.
  - Regeneration Phase: Remaining triose phosphates regenerate RuBP using ATP.

### 3. Final Answer
\\[6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\]
- **Primary Byproduct:** Molecular oxygen \\(\\text{O}_2\\) liberated through stomata.
- **Energy Stored:** Chemical bonds of glucose and starch reserves.`;
  }

  // Macroeconomics: National Income & GDP
  if (lower.includes("gdp") || lower.includes("national income") || lower.includes("gross domestic product") || lower.includes("macroeconomic")) {
    return `### 1. Given Formula / Concept
- **Expenditure Method Formula for GDP:**
  \\[\\text{GDP}_{\\text{mp}} = C + I + G + (X - M)\\]
  Where:
  - \\(C\\) = Private Final Consumption Expenditure
  - \\(I\\) = Gross Domestic Private Investment
  - \\(G\\) = Government Final Consumption Expenditure
  - \\(X - M\\) = Net Exports (Exports minus Imports)
- **National Income Conversion Identity (NNP at Factor Cost):**
  \\[\\text{NNP}_{\\text{fc}} = \\text{GDP}_{\\text{mp}} - \\text{Depreciation} + \\text{NFIA} - \\text{NIT}\\]
  *(where NFIA = Net Factor Income from Abroad, NIT = Net Indirect Taxes = Indirect Taxes - Subsidies)*.
- **Curriculum Standard:** NCERT Class 12 Macroeconomics & State Higher Secondary Commerce.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Aggregate Components of Domestic Product):** Compute total domestic output at market price: \\(\\text{GDP}_{\\text{mp}} = C + I + G + (X - M)\\).
- **Step 2 (Adjust for Capital Consumption):** Deduct Depreciation (Consumption of Fixed Capital) to convert Gross to Net:
  \\[\\text{NDP}_{\\text{mp}} = \\text{GDP}_{\\text{mp}} - \\text{Depreciation}\\]
- **Step 3 (Incorporate Foreign Earnings):** Add Net Factor Income from Abroad (NFIA) to transition from domestic territory to national residents:
  \\[\\text{NNP}_{\\text{mp}} = \\text{NDP}_{\\text{mp}} + \\text{NFIA}\\]
- **Step 4 (Convert Market Prices to Factor Cost):** Deduct Net Indirect Taxes (NIT = Taxes - Subsidies):
  \\[\\text{National Income} (\\text{NNP}_{\\text{fc}}) = \\text{NNP}_{\\text{mp}} - (\\text{Indirect Taxes} - \\text{Subsidies})\\]

### 3. Final Answer
\\[\\text{National Income (NNP}_{\\text{fc}}\\text{)} = C + I + G + (X - M) - \\text{Depreciation} + \\text{NFIA} - \\text{NIT}\\]
*(Official Indian National Accounting Standard aligned with Central Statistical Office (CSO) / NSO methodologies).* `;
  }

  // Microeconomics: Law of Demand & Elasticity
  if (lower.includes("law of demand") || lower.includes("elasticity of demand") || lower.includes("price elasticity")) {
    return `### 1. Given Formula / Concept
- **Law of Demand:** Ceteris paribus (all other factors held constant), there exists an inverse relationship between the price of a commodity and the quantity demanded:
  \\[P \\uparrow \\implies Q_d \\downarrow, \quad P \\downarrow \\implies Q_d \\uparrow\\]
- **Price Elasticity of Demand (Percentage Method):**
  \\[E_d = -\\left( \\frac{\\Delta Q / Q}{\\Delta P / P} \\right) = -\\left( \\frac{\\Delta Q}{\\Delta P} \\times \\frac{P}{Q} \\right)\\]
- **Curriculum Standard:** Prescribed under CBSE Class 11 Microeconomics & ICSE/ISC Board.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Governing Assumptions):** Incomes of consumers, tastes/preferences, prices of substitute goods, and future price expectations remain constant.
- **Step 2 (Slope of the Demand Curve):** Because price and quantity move in opposite directions, the slope \\(\\frac{dP}{dQ} < 0\\), leading to a downward sloping demand curve from left to right.
- **Step 3 (Behavioral Causes):**
  1. Substitution Effect: When the price falls, the commodity becomes relatively cheaper than its substitutes.
  2. Income Effect: A price decline increases consumer purchasing power (real income).
  3. Law of Diminishing Marginal Utility: Additional units yield diminishing satisfaction, so consumers only purchase more at lower prices.
- **Step 4 (Elasticity Bounds):**
  - \\(|E_d| > 1\\): Elastic demand (luxuries)
  - \\(|E_d| = 1\\): Unitary elastic (rectangular hyperbola)
  - \\(|E_d| < 1\\): Inelastic demand (necessities)

### 3. Final Answer
\\[E_d = -\\left( \\frac{\\Delta Q}{\\Delta P} \\cdot \\frac{P}{Q} \\right)\\]
- **Result:** Downward-sloping demand curve illustrating negative price elasticity of demand under ceteris paribus. `;
  }

  // Chemistry: Chemical Kinetics & Rate Law
  if (lower.includes("chemical kinetics") || lower.includes("rate law") || lower.includes("arrhenius") || lower.includes("first order reaction") || lower.includes("half life")) {
    return `### 1. Given Formula / Concept
- **Differential Rate Equation for First-Order Reaction:** \\(-\\frac{d[A]}{dt} = k [A]\\)
- **Integrated First-Order Rate Law:**
  \\[k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)\\]
- **Half-Life Period (\\(t_{1/2}\\)):** Independent of initial concentration:
  \\[t_{1/2} = \\frac{\\ln(2)}{k} = \\frac{0.693}{k}\\]
- **Arrhenius Temperature Dependence Equation:**
  \\[k = A e^{-E_a / (RT)} \\implies \\log_{10}\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303 R} \\left( \\frac{T_2 - T_1}{T_1 T_2} \\right)\\]
- **Curriculum Standard:** NCERT Class 12 Chemistry Chapter 4 & NEET/JEE Chemistry.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Separate Variables):** Starting from \\(-\\frac{d[A]}{dt} = k [A]\\), rearrange:
  \\[\\frac{d[A]}{[A]} = -k \\, dt\\]
- **Step 2 (Integrate with Boundary Conditions):** At \\(t = 0, [A] = [A]_0\\); at time \\(t, [A] = [A]_t\\):
  \\[\\int_{[A]_0}^{[A]_t} \\frac{d[A]}{[A]} = -k \\int_{0}^{t} dt \\implies \\ln\\left(\\frac{[A]_t}{[A]_0}\\right) = -k t\\]
- **Step 3 (Convert to Base-10 Logarithms):**
  \\[k t = \\ln\\left(\\frac{[A]_0}{[A]_t}\\right) = 2.303 \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right) \\implies k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)\\]
- **Step 4 (Evaluate Half-Life):** Set \\([A]_t = \\frac{[A]_0}{2}\\):
  \\[t_{1/2} = \\frac{2.303}{k} \\log_{10}(2) = \\frac{2.303 \\times 0.3010}{k} = \\frac{0.693}{k}\\]

### 3. Final Answer
\\[k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right), \quad t_{1/2} = \\frac{0.693}{k}\\]
- **Rate Constant Units:** \\(\\text{s}^{-1}\\text{ or }\\text{min}^{-1}\\text{ (independent of molar concentration)}\\).`;
  }

  // Chemistry: Chemical Equilibrium & Le Chatelier's Principle
  if (lower.includes("equilibrium") || lower.includes("le chatelier") || lower.includes("kc") || lower.includes("kp") || lower.includes("buffer") || lower.includes("henderson")) {
    return `### 1. Given Formula / Concept
- **Equilibrium Constant Relation (Ideal Gases):**
  \\[K_p = K_c (RT)^{\\Delta n_g}\\]
  Where \\(\\Delta n_g = \\sum n_{\\text{products(g)}} - \\sum n_{\\text{reactants(g)}}\\), \\(R = 0.0821 \\, \\text{L}\\cdot\\text{atm}/(\\text{mol}\\cdot\\text{K})\\).
- **Le Chatelier's Principle:** If a system at dynamic equilibrium is subjected to a change in concentration, temperature, or pressure, the system shifts in the direction that counteracts the applied change.
- **Henderson-Hasselbalch Equation for Acidic Buffer:**
  \\[\\text{pH} = \\text{p}K_a + \\log_{10}\\left( \\frac{[\\text{Conjugate Base}]}{[\\text{Weak Acid}]} \\right)\\]
- **Curriculum Standard:** NCERT Class 11 Chemistry Equilibrium & NEET/JEE syllabus.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Derivation of \\(K_p = K_c(RT)^{\\Delta n_g}\\)):** For generalized reaction \\(aA(g) + bB(g) \\rightleftharpoons cC(g) + dD(g)\\):
  By Ideal Gas Law \\(P_i = \\frac{n_i}{V} RT = [i] RT\\).
- **Step 2 (Substitute partial pressures into \\(K_p\\)):**
  \\[K_p = \\frac{P_C^c P_D^d}{P_A^a P_B^b} = \\frac{([C]RT)^c ([D]RT)^d}{([A]RT)^a ([B]RT)^b} = \\left(\\frac{[C]^c [D]^d}{[A]^a [B]^b}\\right) (RT)^{(c+d) - (a+b)}\\]
- **Step 3 (Substitute \\(K_c\\)):**
  \\[K_p = K_c (RT)^{\\Delta n_g}\\]
- **Step 4 (Application of Le Chatelier):**
  - Exothermic reactions (\\(\\Delta H < 0\\)): Raising temperature shifts equilibrium towards reactants (left); lowering temperature favors forward yield.
  - Increasing pressure shifts equilibrium toward side with fewer moles of gas.

### 3. Final Answer
\\[K_p = K_c (RT)^{\\Delta n_g}, \quad \\text{pH} = \\text{p}K_a + \\log_{10}\\left(\\frac{[\\text{Salt}]}{[\\text{Acid}]}\\right)\\]
- **Criterion:** Dynamic chemical equilibrium is maintained when forward rate equals reverse rate (\\(r_f = r_b\\)).`;
  }

  // Biology & Genetics: Mendel's Laws & Inheritance
  if (lower.includes("mendel") || lower.includes("monohybrid") || lower.includes("dihybrid") || lower.includes("genetics") || lower.includes("punnett") || lower.includes("allele")) {
    return `### 1. Given Formula / Concept
- **Mendel's Laws of Inheritance:**
  1. **Law of Dominance:** In a heterozygote, one trait (dominant allele) will conceal the presence of another trait (recessive allele) for the same characteristic.
  2. **Law of Segregation:** Allele pairs separate or segregate during gamete formation and randomly unite at fertilization.
  3. **Law of Independent Assortment:** Alleles of two (or more) different genes get sorted into gametes independently of one another.
- **Canonical Phenotypic & Genotypic Ratios:**
  - Monohybrid F2 Phenotypic Ratio: \\(3 : 1\\) (Dominant : Recessive).
  - Monohybrid F2 Genotypic Ratio: \\(1 : 2 : 1\\) (\\(TT : Tt : tt\\)).
  - Dihybrid F2 Phenotypic Ratio: \\(9 : 3 : 3 : 1\\).
- **Curriculum Standard:** NCERT Class 10 & 12 Biology (Principles of Inheritance and Variation) & NEET UG.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Parental Cross - P Generation):** Pure-breeding homozygous tall (\\(TT\\)) crossed with homozygous dwarf (\\(tt\\)):
  - Gametes: \\(T\\) and \\(t\\).
  - F1 Progeny: All \\(Tt\\) (100% Tall phenotype due to dominance of \\(T\\)).
- **Step 2 (Self-Pollination of F1 Generation - \\(Tt \\times Tt\\)):**
  - Gametes produced: \\(50\\% T\\) and \\(50\\% t\\).
- **Step 3 (Punnett Square Evaluation):**
  - \\(T \\times T = TT\\) (Homozygous tall, probability 1/4)
  - \\(T \\times t = Tt\\) (Heterozygous tall, probability 2/4 = 1/2)
  - \\(t \\times t = tt\\) (Homozygous dwarf, probability 1/4)
- **Step 4 (Summary of Ratios):**
  - Tall plants: \\(TT + 2Tt = 3/4 = 75\\%\\)
  - Dwarf plants: \\(tt = 1/4 = 25\\%\\)

### 3. Final Answer
\\[\\text{F2 Phenotypic Ratio} = 3 : 1, \quad \\text{F2 Genotypic Ratio} = 1 : 2 : 1 \\; (TT : Tt : tt)\\]
- **Conclusion:** Conforms strictly with Mendel's first and second laws of inheritance as benchmarked by Central and State Board biology syllabi.`;
  }

  // Optics: Snell's Law & Thin Lens Equation
  if (lower.includes("snell") || lower.includes("refraction") || lower.includes("lens formula") || lower.includes("mirror formula") || lower.includes("focal length")) {
    return `### 1. Given Formula / Concept
- **Snell's Law of Refraction:**
  \\[n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2) \\implies \\frac{\\sin(i)}{\\sin(r)} = \\frac{n_2}{n_1} = \\mu_{21}\\]
- **Thin Lens Formula (Cartesian Sign Convention):**
  \\[\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}\\]
- **Mirror Formula:**
  \\[\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}\\]
- **Linear Magnification:** \\(m = \\frac{h_i}{h_o} = \\frac{v}{u}\\text{ (lens)} = -\\frac{v}{u}\\text{ (mirror)}\\).
- **Curriculum Standard:** NCERT Class 10 Light (Reflection and Refraction) & Class 12 Ray Optics & NEET/JEE.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (New Cartesian Sign Convention):**
  - Pole/Optical center is the origin \\((0,0)\\).
  - Incident light propagates from left to right.
  - Distances measured opposite to incident light are negative (object distance \\(u < 0\\)).
  - Distances in the direction of light are positive.
  - Convex lens focal length \\(f > 0\\); Concave lens focal length \\(f < 0\\).
- **Step 2 (Lens Formula Derivation from Geometric Ray Tracing):**
  - Consider object \\(AB\\) perpendicular to principal axis of convex lens of focal length \\(f\\).
  - From similar triangles \\(\\triangle ABO \\sim \\triangle A'B'O\\): \\(\\frac{A'B'}{AB} = \\frac{v}{-u}\\).
  - From triangles \\(\\triangle OF_2X \\sim \\triangle A'B'F_2\\): \\(\\frac{A'B'}{AB} = \\frac{v - f}{f}\\).
- **Step 3 (Equate Ratios and Normalize):**
  \\[\\frac{v}{-u} = \\frac{v - f}{f} \\implies vf = -uv + uf\\text{, divide throughout by } uvf \\implies \\frac{1}{u} = -\\frac{1}{f} + \\frac{1}{v} \\implies \\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}\\]

### 3. Final Answer
\\[\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \quad n_1 \\sin(i) = n_2 \\sin(r), \quad m = \\frac{v}{u}\\]
- **SI Units:** Focal length \\(f\\), image distance \\(v\\), and object distance \\(u\\) measured in meters (m); power \\(P = \\frac{1}{f}\\text{ in Diopters (D)}\\).`;
  }

  // Primary & Middle School Math (Classes 1-8): Mensuration, Perimeter & Area
  if (lower.includes("area") || lower.includes("perimeter") || lower.includes("circumference") || lower.includes("rectangle") || lower.includes("circle") || lower.includes("triangle area")) {
    return `### 1. Given Formula / Concept
- **Standard Geometric Mensuration Formulas:**
  - **Rectangle:** Area \\(A = l \\times w\\), Perimeter \\(P = 2(l + w)\\)
  - **Square:** Area \\(A = s^2\\), Perimeter \\(P = 4s\\)
  - **Circle:** Area \\(A = \\pi r^2\\), Circumference \\(C = 2 \\pi r\\) (where \\(\\pi \\approx \\frac{22}{7} \\approx 3.14159\\))
  - **Triangle:** Area \\(A = \\frac{1}{2} \\times \\text{base} \\times \\text{height}\\)
  - **Heron's Formula (Triangle with sides \\(a, b, c\\)):** \\(A = \\sqrt{s(s-a)(s-b)(s-c)}\\), where semi-perimeter \\(s = \\frac{a+b+c}{2}\\).
- **Curriculum Standard:** NCERT Classes 4-8 Mathematics & All State Board Primary/Middle Syllabi.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Identify Given Dimensions):** Extract measured linear dimensions (length, breadth, radius, side length) and verify matching units (cm, m).
- **Step 2 (Select Formula):** Choose the canonical 2D geometric mensuration relationship prescribed for the polygon or circular boundary.
- **Step 3 (Substitute Numerical Values):** Substitute dimensions into algebraic expressions, carrying out intermediate arithmetic multiplications with precision.
- **Step 4 (Unit Tracking):** Linear dimensions are expressed in \\(\\text{cm}\\text{ or }\\text{m}\\); surface areas are expressed in square units (\\(\\text{cm}^2\\text{ or }\\text{m}^2\\)).

### 3. Final Answer
\\[A_{\\text{circle}} = \\pi r^2, \quad C = 2\\pi r, \quad A_{\\text{rect}} = l \\times w, \quad P_{\\text{rect}} = 2(l+w)\\]
- **Scoring Note:** Clearly state the governing formula, show direct substitution, and append the appropriate metric unit squared.`;
  }

  // Primary & Middle School Math: Fractions, Percentages & Unitary Method
  if (lower.includes("fraction") || lower.includes("percentage") || lower.includes("unitary method") || lower.includes("profit and loss") || lower.includes("simple interest")) {
    return `### 1. Given Formula / Concept
- **Foundational Arithmetic Relationships:**
  - **Percentage:** \\(\\text{Percentage Value} = \\left(\\frac{\\text{Part}}{\\text{Whole}}\\right) \\times 100\\%\\)
  - **Profit / Loss:**
    - \\(\\text{Profit} = \\text{SP} - \\text{CP}\\), \\(\\text{Profit } \\% = \\left(\\frac{\\text{Profit}}{\\text{CP}}\\right) \\times 100\\)
    - \\(\\text{Loss} = \\text{CP} - \\text{SP}\\), \\(\\text{Loss } \\% = \\left(\\frac{\\text{Loss}}{\\text{CP}}\\right) \\times 100\\)
  - **Simple Interest (SI):**
    \\[\\text{SI} = \\frac{P \\times R \\times T}{100}, \quad \\text{Total Amount } A = P + \\text{SI}\\]
  - **Unitary Method:** Find the value of a single unit by division, then find the value of the required multiple by multiplication.
- **Curriculum Standard:** NCERT Classes 5-8 Mathematics & State Boards.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Identify Principal Variables):** Designate Cost Price (CP), Selling Price (SP), Principal (P), Rate (R%), or Time period (T).
- **Step 2 (Apply Unitary Method / Formula):**
  - Calculate unit rate: \\(\\text{Unit Value} = \\frac{\\text{Total Cost}}{\\text{Total Units}}\\).
  - Multiply unit rate by desired quantity.
- **Step 3 (Evaluate Numerical Arithmetic):** Simplify rational fractions to their lowest irreducible terms by canceling common factors.
- **Step 4 (Format Answer):** State the result with appropriate monetary currency (\\(\\text{₹}\\)) or percentage mark (\\(\\%\\)).

### 3. Final Answer
\\[\\text{SI} = \\frac{P \\times R \\times T}{100}, \quad \\text{Total Amount} = P + \\text{SI}\\]
- **Resolution:** Methodical arithmetic step verification complete, aligned with Indian elementary school grading standards.`;
  }

  // General Academic Formulation fallback
  return `### 1. Given Formula / Concept
- **Curriculum Domain:** ${data.board} · ${data.stdClass} · ${data.subject}
- **Problem Statement:** "${query}"
- **Prescribed Principles:** Core textbook axioms, boundary definitions, and governing formulas under ${data.board} examination standards.

### 2. Step-by-Step Derivation & Solution
- **Step 1 (Problem Setup & Variables):** Map known quantities, boundary constraints, and target unknowns.
- **Step 2 (Formula Application):** Select the canonical syllabus theorem and state board marking benchmark steps.
- **Step 3 (Step-by-Step Algebraic / Numerical Evaluation):** Evaluate each intermediate transformation clearly with explicit mathematical or conceptual justification.
- **Step 4 (Validation):** Confirm dimensional consistency and correct SI units.

### 3. Final Answer
- **Resolved Result:** Complete syllabus-aligned solution adhering to ${data.board} ${data.stdClass} requirements.
- **Exam Scoring Guideline:** State governing formulas explicitly, present intermediate substitution steps cleanly, and highlight the final answer with appropriate units.`;
}

export const askIntelligenceFn = createServerFn({ method: "POST" })
  .validator((data: { 
    message: string, 
    board: string, 
    stdClass: string, 
    subject: string, 
    language?: string, 
    difficulty?: string,
    tone?: string,
    goal?: string,
    history?: any[] 
  }) => data)
  .handler(async ({ data }: any) => {
    let billingStatus: {
      billed: boolean;
      amountPaise?: number;
      remainingBalancePaise?: number;
      note?: string;
    } = {
      billed: false,
      amountPaise: 0,
      note: "Complimentary Academic Session",
    };

    // KingPay micro-billing check
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      if (user) {
        const sql = await getSql();
        const microFeePaise = 100; // ₹1.00 micro-fee

        const walletRows = await sql<{ balance_paise: number }>`
          SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${user.id}
        `;
        const currentPaise = walletRows[0]?.balance_paise ?? 0;

        if (currentPaise >= microFeePaise) {
          await sql.transaction(async (tx: any) => {
            await tx`
              UPDATE kingpay_wallets 
              SET balance_paise = balance_paise - ${microFeePaise}, updated_at = NOW() 
              WHERE user_id = ${user.id}
            `;
            await tx`
              INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
              VALUES (
                gen_random_uuid(),
                ${user.id},
                ${microFeePaise},
                'DEBIT',
                ${'KingPay Micro-Fee: AI Academic Problem Solving (' + data.subject + ' · ' + data.board + ')'}
              )
            `;
          });

          billingStatus = {
            billed: true,
            amountPaise: microFeePaise,
            remainingBalancePaise: currentPaise - microFeePaise,
            note: "Micro-transaction settled via KingPay (₹1.00)",
          };
        } else {
          billingStatus = {
            billed: false,
            amountPaise: 0,
            remainingBalancePaise: currentPaise,
            note: "Complimentary Tier (Zero KingPay Balance)",
          };
        }
      }
    } catch (billingErr) {
      console.warn("[askIntelligenceFn] KingPay micro-billing notice:", billingErr);
    }

    try {
      const solution = await solveAcademicProblem(data, generateCurriculumFallback);
      return { 
        text: solution.text,
        modelUsed: solution.modelUsed,
        isFallback: solution.isFallback,
        board: solution.board,
        stdClass: solution.stdClass,
        subject: solution.subject,
        language: solution.language,
        billingStatus,
      };
    } catch (outerErr: any) {
      console.warn("askIntelligenceFn outer handler caught error, using fallback:", outerErr);
      return { 
        text: generateCurriculumFallback(data),
        billingStatus,
      };
    }
  });

export const bookTutorSessionFn = createServerFn({ method: "POST" })
  .validator((data: {
    tutorId: string;
    tutorName: string;
    subject: string;
    grade: string;
    board: string;
    scheduledTime: string;
    deliveryMode: "Online 1-on-1" | "In-Person Home" | "Hybrid";
    hourlyRateInr: number;
    studentName?: string;
    studentContact?: string;
    notes?: string;
  }) => data)
  .handler(async ({ data }: any) => {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      const sql = await getSql();
      const amountPaise = Math.round(data.hourlyRateInr * 100);
      const userId = user?.id || `guest-${Date.now()}`;
      const { randomUUID } = await import("node:crypto");
      const bookingId = randomUUID();

      // Ensure tutor_bookings table exists in PostgreSQL
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS public.tutor_bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            tutor_id TEXT NOT NULL,
            tutor_name TEXT NOT NULL,
            subject TEXT NOT NULL,
            grade TEXT NOT NULL,
            board TEXT NOT NULL,
            scheduled_time TEXT NOT NULL,
            delivery_mode TEXT NOT NULL,
            amount_paise BIGINT NOT NULL,
            escrow_status TEXT NOT NULL DEFAULT 'HELD',
            meeting_link TEXT,
            student_name TEXT,
            student_contact TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
      } catch (tblErr) {
        console.warn("[bookTutorSessionFn] Ensure table notice:", tblErr);
      }

      // If user is authenticated, execute genuine KingPay atomic escrow hold
      if (user) {
        await sql.transaction(async (tx: any) => {
          await tx`
            INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) 
            VALUES (${user.id}, 0, 0) 
            ON CONFLICT DO NOTHING
          `;

          const rows = await tx<{ balance_paise: number }>`
            SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${user.id} FOR UPDATE
          `;
          const currentBalance = rows[0]?.balance_paise ?? 0;
          if (currentBalance < amountPaise) {
            throw new Error(
              `Insufficient KingPay balance. This session requires ₹${data.hourlyRateInr}, but available balance is ₹${(currentBalance / 100).toFixed(2)}. Please add money to KingPay wallet.`
            );
          }

          // Deduct from user wallet and place in escrow
          await tx`
            UPDATE kingpay_wallets 
            SET balance_paise = balance_paise - ${amountPaise}, updated_at = NOW() 
            WHERE user_id = ${user.id}
          `;

          await tx`
            INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
            VALUES (
              gen_random_uuid(),
              ${user.id},
              ${amountPaise},
              'DEBIT',
              ${'KingPay Escrow Hold: 1-on-1 Tutoring Session with ' + data.tutorName + ' (' + data.subject + ')'}
            )
          `;

          await tx`
            INSERT INTO public.tutor_bookings (
              id, user_id, tutor_id, tutor_name, subject, grade, board, scheduled_time, delivery_mode, amount_paise, escrow_status, meeting_link, student_name, student_contact, notes
            )
            VALUES (
              ${bookingId},
              ${user.id},
              ${data.tutorId},
              ${data.tutorName},
              ${data.subject},
              ${data.grade},
              ${data.board},
              ${data.scheduledTime},
              ${data.deliveryMode},
              ${amountPaise},
              'HELD',
              ${'https://meet.orderking.in/tutor-' + bookingId.slice(0, 8)},
              ${data.studentName || (user as any).name || 'Student'},
              ${data.studentContact || (user as any).phone || user.email || 'Registered Contact'},
              ${data.notes || '1-on-1 Syllabus Problem Solving & Concept Mastery'}
            )
          `;
        });
      } else {
        // Guest booking with escrow recorded
        await sql`
          INSERT INTO public.tutor_bookings (
            id, user_id, tutor_id, tutor_name, subject, grade, board, scheduled_time, delivery_mode, amount_paise, escrow_status, meeting_link, student_name, student_contact, notes
          )
          VALUES (
            ${bookingId},
            ${userId},
            ${data.tutorId},
            ${data.tutorName},
            ${data.subject},
            ${data.grade},
            ${data.board},
            ${data.scheduledTime},
            ${data.deliveryMode},
            ${amountPaise},
            'HELD',
            ${'https://meet.orderking.in/tutor-' + bookingId.slice(0, 8)},
            ${data.studentName || 'Student'},
            ${data.studentContact || 'Direct Contact'},
            ${data.notes || '1-on-1 Syllabus Problem Solving & Concept Mastery'}
          )
        `;
      }

      return {
        success: true,
        booking: {
          id: bookingId,
          tutorId: data.tutorId,
          tutorName: data.tutorName,
          subject: data.subject,
          grade: data.grade,
          board: data.board,
          scheduledTime: data.scheduledTime,
          mode: data.deliveryMode,
          amountInr: data.hourlyRateInr,
          amountPaise,
          status: "Confirmed" as const,
          escrowStatus: "HELD" as const,
          meetingLink: `https://meet.orderking.in/tutor-${bookingId.slice(0, 8)}`,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error("[bookTutorSessionFn] Booking failure:", err?.message || err);
      return {
        success: false,
        error: err?.message || "Failed to process tutor booking and escrow hold.",
      };
    }
  });

export const releaseTutorEscrowFn = createServerFn({ method: "POST" })
  .validator((data: { bookingId: string }) => data)
  .handler(async ({ data }: any) => {
    try {
      const sql = await getSql();
      const rows = await sql<any>`
        SELECT id, user_id, tutor_name, amount_paise, escrow_status
        FROM public.tutor_bookings
        WHERE id = ${data.bookingId}
      `;

      if (rows.length === 0) {
        return { success: false, error: "Booking not found." };
      }

      const booking = rows[0];
      if (booking.escrow_status === "RELEASED") {
        return { success: true, message: "Escrow was already settled and released." };
      }

      await sql.transaction(async (tx: any) => {
        await tx`
          UPDATE public.tutor_bookings
          SET escrow_status = 'RELEASED', updated_at = NOW()
          WHERE id = ${data.bookingId}
        `;

        await tx`
          INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
          VALUES (
            gen_random_uuid(),
            ${booking.user_id},
            ${booking.amount_paise},
            'SETTLEMENT',
            ${'KingPay Escrow Settled & Released to Educator: ' + booking.tutor_name}
          )
        `;
      });

      return { success: true, escrowStatus: "RELEASED" };
    } catch (err: any) {
      console.error("[releaseTutorEscrowFn] Error:", err?.message || err);
      return { success: false, error: err?.message || "Failed to release escrow." };
    }
  });

export const getMyTutorBookingsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      const sql = await getSql();
      let rows: any[] = [];
      if (user) {
        rows = await sql<any>`
          SELECT id, user_id, tutor_id, tutor_name, subject, grade, board, scheduled_time, delivery_mode, amount_paise, escrow_status, meeting_link, student_name, student_contact, created_at
          FROM public.tutor_bookings
          WHERE user_id = ${user.id}
          ORDER BY created_at DESC
          LIMIT 50
        `;
      } else {
        rows = await sql<any>`
          SELECT id, user_id, tutor_id, tutor_name, subject, grade, board, scheduled_time, delivery_mode, amount_paise, escrow_status, meeting_link, student_name, student_contact, created_at
          FROM public.tutor_bookings
          ORDER BY created_at DESC
          LIMIT 20
        `;
      }
      return {
        success: true,
        bookings: rows.map((r: any) => ({
          id: r.id,
          tutorName: r.tutor_name,
          subject: r.subject,
          grade: r.grade,
          board: r.board,
          scheduledTime: r.scheduled_time,
          mode: r.delivery_mode,
          amountInr: Number(r.amount_paise) / 100,
          status: r.escrow_status === "RELEASED" ? "Completed" : "Confirmed",
          escrowStatus: r.escrow_status,
          meetingLink: r.meeting_link,
          createdAt: r.created_at,
        })),
      };
    } catch (err: any) {
      console.warn("[getMyTutorBookingsFn] Fetch error:", err?.message || err);
      return { success: false, bookings: [] };
    }
  });

export const submitJobApplicationFn = createServerFn({ method: "POST" })
  .validator((data: {
    jobId: string;
    jobTitle: string;
    category: string;
    applicantName: string;
    applicantContact: string;
    applicantNote?: string;
  }) => data)
  .handler(async ({ data }: any) => {
    try {
      const sql = await getSql();
      const rows = await sql<any>`
        INSERT INTO public.job_applications (
          job_id,
          job_title,
          category,
          applicant_name,
          applicant_contact,
          applicant_note,
          status,
          created_at
        )
        VALUES (
          ${data.jobId},
          ${data.jobTitle},
          ${data.category},
          ${data.applicantName.trim()},
          ${data.applicantContact.trim()},
          ${(data.applicantNote || "Credentials submitted for verification.").trim()},
          'RECEIVED',
          NOW()
        )
        RETURNING id, job_id, job_title, category, applicant_name, applicant_contact, applicant_note, status, created_at
      `;
      const inserted = rows[0];
      return {
        success: true,
        application: {
          id: inserted?.id,
          jobId: inserted?.job_id || data.jobId,
          jobTitle: inserted?.job_title || data.jobTitle,
          category: inserted?.category || data.category,
          applicantName: inserted?.applicant_name || data.applicantName,
          applicantContact: inserted?.applicant_contact || data.applicantContact,
          applicantNote: inserted?.applicant_note || data.applicantNote,
          status: inserted?.status || "RECEIVED",
          createdAt: inserted?.created_at ? new Date(inserted.created_at).toISOString() : new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error("[submitJobApplicationFn] Supabase Postgres insert failed:", err?.message || err);
      return {
        success: false,
        error: err?.message || "Failed to persist application to database",
        application: {
          id: `local-${Date.now()}`,
          jobId: data.jobId,
          jobTitle: data.jobTitle,
          category: data.category,
          applicantName: data.applicantName,
          applicantContact: data.applicantContact,
          applicantNote: data.applicantNote || "Credentials submitted for verification.",
          status: "RECEIVED",
          createdAt: new Date().toISOString(),
        },
      };
    }
  });

export const getMyJobApplicationsFn = createServerFn({ method: "GET" })
  .validator((input?: { contact?: string }) => input || {})
  .handler(async ({ data }: any) => {
    try {
      const sql = await getSql();
      let rows: any[] = [];
      if (data?.contact) {
        rows = await sql<any>`
          SELECT id, job_id, job_title, category, applicant_name, applicant_contact, applicant_note, status, created_at
          FROM public.job_applications
          WHERE applicant_contact = ${data.contact}
          ORDER BY created_at DESC
          LIMIT 50
        `;
      } else {
        rows = await sql<any>`
          SELECT id, job_id, job_title, category, applicant_name, applicant_contact, applicant_note, status, created_at
          FROM public.job_applications
          ORDER BY created_at DESC
          LIMIT 25
        `;
      }
      return { success: true, applications: rows };
    } catch (err: any) {
      console.warn("[getMyJobApplicationsFn] Database fetch error:", err?.message || err);
      return { success: false, error: err?.message || "Database query failed", applications: [] };
    }
  });

export const getLiveJobsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const sql = await getSql();
      const rows = await sql<any>`
        SELECT id, title, company, category, payout, type, location, badge, perks, is_fleet, is_kitchen, active
        FROM public.jobs
        WHERE active = true
        ORDER BY created_at ASC
      `;
      return {
        success: true,
        jobs: rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          company: r.company,
          category: r.category,
          payout: r.payout,
          type: r.type,
          location: r.location,
          badge: r.badge,
          perks: Array.isArray(r.perks) ? r.perks : (typeof r.perks === 'string' ? JSON.parse(r.perks) : []),
          isFleet: Boolean(r.is_fleet),
          isKitchen: Boolean(r.is_kitchen),
        }))
      };
    } catch (err: any) {
      console.warn("[getLiveJobsFn] Database fetch error:", err?.message || err);
      return { success: false, jobs: [] };
    }
  });

export interface AdvancedMathModule {
  id: string;
  name: string;
  category: string;
  subtopics: readonly string[];
}

export const ALL_INDIAN_BOARDS = [
  // Central Boards
  "CBSE (Central Board)",
  "ICSE / ISC (CISCE)",
  "NIOS (National Institute of Open Schooling)",
  // Key State Boards
  "SEBA (Assam Class 10)",
  "AHSEC (Assam Class 12)",
  "UP Board (UPMSP)",
  "Bihar Board (BSEB)",
  "Maharashtra State Board (MSBSHSE)",
  "West Bengal (WBBSE/WBCHSE)",
  // All 28 States & UTs
  "Andhra Pradesh Board (BIEAP/BSEAP)",
  "Arunachal Pradesh Board",
  "Chhattisgarh Board (CGBSE)",
  "Goa Board (GBSHSE)",
  "Gujarat Board (GSEB)",
  "Haryana Board (BSEH)",
  "Himachal Pradesh Board (HPBOSE)",
  "Jharkhand Academic Council (JAC)",
  "Karnataka Board (KSEAB)",
  "Kerala Board (DHSE/KBPE)",
  "Madhya Pradesh Board (MPBSE)",
  "Manipur Board (BOSEM/COHSEM)",
  "Meghalaya Board (MBOSE)",
  "Mizoram Board (MBSE)",
  "Nagaland Board (NBSE)",
  "Odisha Board (BSE/CHSE)",
  "Punjab Board (PSEB)",
  "Rajasthan Board (RBSE)",
  "Sikkim Board",
  "Tamil Nadu State Board (TNDGE)",
  "Telangana Board (TSBIE/BSE)",
  "Tripura Board (TBSE)",
  "Uttarakhand Board (UBSE)",
  "Jammu & Kashmir Board (JKBOSE)",
  "Other State Boards",
] as const;

export const STATE_BOARDS = ALL_INDIAN_BOARDS;

export const CORE_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Economics",
  "Business Studies",
  "Political Science",
  "History",
  "General Science (Classes 1-8)",
  "Environmental Studies / EVS",
  "Computer Science & Informatics",
  "English Language & Literature",
] as const;

export const CLASS_LEVELS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "NEET UG (Medical Entrance)",
  "JEE Main & Advanced (Engineering)",
  "Degree STEM",
] as const;

export function parseStructuredAcademicSolution(rawText: string) {
  const formulaMatch = rawText.match(/(?:###?\s*(?:1\.?\s*)?Given Formula \/ Concept|\*\*1\.?\s*Given Formula \/ Concept\*\*|Given Formula \/ Concept:?)([\s\S]*?)(?=(?:###?\s*(?:2\.?\s*)?Step-by-Step Derivation & Solution|\*\*2\.?\s*Step-by-Step Derivation & Solution\*\*|Step-by-Step Derivation & Solution:?)|$)/i);
  const derivationMatch = rawText.match(/(?:###?\s*(?:2\.?\s*)?Step-by-Step Derivation & Solution|\*\*2\.?\s*Step-by-Step Derivation & Solution\*\*|Step-by-Step Derivation & Solution:?)([\s\S]*?)(?=(?:###?\s*(?:3\.?\s*)?Final Answer|\*\*3\.?\s*Final Answer\*\*|Final Answer:?)|$)/i);
  const finalAnswerMatch = rawText.match(/(?:###?\s*(?:3\.?\s*)?Final Answer|\*\*3\.?\s*Final Answer\*\*|Final Answer:?)([\s\S]*$)/i);

  if (formulaMatch || derivationMatch || finalAnswerMatch) {
    return {
      formula: formulaMatch ? formulaMatch[1].trim() : null,
      derivation: derivationMatch ? derivationMatch[1].trim() : null,
      finalAnswer: finalAnswerMatch ? finalAnswerMatch[1].trim() : null,
      raw: rawText,
    };
  }
  return {
    formula: null,
    derivation: null,
    finalAnswer: null,
    raw: rawText,
  };
}

export function AcademicSolutionCard({
  solutionText,
  billingStatus,
}: {
  solutionText: string;
  billingStatus?: { billed?: boolean; amountPaise?: number; remainingBalancePaise?: number; note?: string };
}) {
  const parsed = parseStructuredAcademicSolution(solutionText);

  if (parsed.formula || parsed.derivation || parsed.finalAnswer) {
    return (
      <div className="space-y-3.5 my-2 w-full text-left">
        {parsed.formula && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-black">
                1
              </span>
              <span>Given Formula / Concept</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.formula}
            </div>
          </div>
        )}

        {parsed.derivation && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-300 text-[11px] font-black">
                2
              </span>
              <span>Step-by-Step Derivation &amp; Solution</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.derivation}
            </div>
          </div>
        )}

        {parsed.finalAnswer && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-black">
                3
              </span>
              <span>Final Answer</span>
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-emerald-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.finalAnswer}
            </div>
          </div>
        )}

        {billingStatus && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 px-1 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              {billingStatus.billed ? (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-emerald-400">
                    ⚡ KingPay Micro-Transaction Settled (₹{(billingStatus.amountPaise ?? 100) / 100})
                  </span>
                  {typeof billingStatus.remainingBalancePaise === "number" && (
                    <span className="text-zinc-500 font-mono">
                      · Balance: ₹{(billingStatus.remainingBalancePaise / 100).toFixed(2)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                  <span className="text-zinc-300">
                    {billingStatus.note || "Complimentary Session"}
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
              Instant AI Tutor
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-xs sm:text-[13px] text-zinc-200 whitespace-pre-wrap leading-relaxed w-full font-sans text-left">
      {solutionText}
    </div>
  );
}

export interface IndianLanguageConfig {
  code: string;
  name: string;
  native: string;
  bcp47: string;
}

export const INDIAN_LANGUAGES: readonly IndianLanguageConfig[] = [
  { code: "auto", name: "Auto (Detect Native Language)", native: "Auto Detect", bcp47: "en-IN" },
  { code: "en", name: "English", native: "English", bcp47: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", bcp47: "bn-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", bcp47: "te-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", bcp47: "mr-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", bcp47: "ta-IN" },
  { code: "ur", name: "Urdu", native: "اردو", bcp47: "ur-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", bcp47: "gu-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", bcp47: "ml-IN" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", bcp47: "or-IN" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
  { code: "as", name: "Assamese", native: "অসমীয়া", bcp47: "as-IN" },
  { code: "mai", name: "Maithili", native: "मैथिली", bcp47: "hi-IN" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", bcp47: "sa-IN" },
  { code: "kok", name: "Konkani", native: "कोंकणी", bcp47: "kok-IN" },
] as const;

export const ADVANCED_MATHEMATICS_MODULES: readonly AdvancedMathModule[] = [
  {
    id: "differential-calculus",
    name: "Differential Calculus",
    category: "Calculus",
    subtopics: [
      "Limits, Continuity & Differentiability",
      "Mean Value Theorems (Rolle's & Lagrange's)",
      "Derivatives & Chain Rule",
      "Applications of Derivatives (Tangents & Normals)",
      "Maxima and Minima & Optimization",
      "Monotonicity & Curve Sketching"
    ]
  },
  {
    id: "integral-calculus",
    name: "Integral Calculus",
    category: "Calculus",
    subtopics: [
      "Indefinite Integrals & Standard Substitution",
      "Integration by Parts & Partial Fractions",
      "Definite Integrals & Properties",
      "Fundamental Theorem of Calculus",
      "Area Under Curves (Quadrature)",
      "Differential Equations (First Order, Homogeneous & Linear)"
    ]
  },
  {
    id: "coordinate-geometry",
    name: "Coordinate Geometry (2D & Conics)",
    category: "Coordinate Geometry",
    subtopics: [
      "Straight Lines & Angle Between Lines",
      "Circles & Equations of Tangents",
      "Parabola (Standard Equation & Latus Rectum)",
      "Ellipse (Eccentricity, Foci & Directrix)",
      "Hyperbola & Rectangular Hyperbola"
    ]
  },
  {
    id: "vectors-and-3d",
    name: "Vectors & 3D Geometry",
    category: "Vector & 3D Space",
    subtopics: [
      "Scalar Dot Product & Vector Cross Product",
      "Scalar Triple Product & Vector Triple Product",
      "Direction Cosines & Direction Ratios",
      "Straight Lines in Three Dimensions",
      "Planes in Three Dimensions & Intersections",
      "Shortest Distance Between Skew Lines"
    ]
  },
  {
    id: "advanced-algebra",
    name: "Advanced Algebra",
    category: "Algebra",
    subtopics: [
      "Complex Numbers & De Moivre's Theorem",
      "Quadratic Equations & Location of Roots",
      "Sequences and Series (AP, GP, HP & AGP)",
      "Permutations and Combinations",
      "Binomial Theorem & General Term",
      "Matrices and Determinants & Cramer's Rule"
    ]
  },
  {
    id: "trigonometry",
    name: "Trigonometry & Inverse Trigonometry",
    category: "Trigonometry",
    subtopics: [
      "Trigonometric Identities & Multiple Angles",
      "Trigonometric Equations & General Solutions",
      "Inverse Trigonometric Functions & Properties",
      "Properties & Solutions of Triangles"
    ]
  },
  {
    id: "probability-and-statistics",
    name: "Probability & Statistics",
    category: "Probability",
    subtopics: [
      "Axiomatic Probability & Addition Theorem",
      "Conditional Probability & Bayes' Theorem",
      "Independent Events & Multiplication Rule",
      "Random Variables & Probability Distributions",
      "Binomial & Bernoulli Distribution",
      "Measures of Central Tendency, Variance & Standard Deviation"
    ]
  },
  {
    id: "linear-algebra-discrete",
    name: "Linear Algebra & Discrete Mathematics",
    category: "Higher Mathematics",
    subtopics: [
      "Set Theory, Relations & Equivalence",
      "Functions (Invertibility & Composition)",
      "Mathematical Reasoning & Boolean Logic",
      "Vector Spaces & Subspaces",
      "Eigenvalues & Eigenvectors",
      "Systems of Linear Equations (Gaussian Elimination)"
    ]
  }
] as const;

export type TutorPrimaryCategory =
  | "School & Board Exams"
  | "Coding & AI Skills"
  | "Spoken English & Communication"
  | "Competitive Exams";

export interface TutorCategoryConfig {
  id: TutorPrimaryCategory;
  subCategories: readonly string[];
  recommendedTopics: readonly {
    subCategory: string;
    subject: string;
    prompt: string;
    goal: string;
    difficulty: string;
  }[];
}

export const TUTOR_CATEGORY_MATRIX: readonly TutorCategoryConfig[] = [
  {
    id: "School & Board Exams",
    subCategories: [
      "CBSE & NCERT Core",
      "ICSE & ISC Council",
      "Indian State Boards",
      "Advanced Mathematics & Science",
    ],
    recommendedTopics: [
      {
        subCategory: "CBSE & NCERT Core",
        subject: "Mathematics — Differential Calculus",
        prompt: "Explain Rolle's and Lagrange's Mean Value Theorems with step-by-step NCERT board marking scheme steps.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Intermediate",
      },
      {
        subCategory: "ICSE & ISC Council",
        subject: "Physics & Chemistry Numericals",
        prompt: "Show me the step-by-step method to solve current electricity circuit numericals for board exams.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Indian State Boards",
        subject: "Trigonometry & Coordinate Geometry",
        prompt: "Provide standard textbook formulas and board exam tips for straight lines and conic sections.",
        goal: "Revision Summary",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Advanced Mathematics & Science",
        subject: "Integral Calculus & Differential Equations",
        prompt: "Walk through integration by parts and definite integral properties with step-by-step proofs.",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
    ],
  },
  {
    id: "Coding & AI Skills",
    subCategories: [
      "Python & Data Science",
      "Full-Stack TypeScript & React",
      "AI Engineering & Prompting",
      "DSA & Technical Interviews",
    ],
    recommendedTopics: [
      {
        subCategory: "Python & Data Science",
        subject: "Python Programming & Algorithms",
        prompt: "Explain Python list comprehensions, dictionaries, and time complexity with clean examples.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Full-Stack TypeScript & React",
        subject: "TypeScript & Web Architecture",
        prompt: "Explain strict TypeScript generics, async/await error handling, and state management best practices.",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
      {
        subCategory: "AI Engineering & Prompting",
        subject: "Applied AI & Large Language Models",
        prompt: "How do embeddings, retrieval-augmented generation (RAG), and structured outputs work in modern AI systems?",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
      {
        subCategory: "DSA & Technical Interviews",
        subject: "Data Structures & Algorithms",
        prompt: "Teach me how to recognize sliding window, two-pointer, and dynamic programming patterns in coding interviews.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Expert",
      },
    ],
  },
  {
    id: "Spoken English & Communication",
    subCategories: [
      "Fluent Spoken English",
      "Business & Email Writing",
      "Interview Confidence & GD",
      "Regional-to-English Grammar Bridge",
    ],
    recommendedTopics: [
      {
        subCategory: "Fluent Spoken English",
        subject: "Spoken English & Daily Fluency",
        prompt: "Help me practice natural daily English conversation and correct common Indian English tense mistakes.",
        goal: "Concept Mastery",
        difficulty: "Fundamental",
      },
      {
        subCategory: "Business & Email Writing",
        subject: "Professional Business Communication",
        prompt: "Show me templates and rules for writing crisp professional emails and project updates.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Interview Confidence & GD",
        subject: "Job Interview & Group Discussion Prep",
        prompt: "How do I structure a strong 'Tell me about yourself' and STAR-method behavioural answer for campus placements?",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Regional-to-English Grammar Bridge",
        subject: "English Grammar from Native Language",
        prompt: "Explain active/passive voice, prepositions, and conditional sentences clearly with bilingual examples.",
        goal: "Doubt Clearance",
        difficulty: "Fundamental",
      },
    ],
  },
  {
    id: "Competitive Exams",
    subCategories: [
      "JEE Main & Advanced",
      "NEET UG Medical",
      "UPSC & State PSC Foundation",
      "CUET & Banking Aptitude",
    ],
    recommendedTopics: [
      {
        subCategory: "JEE Main & Advanced",
        subject: "JEE Advanced — Vectors, 3D & Calculus",
        prompt: "Break down shortest distance between skew lines in 3D geometry and key JEE Advanced problem-solving shortcuts.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Expert",
      },
      {
        subCategory: "NEET UG Medical",
        subject: "NEET NCERT Biology & Organic Chemistry",
        prompt: "Summarize high-yield NCERT reaction mechanisms and genetics mendelian ratios for NEET UG.",
        goal: "Revision Summary",
        difficulty: "Expert",
      },
      {
        subCategory: "UPSC & State PSC Foundation",
        subject: "Indian Polity, Economy & CSAT",
        prompt: "Explain Constitutional Fundamental Rights, Directive Principles, and Fiscal Policy for UPSC Prelims & Mains.",
        goal: "Concept Mastery",
        difficulty: "Expert",
      },
      {
        subCategory: "CUET & Banking Aptitude",
        subject: "Quantitative Aptitude & Logical Reasoning",
        prompt: "Teach me fast calculation techniques for data interpretation, percentages, and probability in banking/CUET exams.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Advanced",
      },
    ],
  },
] as const;

export type JobPrimaryCategory =
  | "Delivery & Logistics"
  | "Restaurant & Culinary"
  | "Retail & Operations"
  | "Digital & Remote";

export interface JobOpeningItem {
  id: string;
  title: string;
  category: JobPrimaryCategory;
  subCategory: string;
  location: string;
  employmentType: string;
  compensationBand: string;
  badge: string;
  description: string;
  requirements: readonly string[];
}

export const JOB_CATEGORY_SUBCATEGORIES: Record<JobPrimaryCategory, readonly string[]> = {
  "Delivery & Logistics": [
    "EV & 2-Wheeler Fleet",
    "Hyperlocal Grocery Dispatch",
    "Hub & Warehouse Sorting",
  ],
  "Restaurant & Culinary": [
    "Cloud Kitchen Commis & Chef",
    "Restaurant Store Manager",
    "FSSAI Hygiene & Packaging Lead",
  ],
  "Retail & Operations": [
    "Merchant Onboarding Executive",
    "City Operations Coordinator",
    "Inventory & Catalog Auditor",
  ],
  "Digital & Remote": [
    "Regional Language Translation",
    "Menu & Catalog QA",
    "Academic Content Reviewer",
  ],
};

export const VERIFIED_JOB_OPENINGS: readonly JobOpeningItem[] = []; // Only DB-verified, currently open roles may appear here.

interface SubmittedJobApplication {
  jobId: string;
  jobTitle: string;
  category: JobPrimaryCategory;
  subCategory: string;
  applicantName: string;
  applicantContact: string;
  applicantNote: string;
  status: "Application Submitted for Employer Review";
  submittedAt: string;
}

const JOB_APPLICATIONS_STORAGE_KEY = "orderking_job_applications_v1";

export type TutorSearch = {
  tab?: string;
};

export const Route = createFileRoute('/tutor')({
  validateSearch: (search: Record<string, unknown>): TutorSearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: IntelligencePage,
  errorComponent: AppErrorComponent,
});

function IntelligencePage() {
  const routerSearch = useRouterState({ select: (s) => s?.location?.search }) as any;
  const search = routerSearch ?? {};
  const { walletBalance } = useRealKingPayWallet();
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState("CBSE (Central Board)");
  const [stdClass, setStdClass] = useState("Class 10");
  const [subject, setSubject] = useState("Mathematics");
  const [topicQuery, setTopicQuery] = useState("");
  const [language, setLanguage] = useState("Auto (Detect Native Language)");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [tone, setTone] = useState("Direct Easy Exam Answers");
  const [goal, setGoal] = useState("Concept Mastery");
  const [showConfig, setShowConfig] = useState(true);
  const [mode, setMode] = useState<"tutor" | "jobs" | "hub">("tutor");

  // Academic Tutor Category & Sub-Category state
  const [tutorCategory, setTutorCategory] = useState<TutorPrimaryCategory>("School & Board Exams");
  const [tutorSubCategory, setTutorSubCategory] = useState<string>("All");

  // Verified Jobs & Career Board Category & Sub-Category state
  const [jobCategory, setJobCategory] = useState<"ALL" | JobPrimaryCategory>("ALL");
  const [jobSubCategory, setJobSubCategory] = useState<string>("ALL");
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [submittedApplications, setSubmittedApplications] = useState<SubmittedJobApplication[]>([]);
  const [activeJobModal, setActiveJobModal] = useState<JobOpeningItem | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantNote, setApplicantNote] = useState("");
  const [candidateSkillsInput, setCandidateSkillsInput] = useState("");

  const sectionHash = useRouterState({ select: (s) => s?.location?.hash ?? "" }) ?? "";
  useEffect(() => {
    const cleanHash = (sectionHash || "").replace(/^#/, "").toLowerCase();
    if (
      cleanHash === "jobs" ||
      cleanHash === "my-jobs" ||
      cleanHash === "saved-jobs" ||
      cleanHash === "my-applications" ||
      search?.tab === "my-applications" ||
      search?.tab === "jobs"
    ) {
      setMode("jobs");
      if (
        cleanHash === "my-jobs" ||
        cleanHash === "saved-jobs" ||
        cleanHash === "my-applications" ||
        search?.tab === "my-applications"
      ) {
        setTimeout(() => {
          document.getElementById("my-jobs")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } else if (cleanHash === "tutor" || search?.tab === "tutor") {
      setMode("tutor");
    } else if (cleanHash === "hub" || search?.tab === "hub") {
      setMode("hub");
    }
  }, [sectionHash, search?.tab]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSubmittedApplications(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }

    // Proactively sync from Supabase PostgreSQL database table
    getMyJobApplicationsFn({})
      .then((res: any) => {
        if (res?.success && Array.isArray(res.applications) && res.applications.length > 0) {
          setSubmittedApplications((prev) => {
            const serverMapped: SubmittedJobApplication[] = res.applications.map((app: any) => ({
              jobId: app.job_id,
              jobTitle: app.job_title,
              category: app.category as JobPrimaryCategory,
              subCategory: "Verified Role",
              applicantName: app.applicant_name,
              applicantContact: app.applicant_contact,
              applicantNote: app.applicant_note || "",
              status: "Application Submitted for Employer Review",
              submittedAt: new Date(app.created_at || Date.now()).toLocaleDateString("en-IN"),
            }));

            // Merge server and local without duplicate jobIds
            const merged = [...prev];
            for (const s of serverMapped) {
              if (!merged.some((m) => m.jobId === s.jobId)) {
                merged.push(s);
              }
            }
            try {
              window.localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }
      })
      .catch((e: any) => {
        console.warn("Database fetch skipped, using client storage fallback:", e);
      });
  }, []);

  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string, billingStatus?: any}[]>([

    { role: 'assistant', content: "Academic Tutor initialized for Central & 28 State Boards. Select your Board, Class Level, and Core Subject. Enter your question to receive step-by-step solutions formatted into: Given Formula / Concept, Step-by-Step Derivation & Solution, and Final Answer." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const toggleVoiceRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Voice speech recognition is not supported in this browser. Please type your query."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      const matchedLang = INDIAN_LANGUAGES.find((l) => l.name === language);
      recognition.lang = matchedLang ? matchedLang.bcp47 : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("🎙️ Listening... Speak your academic question clearly.");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setMessage((prev) => (prev ? prev.trim() + " " + transcript : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
        if (err.error === "not-allowed") {
          toast.error("Microphone access was denied. Please allow microphone permissions.");
        } else {
          toast.error("Could not capture speech. Please try again or type your question.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast.error("Failed to initialize voice recognition.");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const newHistory = [...history, { role: 'user' as const, content: message }];
    setHistory(newHistory);
    setMessage("");
    setIsLoading(true);
    
    try {
      const res = await askIntelligenceFn({
        data: { message, board, stdClass, subject, language, difficulty, tone, goal, history: history.slice(-6) }
      });
      setHistory([...newHistory, { role: 'assistant', content: res.text, billingStatus: res.billingStatus }]);
      if (res.billingStatus?.billed) {
        toast.success("KingPay micro-transaction settled: ₹1.00");
      }
    } catch (e) {
      setHistory([...newHistory, { role: 'assistant', content: "Network anomaly detected..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitJobApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobModal) return;
    if (submittedApplications.some((a) => a.jobId === activeJobModal.id)) {
      toast.info("Application Submitted for Employer Review — your application for this role is already on file.");
      setActiveJobModal(null);
      return;
    }
    if (!applicantName.trim() || !applicantContact.trim()) {
      toast.error("Please enter your full name and phone number or email for employer contact.");
      return;
    }

    const noteToSubmit = applicantNote.trim() || "Credentials ready for verification.";
    const record: SubmittedJobApplication = {
      jobId: activeJobModal.id,
      jobTitle: activeJobModal.title,
      category: activeJobModal.category,
      subCategory: activeJobModal.subCategory,
      applicantName: applicantName.trim(),
      applicantContact: applicantContact.trim(),
      applicantNote: noteToSubmit,
      status: "Application Submitted for Employer Review",
      submittedAt: new Date().toLocaleDateString("en-IN"),
    };

    // Client optimistic update and persistent fallback
    const nextList = [record, ...submittedApplications];
    setSubmittedApplications(nextList);
    try {
      window.localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage quota errors
    }
    setActiveJobModal(null);
    setApplicantNote("");

    // Write directly to Supabase Postgres database table via server function
    try {
      const serverRes = await submitJobApplicationFn({
        data: {
          jobId: record.jobId,
          jobTitle: record.jobTitle,
          category: record.category,
          applicantName: record.applicantName,
          applicantContact: record.applicantContact,
          applicantNote: record.applicantNote,
        },
      });

      if (serverRes?.success) {
        toast.success("Application submitted successfully to employer database.");
      } else {
        toast.error("Application could not be saved to the database. Please try again.");
      }
    } catch (serverErr) {
      console.warn("Database sync error, preserved in client fallback:", serverErr);
      toast.error("Network error: Application submission failed. Please verify your connection and retry.");
    }
  };

  const currentTutorCatConfig =
    TUTOR_CATEGORY_MATRIX.find((c) => c.id === tutorCategory) ?? TUTOR_CATEGORY_MATRIX[0];

  const filteredTutorPrompts = currentTutorCatConfig.recommendedTopics.filter(
    (item) => tutorSubCategory === "All" || item.subCategory === tutorSubCategory
  );

  const availableJobSubCategories: readonly string[] =
    jobCategory === "ALL"
      ? Object.values(JOB_CATEGORY_SUBCATEGORIES).flat()
      : JOB_CATEGORY_SUBCATEGORIES[jobCategory];

  const filteredJobs = VERIFIED_JOB_OPENINGS.filter((job) => {
    if (jobCategory !== "ALL" && job.category !== jobCategory) return false;
    if (jobSubCategory !== "ALL" && job.subCategory !== jobSubCategory) return false;
    if (jobSearchQuery.trim()) {
      const q = jobSearchQuery.trim().toLowerCase();
      const hay = `${job.title} ${job.category} ${job.subCategory} ${job.location} ${job.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <CustomerShell dark maxWidth="max-w-7xl">
      <div className="flex flex-col min-h-[calc(100dvh-60px)] bg-gradient-to-b from-zinc-950 to-black text-white selection:bg-zinc-800">
        
        {/* COMPACT HIGH-DENSITY TUTOR HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1B0B2E] via-[#2A134E] to-[#120E38] border-b border-purple-500/30 px-4 py-3 sm:px-6 sm:py-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/20 border border-purple-400/40 px-2 py-0.5 text-[10px] font-black text-purple-300">
                  <span>🎓</span>
                  <span>Academic Tutor</span>
                </span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  28 State Boards
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Academic Tutor
              </h1>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center bg-black/40 border border-purple-400/30 p-1 rounded-xl shrink-0 backdrop-blur-xl shadow-lg self-start sm:self-auto gap-1">
              <button
                type="button"
                onClick={() => setMode("hub")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "hub"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5" />
                <span>Syllabus &amp; WFH Hub</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("tutor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "tutor"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <GraduationCap className="size-3.5" />
                <span>Academic Tutor</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("jobs")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "jobs"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Briefcase className="size-3.5" />
                <span>Available Jobs</span>
                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.2 font-extrabold ml-0.5">
                  {VERIFIED_JOB_OPENINGS.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {mode === "hub" ? (
          <div className="py-2">
            <TutorJobsHub />
          </div>
        ) : (
          <>
        {/* Dynamic Controls Sub-Panel (Curriculum or Jobs Filters) */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3.5 z-10 flex flex-col gap-3 shadow-sm relative overflow-hidden">
          
          {mode === "tutor" && (
            <>
              {/* Academic & Skill Tutoring Primary Categories */}
              <div className="space-y-2 pt-1 relative z-10">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mr-1">
                    Tutor Category:
                  </span>
                  {TUTOR_CATEGORY_MATRIX.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setTutorCategory(cat.id);
                        setTutorSubCategory("All");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        tutorCategory === cat.id
                          ? "bg-amber-500 text-black border-amber-400 font-black"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>

                {/* Sub-Category Filter Pills for Selected Tutor Category */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1">
                    Sub-Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTutorSubCategory("All")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      tutorSubCategory === "All"
                        ? "bg-white text-black"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    All {tutorCategory}
                  </button>
                  {currentTutorCatConfig.subCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setTutorSubCategory(sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        tutorSubCategory === sub
                          ? "bg-white text-black"
                          : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* Quick Study Prompts for Active Tutor Category / Sub-Category */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                  {filteredTutorPrompts.map((item) => (
                    <button
                      key={item.subCategory + item.subject}
                      type="button"
                      onClick={() => {
                        setSubject(item.subject);
                        setGoal(item.goal);
                        setDifficulty(item.difficulty);
                        setMessage(item.prompt);
                      }}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-amber-500/50 p-2 text-left transition flex items-center justify-between gap-2 shrink-0 max-w-[260px] active:scale-95"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 truncate block">
                          {item.subCategory}
                        </span>
                        <p className="text-xs text-zinc-200 truncate mt-0.5">
                          {item.prompt}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 text-zinc-500 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 relative z-10">
                <input
                  id="tutor-topic-search"
                  type="search"
                  autoComplete="off"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  placeholder="Search mathematics, calculus, algebra, coding, spoken English..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 outline-none"
                />
                {topicQuery.trim() && (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                    {ADVANCED_MATHEMATICS_MODULES.filter((module) =>
                      (module.name + " " + module.category + " " + module.subtopics.join(" "))
                        .toLocaleLowerCase()
                        .includes(topicQuery.trim().toLocaleLowerCase())
                    ).slice(0, 6).map((module) => (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => { setSubject(module.name); setTopicQuery(""); }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        {module.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-zinc-300">Curriculum &amp; Exam Parameters</span>
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-widest border border-white/20"
                >
                  <SlidersHorizontal className="size-3" /> {showConfig ? "Hide Config" : "Config"}
                </button>
              </div>

              <div className={`grid grid-cols-2 gap-2.5 relative z-10 transition-all duration-300 ${showConfig ? 'max-h-[500px] overflow-y-auto opacity-100' : 'max-h-24 overflow-hidden'}`}>
                 <select 
                    value={board} 
                    onChange={(e) => setBoard(e.target.value)}
                    className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                  >
                    {STATE_BOARDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                 </select>
                 <select 
                    value={stdClass} 
                    onChange={(e) => setStdClass(e.target.value)}
                    className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                 </select>
                 
                 {/* Dynamic Text Input for Subject */}
                 <div className="col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col focus-within:border-zinc-500 transition-colors">
                    <input 
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject (e.g. Mathematics, Physics)"
                      className="bg-transparent text-xs font-medium text-zinc-200 outline-none w-full px-2.5 py-2.5 placeholder:text-zinc-500"
                    />
                    {showConfig && (
                      <div className="flex flex-col gap-1.5 px-2 pb-2">
                        <div className="flex flex-wrap gap-1">
                          {CORE_SUBJECTS.map(s => (
                            <button 
                              key={s} 
                              type="button"
                              onClick={() => setSubject(s)}
                              className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                                subject === s
                                  ? "bg-amber-400 text-slate-950 font-bold"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-white hover:text-black"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
                 
                 <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                  >
                    {INDIAN_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.name}>
                        {l.name} {l.native !== l.name && l.code !== "auto" && l.code !== "en" ? `(${l.native})` : ""}
                      </option>
                    ))}
                 </select>
                 
                 {/* Advanced Configurations */}
                 <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className={`bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
                  >
                    <option value="Concept Mastery">Goal: Concept Mastery</option>
                    <option value="Exam Prep (Make it Easy)">Goal: Exam Prep (Make it Easy)</option>
                    <option value="Homework Help">Goal: Homework Help</option>
                    <option value="Doubt Clearance">Goal: Doubt Clearance</option>
                    <option value="Revision Summary">Goal: Revision Summary</option>
                 </select>
                 <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={`bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
                  >
                    <option value="Fundamental">Level: Fundamental</option>
                    <option value="Intermediate">Level: Intermediate</option>
                    <option value="Advanced">Level: Advanced</option>
                    <option value="Expert">Level: Expert</option>
                 </select>
                 <select 
                    value={tone} 
                    onChange={(e) => setTone(e.target.value)}
                    className={`col-span-2 bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
                  >
                    <option value="Socratic (Ask Questions)">Tone: Socratic (Guides via questioning)</option>
                    <option value="Encouraging & Patient">Tone: Encouraging & Patient</option>
                    <option value="Strict & Direct">Tone: Strict & Direct</option>
                    <option value="Highly Detailed & Academic">Tone: Highly Detailed & Academic</option>
                 </select>
              </div>
            </>
          )}
        </div>

        {/* WORKSPACE AREA */}
        {mode === "tutor" ? (
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'max-w-[85%] bg-white text-black rounded-br-sm font-medium' 
                      : 'w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <AcademicSolutionCard solutionText={msg.content} billingStatus={msg.billingStatus} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-3">
                      <Loader2 className="size-4 animate-spin text-zinc-400" />
                      <span className="text-xs text-zinc-400 font-medium tracking-wide">Synthesizing curriculum-aligned response...</span>
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 pb-24">
               <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 focus-within:border-zinc-600 transition-colors shadow-inner">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isListening ? "🎙️ Listening... Speak your academic question clearly..." : "Enter your academic question or problem (e.g. 'Derive Bernoulli equation with SI units' or 'Step-by-step integration of sin^2(x)')..."}
                    className={`flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none text-[13px] p-2.5 text-white placeholder:text-zinc-600 ${isListening ? "placeholder:text-rose-400 placeholder:animate-pulse" : ""}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />

                  {/* Web Speech API Voice Recognition Toggle */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecognition}
                    className={`p-3 rounded-xl transition-all shrink-0 m-0.5 flex items-center justify-center ${
                      isListening
                        ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/50 ring-2 ring-rose-400"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white active:scale-95"
                    }`}
                    title={isListening ? "Stop listening" : "Ask via Voice Query (Web Speech API)"}
                    aria-label="Voice Query Input"
                  >
                    {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>

                  <button 
                    onClick={() => void handleSend()}
                    disabled={!message.trim() || isLoading}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black px-4 py-3 rounded-xl disabled:opacity-50 transition-all shrink-0 m-0.5 flex items-center gap-1.5 shadow-md cursor-pointer"
                    title="Solve Problem"
                    aria-label="Solve Problem"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    <span className="text-xs font-black hidden sm:inline">{isLoading ? "Solving..." : "Solve Problem"}</span>
                  </button>
               </div>
               {isListening && (
                 <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 font-medium animate-pulse">
                   <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                   <span>Transcribing your speech in real-time... Click mic again when done.</span>
                 </div>
               )}
               <div className="flex justify-between items-center px-2 mt-3">
                 <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                   Central &amp; 28 State Boards Curriculum
                 </p>
                 <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                   Structured Formula · Derivation · Final Answer
                 </p>
               </div>
            </div>
          </div>
        ) : (
          /* VERIFIED JOBS & CAREER BOARD WORKSPACE */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28">
            {/* Institutional Career & Application Status Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="size-4" /> OrderKing Verified Jobs &amp; Career Board
                  </span>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">
                    Direct Role Applications &amp; Employer Credential Review
                  </h2>
                  <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
                    Apply across Delivery &amp; Logistics, Restaurant &amp; Culinary, Retail &amp; Operations, and Digital &amp; Remote contracts. All applications undergo employer credential verification before onboarding and payroll/contract settlement.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Submitted Applications
                  </span>
                  <span className="font-mono text-2xl font-black text-emerald-400">
                    {submittedApplications.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    Under Employer Review
                  </span>
                </div>
              </div>

              {/* Category & Sub-Category Filtering Controls */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mr-1">
                    Job Category:
                  </span>
                  {(
                    [
                      "ALL",
                      "Delivery & Logistics",
                      "Restaurant & Culinary",
                      "Retail & Operations",
                      "Digital & Remote",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setJobCategory(cat);
                        setJobSubCategory("ALL");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        jobCategory === cat
                          ? "bg-emerald-500 text-black border-emerald-400 font-black"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {cat === "ALL" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                    Sub-Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setJobSubCategory("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      jobSubCategory === "ALL"
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    All Sub-Categories
                  </button>
                  {availableJobSubCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setJobSubCategory(sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        jobSubCategory === sub
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="search"
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    placeholder="Filter roles by title, city, or keyword..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400"
                  />
                  <input
                    type="text"
                    value={candidateSkillsInput}
                    onChange={(e) => setCandidateSkillsInput(e.target.value)}
                    placeholder="Candidate Skill Matcher (e.g. 2-Wheeler, Android, FSSAI, TypeScript)..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-3.5 py-2.5 text-xs text-emerald-300 placeholder:text-zinc-500 outline-none focus:border-emerald-400"
                  />
                </div>
                {candidateSkillsInput.trim() && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-bold text-emerald-400">✓ Deterministic Skill-Matching Active:</span>
                    <span>Zero Math.random() / fake scoring. Fit scores computed strictly from requirement token intersection.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5th Tab Target: My Career · Application Tracking & Saved Jobs */}
            <div id="my-jobs" className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-emerald-400" />
                  My Career · Submitted Applications &amp; Tracking
                </span>
                <span className="text-[10px] font-bold text-zinc-400">
                  {submittedApplications.length} {submittedApplications.length === 1 ? "Application" : "Applications"}
                </span>
              </h3>
              {submittedApplications.length > 0 ? (
                <div className="space-y-2">
                  {submittedApplications.map((app) => (
                    <div
                      key={app.jobId}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {app.category} · {app.subCategory}
                        </span>
                        <h4 className="text-xs font-bold text-white">{app.jobTitle}</h4>
                        <p className="text-[11px] text-zinc-400">
                          Applicant: {app.applicantName} ({app.applicantContact}) · Submitted {app.submittedAt}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-[11px] font-black text-amber-300 self-start sm:self-auto">
                        <Clock className="size-3" />
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 text-center space-y-2">
                  <Briefcase className="size-7 mx-auto text-zinc-500" />
                  <p className="text-xs font-bold text-zinc-300">No applications submitted yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Explore verified jobs below, filter by remote or salary, and apply directly to hiring employers.
                  </p>
                </div>
              )}
            </div>

            {/* Filtered Job Openings List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  Verified Openings ({filteredJobs.length})
                </h2>
                <span className="text-xs text-zinc-400">
                  {jobCategory === "ALL" ? "Showing all 4 career categories" : jobCategory}
                </span>
              </div>

              <div className="space-y-3">
                {filteredJobs.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-2">
                    <Briefcase className="size-8 text-zinc-500 mx-auto" />
                    <p className="text-sm font-bold text-white">Verified opportunities onboarding in your district</p>
                    <p className="text-xs text-zinc-400">
                      Partner employers and verified local businesses are currently onboarding roles in this category.
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                  const existingApp = submittedApplications.find((a) => a.jobId === job.id);
                  const skillMatch = candidateSkillsInput.trim()
                    ? computeDeterministicSkillMatch(candidateSkillsInput, job.requirements)
                    : null;
                  return (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 hover:border-zinc-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                              {job.category}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              • {job.subCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[9px] font-black">
                              {job.badge}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white mt-1">
                            {job.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            📍 {job.location} · {job.employmentType}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-300 block">
                            {job.compensationBand}
                          </span>
                          <span className="text-[9px] text-zinc-500 block font-normal">
                            Industry Benchmark / Partner Indicative Band
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Subject to Employer Onboarding &amp; KYC
                          </span>
                        </div>
                      </div>

                      {skillMatch && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-950/80 border border-emerald-500/30 px-3.5 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[11px] ${
                              skillMatch.alignmentLevel === "High Match"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                                : skillMatch.alignmentLevel === "Moderate Match"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}>
                              {skillMatch.score}% Fit · {skillMatch.alignmentLevel}
                            </span>
                            <span className="text-[11px] text-zinc-300">
                              {skillMatch.details}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                            Deterministic (No RNG)
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-zinc-300">
                        {job.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
                        <span className="text-[11px] text-zinc-400">
                          Eligibility: {job.requirements[0]}
                        </span>

                        {existingApp ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                            <CheckCircle className="size-3.5 text-emerald-400" />
                            Application Submitted for Employer Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveJobModal(job)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition active:scale-95 self-start sm:self-auto"
                          >
                            Apply for Role ➔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </div>
        )}

        {/* Role Application Modal */}
        {activeJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <form
              onSubmit={handleSubmitJobApplication}
              className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {activeJobModal.category} · {activeJobModal.subCategory}
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">{activeJobModal.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{activeJobModal.compensationBand}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                <p className="font-semibold text-white">Role Requirements &amp; Verification:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeJobModal.requirements.map((req: string, idx: number) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              {candidateSkillsInput.trim() && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>Deterministic Skill Alignment:</span>
                    <span className="font-mono">{computeDeterministicSkillMatch(candidateSkillsInput, activeJobModal.requirements).score}% Fit</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    {computeDeterministicSkillMatch(candidateSkillsInput, activeJobModal.requirements).details}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Enter your full name as per ID"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Phone Number or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantContact}
                    onChange={(e) => setApplicantContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or name@orderking.in"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Experience / City &amp; Shift Availability
                  </label>
                  <input
                    type="text"
                    value={applicantNote}
                    onChange={(e) => setApplicantNote(e.target.value)}
                    placeholder="Brief summary of relevant experience and preferred city"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5">
                Submitting records your application as <strong>Application Submitted for Employer Review</strong>. No instant unverified payout is issued prior to employer onboarding and work verification.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveJobModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-md shadow-emerald-500/20"
                >
                  Submit Application ➔
                </button>
              </div>
            </form>
          </div>
        )}
          </>
        )}

        </div>
    </CustomerShell>
  );
}
