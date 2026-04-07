import { Site, SiteProcess } from "@/lib/types";
import { processMasters } from "./processes";
import { addBusinessDays } from "@/lib/utils";

function generateProcesses(startDate: string): SiteProcess[] {
  let currentDate = new Date(startDate);
  const processes: SiteProcess[] = [];

  for (const master of processMasters) {
    const start = new Date(currentDate);
    const totalDays = master.durationDays + master.dryingDays;
    const end = addBusinessDays(start, totalDays);

    processes.push({
      ...master,
      status: "pending",
      scheduledStart: start.toISOString().split("T")[0],
      scheduledEnd: end.toISOString().split("T")[0],
    });

    currentDate = new Date(end);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return processes;
}

export const sampleSites: Site[] = [
  {
    id: "site-1",
    name: "高石市 田中邸",
    address: "大阪府高石市取石3丁目",
    ownerName: "田中 太郎",
    buildingType: "house",
    paintArea: 150,
    startDate: "2026-04-08",
    status: "in_progress",
    processes: generateProcesses("2026-04-08"),
  },
  {
    id: "site-2",
    name: "堺市 山田マンション",
    address: "大阪府堺市北区中百舌鳥町",
    ownerName: "山田 花子",
    buildingType: "apartment",
    paintArea: 800,
    startDate: "2026-04-10",
    status: "scheduled",
    processes: generateProcesses("2026-04-10"),
  },
  {
    id: "site-3",
    name: "岸和田市 市民会館",
    address: "大阪府岸和田市岸城町",
    ownerName: "岸和田市役所",
    buildingType: "public",
    paintArea: 1200,
    startDate: "2026-04-14",
    status: "scheduled",
    processes: generateProcesses("2026-04-14"),
  },
];
