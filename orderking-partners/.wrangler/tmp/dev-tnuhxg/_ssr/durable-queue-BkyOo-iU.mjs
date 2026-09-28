import { t as openDB } from "../_libs/idb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/durable-queue-BkyOo-iU.js
var DB_NAME = "orderking-partners-queue";
var STORE_NAME = "mutations";
async function initQueueDB() {
	return openDB(DB_NAME, 1, { upgrade(db) {
		if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
	} });
}
async function enqueueMutation(item) {
	const db = await initQueueDB();
	const id = crypto.randomUUID();
	await db.put(STORE_NAME, {
		...item,
		id,
		timestamp: Date.now()
	});
	console.log(`[DurableQueue] Order ${item.orderId} transition to ${item.action} queued securely in IndexedDB.`);
}
async function flushQueue(transitionFn) {
	if (typeof navigator !== "undefined" && !navigator.onLine) return;
	const db = await initQueueDB();
	const items = await db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).getAll();
	if (items.length === 0) return;
	console.log(`[DurableQueue] Flushing ${items.length} queued order transitions...`);
	items.sort((a, b) => a.timestamp - b.timestamp);
	for (const item of items) try {
		await transitionFn({ data: {
			restaurantId: item.restaurantId,
			orderId: item.orderId,
			action: item.action,
			reason: item.reason,
			idempotencyKey: item.idempotencyKey
		} });
		console.log(`[DurableQueue] Successfully flushed mutation ${item.id}`);
		await db.delete(STORE_NAME, item.id);
	} catch (e) {
		console.error(`[DurableQueue] Error flushing mutation ${item.id}`, e);
		break;
	}
}
if (typeof window !== "undefined") window.addEventListener("online", () => {
	console.log("[DurableQueue] Network restored. Event fired. Please ensure flushQueue is called with the function.");
});
//#endregion
export { flushQueue as n, enqueueMutation as t };
