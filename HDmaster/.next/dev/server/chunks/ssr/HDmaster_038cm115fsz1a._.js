(()=>{"use strict";module.exports = [
"[project]/HDmaster/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/HDmaster/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime;
}),
"[project]/HDmaster/src/app/checkout/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CheckoutPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/HDmaster/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function CheckoutPage() {
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleCheckout = async ()=>{
        setLoading(true);
        try {
            // Call real payments checkout API
            const response = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: `ord_${Date.now()}`,
                    amount: 5000
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Checkout session created successfully');
                }
            } else {
                alert('Checkout initiated');
            }
        } catch (error) {
            console.error("Checkout failed", error);
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-4",
                children: "Secure Checkout"
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/checkout/page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mb-6 text-gray-600",
                children: "Complete your order securely via KingPay."
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/checkout/page.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$HDmaster$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleCheckout,
                disabled: loading,
                className: "w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50",
                children: loading ? 'Processing...' : 'Pay Now'
            }, void 0, false, {
                fileName: "[project]/HDmaster/src/app/checkout/page.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/HDmaster/src/app/checkout/page.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
}),
];})()

//# sourceMappingURL=HDmaster_038cm115fsz1a._.js.map