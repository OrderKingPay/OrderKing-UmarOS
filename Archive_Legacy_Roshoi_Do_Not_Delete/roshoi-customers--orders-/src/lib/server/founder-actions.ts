import { createServerFn } from "@tanstack/react-start";
import { 
  getCuratedClientLeadsFromDb,
  getUniversalPlatformsFromDb,
  getCuratedRemoteGigsFromDb,
  getSeparableModulesFromDb,
  getEnterpriseBlueprintsFromDb
} from "./founder-data.server";

export const getCuratedClientLeadsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getCuratedClientLeadsFromDb();
});

export const getUniversalPlatformsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getUniversalPlatformsFromDb();
});

export const getCuratedRemoteGigsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getCuratedRemoteGigsFromDb();
});

export const getSeparableModulesFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getSeparableModulesFromDb();
});

export const getEnterpriseBlueprintsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getEnterpriseBlueprintsFromDb();
});
