/** Hardware data shared by the planner and assembly features. */
export * from "./types";
export { CATALOG, CONNECTORS, FASTENERS, HAS_UNVERIFIED_DATA, connectorAccepts, getConnector, getPart, getScrew } from "./catalog";
export { EMPTY_BUILD, PRESET_BUILDS, buildPrice, loadBuild, resolveBuild, saveBuild } from "./build";
export { PSU_HEADROOM_WARN, estimatePowerW } from "./power";
