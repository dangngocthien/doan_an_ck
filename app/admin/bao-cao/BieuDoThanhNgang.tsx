"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DuLieu = { nhan: string; gia_tri: number; don_vi?: string };

export default function BieuDoThanhNgang({ duLieu }: { duLieu: DuLieu[] }) {
  return (
    <div className="w-full" style={{ height: duLieu.length * 44 + 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={duLieu}
          layout="vertical"
          margin={{ top: 4, right: 32, left: 0, bottom: 4 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="nhan"
            width={110}
            tick={{ fontSize: 12, fill: "#6b7785" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,76,129,0.05)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7eaee",
              boxShadow: "0 12px 32px -12px rgba(19,31,43,0.2)",
              fontSize: 13,
            }}
            formatter={(value, _ten, muc) =>
              `${value} ${muc.payload?.don_vi ?? ""}`.trim()
            }
          />
          <Bar
            dataKey="gia_tri"
            name="Số lượng"
            fill="var(--color-primary)"
            radius={[0, 8, 8, 0]}
            barSize={16}
            background={{ fill: "#eef1f5" }}
          >
            <LabelList
              dataKey="gia_tri"
              position="right"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
