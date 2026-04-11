import { useState, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dashboard } from "@/components/Dashboard";
import { AssignmentForm } from "@/components/AssignmentForm";
import { WorkloadChart } from "@/components/WorkloadChart";
import {
  Assignment,
  getDateKey,
  loadAssignments,
  saveAssignments,
} from "@/lib/workData";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = getDateKey(selectedDate);
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadAssignments(dateKey));

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setAssignments(loadAssignments(getDateKey(date)));
  }, []);

  const handleAssign = useCallback(
    (assignment: Assignment) => {
      const updated = [...assignments, assignment];
      setAssignments(updated);
      saveAssignments(dateKey, updated);
    },
    [assignments, dateKey]
  );

  const isToday = getDateKey(selectedDate) === getDateKey(new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">ระบบแจกจ่ายงาน</h1>
              <p className="text-xs text-muted-foreground">เคมีเกษตรภัณฑ์</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("gap-2 font-normal", !isToday && "border-primary/40")}>
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "d MMMM yyyy", { locale: th })}
                {isToday && (
                  <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">วันนี้</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            สถานะการรับงาน
          </h2>
          <Dashboard assignments={assignments} />
        </section>

        {/* Charts */}
        <WorkloadChart assignments={assignments} />

        {/* Assignment Form */}
        {isToday && (
          <section>
            <AssignmentForm onAssign={handleAssign} />
          </section>
        )}

        {!isToday && (
          <div className="glass-card rounded-lg p-6 text-center text-muted-foreground text-sm">
            📋 ดูข้อมูลย้อนหลังวันที่ {format(selectedDate, "d MMMM yyyy", { locale: th })} — ไม่สามารถเพิ่มงานได้
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
