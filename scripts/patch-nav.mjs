import fs from "node:fs";

const path = "orderking-customers/src/components/navigation/floating-bottom-nav.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  '{ id: "vault", label: "Wallet", to: "/wallet" }',
  '{ id: "vault", label: "Wallet", to: "/kingpay-wallet" }'
);
content = content.replace(
  '{ id: "ledger", label: "Passbook", to: "/earn" }',
  '{ id: "ledger", label: "Passbook", to: "/kingpay/passbook" }'
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated navigation tabs successfully.");
