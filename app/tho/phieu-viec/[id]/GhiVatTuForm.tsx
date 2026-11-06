"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghiVatTuPhieuViec } from "@/lib/actions/tho-vat-tu";
import type { KetQuaHanhDong } from "@/lib/actions/tho-phieu-viec";

type VatTuChon = {
  id: number;
  ten: string;
  don_vi: string;
  so_luong_ton: number;
};

const TRANG_THAI_BAN_DAU: KetQuaHanhDong = {};

export default function GhiVatTuForm({
  phieuViecId,
  danhMuc,
}: {
  phieuViecId: number;
  danhMuc: VatTuChon[];
}) {
  const [state, formAction, dangGhi] = useActionState(
    ghiVatTuPhieuViec.bind(null, phieuViecId),
    TRANG_THAI_BAN_DAU,
  );

  if (danhMuc.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Kho hiện không còn vật tư nào để ghi.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <select
        name="vat_tu_id"
        required
        defaultValue=""
        className="h-10 w-full rounded border border-[var(--color-border)] bg-white px-3 text-sm text-gray-900"
      >
        <option value="" disabled>
          Chọn vật tư...
        </option>
        {danhMuc.map((vt) => (
          <option key={vt.id} value={vt.id}>
            {vt.ten} (còn {vt.so_luong_ton} {vt.don_vi})
          </option>
        ))}
      </select>

      <div className="flex gap-3">
        <Input
          name="so_luong"
          type="number"
          min={1}
          step={1}
          required
          placeholder="Số lượng"
          className="min-w-0 flex-1 bg-white text-gray-900"
        />
        <Button type="submit" disabled={dangGhi}>
          {dangGhi ? "Đang ghi..." : "Ghi vật tư"}
        </Button>
      </div>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
    </form>
  );
}
