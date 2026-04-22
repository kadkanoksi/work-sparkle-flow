import { useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, History, Printer, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Assignment, getDateKey, STAFF, SHORT_NAMES, WORK_HOURS, getStaffWorkload } from "@/lib/workData";

type DbRow = {
  id: string;
  staff: string;
  chemical: string;
  sample_count: number;
  estimated_hours: number;
  assignment_date: string;
  created_at: string;
};

const rowToAssignment = (r: DbRow): Assignment & { date: string } => ({
  id: r.id,
  staff: r.staff,
  chemical: r.chemical,
  sampleCount: r.sample_count,
  estimatedHours: Number(r.estimated_hours),
  timestamp: r.created_at,
  date: r.assignment_date,
});

interface Props {
  onSelectDate: (date: Date) => void;
}

export function HistoryReport({ onSelectDate }: Props) {
  const [open, setOpen] = useState(false);
  const [historyDate, setHistoryDate] = useState<Date | undefined>(undefined);

  // Default range: previous Monday-Sunday (last week — for Monday executive briefing)
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  const [rangeFrom, setRangeFrom] = useState<Date>(lastWeekStart);
  const [rangeTo, setRangeTo] = useState<Date>(lastWeekEnd);
  const [printing, setPrinting] = useState(false);

  const handleViewHistory = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      setHistoryDate(date);
      onSelectDate(date);
      setOpen(false);
    },
    [onSelectDate]
  );

  const handlePrintReport = useCallback(async () => {
    if (rangeFrom > rangeTo) {
      toast.error("วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด");
      return;
    }
    setPrinting(true);
    try {
      const fromKey = getDateKey(rangeFrom);
      const toKey = getDateKey(rangeTo);
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .gte("assignment_date", fromKey)
        .lte("assignment_date", toKey)
        .order("assignment_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
        return;
      }

      const rows = (data as DbRow[]).map(rowToAssignment);
      openPrintWindow(rangeFrom, rangeTo, rows);
    } finally {
      setPrinting(false);
    }
  }, [rangeFrom, rangeTo]);

  const setQuickRange = (type: "lastWeek" | "thisWeek" | "last7") => {
    const now = new Date();
    if (type === "lastWeek") {
      setRangeFrom(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
      setRangeTo(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
    } else if (type === "thisWeek") {
      setRangeFrom(startOfWeek(now, { weekStartsOn: 1 }));
      setRangeTo(endOfWeek(now, { weekStartsOn: 1 }));
    } else {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setRangeFrom(from);
      setRangeTo(now);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <History className="h-4 w-4" />
          ประวัติย้อนหลัง
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            ประวัติการมอบหมายงาน
          </SheetTitle>
          <SheetDescription>เลือกวันที่เพื่อดูข้อมูลย้อนหลัง หรือพิมพ์รายงานสรุปช่วงเวลา</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* View single day */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              ดูข้อมูลรายวัน
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {historyDate
                    ? format(historyDate, "d MMMM yyyy", { locale: th })
                    : "เลือกวันที่เพื่อดูประวัติ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={historyDate}
                  onSelect={handleViewHistory}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </section>

          <div className="border-t border-border" />

          {/* Print report */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              พิมพ์รายงานสรุป (Executive Weekly)
            </h3>
            <p className="text-xs text-muted-foreground">
              เลือกช่วงวันที่เพื่อสร้างรายงาน Daily Summary สำหรับนำเสนอผู้บริหารทุกวันจันทร์
            </p>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => setQuickRange("lastWeek")}>
                อาทิตย์ที่แล้ว
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setQuickRange("thisWeek")}>
                อาทิตย์นี้
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setQuickRange("last7")}>
                7 วันล่าสุด
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">จากวันที่</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(rangeFrom, "d MMM yy", { locale: th })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rangeFrom}
                      onSelect={(d) => d && setRangeFrom(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ถึงวันที่</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(rangeTo, "d MMM yy", { locale: th })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rangeTo}
                      onSelect={(d) => d && setRangeTo(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button onClick={handlePrintReport} disabled={printing} className="w-full gap-2">
              {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              พิมพ์รายงาน
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================
// Report rendering — opens a new window with print-styled HTML
// =============================================================
function openPrintWindow(
  from: Date,
  to: Date,
  rows: (Assignment & { date: string })[]
) {
  const days = eachDayOfInterval({ start: from, end: to });
  const fromLabel = format(from, "d MMMM yyyy", { locale: th });
  const toLabel = format(to, "d MMMM yyyy", { locale: th });

  // Aggregate per day
  const perDay = days.map((d) => {
    const key = getDateKey(d);
    const dayRows = rows.filter((r) => r.date === key);
    return { date: d, key, rows: dayRows };
  });

  // Aggregate per staff (whole period)
  const perStaff = STAFF.map((name) => {
    const staffRows = rows.filter((r) => r.staff === name);
    const totalSamples = staffRows.reduce((s, r) => s + r.sampleCount, 0);
    const totalHours = staffRows.reduce((s, r) => s + r.estimatedHours, 0);
    const taskCount = staffRows.length;
    return { name, totalSamples, totalHours, taskCount };
  });

  // Aggregate per chemical (whole period)
  const chemicalMap = new Map<string, { samples: number; tasks: number }>();
  rows.forEach((r) => {
    const cur = chemicalMap.get(r.chemical) ?? { samples: 0, tasks: 0 };
    cur.samples += r.sampleCount;
    cur.tasks += 1;
    chemicalMap.set(r.chemical, cur);
  });
  const perChemical = Array.from(chemicalMap.entries())
    .map(([chemical, v]) => ({ chemical, ...v }))
    .sort((a, b) => b.samples - a.samples);

  const totalSamples = rows.reduce((s, r) => s + r.sampleCount, 0);
  const totalHours = rows.reduce((s, r) => s + r.estimatedHours, 0);
  const totalTasks = rows.length;
  const workingDays = perDay.filter((d) => d.rows.length > 0).length;
  const capacity = STAFF.length * WORK_HOURS * Math.max(workingDays, 1);
  const utilization = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;

  // Calculate overload summary per staff for the entire period
  const overloadSummary = STAFF.map((name) => {
    const staffRows = rows.filter((r) => r.staff === name);
    const totalHoursWorked = staffRows.reduce((s, r) => s + r.estimatedHours, 0);
    const staffWorkingDays = perDay.filter((d) =>
      d.rows.some((r) => r.staff === name)
    ).length;
    const staffCapacity = staffWorkingDays > 0 ? staffWorkingDays * WORK_HOURS : WORK_HOURS;
    const overloadPercent = Math.max(0, Math.round(((totalHoursWorked - staffCapacity) / staffCapacity) * 100));
    const excessHours = Math.max(0, totalHoursWorked - staffCapacity);
    return {
      name,
      totalHours: totalHoursWorked,
      capacity: staffCapacity,
      overloadPercent,
      excessHours,
      isOver: totalHoursWorked > staffCapacity,
      workingDays: staffWorkingDays,
    };
  }).sort((a, b) => b.overloadPercent - a.overloadPercent);

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>รายงานการมอบหมายงาน ${fromLabel} - ${toLabel}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Sarabun', sans-serif;
    color: #1a2332;
    background: #fff;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.5;
  }
  .header {
    border-bottom: 3px solid hsl(210, 60%, 45%);
    padding-bottom: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header h1 {
    font-size: 22px;
    font-weight: 700;
    color: hsl(210, 60%, 30%);
    letter-spacing: -0.3px;
  }
  .header .subtitle {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
  }
  .header .meta {
    text-align: right;
    font-size: 11px;
    color: #64748b;
  }
  .meta strong { color: #1a2332; font-size: 13px; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
  }
  .kpi .label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .kpi .value {
    font-size: 22px;
    font-weight: 700;
    color: hsl(210, 60%, 30%);
  }
  .kpi .unit { font-size: 12px; color: #64748b; font-weight: 400; margin-left: 4px; }

  h2.section-title {
    font-size: 14px;
    font-weight: 600;
    color: hsl(210, 60%, 30%);
    margin: 24px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2.section-title::before {
    content: '';
    width: 4px;
    height: 14px;
    background: hsl(170, 50%, 42%);
    border-radius: 2px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    font-size: 12px;
  }
  thead th {
    background: hsl(210, 30%, 94%);
    color: hsl(210, 60%, 25%);
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1.5px solid hsl(210, 60%, 45%);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  tbody td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.center, th.center { text-align: center; }
  .day-header {
    background: hsl(170, 50%, 95%) !important;
    color: hsl(170, 50%, 25%);
    font-weight: 600;
    padding: 6px 10px;
    border-top: 2px solid hsl(170, 50%, 42%);
  }
  .empty-day {
    color: #94a3b8;
    font-style: italic;
    padding: 6px 10px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 11px;
  }

  .overload { color: hsl(0, 70%, 45%); font-weight: 600; }
  .normal { color: hsl(150, 50%, 35%); }

  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media print {
    body { padding: 16px 20px; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
  .print-btn {
    position: fixed;
    top: 16px;
    right: 16px;
    background: hsl(210, 60%, 45%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .print-btn:hover { background: hsl(210, 60%, 38%); }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ พิมพ์รายงาน</button>

  <div class="header">
    <div>
      <h1>รายงานสรุปการมอบหมายงานวิเคราะห์</h1>
      <div class="subtitle">Weekly Executive Summary — ภาพรวมการปฏิบัติงานวิเคราะห์เคมี</div>
    </div>
    <div class="meta">
      <div><strong>${fromLabel}</strong></div>
      <div>ถึง <strong>${toLabel}</strong></div>
      <div style="margin-top: 6px;">พิมพ์เมื่อ: ${format(new Date(), "d MMM yyyy HH:mm", { locale: th })}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="label">ตัวอย่างทั้งหมด</div>
      <div class="value">${totalSamples.toLocaleString()}<span class="unit">ตัวอย่าง</span></div>
    </div>
    <div class="kpi">
      <div class="label">งานที่มอบหมาย</div>
      <div class="value">${totalTasks}<span class="unit">รายการ</span></div>
    </div>
    <div class="kpi">
      <div class="label">ชั่วโมงรวม</div>
      <div class="value">${totalHours.toFixed(1)}<span class="unit">ชม.</span></div>
    </div>
    <div class="kpi">
      <div class="label">การใช้กำลังการผลิต</div>
    <div class="value">${utilization}<span class="unit">%</span></div>
    </div>
  </div>

  <!-- Overload Summary Section -->
  <h2 class="section-title">สรุปการคิด Overload ของบุคคล (สะสมรายอาทิตย์)</h2>
  <table>
    <thead>
      <tr>
        <th>ผู้ปฏิบัติงาน</th>
        <th class="num">จำนวนวันทำงาน</th>
        <th class="num">ชั่วโมงทำงาน (ชม.)</th>
        <th class="num">กำลังการผลิต (ชม.)</th>
        <th class="num">Overload %</th>
        <th class="center">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${overloadSummary
        .filter((s) => s.workingDays > 0)
        .map(
          (s) => `
        <tr style="${s.isOver ? 'color: hsl(0, 70%, 45%); background: hsl(0, 70%, 97%);' : 'color: hsl(150, 50%, 35%);'}">
          <td><strong>${SHORT_NAMES[s.name] ?? s.name}</strong></td>
          <td class="num">${s.workingDays}</td>
          <td class="num">${s.totalHours.toFixed(1)}</td>
          <td class="num">${s.capacity.toFixed(1)}</td>
          <td class="num">${s.overloadPercent > 0 ? '+' + s.overloadPercent + '%' : '0%'}</td>
          <td class="center"><strong>${s.isOver ? 'Overload (+' + s.excessHours.toFixed(1) + ' ชม.)' : 'ปกติ'}</strong></td>
        </tr>`
        )
        .join('')}
      <tr style="font-weight: 600; background: hsl(210, 30%, 94%);">
        <td>รวม</td>
        <td class="num">${overloadSummary.filter((s) => s.workingDays > 0).length} คน</td>
        <td class="num">${totalHours.toFixed(1)}</td>
        <td class="num">${capacity.toFixed(1)}</td>
        <td class="num">${utilization}%</td>
        <td class="center">${overloadSummary.filter((s) => s.isOver).length > 0 ? overloadSummary.filter((s) => s.isOver).length + ' คนทำงานเกินค่า' : 'ทุกคนทำงานปกติ'}</td>
      </tr>
    </tbody>
  </table>
        <td class="num">${totalHours.toFixed(1)}</td>
        <td class="num">${capacity.toFixed(1)}</td>
        <td class="num">${utilization}%</td>
        <td class="center">${overloadSummary.filter((s) => s.isOver).length > 0 ? overloadSummary.filter((s) => s.isOver).length + ' 	 ' : '		2	'}</td>
      </tr>
    </tbody>
  </table>

  <div class="two-col">
    <div>
      <h2 class="section-title">ภาระงานรายบุคคล</h2>
      <table>
        <thead>
          <tr>
            <th>ผู้ปฏิบัติงาน</th>
            <th class="num">งาน</th>
            <th class="num">ตัวอย่าง</th>
            <th class="num">ชม.</th>
          </tr>
        </thead>
        <tbody>
          ${perStaff
            .map(
              (s) => `
            <tr>
              <td>${SHORT_NAMES[s.name] ?? s.name}</td>
              <td class="num">${s.taskCount}</td>
              <td class="num">${s.totalSamples}</td>
              <td class="num">${s.totalHours.toFixed(1)}</td>
            </tr>`
            )
            .join("")}
          <tr style="font-weight: 600; background: hsl(210, 30%, 94%);">
            <td>รวม</td>
            <td class="num">${totalTasks}</td>
            <td class="num">${totalSamples}</td>
            <td class="num">${totalHours.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h2 class="section-title">สารเคมีที่วิเคราะห์ (Top)</h2>
      <table>
        <thead>
          <tr>
            <th>สารเคมี</th>
            <th class="num">งาน</th>
            <th class="num">ตัวอย่าง</th>
          </tr>
        </thead>
        <tbody>
          ${
            perChemical.length === 0
              ? `<tr><td colspan="3" class="empty-day">ไม่มีข้อมูล</td></tr>`
              : perChemical
                  .slice(0, 12)
                  .map(
                    (c) => `
            <tr>
              <td>${c.chemical}</td>
              <td class="num">${c.tasks}</td>
              <td class="num">${c.samples}</td>
            </tr>`
                  )
                  .join("")
          }
        </tbody>
      </table>
    </div>
  </div>

  <h2 class="section-title">รายละเอียดประจำวัน (Daily Breakdown)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 22%">ผู้ปฏิบัติงาน</th>
        <th style="width: 38%">สารเคมี</th>
        <th class="num" style="width: 15%">ตัวอย่าง</th>
        <th class="num" style="width: 15%">ชม.</th>
        <th class="center" style="width: 10%">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${perDay
        .map((day) => {
          const dayLabel = format(day.date, "EEEE d MMM yyyy", { locale: th });
          if (day.rows.length === 0) {
            return `
              <tr><td colspan="5" class="day-header">${dayLabel}</td></tr>
              <tr><td colspan="5" class="empty-day">— ไม่มีการมอบหมายงาน —</td></tr>
            `;
          }
          // workload per staff for this day
          const dayStaff = STAFF.map((name) => {
            const w = getStaffWorkload(day.rows as Assignment[], name);
            return { name, ...w };
          });
          const dayTotalSamples = day.rows.reduce((s, r) => s + r.sampleCount, 0);
          const dayTotalHours = day.rows.reduce((s, r) => s + r.estimatedHours, 0);

          const taskRows = day.rows
            .map((r) => {
              const w = dayStaff.find((s) => s.name === r.staff);
              const isOver = w && w.totalHours > WORK_HOURS;
              return `
              <tr>
                <td>${SHORT_NAMES[r.staff] ?? r.staff}</td>
                <td>${r.chemical}</td>
                <td class="num">${r.sampleCount}</td>
                <td class="num">${r.estimatedHours.toFixed(1)}</td>
                <td class="center"><span class="${isOver ? "overload" : "normal"}">${
                isOver ? "Overload" : "ปกติ"
              }</span></td>
              </tr>`;
            })
            .join("");

          return `
            <tr><td colspan="5" class="day-header">${dayLabel} — ${day.rows.length} งาน, ${dayTotalSamples} ตัวอย่าง, ${dayTotalHours.toFixed(1)} ชม.</td></tr>
            ${taskRows}
          `;
        })
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    ระบบแจกจ่ายงานวิเคราะห์ — รายงานสรุปสำหรับการประชุมผู้บริหารประจำสัปดาห์
  </div>

  <script>
    // Auto-trigger print dialog on load (user can cancel)
    window.addEventListener('load', () => setTimeout(() => window.print(), 400));
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) {
    toast.error("กรุณาอนุญาต popup เพื่อพิมพ์รายงาน");
    return;
  }
  w.document.write(html);
  w.document.close();
}
