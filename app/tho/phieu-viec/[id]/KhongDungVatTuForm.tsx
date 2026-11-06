"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { datKhongDungVatTu } from "@/lib/actions/tho-vat-tu";
import type { KetQuaHanhDong } from "@/lib/actions/tho-phieu-viec";

const TRANG_THAI_BAN_DAU: KetQuaHanhDong = {};

export default function KhongDungVatTuForm({
  phieuViecId,
  daChon,
}: {
  phieuViecId: number;
  daChon: boolean;
}) {
  // Đang chọn thì bấm để bỏ chọn, và ngược lại
  const action = datKhongDungVatTu.bind(null, phieuViecId, !daChon);
  const [state, formAction, dangXuLy] = useActionState(
    action,
    TRANG_THAI_BAN_DAU,
  );

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-3">
      {daChon && (
        <p className="mb-2 text-sm font-medium text-green-800">
          Đã xác nhận: ca này không dùng vật tư.
        </p>
      )}
      <form action={formAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={dangXuLy}
          className="w-full sm:w-auto"
        >
          {dangXuLy
            ? "Đang cập nhật..."
            : daChon
              ? "Bỏ xác nhận"
              : "Ca này không dùng vật tư"}
        </Button>
      </form>
      {state.error && (
        <p className="mt-2 text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
    </div>
  );
}
