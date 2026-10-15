import { create } from "zustand";
import { EMPTY_BUILD, PRESET_BUILDS, saveBuild, type Build, type CategoryId, type Goal } from "@shared/hardware";
import { CATEGORIES } from "../constants/categories";

interface PlannerState {
  build: Build;
  goal: Goal | null;
  budget: number | null;
  active: CategoryId;
  setGoal: (goal: Goal) => void;
  setBudget: (budget: number | null) => void;
  setActive: (c: CategoryId) => void;
  choose: (category: CategoryId, id: string) => void;
  clear: (category: CategoryId) => void;
  setFanCount: (n: number) => void;
  applyPreset: (presetId: string) => void;
  hydrate: (build: Build) => void;
  reset: () => void;
}

const next = (c: CategoryId): CategoryId => {
  const i = CATEGORIES.findIndex((x) => x.id === c);
  return CATEGORIES[Math.min(i + 1, CATEGORIES.length - 1)]?.id ?? c;
};

export const usePlannerStore = create<PlannerState>()((set, get) => {
  const commit = (build: Build) => {
    saveBuild(build);
    set({ build });
  };
  return {
    build: EMPTY_BUILD,
    goal: null,
    budget: 1000,
    active: "cpu",
    setGoal: (goal) => set({ goal }),
    setBudget: (budget) => set({ budget }),
    setActive: (active) => set({ active }),
    choose: (category, id) => {
      const b = get().build;
      if (category === "storage") {
        const has = b.storageIds.includes(id);
        commit({ ...b, storageIds: has ? b.storageIds.filter((x) => x !== id) : [...b.storageIds, id] });
        return;
      }
      if (category === "fan") {
        commit({ ...b, fanId: id, fanCount: Math.max(1, b.fanCount) });
        return;
      }
      commit({ ...b, [`${category}Id`]: id } as Build);
      set({ active: next(category) });
    },
    clear: (category) => {
      const b = get().build;
      if (category === "storage") commit({ ...b, storageIds: [] });
      else if (category === "fan") commit({ ...b, fanId: null, fanCount: 0 });
      else commit({ ...b, [`${category}Id`]: null } as Build);
    },
    setFanCount: (n) => commit({ ...get().build, fanCount: Math.max(0, Math.min(5, n)) }),
    applyPreset: (presetId) => {
      const p = PRESET_BUILDS.find((x) => x.id === presetId);
      if (p) commit({ ...p.build, storageIds: [...p.build.storageIds] });
    },
    hydrate: (build) => set({ build }),
    reset: () => commit(EMPTY_BUILD),
  };
});
