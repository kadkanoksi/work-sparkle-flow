import { useState } from "react";
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
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onAssign: (assignment: Assignment) => void;
}

export function AssignmentForm({ onAssign }: Props) {
  const [staff, setStaff] = useState("");
  const [chemical, setChemical] = useState("");
  const [sampleCount, setSampleCount] = useState(1);

  const handleSubmit = () => {
    if (!staff || !chemical || sampleCount < 1) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const perSample = ANALYSIS_TIME[chemical] ?? 1.5;
    const assignment: Assignment = {
      id: crypto.randomUUID(),
      staff,
      chemical,
      sampleCount,
      estimatedHours: perSample * sampleCount,
      timestamp: new Date().toISOString(),
    };
    onAssign(assignment);
    setStaff("");
    setChemical("");
    setSampleCount(1);
    toast.success("มอบหมายงานเรียบร้อย");
  };

  return (
    <div className="glass-card rounded-lg p-6 space-y-5">
      <h2 className="text-lg font-semibold text-foreground">มอบหมายงาน</h2>
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

        <Button onClick={handleSubmit} className="gap-2">
          <Send className="h-4 w-4" />
          ยืนยันส่ง
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
