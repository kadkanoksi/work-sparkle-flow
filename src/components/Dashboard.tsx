import { STAFF, SHORT_NAMES, WORK_HOURS, Assignment, getStaffWorkload } from "@/lib/workData";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { User, FlaskConical, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  assignments: Assignment[];
  canEdit?: boolean;
  onEdit?: (a: Assignment) => void;
  onDelete?: (id: string) => void;
}

export function Dashboard({ assignments, canEdit = false, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {STAFF.map((name) => {
        const { tasks, totalSamples, totalHours, overloadPercent } = getStaffWorkload(assignments, name);
        const isOverload = totalHours > WORK_HOURS;
        const progressValue = Math.min(overloadPercent, 100);

        return (
          <div
            key={name}
            className={`glass-card rounded-lg p-5 space-y-3 transition-all ${
              isOverload ? "ring-2 ring-overload/40" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-sm">{SHORT_NAMES[name]}</span>
              </div>
              {isOverload && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Overload
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{totalSamples} ตัวอย่าง</span>
              <span>{totalHours.toFixed(1)} / {WORK_HOURS} ชม.</span>
            </div>

            <Progress value={progressValue} className="h-2" />

            {tasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs group">
                    <FlaskConical className="h-3 w-3 text-accent shrink-0" />
                    <span className="text-foreground">{t.chemical}</span>
                    <span className="text-muted-foreground">×{t.sampleCount}</span>
                    {canEdit && (
                      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onEdit?.(t)}
                          aria-label="แก้ไข"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              aria-label="ลบ"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการลบงาน</AlertDialogTitle>
                              <AlertDialogDescription>
                                ลบงาน <strong>{t.chemical}</strong> ({t.sampleCount} ตัวอย่าง) ของ {SHORT_NAMES[t.staff]} ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete?.(t.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                ลบ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground italic">ยังไม่มีงาน</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
