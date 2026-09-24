const fs = require('fs');
let c = fs.readFileSync('C:/Users/hasan/OrderKing/orderking-customers--orders-/src/components/fintech/travel-booking-hub.tsx', 'utf8');
c = c.replace(
  'const [activeTab, setActiveTab] = useState<"flights" | "trains" | "buses" | "cabs">("flights");',
  `const [activeTab, setActiveTab] = useState<"flights" | "trains" | "buses" | "cabs">("flights");

  if (!import.meta.env.VITE_AMADEUS_API_KEY && !import.meta.env.VITE_IRCTC_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Integration Not Configured</h2>
        <p className="text-muted-foreground max-w-md">
          The Travel & Transit Booking Engine requires genuine Amadeus and IRCTC API keys. Please configure these in your environment variables.
        </p>
      </div>
    );
  }`
);
fs.writeFileSync('C:/Users/hasan/OrderKing/orderking-customers--orders-/src/components/fintech/travel-booking-hub.tsx', c, 'utf8');
