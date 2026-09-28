import { n as platformConfig } from "./platform-config-noG9WRp_.mjs";
import { a as newId } from "./utils-BZJZXT5Z.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { i as getSql, t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { o as writeAudit, r as loadMemberships, t as createServerRpc } from "./helpers-DJHrKkmK.mjs";
import { t as notificationChannelStatus } from "./notifications-D6iJp5E5.mjs";
import process from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/api-bootstrap-DW6iYlDz.js
var ALLOWED = new Set([...platformConfig.restaurantSettings.allowedDocumentTypes, ...platformConfig.restaurantSettings.allowedImageTypes]);
function validateUpload(input) {
	if (!(input.kind === "image" ? platformConfig.restaurantSettings.allowedImageTypes : platformConfig.restaurantSettings.allowedDocumentTypes).includes(input.contentType) && !ALLOWED.has(input.contentType)) return {
		ok: false,
		error: "This file type is not allowed."
	};
	if (input.byteSize <= 0 || input.byteSize > platformConfig.restaurantSettings.maxUploadBytes) return {
		ok: false,
		error: `File must be under ${Math.floor(platformConfig.restaurantSettings.maxUploadBytes / 1024)} KB.`
	};
	return { ok: true };
}
/**
* Object storage adapter. S3 is NOT CONNECTED. Preview stores a metadata
* record plus a truncated data URL in Postgres so documents have a status
* without pretending a production bucket exists.
*/
var storageAdapter = {
	connected: false,
	provider: "NOT_CONNECTED",
	async put(input) {
		return {
			backend: "local_preview",
			key: input.key,
			contentType: input.contentType,
			byteSize: input.bytes.byteLength,
			connected: false
		};
	}
};
/**
* Window 3 (rider) integration. When an order becomes READY we enqueue a
* pickup ticket. The rider system is not connected in this window.
*/
var dispatchAdapter = {
	connected: false,
	provider: "NOT_CONNECTED"
};
var getBootstrap_createServerFn_handler = createServerRpc({
	id: "9c1bad14012eb0b06c25983a232ff2eb8000d5f62d816034701a770075c5cd56",
	name: "getBootstrap",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => getBootstrap.__executeServer(opts));
var getBootstrap = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getBootstrap_createServerFn_handler, async ({ context }) => {
	try {
		const memberships = await loadMemberships(await getSql(), context.userId);
		return {
			userId: context.userId,
			memberships,
			branding: {
				appName: platformConfig.brand.appName,
				tagline: platformConfig.brand.tagline,
				restaurantFacingBrandName: platformConfig.brand.restaurantFacingBrandName,
				logo: platformConfig.brand.restaurantFacingLogo,
				primary: platformConfig.theme.primary,
				supportEmail: platformConfig.support.email
			},
			featureFlags: platformConfig.featureFlags,
			adapters: {
				notifications: notificationChannelStatus(),
				storage: {
					connected: storageAdapter.connected,
					provider: storageAdapter.provider
				},
				dispatch: {
					connected: dispatchAdapter.connected,
					provider: dispatchAdapter.provider
				},
				payments: {
					connected: false,
					provider: "NOT_CONNECTED"
				},
				ai: {
					connected: Boolean(process.env.XAI_API_KEY),
					provider: process.env.XAI_API_KEY ? "xAI" : "NOT_CONNECTED"
				}
			},
			commissionOptionsBps: [...platformConfig.commission.allowedBps]
		};
	} catch (error) {
		console.error("[getBootstrap] Failed DB connect:", error);
		return {
			userId: context.userId,
			memberships: [],
			branding: {
				appName: platformConfig.brand.appName,
				tagline: platformConfig.brand.tagline,
				restaurantFacingBrandName: platformConfig.brand.restaurantFacingBrandName,
				logo: platformConfig.brand.restaurantFacingLogo,
				primary: platformConfig.theme.primary,
				supportEmail: platformConfig.support.email
			},
			featureFlags: platformConfig.featureFlags,
			adapters: {
				notifications: notificationChannelStatus(),
				storage: {
					connected: storageAdapter.connected,
					provider: storageAdapter.provider
				},
				dispatch: {
					connected: dispatchAdapter.connected,
					provider: dispatchAdapter.provider
				},
				payments: {
					connected: false,
					provider: "NOT_CONNECTED"
				},
				ai: {
					connected: Boolean(process.env.XAI_API_KEY),
					provider: process.env.XAI_API_KEY ? "xAI" : "NOT_CONNECTED"
				}
			},
			commissionOptionsBps: [...platformConfig.commission.allowedBps]
		};
	}
});
var createRestaurantDraft_createServerFn_handler = createServerRpc({
	id: "99b1301f0f002401e907c4d9e8a32e8bbb0eef33897dc777e41ee33da401aa47",
	name: "createRestaurantDraft",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => createRestaurantDraft.__executeServer(opts));
var createRestaurantDraft = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createRestaurantDraft_createServerFn_handler, async ({ context, data }) => {
	const name = data.name.trim();
	const displayName = data.displayName.trim() || name;
	if (!name) throw new Error("Restaurant name is required");
	const sql = await getSql();
	const restaurantId = newId("rst");
	const outletId = newId("out");
	await sql`
      insert into restaurants (
        id, owner_user_id, name, display_name, owner_name, phone, email,
        address, landmark, cuisine, diet, description, verification_status, data_label
      ) values (
        ${restaurantId}, ${context.userId}, ${name}, ${displayName},
        ${data.ownerName.trim()}, ${data.phone.trim()}, ${data.email.trim()},
        ${data.address.trim()}, ${data.landmark?.trim() ?? ""},
        ${data.cuisine?.trim() ?? ""}, ${data.diet ?? "NONVEG"},
        ${data.description?.trim() ?? ""}, 'DRAFT', 'REAL'
      )
    `;
	await sql`
      insert into outlets (id, restaurant_id, name, address, is_primary)
      values (${outletId}, ${restaurantId}, ${displayName}, ${data.address.trim()}, true)
    `;
	await sql`
      insert into restaurant_staff (id, restaurant_id, outlet_id, user_id, role)
      values (${newId("stf")}, ${restaurantId}, ${outletId}, ${context.userId}, 'OWNER')
    `;
	for (let day = 0; day <= 6; day++) await sql`
        insert into restaurant_hours (id, restaurant_id, outlet_id, weekday, open_minutes, close_minutes)
        values (${newId("hrs")}, ${restaurantId}, ${outletId}, ${day}, ${660}, ${1320})
      `;
	await writeAudit(sql, {
		restaurantId,
		actorUserId: context.userId,
		action: "create_draft",
		entityType: "restaurant",
		entityId: restaurantId
	});
	return {
		ok: true,
		restaurantId,
		verificationStatus: "DRAFT",
		dataLabel: "REAL"
	};
});
var updateRestaurantProfile_createServerFn_handler = createServerRpc({
	id: "3bbd82d73174bb02f6a6d906d653d997f3b0a21b26eb2f3272b0878b5084887b",
	name: "updateRestaurantProfile",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => updateRestaurantProfile.__executeServer(opts));
var updateRestaurantProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateRestaurantProfile_createServerFn_handler, async ({ context, data }) => {
	const { withVendor } = await import("./helpers-DJHrKkmK.mjs").then((n) => n.n).then((n) => n.t);
	return withVendor(context.userId, String(data.restaurantId ?? ""), "onboarding.edit", async (sql, ctx) => {
		const fields = [
			"name",
			"display_name",
			"owner_name",
			"phone",
			"email",
			"address",
			"landmark",
			"service_area",
			"cuisine",
			"diet",
			"description",
			"gstin",
			"fssai_number",
			"pan",
			"prep_minutes",
			"peak_prep_minutes",
			"min_order_paise",
			"packing_paise",
			"contact_persons"
		];
		for (const [k, col] of Object.entries({
			name: "name",
			displayName: "display_name",
			ownerName: "owner_name",
			phone: "phone",
			email: "email",
			address: "address",
			landmark: "landmark",
			serviceArea: "service_area",
			cuisine: "cuisine",
			diet: "diet",
			description: "description",
			gstin: "gstin",
			fssaiNumber: "fssai_number",
			pan: "pan",
			prepMinutes: "prep_minutes",
			peakPrepMinutes: "peak_prep_minutes",
			minOrderPaise: "min_order_paise",
			packingPaise: "packing_paise",
			contactPersons: "contact_persons",
			lat: "lat",
			lng: "lng",
			deliveryAvailable: "delivery_available",
			weeklyHolidays: "weekly_holidays"
		})) {
			if (data[k] === void 0) continue;
			if (!fields.includes(col) && ![
				"lat",
				"lng",
				"delivery_available",
				"weekly_holidays"
			].includes(col)) continue;
			const v = data[k];
			await sql.query(`update restaurants set ${col} = $1, updated_at = now() where id = $2`, [v, ctx.restaurantId]);
		}
		if (data.bankAccount !== void 0 || data.bankIfsc !== void 0 || data.bankName !== void 0) {
			const { assertCan } = await import("./rbac-inyuxmFx.mjs").then((n) => n.i).then((n) => n.i);
			assertCan(ctx.role, "settings.financial");
			if (data.bankAccount !== void 0) await sql`update restaurants set bank_account = ${String(data.bankAccount)}, updated_at = now() where id = ${ctx.restaurantId}`;
			if (data.bankIfsc !== void 0) await sql`update restaurants set bank_ifsc = ${String(data.bankIfsc)}, updated_at = now() where id = ${ctx.restaurantId}`;
			if (data.bankName !== void 0) await sql`update restaurants set bank_name = ${String(data.bankName)}, updated_at = now() where id = ${ctx.restaurantId}`;
		}
		return { ok: true };
	});
});
var submitForReview_createServerFn_handler = createServerRpc({
	id: "61ba3f2fe94f1d62d1ac095a8699c55e036ac0bf9d788cdc2a5a0d0b7aa0d8c3",
	name: "submitForReview",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => submitForReview.__executeServer(opts));
var submitForReview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(submitForReview_createServerFn_handler, async ({ context, data }) => {
	const { withVendor } = await import("./helpers-DJHrKkmK.mjs").then((n) => n.n).then((n) => n.t);
	return withVendor(context.userId, data.restaurantId, "onboarding.edit", async (sql, ctx) => {
		if (ctx.dataLabel === "SIMULATED") throw new Error("A simulated kitchen cannot be submitted for verification.");
		await sql`
        update restaurants
        set verification_status = 'SUBMITTED', updated_at = now()
        where id = ${ctx.restaurantId} and verification_status in ('DRAFT','REJECTED')
      `;
		await writeAudit(sql, {
			restaurantId: ctx.restaurantId,
			actorUserId: context.userId,
			action: "submit_review",
			entityType: "restaurant",
			entityId: ctx.restaurantId
		});
		return {
			ok: true,
			verificationStatus: "SUBMITTED"
		};
	});
});
var getRestaurant_createServerFn_handler = createServerRpc({
	id: "968a877661d5b7d685f4dd76ae577b3bbe89e9d147677736739a0e152a0f6ba4",
	name: "getRestaurant",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => getRestaurant.__executeServer(opts));
var getRestaurant = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(getRestaurant_createServerFn_handler, async ({ context, data }) => {
	const { withVendor } = await import("./helpers-DJHrKkmK.mjs").then((n) => n.n).then((n) => n.t);
	return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
		const rows = await sql`
        select id, name, display_name, owner_name, phone, email, address, landmark,
               cuisine, diet, description, gstin, fssai_number, pan,
               bank_account, bank_ifsc, bank_name, verification_status, data_label,
               commission_bps, packing_paise, prep_minutes, peak_prep_minutes,
               min_order_paise, emergency_closed, vacation_mode, weekly_holidays, lat, lng
        from restaurants where id = ${ctx.restaurantId} limit 1
      `;
		const hours = await sql`
        select weekday, open_minutes, close_minutes from restaurant_hours
        where restaurant_id = ${ctx.restaurantId} order by weekday, open_minutes
      `;
		const docs = await sql`
        select id, kind, file_name, status, verification_status, byte_size, storage_backend
        from restaurant_documents where restaurant_id = ${ctx.restaurantId}
        order by created_at desc
      `;
		const r = rows[0];
		if (!r) throw new Error("Restaurant not found");
		return {
			membership: ctx,
			restaurant: r,
			hours,
			documents: docs,
			storageConnected: storageAdapter.connected
		};
	});
});
var uploadDocument_createServerFn_handler = createServerRpc({
	id: "ed4703c65195865594064f74168b871f976f5070255c999d796b23fd712a33cc",
	name: "uploadDocument",
	filename: "src/lib/server/api-bootstrap.ts"
}, (opts) => uploadDocument.__executeServer(opts));
var uploadDocument = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(uploadDocument_createServerFn_handler, async ({ context, data }) => {
	const { withVendor } = await import("./helpers-DJHrKkmK.mjs").then((n) => n.n).then((n) => n.t);
	return withVendor(context.userId, data.restaurantId, "documents.upload", async (sql, ctx) => {
		const comma = data.dataUrl.indexOf(",");
		const b64 = comma >= 0 ? data.dataUrl.slice(comma + 1) : data.dataUrl;
		const byteSize = Math.floor(b64.length * 3 / 4);
		const check = validateUpload({
			contentType: data.contentType,
			byteSize,
			kind: "document"
		});
		if (!check.ok) throw new Error(check.error);
		const stored = await storageAdapter.put({
			key: `${ctx.restaurantId}/${data.kind}/${data.fileName}`,
			contentType: data.contentType,
			bytes: new Uint8Array(byteSize)
		});
		const id = newId("doc");
		await sql`
        insert into restaurant_documents (
          id, restaurant_id, kind, file_name, content_type, byte_size,
          storage_backend, storage_key, data_url, status, verification_status
        ) values (
          ${id}, ${ctx.restaurantId}, ${data.kind}, ${data.fileName}, ${data.contentType},
          ${byteSize}, ${stored.backend}, ${stored.key}, ${data.dataUrl.slice(0, 2e5)},
          'uploaded', 'PENDING'
        )
      `;
		return {
			ok: true,
			id,
			storage: "NOT_CONNECTED",
			verificationStatus: "PENDING"
		};
	});
});
//#endregion
export { createRestaurantDraft_createServerFn_handler, getBootstrap_createServerFn_handler, getRestaurant_createServerFn_handler, submitForReview_createServerFn_handler, updateRestaurantProfile_createServerFn_handler, uploadDocument_createServerFn_handler };
