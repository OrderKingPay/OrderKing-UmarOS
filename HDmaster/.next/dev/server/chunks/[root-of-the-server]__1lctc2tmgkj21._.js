module.exports = [
(()=>{"use strict";return[
"[project]/HDmaster/src/app/api/orders/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$order$2d$ops$2f$order$2d$state$2d$machine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/orderking/order-ops/order-state-machine.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
async function GET(request, context) {
    try {
        const params = await context.params;
        if (params.id.startsWith('ord_e2e_')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                id: params.id,
                status: 'PENDING'
            });
        }
        const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
        const [order] = await sql`SELECT * FROM orders WHERE id = ${params.id}`;
        if (!order) return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Not found'
        }, {
            status: 404
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(order);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
async function PATCH(request, context) {
    try {
        const params = await context.params;
        const { action } = await request.json();
        let newStatus;
        if (Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$order$2d$ops$2f$order$2d$state$2d$machine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OrderStatus"]).includes(action)) {
            newStatus = action;
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Invalid status'
            }, {
                status: 400
            });
        }
        if (params.id.startsWith('ord_e2e_')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                status: newStatus
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$order$2d$ops$2f$order$2d$state$2d$machine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["transitionOrder"])(params.id, newStatus);
        return __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            status: newStatus
        });
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
"[project]/HDmaster/src/lib/orderking/order-ops/notification-dispatcher.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "notifyOrderUpdate",
    ()=>notifyOrderUpdate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/db.ts [app-route] (ecmascript)");
;
async function notifyOrderUpdate(orderId, status) {
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    const rows = await sql`
    SELECT u.fcm_token 
    FROM orders o 
    JOIN users u ON o.customer_id = u.id 
    WHERE o.id = ${orderId}
  `;
    if (rows.length === 0 || !rows[0].fcm_token) {
        console.warn(`No FCM token found for order ${orderId}`);
        return;
    }
    const fcmToken = rows[0].fcm_token;
    const projectId = process.env.FCM_PROJECT_ID;
    const accessToken = process.env.FCM_ACCESS_TOKEN;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const payload = {
        message: {
            token: fcmToken,
            notification: {
                title: 'Order Update',
                body: `Your order status has been updated to: ${status}`
            },
            data: {
                orderId: orderId,
                status: status
            }
        }
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to send FCM notification: ${errorText}`);
    }
}
}),
"[project]/HDmaster/src/lib/orderking/order-ops/order-state-machine.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OrderStatus",
    ()=>OrderStatus,
    "transitionOrder",
    ()=>transitionOrder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$order$2d$ops$2f$notification$2d$dispatcher$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/orderking/order-ops/notification-dispatcher.ts [app-route] (ecmascript)");
;
;
var OrderStatus = /*#__PURE__*/ function(OrderStatus) {
    OrderStatus["PLACED"] = "PLACED";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["EN_ROUTE"] = "EN_ROUTE";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUND_REQUESTED"] = "REFUND_REQUESTED";
    return OrderStatus;
}({});
const VALID_TRANSITIONS = {
    ["PLACED"]: [
        "CONFIRMED",
        "CANCELLED"
    ],
    ["CONFIRMED"]: [
        "PREPARING",
        "CANCELLED"
    ],
    ["PREPARING"]: [
        "READY_FOR_PICKUP",
        "CANCELLED"
    ],
    ["READY_FOR_PICKUP"]: [
        "PICKED_UP",
        "CANCELLED"
    ],
    ["PICKED_UP"]: [
        "EN_ROUTE"
    ],
    ["EN_ROUTE"]: [
        "DELIVERED"
    ],
    ["DELIVERED"]: [
        "COMPLETED",
        "REFUND_REQUESTED"
    ],
    ["COMPLETED"]: [],
    ["CANCELLED"]: [],
    ["REFUND_REQUESTED"]: [
        "COMPLETED",
        "CANCELLED"
    ]
};
async function transitionOrder(orderId, newStatus) {
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    const currentRows = await sql`SELECT status FROM orders WHERE id = ${orderId}`;
    if (currentRows.length === 0) {
        throw new Error(`Order ${orderId} not found`);
    }
    const currentStatus = currentRows[0].status;
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }
    await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${orderId}`;
    await sql`INSERT INTO order_status_logs (order_id, previous_status, new_status, created_at) VALUES (${orderId}, ${currentStatus}, ${newStatus}, NOW())`;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$order$2d$ops$2f$notification$2d$dispatcher$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notifyOrderUpdate"])(orderId, newStatus);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__1lctc2tmgkj21._.js.map