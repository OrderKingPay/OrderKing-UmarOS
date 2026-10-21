const fs = require('fs');
const filePath = 'orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `import { 
  askIntelligenceFn, 
  submitJobApplicationFn, 
  ALL_INDIAN_BOARDS, 
  CORE_SUBJECTS, 
  CLASS_LEVELS, 
  AcademicSolutionCard 
} from "@/routes/tutor";`;

const replacement = `import { 
  askIntelligenceFn, 
  submitJobApplicationFn 
} from "@/routes/tutor";
import { 
  ALL_INDIAN_BOARDS, 
  CORE_SUBJECTS, 
  CLASS_LEVELS, 
  AcademicSolutionCard 
} from "@/lib/tutor/tutor-constants";`;

if (content.includes('from "@/routes/tutor"') && content.includes('ALL_INDIAN_BOARDS')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated tutor imports in supreme-kingpay-experience.tsx');
} else {
  console.log('Target import not found or already replaced');
}
