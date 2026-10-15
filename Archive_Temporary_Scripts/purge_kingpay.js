
const fs = require("fs");
const path = "orderking-customers/src/routes/king-pay.tsx";
let content = fs.readFileSync(path, "utf8");

// Remove all fintech hubs
content = content.replace(/<VehicleGarageHub[^>]*\/>/g, "");
content = content.replace(/<TravelBookingHub[^>]*\/>/g, "");
content = content.replace(/<MicroLoanHub[^>]*\/>/g, "");
content = content.replace(/<KingPayAccountHub[^>]*\/>/g, "");

fs.writeFileSync(path, content, "utf8");
console.log("Purged fintech hubs from kingpay");

