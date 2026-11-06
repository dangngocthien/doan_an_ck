"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type BoLoc = { q: string; trangThai: string; banRon: string };

const MAC_DINH: BoLoc = { q: "", trangThai: "hoat_dong", banRon: "tat_ca" };

export default function BoLocTho({ giaTriBanDau }: { giaTriBanDau: BoLoc }) {
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
    if (moi.banRon !== MAC_DINH.banRon) params.set("ban_ron", moi.banRon);
    const chuoi = params.toString();
    router.replace(chuoi ? `${duongDan}?${chuoi}` : duongDan, { scroll: false });
  }

  function doiTimKiem(q: string) {
    const moi = { ...boLoc, q };
    setBoLoc(moi);
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => ap(moi), 400); // chờ người dùng gõ xong
  }

  function doiChon(truong: "trangThai" | "banRon", giaTri: string) {
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
    boLoc.banRon !== MAC_DINH.banRon;

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        type="search"
        value={boLoc.q}
        onChange={(e) => doiTimKiem(e.target.value)}
        placeholder="Tìm tên, SĐT hoặc email..."
        maxLength={100}
        className="sm:max-w-xs sm:flex-1"
      />

      <Select
        value={boLoc.trangThai}
        onChange={(e) => doiChon("trangThai", e.target.value)}
        className="sm:w-auto"
        aria-label="Lọc theo hoạt động"
      >
        <option value="hoat_dong">Đang hoạt động</option>
        <option value="ngung">Đã ngừng hoạt động</option>
        <option value="tat_ca">Tất cả</option>
      </Select>

      <Select
        value={boLoc.banRon}
        onChange={(e) => doiChon("banRon", e.target.value)}
        className="sm:w-auto"
        aria-label="Lọc theo rảnh/bận"
      >
        <option value="tat_ca">Rảnh và bận</option>
        <option value="ron">Chỉ thợ rảnh</option>
        <option value="ban">Chỉ thợ đang bận</option>
      </Select>

      {dangLoc && (
        <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
          Xóa lọc
        </Button>
      )}
    </div>
  );
}
