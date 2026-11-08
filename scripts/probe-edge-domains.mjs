const domains = [
  'https://admin.orderkingpay.com',
  'https://orderkingpay.com',
  'https://partner.orderkingpay.com',
  'https://rider.orderkingpay.com'
];

for (const d of domains) {
  try {
    const res = await fetch(d, { redirect: 'manual' });
    console.log(`${d} => HTTP ${res.status} [${res.headers.get('location') || 'OK'}] (cf-ray: ${res.headers.get('cf-ray')})`);
  } catch (e) {
    console.log(`${d} => ERROR: ${e.message}`);
  }
}
