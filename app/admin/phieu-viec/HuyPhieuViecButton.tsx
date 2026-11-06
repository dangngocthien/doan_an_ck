"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { huyPhieuViec } from "@/lib/actions/phieu-viec";

// Chỉ trạng thái có trong bảng này mới hủy được (khớp TRANG_THAI_CHO_PHEP_HUY ở server).
// Trạng thái khác (Hoàn thành, Đã hủy) -> không hiện nút.
const CANH_BAO: Record<string, string> = {
  MOI: "Hủy phiếu việc này?\n\nPhiếu đã hủy không thể khôi phục.",
  DANG_DI:
    "Thợ đang trên đường tới. Hủy phiếu việc này?\n\nPhiếu đã hủy không thể khôi phục.",
  DANG_LAM:
    "Thợ đang sửa chữa. Nếu thợ đã ghi vật tư thì số vật tư đó đã bị trừ khỏi kho và KHÔNG được hoàn lại khi hủy.\n\nPhiếu đã hủy không thể khôi phục. Vẫn hủy phiếu này?",
};

export default function HuyPhieuViecButton({
  id,
  trangThai,
}: {
  id: number;
  trangThai: string;
}) {
  const [dangXuLy, batDauXuLy] = useTransition();

  const canhBao = CANH_BAO[trangThai];
  if (!canhBao) return null;

  function xuLyHuy() {
    if (!window.confirm(canhBao)) return;
    batDauXuLy(async () => {
      await huyPhieuViec(id);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={dangXuLy}
      onClick={xuLyHuy}
      className="text-[var(--color-danger)]"
    >
      {dangXuLy ? "Đang hủy..." : "Hủy phiếu"}
    </Button>
  );
}
