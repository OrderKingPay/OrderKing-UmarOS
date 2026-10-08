module.exports = [
(()=>{"use strict";return[
"[project]/HDmaster/src/app/restaurants/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RestaurantsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$discovery$2f$full$2d$text$2d$search$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/orderking/discovery/full-text-search.ts [app-rsc] (ecmascript)");
;
;
async function searchRestaurants(query) {
    if (!query) return [];
    const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$orderking$2f$discovery$2f$full$2d$text$2d$search$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["searchRestaurants"])(query);
    return res.map((r)=>({
            id: r.id,
            name: r.name,
            matchScore: r.rank ? r.rank.toFixed(2) : 0
        }));
}
async function RestaurantsPage({ searchParams }) {
    const query = searchParams.q || '';
    const results = await searchRestaurants(query);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-3xl font-bold mb-6",
                children: "Restaurant Discovery"
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "mb-8",
                method: "GET",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        name: "q",
                        defaultValue: query,
                        placeholder: "Search restaurants...",
                        className: "border border-gray-300 p-3 rounded-l-md w-64 text-black"
                    }, void 0, false, {
                        fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "bg-blue-600 text-white p-3 rounded-r-md hover:bg-blue-700",
                        children: "Search"
                    }, void 0, false, {
                        fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            results.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "space-y-4",
                children: results.map((restaurant)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "p-4 bg-gray-50 border border-gray-200 rounded-md",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-semibold text-gray-900",
                                children: restaurant.name
                            }, void 0, false, {
                                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                                lineNumber: 38,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: [
                                    "Match Score: ",
                                    restaurant.matchScore
                                ]
                            }, void 0, true, {
                                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                                lineNumber: 39,
                                columnNumber: 15
                            }, this)
                        ]
                    }, restaurant.id, true, {
                        fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                        lineNumber: 37,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500",
                children: "No restaurants found matching your query."
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/HDmaster/src/app/restaurants/page.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}),
"[project]/HDmaster/src/lib/db.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/HDmaster/src/lib/orderking/discovery/full-text-search.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "searchRestaurants",
    ()=>searchRestaurants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/src/lib/db.ts [app-rsc] (ecmascript)");
;
async function searchRestaurants(query, lat, lng) {
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSql"])();
    let result;
    if (lat !== undefined && lng !== undefined) {
        result = await sql`
            SELECT 
                id, 
                name, 
                description,
                ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank,
                (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) AS distance
            FROM restaurants
            WHERE search_vector @@ plainto_tsquery('english', ${query})
            ORDER BY rank DESC, distance ASC
        `;
    } else {
        result = await sql`
            SELECT 
                id, 
                name, 
                description,
                ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
            FROM restaurants
            WHERE search_vector @@ plainto_tsquery('english', ${query})
            ORDER BY rank DESC
        `;
    }
    return result;
}
}),
]})(),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/HDmaster/src/app/restaurants/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/HDmaster/src/app/restaurants/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__04pf196c8vqbm._.js.map