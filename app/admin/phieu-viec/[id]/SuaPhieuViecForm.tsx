"use client";

import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TrangThaiFormPhieuViec } from "@/lib/actions/phieu-viec";

type PhieuViecChiTiet = {
  id: number;
  loai_su_co: string;
  muc_do_uu_tien: string;
  trang_thai: string;
  dia_chi: string;
  ghi_chu: string | null;
  tho_id: number | null;
  khach_hang: { ten: string; sdt: string; dia_chi: string };
};

type Tho = { id: number; ten: string };

export default function SuaPhieuViecForm({
  phieuViec,
  danhSachTho,
  capNhatAction,
}: {
  phieuViec: PhieuViecChiTiet;
  danhSachTho: Tho[];
  capNhatAction: (
    prevState: TrangThaiFormPhieuViec,
    formData: FormData
  ) => Promise<TrangThaiFormPhieuViec>;
}) {
  const [state, formAction, dangXuLy] = useActionState(capNhatAction, {});

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Phiếu việc — {phieuViec.khach_hang.ten}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
          <div>
            <span className="font-medium">Khách hàng:</span> {phieuViec.khach_hang.ten} —{" "}
            {phieuViec.khach_hang.sdt}
          </div>
          <div className="text-[var(--color-text-muted)]">{phieuViec.khach_hang.dia_chi}</div>
        </div>

        {phieuViec.trang_thai === "DA_HUY" ? (
          <p className="rounded border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">
            Phiếu việc này đã hủy, không thể chỉnh sửa.
          </p>
        ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label>Loại sự cố</Label>
            <p className="mt-1 text-sm">{phieuViec.loai_su_co}</p>
          </div>

          <div>
            <Label htmlFor="dia_chi">Địa chỉ sửa chữa</Label>
            <Input
              id="dia_chi"
              name="dia_chi"
              type="text"
              required
              defaultValue={phieuViec.dia_chi}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="muc_do_uu_tien">Mức độ ưu tiên</Label>
            <Select
              id="muc_do_uu_tien"
              name="muc_do_uu_tien"
              defaultValue={phieuViec.muc_do_uu_tien}
              className="mt-1"
            >
              <option value="THAP">Thấp</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="CAO">Cao</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="tho_id">Thợ phụ trách</Label>
            <Select
              id="tho_id"
              name="tho_id"
              defaultValue={phieuViec.tho_id ?? ""}
              className="mt-1"
            >
              <option value="">-- Chưa gán --</option>
              {danhSachTho.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="trang_thai">Trạng thái</Label>
            <Select
              id="trang_thai"
              name="trang_thai"
              defaultValue={phieuViec.trang_thai}
              className="mt-1"
            >
              <option value="MOI">Mới</option>
              <option value="DANG_DI">Đang đi</option>
              <option value="DANG_LAM">Đang làm</option>
              <option value="HOAN_THANH">Hoàn thành</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="ghi_chu">Ghi chú</Label>
            <textarea
              id="ghi_chu"
              name="ghi_chu"
              rows={3}
              defaultValue={phieuViec.ghi_chu ?? ""}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <Button type="submit" disabled={dangXuLy} className="w-full">
            {dangXuLy ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}
