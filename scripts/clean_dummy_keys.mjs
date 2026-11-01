import fs from "fs";

function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");
  const orig = content;
  content = content.replaceAll(' || "bae2bf50-d3d4-11f1-ac3e-0200cd936042"', "");
  content = content.replaceAll('"bae2bf50-d3d4-11f1-ac3e-0200cd936042"', '""');
  if (content !== orig) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Cleaned dummy keys from: ${filePath}`);
  }
}

cleanFile("orderking-riders/src/lib/server/sms-gateway.ts");
cleanFile("orderking-riders/src/lib/server/rider-fns.ts");
cleanFile("orderking-partners/src/lib/server/sms-gateway.ts");
cleanFile("orderking-customers/src/lib/server/sms-gateway.ts");
cleanFile("orderking-customers/src/lib/server/phone-auth.ts");
cleanFile("HDmaster/src/lib/server/sms-gateway.ts");
cleanFile("HDmaster/src/lib/server/phone-auth.ts");
