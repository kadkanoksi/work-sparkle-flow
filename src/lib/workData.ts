export const STAFF = [
  "นางสาวปัญจพร สารจันทร์",
  "นางสาวเกศกนก สิริเหล่าตระกูล",
  "นางสาวรัตติยา ผ่องทอง",
  "นางสาวนุชจรินทร์ ดวงเนตร",
  "นายนคร อ่อนคง",
  "นางสาวแก้ววิศา วาระเพียง",
] as const;

export const SHORT_NAMES: Record<string, string> = {
  "นางสาวปัญจพร สารจันทร์": "ปัญจพร",
  "นางสาวเกศกนก สิริเหล่าตระกูล": "เกศกนก",
  "นางสาวรัตติยา ผ่องทอง": "รัตติยา",
  "นางสาวนุชจรินทร์ ดวงเนตร": "นุชจรินทร์",
  "นายนคร อ่อนคง": "นคร",
  "นางสาวแก้ววิศา วาระเพียง": "แก้ววิศา",
};

// Agricultural chemicals - common pesticide / agrochemical active ingredients
export const CHEMICALS = [
  "Chlorpyrifos",
  "Cypermethrin",
  "Carbendazim",
  "Glyphosate",
  "Paraquat",
  "Atrazine",
  "Mancozeb",
  "Imidacloprid",
  "Abamectin",
  "Fipronil",
  "Metalaxyl",
  "Profenofos",
  "Difenoconazole",
  "Lambda-cyhalothrin",
  "Emamectin benzoate",
  "Thiamethoxam",
  "Acetamiprid",
  "Azoxystrobin",
  "Chlorothalonil",
  "Propiconazole",
] as const;

// Estimated analysis time in hours per sample for each chemical
export const ANALYSIS_TIME: Record<string, number> = {
  "Chlorpyrifos": 1.5,
  "Cypermethrin": 1.5,
  "Carbendazim": 2,
  "Glyphosate": 2.5,
  "Paraquat": 2.5,
  "Atrazine": 1,
  "Mancozeb": 2,
  "Imidacloprid": 1.5,
  "Abamectin": 2,
  "Fipronil": 1.5,
  "Metalaxyl": 1,
  "Profenofos": 1.5,
  "Difenoconazole": 2,
  "Lambda-cyhalothrin": 1.5,
  "Emamectin benzoate": 2,
  "Thiamethoxam": 1.5,
  "Acetamiprid": 1,
  "Azoxystrobin": 1.5,
  "Chlorothalonil": 1,
  "Propiconazole": 1.5,
};

export const WORK_HOURS = 8; // 08:00 - 17:00 minus 1hr lunch = 8 hrs

export interface Assignment {
  id: string;
  staff: string;
  chemical: string;
  sampleCount: number;
  estimatedHours: number;
  timestamp: string;
}

export function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function loadAssignments(dateKey: string): Assignment[] {
  const raw = localStorage.getItem(`assignments-${dateKey}`);
  return raw ? JSON.parse(raw) : [];
}

export function saveAssignments(dateKey: string, assignments: Assignment[]): void {
  localStorage.setItem(`assignments-${dateKey}`, JSON.stringify(assignments));
}

export function getStaffWorkload(assignments: Assignment[], staffName: string) {
  const tasks = assignments.filter((a) => a.staff === staffName);
  const totalSamples = tasks.reduce((s, a) => s + a.sampleCount, 0);
  const totalHours = tasks.reduce((s, a) => s + a.estimatedHours, 0);
  const overloadPercent = Math.round((totalHours / WORK_HOURS) * 100);
  return { tasks, totalSamples, totalHours, overloadPercent };
}
