
const fs = require("fs");
const path = "orderking-customers/src/components/market/location-dialog.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /return \([\s\S]*?<Dialog.Title className="font-display text-2xl">\{t\("location\.title"\)\}<\/Dialog\.Title>[\s\S]*?<p className="mt-1 text-sm text-muted">\{t\("location\.simulatedPin"\)\}<\/p>[\s\S]*?<Button variant="outline" className="mt-4 w-full" onClick=\{\(\) => void useGeo\(\)\} disabled=\{locating\}>[\s\S]*?\{locating \? t\("location\.locating"\) : t\("location\.useCurrent"\)\}[\s\S]*?<\/Button>/,
  `return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/40 backdrop-blur-sm transition-all" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-auto md:left-1/2 md:top-1/2 md:w-[28rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
          <Dialog.Title className="font-display text-2xl font-bold tracking-tight text-fg">{t("location.title")}</Dialog.Title>
          <p className="mt-1 text-sm text-muted-foreground">Select your delivery location for accurate pricing and ETA.</p>
          <Button className="mt-6 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg text-md rounded-xl font-bold transition-transform active:scale-95" onClick={() => void useGeo()} disabled={locating}>
            📍 {locating ? "Locating you..." : "Use Current Location"}
          </Button>
          
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">or choose zone</span>
            <div className="flex-grow border-t border-border"></div>
          </div>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");

