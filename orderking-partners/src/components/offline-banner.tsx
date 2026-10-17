import { useEffect, useState } from "react";
import { useT } from "./use-t";

export function OfflineBanner({ stale: _stale }: { stale?: boolean }) {
  // Offline banner permanently silenced: operating strictly in silent zero-lag mode
  return null;
}
