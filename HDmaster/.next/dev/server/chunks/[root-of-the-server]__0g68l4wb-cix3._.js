module.exports = [
(()=>{"use strict";return[
"[project]/HDmaster/src/app/api/payments/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$kingpay$2f$payment$2d$processor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/orderking/kingpay/payment-processor.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        const { orderId, amount, provider } = body;
        if (!orderId || !amount) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields'
            }, {
                status: 400
            });
        }
        const gateway = provider === 'razorpay' ? 'razorpay' : 'stripe';
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$kingpay$2f$payment$2d$processor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processPayment"])(orderId, amount, 'card', gateway);
        return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(session);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
}),
"[project]/HDmaster/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dbSource",
    ()=>dbSource,
    "ensureDbReady",
    ()=>ensureDbReady,
    "getDatabaseUrl",
    ()=>getDatabaseUrl,
    "getDbSource",
    ()=>getDbSource,
    "getSql",
    ()=>getSql
]);
function getDatabaseUrl() {
    const raw = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
    let url = raw && raw.trim() ? raw : undefined;
    if (url && url.includes('your_supabase_pooler')) url = undefined;
    return url;
}
function getDbSource() {
    return 'neon';
}
const dbSource = 'neon';
/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */ const globalRef = globalThis;
/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */ const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v)=>v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */ function toSql(run, transaction) {
    const sql = async (strings, ...values)=>{
        // Rebuild with $1, $2, … placeholders so values stay parameterized.
        let text = strings[0];
        for(let i = 0; i < values.length; i += 1)text += `$${i + 1}${strings[i + 1]}`;
        return run(text, values);
    };
    sql.query = (text, params = [])=>run(text, params);
    sql.transaction = async (cb)=>{
        if (!transaction) throw new Error("Database transactions are unavailable");
        return transaction(cb);
    };
    return sql;
}
function createNeonSql() {
    globalRef.__pgSqlPromise__ ??= (async ()=>{
        // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
        // pooled endpoint. One pool per process; warm serverless instances reuse it.
        const { Pool, types } = await __turbopack_context__.A("[externals]/pg [external] (pg, esm_import, [project]/HDmaster/node_modules/pg, async loader)");
        types.setTypeParser(OID_INT8, Number);
        types.setTypeParser(OID_DATE, identity);
        types.setTypeParser(OID_INTERVAL, identity);
        const url = getDatabaseUrl();
        if (!url) throw new Error("DATABASE_URL is missing");
        const pool = new Pool({
            connectionString: url
        });
        const run = async (text, params)=>{
            const res = await pool.query(text, params);
            return res.rows;
        };
        const makeClientSql = (client)=>toSql(async (text, params)=>{
                const res = await client.query(text, params);
                return res.rows;
            });
        return toSql(async (text, params)=>{
            const res = await pool.query(text, params);
            return res.rows;
        }, async (fn)=>{
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const result = await fn(makeClientSql(client));
                await client.query("COMMIT");
                return result;
            } catch (error) {
                try {
                    await client.query("ROLLBACK");
                } catch  {}
                throw error;
            } finally{
                client.release();
            }
        });
    })().catch((err)=>{
        globalRef.__pgSqlPromise__ = undefined;
        throw err;
    });
    return globalRef.__pgSqlPromise__;
}
let sqlPromise = null;
async function createSql() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return createNeonSql();
}
function getSql() {
    sqlPromise ??= createSql().catch((err)=>{
        sqlPromise = null; // don't memoize failures — let the next call retry
        throw err;
    });
    return sqlPromise;
}
function ensureDbReady() {
    if (getDbSource() !== "pglite") return Promise.resolve();
    //TURBOPACK unreachable
    ;
}
// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
}),
"[project]/HDmaster/src/lib/orderking/kingpay/payment-processor.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "processPayment",
    ()=>processPayment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/db.ts [app-route] (ecmascript)");
;
async function processPayment(orderId, amountPaise, paymentMethod, gateway) {
    if (!Number.isInteger(amountPaise)) {
        throw new Error('Amount must be an integer in paise');
    }
    let responseData;
    let transactionId = '';
    if (gateway === 'razorpay') {
        const payload = {
            amount: amountPaise,
            currency: 'INR',
            receipt: `order_rcptid_${orderId}`,
            method: paymentMethod
        };
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa('YOUR_RAZORPAY_KEY:YOUR_RAZORPAY_SECRET')}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json();
        transactionId = responseData.id;
    } else if (gateway === 'stripe') {
        const payload = new URLSearchParams({
            amount: amountPaise.toString(),
            currency: 'inr',
            'metadata[order_id]': orderId
        });
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer YOUR_STRIPE_SECRET_KEY`
            },
            body: payload
        });
        responseData = await res.json();
        transactionId = responseData.id;
    }
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    await sql`
        INSERT INTO transactions (id, order_id, amount, gateway, status)
        VALUES (${transactionId}, ${orderId}, ${amountPaise}, ${gateway}, 'SUCCESS')
    `;
    return responseData;
}
}),
]})(),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0g68l4wb-cix3._.js.map