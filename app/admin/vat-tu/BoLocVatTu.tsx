"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type BoLoc = { q: string; trangThai: string; tonKho: string };

const MAC_DINH: BoLoc = { q: "", trangThai: "tat_ca", tonKho: "tat_ca" };

export default function BoLocVatTu({
  giaTriBanDau,
  nguongSapHet,
}: {
  giaTriBanDau: BoLoc;
  nguongSapHet: number;
}) {
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
    if (moi.tonKho !== MAC_DINH.tonKho) params.set("ton_kho", moi.tonKho);
    const chuoi = params.toString();
    router.replace(chuoi ? `${duongDan}?${chuoi}` : duongDan, { scroll: false });
  }

  function doiTimKiem(q: string) {
    const moi = { ...boLoc, q };
    setBoLoc(moi);
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => ap(moi), 400); // chờ người dùng gõ xong
  }

  function doiChon(truong: "trangThai" | "tonKho", giaTri: string) {
    if (hen.current) clearTimeout(hen.current); // tránh ô tìm kiếm ghi đè bằng giá trị cũ
    const moi = { ...boLoc, [truong]: giaTri };
    setBoLoc(moi);
    ap(moi);
  }

  function xoaLoc() {
    if (hen.current) clearTimeout(hen.current);
    setBoLoc(MAC_DINH);
    ap(MAC_DINH);
  }

  const dangLoc =
    boLoc.q.trim() !== "" ||
    boLoc.trangThai !== MAC_DINH.trangThai ||
    boLoc.tonKho !== MAC_DINH.tonKho;

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        type="search"
        value={boLoc.q}
        onChange={(e) => doiTimKiem(e.target.value)}
        placeholder="Tìm tên vật tư..."
        maxLength={100}
        className="sm:max-w-xs sm:flex-1"
      />

      <Select
        value={boLoc.trangThai}
        onChange={(e) => doiChon("trangThai", e.target.value)}
        className="h-10 sm:w-auto"
        aria-label="Lọc theo trạng thái dùng"
      >
        <option value="tat_ca">Tất cả trạng thái</option>
        <option value="dang_dung">Đang dùng</option>
        <option value="ngung">Ngừng dùng</option>
      </Select>

      <Select
        value={boLoc.tonKho}
        onChange={(e) => doiChon("tonKho", e.target.value)}
        className="h-10 sm:w-auto"
        aria-label="Lọc theo tồn kho"
      >
        <option value="tat_ca">Mọi mức tồn kho</option>
        <option value="sap_het">Sắp hết (≤ {nguongSapHet})</option>
        <option value="het_hang">Hết hàng (0)</option>
      </Select>

      {dangLoc && (
        <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
          Xóa lọc
        </Button>
      )}
    </div>
  );
}
