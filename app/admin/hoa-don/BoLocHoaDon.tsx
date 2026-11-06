"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type BoLoc = {
  q: string;
  trangThai: string;
  tuNgay: string;
  denNgay: string;
  tienTu: string;
  tienDen: string;
};

const MAC_DINH: BoLoc = {
  q: "",
  trangThai: "tat_ca",
  tuNgay: "",
  denNgay: "",
  tienTu: "",
  tienDen: "",
};

function Truong({ nhan, children }: { nhan: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
      {nhan}
      {children}
    </label>
  );
}

export default function BoLocHoaDon({ giaTriBanDau }: { giaTriBanDau: BoLoc }) {
  const router = useRouter();
  const duongDan = usePathname();
  const [boLoc, setBoLoc] = useState<BoLoc>(giaTriBanDau);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hen.current) clearTimeout(hen.current);
    };
  }, []);

  // Chỉ đưa lên URL những giá trị khác mặc định; đổi bộ lọc thì bỏ `trang` (về trang 1)
  function ap(moi: BoLoc) {
    const params = new URLSearchParams();
    if (moi.q.trim()) params.set("q", moi.q.trim());
    if (moi.trangThai !== MAC_DINH.trangThai) params.set("trang_thai", moi.trangThai);
    if (moi.tuNgay) params.set("tu_ngay", moi.tuNgay);
    if (moi.denNgay) params.set("den_ngay", moi.denNgay);
    if (moi.tienTu) params.set("tien_tu", moi.tienTu);
    if (moi.tienDen) params.set("tien_den", moi.tienDen);
    const chuoi = params.toString();
    router.replace(chuoi ? `${duongDan}?${chuoi}` : duongDan, { scroll: false });
  }

  // tre = true: ô gõ chữ/số, chờ người dùng gõ xong mới lọc.
  // Ô chọn và ô ngày áp dụng ngay; luôn hủy hẹn cũ để không ghi đè bằng giá trị cũ.
  function doi(truong: keyof BoLoc, giaTri: string, tre = false) {
    if (hen.current) clearTimeout(hen.current);
    const moi = { ...boLoc, [truong]: giaTri };
    setBoLoc(moi);
    if (tre) {
      hen.current = setTimeout(() => ap(moi), 400);
    } else {
      ap(moi);
    }
  }

  function xoaLoc() {
    if (hen.current) clearTimeout(hen.current);
    setBoLoc(MAC_DINH);
    ap(MAC_DINH);
  }

  const dangLoc = (Object.keys(MAC_DINH) as (keyof BoLoc)[]).some(
    (k) => boLoc[k].trim() !== MAC_DINH[k],
  );

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="search"
          value={boLoc.q}
          onChange={(e) => doi("q", e.target.value, true)}
          placeholder="Tìm tên hoặc SĐT khách..."
          maxLength={100}
          className="sm:max-w-xs sm:flex-1"
        />

        <Select
          value={boLoc.trangThai}
          onChange={(e) => doi("trangThai", e.target.value)}
          className="h-10 sm:w-auto"
          aria-label="Lọc theo thanh toán"
        >
          <option value="tat_ca">Tất cả thanh toán</option>
          <option value="CON_NO">Còn nợ</option>
          <option value="DA_THU">Đã thu</option>
        </Select>

        {dangLoc && (
          <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
            Xóa lọc
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
        <Truong nhan="Lập từ ngày">
          <Input
            type="date"
            value={boLoc.tuNgay}
            onChange={(e) => doi("tuNgay", e.target.value)}
            className="sm:w-44"
          />
        </Truong>
        <Truong nhan="Đến ngày">
          <Input
            type="date"
            value={boLoc.denNgay}
            onChange={(e) => doi("denNgay", e.target.value)}
            className="sm:w-44"
          />
        </Truong>
        <Truong nhan="Tổng tiền từ (₫)">
          <Input
            inputMode="numeric"
            value={boLoc.tienTu}
            onChange={(e) =>
              doi("tienTu", e.target.value.replace(/\D/g, "").slice(0, 10), true)
            }
            placeholder="0"
            className="sm:w-44"
          />
        </Truong>
        <Truong nhan="Đến (₫)">
          <Input
            inputMode="numeric"
            value={boLoc.tienDen}
            onChange={(e) =>
              doi("tienDen", e.target.value.replace(/\D/g, "").slice(0, 10), true)
            }
            placeholder="Không giới hạn"
            className="sm:w-44"
          />
        </Truong>
      </div>
    </div>
  );
}
