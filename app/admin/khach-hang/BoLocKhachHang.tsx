"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type BoLoc = { q: string; hoatDong: string; no: string; sapXep: string };

const MAC_DINH: BoLoc = { q: "", hoatDong: "hoat_dong", no: "tat_ca", sapXep: "moi" };

export default function BoLocKhachHang({ giaTriBanDau }: { giaTriBanDau: BoLoc }) {
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
    if (moi.hoatDong !== MAC_DINH.hoatDong) params.set("trang_thai", moi.hoatDong);
    if (moi.no !== MAC_DINH.no) params.set("no", moi.no);
    if (moi.sapXep !== MAC_DINH.sapXep) params.set("sap_xep", moi.sapXep);
    const chuoi = params.toString();
    router.replace(chuoi ? `${duongDan}?${chuoi}` : duongDan, { scroll: false });
  }

  function doiTimKiem(q: string) {
    const moi = { ...boLoc, q };
    setBoLoc(moi);
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => ap(moi), 400); // chờ người dùng gõ xong
  }

  function doiChon(truong: "hoatDong" | "no" | "sapXep", giaTri: string) {
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

  // "Xóa lọc" chỉ xét bộ lọc; sắp xếp không tính là đang lọc
  const dangLoc =
    boLoc.q.trim() !== "" ||
    boLoc.hoatDong !== MAC_DINH.hoatDong ||
    boLoc.no !== MAC_DINH.no;

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        type="search"
        value={boLoc.q}
        onChange={(e) => doiTimKiem(e.target.value)}
        placeholder="Tìm tên hoặc SĐT..."
        maxLength={100}
        className="sm:max-w-xs sm:flex-1"
      />

      <Select
        value={boLoc.hoatDong}
        onChange={(e) => doiChon("hoatDong", e.target.value)}
        className="sm:w-auto"
        aria-label="Lọc theo hoạt động"
      >
        <option value="hoat_dong">Đang hoạt động</option>
        <option value="ngung">Đã ngừng hoạt động</option>
        <option value="tat_ca">Tất cả</option>
      </Select>

      <Select
        value={boLoc.no}
        onChange={(e) => doiChon("no", e.target.value)}
        className="sm:w-auto"
        aria-label="Lọc theo công nợ"
      >
        <option value="tat_ca">Có nợ và không nợ</option>
        <option value="co_no">Chỉ khách còn nợ</option>
        <option value="khong_no">Chỉ khách không nợ</option>
      </Select>

      <Select
        value={boLoc.sapXep}
        onChange={(e) => doiChon("sapXep", e.target.value)}
        className="sm:w-auto"
        aria-label="Sắp xếp"
      >
        <option value="moi">Mới nhất</option>
        <option value="ten_tang">Tên A → Z</option>
        <option value="ten_giam">Tên Z → A</option>
      </Select>

      {dangLoc && (
        <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
          Xóa lọc
        </Button>
      )}
    </div>
  );
}
