async function checkRootHeaders() {
  for (const url of ['https://orderkingpay.com', 'https://partner.orderkingpay.com']) {
    console.log(`\n=================== CHECKING: ${url} ===================`);
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    console.log('Status:', res.status);
    console.log('Final URL:', res.url);
    console.log('Headers:');
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }
    const html = await res.text();
    console.log('HTML snippet (first 300 chars):');
    console.log(html.slice(0, 300));
  }
}

checkRootHeaders();
