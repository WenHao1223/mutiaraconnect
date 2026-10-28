import closureData from "@/data/closures.json";
import { readJson, writeJson } from "@/lib/admin/store";
import type { RoadClosure } from "@/types/road-closure";

// Storage access stays separate from publication and schedule services to avoid circular imports.
const CLOSURES_KEY = "mutiaraconnect.closures";

export const readClosureRecords = () => readJson<RoadClosure[]>(CLOSURES_KEY, closureData as RoadClosure[]);
export const writeClosureRecords = (items: RoadClosure[]) => writeJson(CLOSURES_KEY, items);
