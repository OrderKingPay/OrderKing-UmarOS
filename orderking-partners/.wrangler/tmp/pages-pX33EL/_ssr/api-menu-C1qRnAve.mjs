import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { n as createSsrRpc } from "./hdmaster-order-transition-BLAHw5vH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-menu-C1qRnAve.js
var getMenu = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("90df5330afa2cbcd2b36a57205c2e5ed0c049d75f39bdaf478558027f404a733"));
var saveCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("30348f87e619f8662a5dc036d60ed7e183c489fbec3f309705a699417ef37726"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8f3bd1d440450ed0f5ff607231bade0c9ea707f61649577cdadedb57e4871fc8"));
var getMenuItemUploadUrl = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("208d1a750a2a998423ff548a698d590d84f77714b839c033445fe817cbaa0c59"));
var saveItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("e24ee3b4736407944027093846ccfd445668fe7163d100966d8e70a992df4621"));
var duplicateItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("d0b4a08bc3197fd2c0f70f1d93767554271eed24e61cb7d1c0eabe6affca330f"));
var setAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("d78318627b6eb20ff3dacb22c44fa8c7ab2037754a98ad850b00a4934a40db14"));
var saveAddon = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("765c2a93c0fe4e4b8f84db58633134e6422b1ca2937720ecacf437e3eb7d37ef"));
var listPublicCatalog = createServerFn({ method: "GET" }).handler(createSsrRpc("835cba97c2ad33288b1f0ea6e71244c3df82c8ccd59de419540727374753a8fe"));
//#endregion
export { saveAddon as a, setAvailability as c, listPublicCatalog as i, getMenu as n, saveCategory as o, getMenuItemUploadUrl as r, saveItem as s, duplicateItem as t };
