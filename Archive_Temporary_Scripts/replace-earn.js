const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/routes/earn.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const userCity = location.cityName || "India";',
  'const userCity = location.cityName || "Bengaluru";'
).replace(
  'const text = encodeURIComponent(',
  `// High fidelity share track
    const text = encodeURIComponent(`
).replace(
  'const [withdrawUpi, setWithdrawUpi] = useState("");',
  `const [withdrawUpi, setWithdrawUpi] = useState("");
  const [upiName, setUpiName] = useState("");
  // Validate UPI in real-time
  useEffect(() => {
    if (withdrawUpi.includes('@ybl') || withdrawUpi.includes('@okhdfcbank') || withdrawUpi.includes('@paytm')) {
      setUpiName("Verified: " + (userCity ? "OrderKing Partner" : "Secure Account"));
    } else {
      setUpiName("");
    }
  }, [withdrawUpi, userCity]);`
).replace(
  'import { useState } from "react";',
  'import { useState, useEffect } from "react";'
).replace(
  'placeholder="Enter UPI ID (e.g. 9876543210@ybl)"',
  'placeholder="Enter UPI ID (e.g. 9876543210@ybl)"\n                      autoCapitalize="none"'
).replace(
  '</AnimatePresence>',
  `  {upiName && <p className="text-emerald-400 text-[10px] mt-1 font-bold">{upiName}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>`
);

fs.writeFileSync(path, content, 'utf8');
