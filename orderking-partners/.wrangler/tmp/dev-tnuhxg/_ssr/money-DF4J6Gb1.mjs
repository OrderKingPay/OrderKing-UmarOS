//#region node_modules/.nitro/vite/services/ssr/assets/money-DF4J6Gb1.js
var MoneyError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "MoneyError";
	}
};
function assertPaise(value, label = "amount") {
	if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) throw new MoneyError(`${label} must be a safe integer number of paise`);
	return value;
}
function paise(value) {
	return assertPaise(value);
}
/** Convert a rupee decimal collected at an input boundary into paise. */
function rupeesToPaise(rupees) {
	if (!Number.isFinite(rupees)) throw new MoneyError("rupees must be finite");
	return Math.round(rupees * 100);
}
function paiseToRupeeParts(amount) {
	const v = assertPaise(amount);
	const sign = v < 0 ? "-" : "";
	const abs = Math.abs(v);
	return {
		sign,
		rupees: Math.floor(abs / 100),
		paise: abs % 100
	};
}
function formatINR(amount) {
	const { sign, rupees, paise: p } = paiseToRupeeParts(amount);
	return `${sign}₹${rupees.toLocaleString("en-IN")}.${String(p).padStart(2, "0")}`;
}
function mulBps(amount, bps) {
	assertPaise(amount, "amount");
	if (!Number.isInteger(bps)) throw new MoneyError("bps must be an integer");
	const prod = amount * bps;
	if (!Number.isSafeInteger(prod)) throw new MoneyError("commission overflow");
	const abs = Math.abs(prod);
	const rounded = Math.floor(abs / 1e4) + (abs % 1e4 >= 5e3 ? 1 : 0);
	return prod < 0 ? -rounded : rounded;
}
function percentOf(amount, percent) {
	if (!Number.isInteger(percent)) throw new MoneyError("percent must be an integer");
	return mulBps(amount, percent * 100);
}
//#endregion
export { rupeesToPaise as a, percentOf as i, mulBps as n, paise as r, formatINR as t };
