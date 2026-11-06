"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Props = {
  tu: string | null;
  den: string | null;
  thoId: number | null;
  macDinhTu: string;
  macDinhDen: string;
  danhSachTho: { id: number; ten: string }[];
  mucNhanh: { nhan: string; tu: string; den: string }[];
  dangLoc: boolean;
};

export default function BoLocBaoCao({
  tu: tuBanDau,
  den: denBanDau,
  thoId: thoIdBanDau,
  macDinhTu,
  macDinhDen,
  danhSachTho,
  mucNhanh,
  dangLoc,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [tu, setTu] = useState(tuBanDau ?? "");
  const [den, setDen] = useState(denBanDau ?? "");
  const [tho, setTho] = useState(thoIdBanDau === null ? "" : String(thoIdBanDau));

  const saiKhoang = tu !== "" && den !== "" && tu > den;

  // Ngày và ô chọn áp dụng ngay (không cần debounce vì không có ô gõ chữ)
  function ap(tuMoi: string, denMoi: string, thoMoi: string) {
    if (tuMoi !== "" && denMoi !== "" && tuMoi > denMoi) return;
    const p = new URLSearchParams({ tu: tuMoi, den: denMoi });
    if (thoMoi) p.set("tho", thoMoi);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function chonNhanh(tuMoi: string, denMoi: string) {
    setTu(tuMoi);
    setDen(denMoi);
    ap(tuMoi, denMoi, tho);
  }

  function xoaLoc() {
    setTu(macDinhTu);
    setDen(macDinhDen);
    setTho("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bc-tu">Từ ngày</Label>
          <Input
            id="bc-tu"
            type="date"
            value={tu}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setTu(e.target.value);
              ap(e.target.value, den, tho);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-den">Đến ngày</Label>
          <Input
            id="bc-den"
            type="date"
            value={den}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setDen(e.target.value);
              ap(tu, e.target.value, tho);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-tho">Thợ</Label>
          <Select
            id="bc-tho"
            value={tho}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setTho(e.target.value);
              ap(tu, den, e.target.value);
            }}
          >
            <option value="">Tất cả thợ</option>
            {danhSachTho.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {saiKhoang && (
        <p className="text-sm text-[var(--color-danger)]">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mucNhanh.map((m) => (
          <Button
            key={m.nhan}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => chonNhanh(m.tu, m.den)}
          >
            {m.nhan}
          </Button>
        ))}
        {dangLoc && (
          <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
            Xóa lọc
          </Button>
        )}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Doanh thu tính theo ngày lập hóa đơn; số phiếu và vật tư dùng nhiều tính
        theo ngày tạo phiếu. Công nợ chỉ lọc theo thợ; vật tư sắp hết không bị
        lọc.
      </p>
    </div>
  );
}
