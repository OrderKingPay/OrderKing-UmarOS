import fs from "fs";

let p = "orderking-riders/src/lib/server/sms-gateway.ts";
let f = fs.readFileSync(p, "utf8");

f = f.replace(
  `: \`https://2factor.in/API/V1/\${encodeURIComponent(cleanKey)}/SMS/+91\${cleanPhone}/AUTOGEN\`;`,
  `: \`https://2factor.in/v1/API/V1/\${encodeURIComponent(cleanKey)}/SMS/\${cleanPhone}/\${otp}/AUTOGEN\`;`
);

fs.writeFileSync(p, f, "utf8");
console.log("Updated 2factor URL successfully");
