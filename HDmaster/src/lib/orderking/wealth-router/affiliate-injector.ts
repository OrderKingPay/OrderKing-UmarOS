export function injectAffiliateCodes(htmlPayload: string, amazonTag: string, binanceRef: string): string {
  let injected = htmlPayload.replace(/(https?:\/\/(?:www\.)?amazon\.[a-z.]+\/dp\/[A-Z0-9]+)/ig, `$1?tag=${amazonTag}`);
  injected = injected.replace(/(https?:\/\/(?:www\.)?binance\.com\/[a-z]{2}\/register)/ig, `$1?ref=${binanceRef}`);
  return injected;
}
