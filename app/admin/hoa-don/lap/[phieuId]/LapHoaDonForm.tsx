"use client";

import { useActionState, useState } from "react";
import { lapHoaDon, type TrangThaiFormHoaDon } from "@/lib/actions/hoa-don";
import { Button } from "@/components/ui/button";
import { dinhDangTien } from "@/lib/dinh-dang-tien";

export default function LapHoaDonForm({
  phieuViecId,
  tienVatTu,
}: {
  phieuViecId: number;
  tienVatTu: number;
}) {
  const [trangThai, formAction, dangGui] = useActionState<
    TrangThaiFormHoaDon,
    FormData
  >(lapHoaDon.bind(null, phieuViecId), {});
  const [tienCong, setTienCong] = useState("");

  const tienCongSo = Number(tienCong);
  const tong = Number.isFinite(tienCongSo) && tienCong !== "" ? tienCongSo + tienVatTu : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="tien_cong" className="text-sm font-medium text-[var(--color-text)]">
          Tiền công (₫)
        </label>
        <input
          id="tien_cong"
          name="tien_cong"
          type="number"
          min={0}
          step={1}
          required
          value={tienCong}
          onChange={(e) => setTienCong(e.target.value)}
          className="h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm text-gray-900 sm:max-w-xs"
        />
      </div>

      <p className="text-sm text-[var(--color-text)]">
        Tổng tiền:{" "}
        <span className="font-semibold">
          {tong === null ? "—" : dinhDangTien(tong)}
        </span>
      </p>

      {trangThai.error && (
        <p className="rounded-md bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)] break-words">
          {trangThai.error}
        </p>
      )}

      <Button type="submit" disabled={dangGui}>
        {dangGui ? "Đang lập..." : "Lập hóa đơn"}
      </Button>
    </form>
  );
}
