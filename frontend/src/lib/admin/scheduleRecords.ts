import scheduleData from "@/data/construction-schedule.json";
import { readJson, writeJson } from "@/lib/admin/store";
import type { ConstructionSchedule } from "@/types/schedule";

const SCHEDULE_KEY = "mutiaraconnect.construction-schedule";

export function normalizeSchedule(item: ConstructionSchedule): ConstructionSchedule {
    return {
        ...item,
        stationIds: [...new Set(item.stationIds ?? [])],
        closureIds: [...new Set(item.closureIds ?? [])],
        announcementIds: [...new Set(item.announcementIds ?? [])],
    };
}

export const readScheduleRecords = () => readJson<ConstructionSchedule[]>(SCHEDULE_KEY, scheduleData as ConstructionSchedule[])
    .map(normalizeSchedule);
export const writeScheduleRecords = (items: ConstructionSchedule[]) => writeJson(SCHEDULE_KEY, items);
