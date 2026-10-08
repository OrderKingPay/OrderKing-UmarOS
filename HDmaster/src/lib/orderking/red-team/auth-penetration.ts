import fetch from 'node-fetch';

export async function testBruteForce(loginUrl: string) {
  let success = false;
  try {
    for(let i=0; i<105; i++) {
       const res = await fetch(loginUrl, { method: 'POST' });
       if (res.status === 429) { success = true; break; }
    }
  } catch(e) {}
  return success;
}
