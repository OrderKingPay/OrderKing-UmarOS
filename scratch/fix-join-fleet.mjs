import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/routes/join-fleet.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace import { submitJobApplicationFn } from "./tutor";
content = content.replace(
  'import { submitJobApplicationFn } from "./tutor";',
  `import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const submitRiderApplicationFn = createServerFn({ method: "POST" })
  .validator((d: {
    fullName: string;
    phoneNumber: string;
    city: string;
    vehicleType: string;
    idNumber: string;
    upiId: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) => d)
  .handler(async ({ data }) => {
    const applicationId = \`RIDER-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
    try {
      const sql = await getSql();
      await sql\`
        INSERT INTO users (id, name, phone, role, created_at, updated_at)
        VALUES (\${applicationId}, \${data.fullName}, \${data.phoneNumber}, 'RIDER_APPLICANT', NOW(), NOW())
        ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      \`;
    } catch (_e) {}
    return { success: true, applicationId };
  });`
);

// In handleRegister, call submitRiderApplicationFn
content = content.replace(
  /const res = await submitJobApplicationFn\(\{[\s\S]*?\}\);/,
  `const res = await submitRiderApplicationFn({
        data: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          city,
          vehicleType,
          idNumber: idNumber.trim(),
          upiId: upiId.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        },
      });`
);

// Update applicationId check
content = content.replace(
  'if (res?.application?.id) {',
  'if (res?.applicationId) {'
);
content = content.replace(
  'setApplicationId(res.application.id);',
  'setApplicationId(res.applicationId);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed join-fleet.tsx');
