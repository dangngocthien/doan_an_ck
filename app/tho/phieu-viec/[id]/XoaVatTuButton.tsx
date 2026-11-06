"use client";

import { useState, useTransition } from "react";
import { xoaVatTuSuDung } from "@/lib/actions/tho-vat-tu";

export default function XoaVatTuButton({
  phieuViecId,
  dongId,
  ten,
}: {
  phieuViecId: number;
  dongId: number;
  ten: string;
}) {
  const [dangXoa, batDauXoa] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);

  function xuLyXoa() {
    if (
      !window.confirm(
        `Xóa "${ten}" khỏi phiếu này?\nSố lượng sẽ được cộng lại vào kho.`,
      )
    )
      return;
    datLoi(null);
    batDauXoa(async () => {
      const kq = await xoaVatTuSuDung(phieuViecId, dongId);
      if (kq.error) datLoi(kq.error);
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={xuLyXoa}
        disabled={dangXoa}
        aria-label={`Xóa ${ten}`}
        className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] disabled:opacity-50"
      >
        {dangXoa ? "…" : "✕"}
      </button>
      {loi && (
        <span className="max-w-[12rem] break-words text-right text-xs text-[var(--color-danger)]">
          {loi}
        </span>
      )}
    </span>
  );
}
