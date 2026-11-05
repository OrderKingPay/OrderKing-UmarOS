const fs = require('fs');
const path = require('path');

function replaceNormalize(str, target, replacement) {
  // Normalize both CRLF and LF to match
  const normStr = str.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');

  if (!normStr.includes(normTarget)) {
    return null;
  }
  const replaced = normStr.replace(normTarget, normReplacement);
  // Restore CRLF if original had CRLF
  return str.includes('\r\n') ? replaced.replace(/\n/g, '\r\n') : replaced;
}

// 1. Wire Partner order-card.tsx
const orderCardPath = path.join(__dirname, '..', 'orderking-partners', 'src', 'components', 'order-card.tsx');
let orderCard = fs.readFileSync(orderCardPath, 'utf8');

if (!orderCard.includes('quadPartySyncClient')) {
  const importTarget = 'import { toast } from "sonner";';
  const importReplacement = 'import { toast } from "sonner";\nimport { quadPartySyncClient } from "@orderking/ui";';
  let res = replaceNormalize(orderCard, importTarget, importReplacement);
  if (res) orderCard = res;

  const targetCode = `      await transitionOrderViaHDmaster({
        data: {
          restaurantId,
          orderId: order.id,
          action,
          reason: action === "reject" ? chosenReason : undefined,
          prepMinutes: action === "accept" ? effectivePrep : undefined,
          idempotencyKey,
        },
      });`;

  const replacementCode = `      await transitionOrderViaHDmaster({
        data: {
          restaurantId,
          orderId: order.id,
          action,
          reason: action === "reject" ? chosenReason : undefined,
          prepMinutes: action === "accept" ? effectivePrep : undefined,
          idempotencyKey,
        },
      });

      // Broadcast sub-second quad-party state transition to Customer, Rider Fleet & Umar OS
      const eventName =
        action === "accept"
          ? "ORDER_ACCEPTED"
          : action === "preparing"
          ? "ORDER_PREPARING"
          : action === "ready"
          ? "ORDER_READY"
          : "ORDER_REJECTED";
      const statusMap: Record<string, any> = {
        accept: "ACCEPTED",
        preparing: "PREPARING",
        ready: "READY",
        reject: "REJECTED",
      };

      void quadPartySyncClient.broadcastTransition({
        orderId: order.id,
        event: eventName,
        status: statusMap[action] || "ACCEPTED",
        previousStatus: (order.state?.toUpperCase() as any) || "PLACED",
        restaurantId: restaurantId || "",
        prepMinutes: action === "accept" ? effectivePrep : order.prepMinutes,
        totalPaise: order.prices?.customerTotalPaise,
        idempotencyKey,
        actorRole: "partner_kds",
      });`;

  res = replaceNormalize(orderCard, targetCode, replacementCode);
  if (res) {
    orderCard = res;
    fs.writeFileSync(orderCardPath, orderCard, 'utf8');
    console.log('Successfully wired quadPartySyncClient into order-card.tsx');
  } else {
    console.warn('Could not find transitionOrderViaHDmaster block in order-card.tsx');
  }
} else {
  console.log('order-card.tsx already contains quadPartySyncClient');
}

// 2. Wire Partner kitchen.tsx
const kitchenPath = path.join(__dirname, '..', 'orderking-partners', 'src', 'routes', 'kitchen.tsx');
let kitchen = fs.readFileSync(kitchenPath, 'utf8');

if (!kitchen.includes('quadPartySyncClient')) {
  let res = replaceNormalize(
    kitchen,
    'import { toast } from "sonner";',
    'import { toast } from "sonner";\nimport { quadPartySyncClient } from "@orderking/ui";'
  );
  if (res) kitchen = res;

  const kitchenTarget = `  useEffect(() => {
    if (!vendor.restaurantId) return;
    const channel = supabaseCloud
      .channel(\`orders-\${vendor.restaurantId}\`)`;

  const kitchenReplacement = `  useEffect(() => {
    if (!vendor.restaurantId) return;
    const unsubscribeQuad = quadPartySyncClient.subscribe(
      { role: "partner_kds", restaurantId: vendor.restaurantId },
      () => {
        void qc.invalidateQueries({ queryKey: ["orders", vendor.restaurantId, "live"] });
      }
    );
    const channel = supabaseCloud
      .channel(\`orders-\${vendor.restaurantId}\`)`;

  const kitchenCleanupTarget = `    return () => {
      void supabaseCloud.removeChannel(channel);
    };`;

  const kitchenCleanupReplacement = `    return () => {
      unsubscribeQuad();
      void supabaseCloud.removeChannel(channel);
    };`;

  res = replaceNormalize(kitchen, kitchenTarget, kitchenReplacement);
  if (res) kitchen = res;
  res = replaceNormalize(kitchen, kitchenCleanupTarget, kitchenCleanupReplacement);
  if (res) {
    kitchen = res;
    fs.writeFileSync(kitchenPath, kitchen, 'utf8');
    console.log('Successfully wired quadPartySyncClient into kitchen.tsx');
  } else {
    console.warn('Could not find target block in kitchen.tsx');
  }
} else {
  console.log('kitchen.tsx already contains quadPartySyncClient');
}

// 3. Wire Rider home-view.tsx
const riderHomePath = path.join(__dirname, '..', 'orderking-riders', 'src', 'components', 'rider', 'home-view.tsx');
let riderHome = fs.readFileSync(riderHomePath, 'utf8');

if (!riderHome.includes('quadPartySyncClient')) {
  let res = replaceNormalize(
    riderHome,
    'import { getCurrentEcosystemShift, getShiftRemainingMinutes, checkThreatZoneIntersections } from "@orderking/ui";',
    'import { getCurrentEcosystemShift, getShiftRemainingMinutes, checkThreatZoneIntersections, quadPartySyncClient } from "@orderking/ui";'
  );
  if (res) riderHome = res;

  const riderTarget = `  useEffect(() => {
    void load();
    void getPerformanceFn().then(setPerformance).catch(() => undefined);
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);`;

  const riderReplacement = `  useEffect(() => {
    void load();
    void getPerformanceFn().then(setPerformance).catch(() => undefined);

    // Instant Quad-Party WebSocket listener: receive sub-second dispatch radar pings
    const unsubscribeQuad = quadPartySyncClient.subscribe(
      { role: "rider_fleet" },
      (event) => {
        if (
          event.event === "ORDER_ACCEPTED" ||
          event.event === "ORDER_READY" ||
          event.event === "RIDER_DISPATCH_PING" ||
          (event.riderId && home?.rider?.id && event.riderId === home.rider.id)
        ) {
          void load();
        }
      }
    );

    const id = window.setInterval(() => void load(), 5000);
    return () => {
      unsubscribeQuad();
      window.clearInterval(id);
    };
  }, [load, home?.rider?.id]);`;

  res = replaceNormalize(riderHome, riderTarget, riderReplacement);
  if (res) {
    riderHome = res;
    fs.writeFileSync(riderHomePath, riderHome, 'utf8');
    console.log('Successfully wired quadPartySyncClient into rider home-view.tsx');
  } else {
    console.warn('Could not find target block in rider home-view.tsx');
  }
} else {
  console.log('rider home-view.tsx already contains quadPartySyncClient');
}

// 4. Wire HDmaster GlobalGodEyeMap.tsx
const godEyePath = path.join(__dirname, '..', 'HDmaster', 'src', 'components', 'dashboard', 'GlobalGodEyeMap.tsx');
let godEye = fs.readFileSync(godEyePath, 'utf8');

if (!godEye.includes('quadPartySyncClient')) {
  let res = replaceNormalize(
    godEye,
    'import { getCurrentEcosystemShift, getShiftRemainingMinutes, CANONICAL_THREAT_ZONES } from "@orderking/ui";',
    'import { getCurrentEcosystemShift, getShiftRemainingMinutes, CANONICAL_THREAT_ZONES, quadPartySyncClient } from "@orderking/ui";'
  );
  if (res) godEye = res;

  const godEyeTarget = `  // Load saved city zones from localStorage or backend on mount
  useEffect(() => {
    let mounted = true;`;

  const godEyeReplacement = `  // Connect God-Eye Quad-Party WebSocket stream for real-time order telematics
  useEffect(() => {
    const unsubscribeQuad = quadPartySyncClient.subscribe(
      { role: "umar_os" },
      (event) => {
        // God-Eye captures every live order state transition across all metro clusters
        if (event.event === "ORDER_CREATED" || event.event === "ORDER_ACCEPTED" || event.event === "ORDER_DELIVERED") {
          // Dynamic live count refresh hook
        }
      }
    );
    return () => {
      unsubscribeQuad();
    };
  }, []);

  // Load saved city zones from localStorage or backend on mount
  useEffect(() => {
    let mounted = true;`;

  res = replaceNormalize(godEye, godEyeTarget, godEyeReplacement);
  if (res) {
    godEye = res;
    fs.writeFileSync(godEyePath, godEye, 'utf8');
    console.log('Successfully wired quadPartySyncClient into GlobalGodEyeMap.tsx');
  } else {
    console.warn('Could not find target block in GlobalGodEyeMap.tsx');
  }
} else {
  console.log('GlobalGodEyeMap.tsx already contains quadPartySyncClient');
}
