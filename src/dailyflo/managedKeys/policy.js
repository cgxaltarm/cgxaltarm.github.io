import { getAllowedModelsForKey } from "../../lib/db/repos/managedKeysRepo.js";
import { getCombos } from "../../lib/db/repos/combosRepo.js";

export async function filterModelsListForManagedKey(managedKeyRecord, modelsList) {
  if (!managedKeyRecord || managedKeyRecord.status !== "active") {
    return [];
  }

  const allowedModelIds = await getAllowedModelsForKey(managedKeyRecord.id);
  const allowedSet = new Set(allowedModelIds);

  const combos = await getCombos();
  const comboMap = new Map(combos.map((c) => [c.name, c.models || []]));

  return modelsList.filter((model) => {
    const mId = model.id;

    // Direct model match
    if (allowedSet.has(mId)) return true;

    // Check combo
    if (comboMap.has(mId)) {
      const targets = comboMap.get(mId);
      if (!Array.isArray(targets) || targets.length === 0) return false;
      return targets.every((t) => allowedSet.has(t));
    }

    return false;
  });
}

export async function isModelAllowedForManagedKey(managedKeyRecord, requestedModel) {
  if (!managedKeyRecord || managedKeyRecord.status !== "active") {
    return false;
  }

  const allowedModelIds = await getAllowedModelsForKey(managedKeyRecord.id);
  const allowedSet = new Set(allowedModelIds);

  // Direct match
  if (allowedSet.has(requestedModel)) return true;

  // Normalized prefix/suffix match (e.g. kiro/claude-sonnet-5-thinking -> kiro/claude-sonnet-5)
  const baseModel = requestedModel.replace(/-(thinking|agentic)(-agentic)?$/, "");
  if (allowedSet.has(baseModel)) return true;

  // Combo check
  const combos = await getCombos();
  const combo = combos.find((c) => c.name === requestedModel);
  if (combo && Array.isArray(combo.models) && combo.models.length > 0) {
    return combo.models.every((t) => allowedSet.has(t));
  }

  return false;
}
