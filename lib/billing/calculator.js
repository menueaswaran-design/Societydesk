import { CALCULATION_TYPE } from "../constants.js";

/**
 * Amount of a single fee configuration for one flat.
 * Returns 0 when the charge does not apply to that flat.
 */
export function calculateFeeAmount(config, flat) {
  switch (config.calculationType) {
    case CALCULATION_TYPE.FIXED:
      return Math.max(0, Math.round(config.amount || 0));

    case CALCULATION_TYPE.PER_SQFT: {
      const sqFt = Number(flat.sqFt) || 0;
      if (sqFt <= 0) return 0;
      return Math.max(0, Math.round((config.rate || 0) * sqFt));
    }

    case CALCULATION_TYPE.FLAT_TYPE: {
      const map = parseFlatTypeAmounts(config.flatTypeAmounts);
      const amount = map?.[flat.flatType];
      return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
    }

    default:
      return 0;
  }
}

/** Parking-only charges are skipped for flats without a parking slot. */
function chargeApplies(config, flat) {
  if (config.appliesToParkingOnly && !flat.parkingSlot) return false;
  return true;
}

/**
 * Build the full charge breakdown for one flat.
 * Returns { items: [{name, type, amount}], subtotal }.
 */
export function calculateCharges(configs, flat) {
  const items = [];
  let subtotal = 0;

  for (const config of configs) {
    if (!config.active) continue;
    if (!chargeApplies(config, flat)) continue;

    const amount = calculateFeeAmount(config, flat);
    if (amount <= 0) continue;

    items.push({ name: config.name, type: config.type, amount });
    subtotal += amount;
  }

  return { items, subtotal };
}

export function parseFlatTypeAmounts(json) {
  if (!json) return null;
  if (typeof json === "object") return json;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeFlatTypeAmounts(map) {
  return map ? JSON.stringify(map) : null;
}