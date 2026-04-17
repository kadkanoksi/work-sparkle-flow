import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, FlaskConical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dashboard } from "@/components/Dashboard";
import { AssignmentForm } from "@/components/AssignmentForm";
import { WorkloadChart } from "@/components/WorkloadChart";
import { Assignment, getDateKey } from "@/lib/workData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DbRow = {
  id: string;
  staff: string;
  chemical: string;
  sample_count: number;
  estimated_hours: number;
  assignment_date: string;
  created_at: string;
};

const rowToAssignment = (r: DbRow): Assignment => ({
  id: r.id,
  staff: r.staff,
  chemical: r.chemical,
  sampleCount: r.sample_count,
  estimatedHours: Number(r.estimated_hours),
  timestamp: r.created_at,
});

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const dateKey = getDateKey(selectedDate);
  const isToday = dateKey === getDateKey(new Date());

  const fetchAssignments = useCallback(async () => {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("assignment_date", dateKey)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("โหลดข้อมูลล้มเหลว: " + error.message);
      return;
    }
    setAssignments((data as DbRow[]).map(rowToAssignment));
  }, [dateKey]);

  // Fetch + realtime subscription (combined to avoid race conditions)
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAssignments().finally(() => {
      if (active) setLoading(false);
    });

    const channel = supabase
      .channel(`assignments-rt-${dateKey}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        (payload) => {
          // Filter by current date on the client to avoid filter-syntax issues
          const row = (payload.new ?? payload.old) as DbRow | undefined;
          if (!row || row.assignment_date !== dateKey) return;

          if (payload.eventType === "INSERT") {
            const r = payload.new as DbRow;
            setAssignments((prev) =>
              prev.some((a) => a.id === r.id) ? prev : [...prev, rowToAssignment(r)]
            );
          } else if (payload.eventType === "UPDATE") {
            const r = payload.new as DbRow;
            setAssignments((prev) =>
              prev.map((a) => (a.id === r.id ? rowToAssignment(r) : a))
            );
          } else if (payload.eventType === "DELETE") {
            const r = payload.old as DbRow;
            setAssignments((prev) => prev.filter((a) => a.id !== r.id));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [dateKey, fetchAssignments]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setEditing(null);
  }, []);

  const handleSubmit = useCallback(
    async (data: Omit<Assignment, "id" | "timestamp">) => {
      if (editing) {
        const { error } = await supabase
          .from("assignments")
          .update({
            staff: data.staff,
            chemical: data.chemical,
            sample_count: data.sampleCount,
            estimated_hours: data.estimatedHours,
          })
          .eq("id", editing.id);
        if (error) {
          toast.error("แก้ไขล้มเหลว: " + error.message);
          return;
        }
        toast.success("บันทึกการแก้ไขเรียบร้อย");
        setEditing(null);
      } else {
        const { error } = await supabase.from("assignments").insert({
          staff: data.staff,
          chemical: data.chemical,
          sample_count: data.sampleCount,
          estimated_hours: data.estimatedHours,
          assignment_date: dateKey,
        });
        if (error) {
          toast.error("บันทึกล้มเหลว: " + error.message);
          return;
        }
        toast.success("มอบหมายงานเรียบร้อย");
      }
      // Fallback refetch in case realtime is delayed
      fetchAssignments();
    },
    [editing, dateKey, fetchAssignments]
  );

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      toast.error("ลบล้มเหลว: " + error.message);
      return;
    }
    toast.success("ลบงานเรียบร้อย");
    if (editing?.id === id) setEditing(null);
  }, [editing]);

  const handleEdit = useCallback((a: Assignment) => {
    setEditing(a);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              สถานะการรับงาน
            </h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Dashboard
            assignments={assignments}
            canEdit={isToday}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>

        {/* Charts */}
        <WorkloadChart assignments={assignments} />

        {/* Assignment Form */}
        {isToday && (
          <section>
            <AssignmentForm
              onSubmit={handleSubmit}
              editing={editing}
              onCancelEdit={() => setEditing(null)}
            />
          </section>
        )}

        {!isToday && (
          <div className="glass-card rounded-lg p-6 text-center text-muted-foreground text-sm">
            📋 ดูข้อมูลย้อนหลังวันที่ {format(selectedDate, "d MMMM yyyy", { locale: th })} — ไม่สามารถเพิ่ม/แก้ไขได้
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
