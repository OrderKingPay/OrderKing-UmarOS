const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/ai/remote-work-board.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import { useState } from "react";/, `import { useState, useEffect } from "react";`);

const replaceTarget = `export function RemoteWorkBoard({
  onSelectAction,
}: {
  onSelectAction?: (action: string, payload: any) => void;
}) {
  const [gigs, setGigs] = useState<
    Array<RemoteContractGig & { applicationStatus: "NOT_APPLIED" | "APPLIED" | "INTERVIEWING" | "OFFER_RECEIVED" }>
  >(() =>
    CURATED_REMOTE_GIGS.map((g) => ({
      ...g,
      applicationStatus: "NOT_APPLIED",
    }))
  );

  const [selectedGig, setSelectedGig] = useState<(typeof gigs)[0] | null>(gigs[0] || null);`;

const replaceWith = `export function RemoteWorkBoard({
  onSelectAction,
}: {
  onSelectAction?: (action: string, payload: any) => void;
}) {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGig, setSelectedGig] = useState<any | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("https://orderking-hdmaster-prod.netlify.app/api/v1/founder/jobs");
        const data = await res.json();
        if (data.success) {
          setGigs(data.jobs);
          setSelectedGig(data.jobs[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);`;

content = content.replace(replaceTarget, replaceWith);
fs.writeFileSync(path, content);
console.log("Updated remote-work-board.tsx to fetch real API");
