import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { STAFF, CHEMICALS, ANALYSIS_TIME, Assignment } from "@/lib/workData";
import { Send, X, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onSubmit: (data: Omit<Assignment, "id" | "timestamp">) => Promise<void> | void;
  editing?: Assignment | null;
  onCancelEdit?: () => void;
}

export function AssignmentForm({ onSubmit, editing, onCancelEdit }: Props) {
  const [staff, setStaff] = useState("");
  const [chemical, setChemical] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setStaff(editing.staff);
      setChemical(editing.chemical);
      setSampleCount(editing.sampleCount);
    }
  }, [editing]);

  const reset = () => {
    setStaff("");
    setChemical("");
    setSampleCount(1);
  };

  const handleSubmit = async () => {
    if (!staff || !chemical || sampleCount < 1) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const perSample = ANALYSIS_TIME[chemical] ?? 1.5;
    setSubmitting(true);
    try {
      await onSubmit({
        staff,
        chemical,
        sampleCount,
        estimatedHours: perSample * sampleCount,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = !!editing;

  return (
    <div className="glass-card rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {isEditing ? "แก้ไขงาน" : "มอบหมายงาน"}
        </h2>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onCancelEdit?.();
            }}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            ยกเลิก
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">ผู้รับงาน</label>
          <Select value={staff} onValueChange={setStaff}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกผู้รับงาน" />
            </SelectTrigger>
            <SelectContent>
              {STAFF.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">ชื่อสารเคมี</label>
          <Select value={chemical} onValueChange={setChemical}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกสารเคมี" />
            </SelectTrigger>
            <SelectContent>
              {CHEMICALS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">จำนวนตัวอย่าง</label>
          <Input
            type="number"
            min={1}
            value={sampleCount}
            onChange={(e) => setSampleCount(Number(e.target.value))}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {isEditing ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {isEditing ? "บันทึกการแก้ไข" : "ยืนยันส่ง"}
        </Button>
      </div>
      {staff && chemical && (
        <p className="text-sm text-muted-foreground">
          ⏱ เวลาวิเคราะห์โดยประมาณ: {((ANALYSIS_TIME[chemical] ?? 1.5) * sampleCount).toFixed(1)} ชม. / {sampleCount} ตัวอย่าง
        </p>
      )}
    </div>
  );
}
