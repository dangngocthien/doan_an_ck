"use client";

import { useActionState } from "react";
import { capNhatTienCong, type TrangThaiFormHoaDon } from "@/lib/actions/hoa-don";
import { Button } from "@/components/ui/button";

export default function SuaTienCongForm({
  hoaDonId,
  tienCong,
}: {
  hoaDonId: number;
  tienCong: number;
}) {
  const [trangThai, formAction, dangGui] = useActionState<
    TrangThaiFormHoaDon,
    FormData
  >(capNhatTienCong.bind(null, hoaDonId), {});

  return (
    // key: nạp lại ô nhập khi tiền công đổi sau khi lưu
    <form key={tienCong} action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="tien_cong" className="text-sm font-medium text-[var(--color-text)]">
          Sửa tiền công (₫)
        </label>
        <input
          id="tien_cong"
          name="tien_cong"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={tienCong}
          className="h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm text-gray-900 sm:max-w-xs"
        />
      </div>

      {trangThai.error && (
        <p className="rounded-md bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)] break-words">
          {trangThai.error}
        </p>
      )}
      {trangThai.thanhCong && (
        <p className="text-sm text-[var(--color-text-muted)]">Đã cập nhật tiền công.</p>
      )}

      <Button type="submit" variant="outline" disabled={dangGui} className="w-full sm:w-auto">
        {dangGui ? "Đang lưu..." : "Lưu tiền công"}
      </Button>
    </form>
  );
}
