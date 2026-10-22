import { WORKSPACE_TYPE } from "../constants.js";

/**
 * Feature flag helper for workspace type (PG vs SOCIETY).
 * PG is the primary MVP workspace; SOCIETY is enabled as a second workspace.
 */
export function getWorkspaceType(tenant) {
  return tenant?.type || WORKSPACE_TYPE.PG;
}

export function isPg(tenant) {
  return getWorkspaceType(tenant) === WORKSPACE_TYPE.PG;
}

export function isSociety(tenant) {
  return getWorkspaceType(tenant) === WORKSPACE_TYPE.SOCIETY;
}

export function getWorkspaceFeatures(tenant) {
  const pg = isPg(tenant);
  return {
    workspaceType: pg ? WORKSPACE_TYPE.PG : WORKSPACE_TYPE.SOCIETY,
    roomsAndBeds: pg,
    perPersonBilling: pg,
    depositsAndRefunds: pg,
    checkInOut: pg,
    idProofDocuments: pg,
    committeeGovernance: !pg,
    flatsAndBlocks: !pg,
    specialCollections: !pg,
    meetingsAndPolls: !pg,
  };
}

