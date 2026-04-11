import { STAFF, SHORT_NAMES, WORK_HOURS, Assignment, getStaffWorkload } from "@/lib/workData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface Props {
  assignments: Assignment[];
}

export function WorkloadChart({ assignments }: Props) {
  const data = STAFF.map((name) => {
    const { totalSamples, totalHours, overloadPercent } = getStaffWorkload(assignments, name);
    return {
      name: SHORT_NAMES[name],
      samples: totalSamples,
      hours: totalHours,
      overloadPercent,
    };
  });

  return (
    <div className="glass-card rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">ภาระงาน & จำนวนตัวอย่าง</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">ชั่วโมงทำงาน (เทียบกับ {WORK_HOURS} ชม.)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <ReferenceLine x={WORK_HOURS} stroke="hsl(var(--overload))" strokeDasharray="4 4" label={{ value: "Max", fill: "hsl(var(--overload))", fontSize: 11 }} />
              <Bar dataKey="hours" name="ชั่วโมง" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.hours > WORK_HOURS ? "hsl(var(--overload))" : "hsl(var(--primary))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Samples chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">จำนวนตัวอย่างที่ได้รับ</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Bar dataKey="samples" name="ตัวอย่าง" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
