import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as createServerFn, o as getServerFnById, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-C9fpcC-8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-BhD-mRHK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getBootstrap = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("4d07721212f55d9d7e6f90616a98a913a695d75cb56c7947a56facf4567ba778"));
var getOpsHome = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("793b732acca00455693ed0f532e952ba40684e7f7d1e4d859e8114e4fd1df9d1"));
var getCeoDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("ca8267db04bb5872edb39a43da1e155860fce11a99e753cd8de1b9e6e7f57682"));
var getOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("1623e3e07fba717b954fe77775d0acc4967419afd0e1aff15111f719e224aaf8"));
var getOrder = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("7a6816eddc74232d52557ef57ca41e7c88ebf61569a4f5b46ee0bf56eb6b9ca6"));
var mutateOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("fc94fb88a9d845f47b1423163da55e5710f5ffa089ce49c39a8318da18a9dac5"));
var getRestaurants = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("2ec1bfa83243b797dd399a050d759333756750fb2c971c1108e3794dd3cfbca8"));
var mutateRestaurant = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("2cb2f9d6baec45161a40e9790ec9830bb80ceec9fdce7b6e9c23782c0e3186e9"));
var getRiders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("06f68520cdab4d7b1c03aa50c58bb027e718205b1ae3caa8e674ffbaf930cd64"));
var mutateRider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("7ceb56584ae12bc1339f88c5bc226f67f7094218e6c4f94109a8425ccb43e184"));
var getCustomers = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bd89932a29b766bff9b8d7407cbae50126f2d636a3624d5c5918533e0235f338"));
var mutateCustomer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("afc92142d24d931644ada5d4ebaee1380ef9beb9082b1cdd2c1050e87337d403"));
var getDispatch = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("92f2ed83c77ab91924068508fbf2486aec68a6d7e0af7a07be9b29ef5016cd4f"));
var getMap = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5dd4ef99ef14bc874c698ff55159ff1189a62429a29ba04367f830fce4269bcf"));
var getSupport = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("cf4691ddb45a7962715dda8b747e04ca811a12ce6929dde8fb8c3bc8b9a15487"));
var mutateTicket = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("b04135d4be655b1278dfd91b89ca5bdd97750a9ab282b822ec115465c449ccbc"));
var getTasks = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3b3ccf0ff5f479fa685c6191c136aff937d7b8ae12ad5d402a6eda12631f307f"));
var mutateTask = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("a8c07a2a22489b32d5c9dce8b6b699fb893be8712a1f517a040fffd0052c1813"));
var getFinance = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("da5da650058d095a2ab7e92cb1cfe02305593e2fdf8c7002998fda76ed201722"));
var mutateSettlement = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("1ecd7474726af8e978fd5570774a5321db320b4478416d14d8d35b73885b8337"));
var getCommerce = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("db640fac8c167ec44b2586b4b3cb0442288741f685f55e243bed995723103219"));
var mutatePromotion = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("e025278b43772f0105f50ec3a84fa5a4794ed37818871b74c859769e3b342fe4"));
var mutateCampaign = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("1b373f5bffbef037740569447017fa593e0115a4ce40e221d64677907d4974ef"));
var getKyc = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d045ce514367d853a9371f524ca52ddac17d5df40aa7c950d6919330851a0298"));
var mutateKyc = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("07f45ad59bf01fba4d20a9c64acf8ea9ec00a99ce2648321e2eaae5a2ac3e393"));
var getRisk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c36449408be0884683bb4978ec1eabff4b2c925e81047775ca77ccf55832b2fa"));
var mutateRisk = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("0ac51d8b3eb9dc769a588a0e275e6bd31b3744411311c2d42930d00f70c4994e"));
var getPeople = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7c7631cb6c268872c19f1b5763671ba7dabb1433b6acac09e45e0a20959ec728"));
var inviteEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("8f6b5f0bcb800ffffd7244af9c43f4895f5091f556e27bdf9133028165797117"));
var mutateEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("69746ec587deb8ecfecc8e71d87a6c671a6e393a4089e79881e5db1add65fcf7"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("32e3cdb6826bedea7bba1df06fc0abbb517f594c795a8d0278c33f3f63dfd5d5"));
var getAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("13e397a8934a9b349d45601c94b77d8d2bb5204b68b07a4e863afaa927755e00"));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("c82230143eb6371f6b0cf6e8bcd5c49d513fe077516eb535562e001f68762ca4"));
var getNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("2601ea206cc80b00b02e16f99e952f08f792c227c052577040c03e9576be9463"));
var getHealth = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("771f2c5fb9ad47ffb84b40df985878c6a1bee727d3683375d6a41adf7dedf58f"));
var getSystem = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f429b1d8ccebaa7e8b909aa4c1e31b05cbcce69dd30b012e64b919930dd45974"));
var saveSystem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("8178715a84745f336e4562fb5f03b9cf4f5a9f550f84b84e6f8d65ead94f3f77"));
var getSearch = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("577449ce333aa74b1d62ebd4b559d8ca83397753651607592939356b651f428c"));
var getSecurity = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("95cb549ea0adb29c11de45a078ce956810c2085b902916892e739f9d01279e11"));
var runNlQuery = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("75a4bd4f42a1d4af962fe85c4abeda81f7a18517173d5da2be99c15fb58c8093"));
var askAssistant = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bbe9e1c4df6965a737b99deccbe984faf216cc816666d42fcc34a796d1579146"));
var generateCeoReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("5dfa42f8d697d28f601b1d8b42048bdf4c0a1a134dc8a6f3c259f4a4dbca2595"));
var runMarketplaceTick = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("77a804f2f686b1d9971a5579ad6da915feac69ceb9695c243041a52f1c4679b1"));
var runE2eSimulation = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("5efb15df6081b970f38ac644bcb6b66b2f2ac933a6a76892fa8d1511172729a8"));
var EN = {
	"brand.tagline": "Command the marketplace",
	"nav.home": "Home",
	"nav.ceo": "Command Center",
	"nav.economics": "Unit economics",
	"nav.simulator": "What-if",
	"nav.ceoAi": "CEO AI",
	"nav.reports": "Reports",
	"nav.orders": "Orders",
	"nav.dispatch": "Dispatch",
	"nav.map": "Live map",
	"nav.support": "Support",
	"nav.tasks": "Tasks",
	"nav.restaurants": "Restaurants",
	"nav.riders": "Riders",
	"nav.kyc": "KYC",
	"nav.customers": "Customers",
	"nav.promotions": "Promotions",
	"nav.loyalty": "Loyalty",
	"nav.marketing": "Marketing",
	"nav.commerce": "Growth",
	"nav.finance": "Finance",
	"nav.settlements": "Settlements",
	"nav.risk": "Fraud & risk",
	"nav.security": "Security",
	"nav.audit": "Audit log",
	"nav.employees": "People",
	"nav.roles": "Roles",
	"nav.analytics": "Analytics",
	"nav.notifications": "Notifications",
	"nav.branding": "Branding",
	"nav.flags": "Feature flags",
	"nav.settings": "System",
	"nav.health": "Health",
	"nav.ai": "AI assist",
	"nav.search": "Search",
	"nav.section.command": "Command",
	"nav.section.ops": "Operations",
	"nav.section.network": "Network",
	"nav.section.growth": "Growth",
	"nav.section.money": "Money",
	"nav.section.trust": "Trust",
	"nav.section.org": "Organisation",
	"sim.banner": "SIMULATED DATA — marketplace records are demonstration data until Shared Core is connected. They are not live customer, restaurant, or rider activity.",
	"sim.short": "SIMULATED DATA",
	"sim.action": "Simulation — does not change a live marketplace.",
	"auth.pending": "Your account is waiting for an administrator to activate access.",
	"auth.suspended": "This employee account is suspended.",
	"auth.signIn": "Sign in to OrderKing",
	"auth.email": "Work email",
	"auth.password": "Password",
	"auth.name": "Full name",
	"auth.create": "Create employee account",
	"auth.have": "Have an account? Sign in",
	"auth.need": "Invited? Create an account",
	"action.retry": "Retry",
	"action.save": "Save",
	"action.cancel": "Cancel",
	"action.confirm": "Confirm",
	"action.export": "Export",
	"empty.none": "Nothing here yet.",
	"denied.title": "You do not have access",
	"denied.body": "This area is limited to employees with the required permission.",
	"home.happening": "What is happening",
	"home.wrong": "What is wrong",
	"home.action": "What needs action",
	"home.money": "What is making or losing money",
	"ceo.title": "Command Center",
	"ceo.subtitle": "Business health, money, and what to do next.",
	"queue.support": "Open tickets",
	"queue.onboarding": "Restaurant onboarding",
	"queue.kyc": "Pending KYC",
	"queue.finance": "Settlement exceptions",
	"queue.risk": "Fraud signals",
	"queue.dispatch": "Unassigned orders"
};
var DICTS = {
	en: EN,
	bn: {
		"brand.tagline": "মার্কেটপ্লেস পরিচালনা করুন",
		"nav.home": "হোম",
		"nav.ceo": "কমান্ড সেন্টার",
		"nav.orders": "অর্ডার",
		"nav.dispatch": "ডিসপ্যাচ",
		"nav.map": "লাইভ ম্যাপ",
		"nav.support": "সাপোর্ট",
		"nav.tasks": "টাস্ক",
		"nav.restaurants": "রেস্তোরাঁ",
		"nav.riders": "রাইডার",
		"nav.kyc": "কেওয়াইসি",
		"nav.customers": "গ্রাহক",
		"nav.finance": "ফিনান্স",
		"nav.employees": "কর্মচারী",
		"nav.analytics": "অ্যানালিটিক্স",
		"nav.settings": "সেটিংস",
		"nav.ai": "এআই সহায়তা",
		"nav.search": "খোঁজ",
		"sim.banner": "সিমুলেটেড ডেটা — Shared Core সংযুক্ত না হওয়া পর্যন্ত এটি প্রদর্শনী তথ্য।",
		"sim.short": "সিমুলেটেড ডেটা",
		"auth.pending": "প্রশাসক অ্যাক্সেস সক্রিয় করার অপেক্ষায়।",
		"auth.suspended": "এই কর্মচারী অ্যাকাউন্ট স্থগিত।",
		"auth.signIn": "রোশোই-তে সাইন ইন করুন",
		"action.retry": "আবার চেষ্টা",
		"empty.none": "এখনও কিছু নেই।",
		"denied.title": "আপনার অ্যাক্সেস নেই",
		"denied.body": "এই এলাকা নির্দিষ্ট অনুমতি সম্পন্ন কর্মচারীদের জন্য।"
	},
	as: {
		"brand.tagline": "মাৰ্কেটপ্লেচ পৰিচালনা কৰক",
		"nav.home": "হোম",
		"nav.ceo": "কমাণ্ড চেণ্টাৰ",
		"nav.orders": "অৰ্ডাৰ",
		"nav.dispatch": "ডিস্পেচ",
		"nav.map": "লাইভ মেপ",
		"nav.support": "সাপৰ্ট",
		"nav.restaurants": "ৰেষ্টুৰেণ্ট",
		"nav.riders": "ৰাইডাৰ",
		"nav.customers": "গ্ৰাহক",
		"nav.finance": "ফিনান্স",
		"nav.employees": "কৰ্মচাৰী",
		"nav.ai": "এআই সহায়",
		"nav.search": "সন্ধান",
		"sim.short": "ছিমুলেটেড ডেটা",
		"sim.banner": "ছিমুলেটেড ডেটা — Shared Core সংযোগ নোহোৱালৈকে এইটো প্ৰদৰ্শনী তথ্য।"
	},
	hi: {
		"brand.tagline": "मार्केटप्लेस चलाएँ",
		"nav.home": "होम",
		"nav.ceo": "कमांड सेंटर",
		"nav.orders": "ऑर्डर",
		"nav.dispatch": "डिस्पैच",
		"nav.map": "लाइव मैप",
		"nav.support": "सपोर्ट",
		"nav.restaurants": "रेस्तराँ",
		"nav.riders": "राइडर",
		"nav.customers": "ग्राहक",
		"nav.finance": "वित्त",
		"nav.employees": "कर्मचारी",
		"nav.ai": "एआई सहायता",
		"nav.search": "खोज",
		"sim.short": "सिम्युलेटेड डेटा",
		"sim.banner": "सिम्युलेटेड डेटा — Shared Core जुड़ने तक यह प्रदर्शन डेटा है।"
	}
};
function t(locale, key) {
	return DICTS[locale]?.[key] ?? EN[key];
}
var Ctx = (0, import_react.createContext)(null);
function SessionProvider({ boot, locale, setLocale, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value: {
			boot,
			locale,
			setLocale
		},
		children
	});
}
function useSessionBoot() {
	const v = (0, import_react.useContext)(Ctx);
	if (!v) throw new Error("Session missing");
	return v;
}
function useT() {
	const { locale } = useSessionBoot();
	return (key) => t(locale, key);
}
/** Stable permission checker. Call once at the top of a component — never inside conditions or loops. */
function useCan() {
	const { boot } = useSessionBoot();
	const perms = boot.session.permissions;
	return (key) => perms.includes(key);
}
//#endregion
export { mutateCustomer as A, mutateTicket as B, getSearch as C, getTasks as D, getSystem as E, mutateRestaurant as F, t as G, runMarketplaceTick as H, mutateRider as I, useT as J, useCan as K, mutateRisk as L, mutateKyc as M, mutateOrder as N, inviteEmployee as O, mutatePromotion as P, mutateSettlement as R, getRisk as S, getSupport as T, runNlQuery as U, runE2eSimulation as V, saveSystem as W, getOrder as _, getAudit as a, getRestaurants as b, getCommerce as c, getFinance as d, getHealth as f, getOpsHome as g, getNotifications as h, getAnalytics as i, mutateEmployee as j, mutateCampaign as k, getCustomers as l, getMap as m, askAssistant as n, getBootstrap as o, getKyc as p, useSessionBoot as q, generateCeoReport as r, getCeoDashboard as s, SessionProvider as t, getDispatch as u, getOrders as v, getSecurity as w, getRiders as x, getPeople as y, mutateTask as z };
