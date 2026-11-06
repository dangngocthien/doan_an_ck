"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dinhDangTien } from "@/lib/dinh-dang-tien";

type DuLieuThang = { thang: string; da_thu: number; con_no: number };

const MAU_CHU = "#6b7785";

export default function BieuDoDoanhThu({ duLieu }: { duLieu: DuLieuThang[] }) {
  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef1f5" />
          <XAxis
            dataKey="thang"
            tick={{ fontSize: 12, fill: MAU_CHU }}
            tickLine={false}
            axisLine={{ stroke: "#e7eaee" }}
          />
          <YAxis
            width={44}
            tick={{ fontSize: 12, fill: MAU_CHU }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${v / 1_000_000}tr` : String(v)
            }
          />
          <Tooltip
            formatter={(value) => dinhDangTien(Number(value))}
            cursor={{ fill: "rgba(15,76,129,0.05)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7eaee",
              boxShadow: "0 12px 32px -12px rgba(19,31,43,0.2)",
              fontSize: 13,
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar
            dataKey="da_thu"
            name="Đã thu"
            stackId="doanh-thu"
            fill="var(--color-primary)"
            maxBarSize={40}
          />
          <Bar
            dataKey="con_no"
            name="Còn nợ"
            stackId="doanh-thu"
            fill="var(--color-accent)"
            maxBarSize={40}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
