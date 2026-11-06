"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type GiaTriLoc = {
  q: string;
  trang_thai: string;
  tho: string;
  uu_tien: string;
  loai_ngay: string;
  tu: string;
  den: string;
};

type Props = {
  giaTriBanDau: GiaTriLoc;
  thoDanhSach: { id: number; ten: string; dang_hoat_dong: boolean }[];
};

const CLASS_NHAN =
  "mb-1 block text-xs font-medium text-[var(--color-text-muted)]";

export default function BoLocPhieuViec({ giaTriBanDau, thoDanhSach }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loc, setLoc] = useState<GiaTriLoc>(giaTriBanDau);
  const boHenGio = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dọn bộ hẹn giờ khi rời trang
  useEffect(() => {
    return () => {
      if (boHenGio.current) clearTimeout(boHenGio.current);
    };
  }, []);

  // Ghi các thay đổi lên URL (đọc URL hiện tại để không đè mất ô khác)
  function dayLenUrl(thayDoi: Record<string, string>) {
    const params = new URLSearchParams(window.location.search);
    // Đổi bộ lọc thì về trang 1 (bỏ "trang" khỏi URL)
    params.delete("trang");
    for (const [khoa, giaTri] of Object.entries(thayDoi)) {
      if (giaTri) params.set(khoa, giaTri);
      else params.delete(khoa);
    }
    const chuoi = params.toString();
    router.replace(chuoi ? `${pathname}?${chuoi}` : pathname, {
      scroll: false,
    });
  }

  // Ô chọn / ô ngày: lọc ngay khi đổi
  function doiO(khoa: Exclude<keyof GiaTriLoc, "q">, giaTri: string) {
    setLoc((truoc) => ({ ...truoc, [khoa]: giaTri }));
    // "tao" là mặc định → không cần ghi lên URL
    dayLenUrl({ [khoa]: khoa === "loai_ngay" && giaTri === "tao" ? "" : giaTri });
  }

  // Ô tìm kiếm: đợi 0,4 giây sau lần gõ cuối rồi mới lọc (tránh tải lại mỗi phím)
  function doiTimKiem(giaTri: string) {
    setLoc((truoc) => ({ ...truoc, q: giaTri }));
    if (boHenGio.current) clearTimeout(boHenGio.current);
    boHenGio.current = setTimeout(() => {
      dayLenUrl({ q: giaTri.trim() });
    }, 400);
  }

  function xoaLoc() {
    if (boHenGio.current) clearTimeout(boHenGio.current);
    setLoc({
      q: "",
      trang_thai: "",
      tho: "",
      uu_tien: "",
      loai_ngay: "tao",
      tu: "",
      den: "",
    });
    router.replace(pathname, { scroll: false });
  }

  const coLoc =
    loc.q || loc.trang_thai || loc.tho || loc.uu_tien || loc.tu || loc.den;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label className={CLASS_NHAN} htmlFor="loc-q">
          Tìm theo tên khách, SĐT hoặc loại sự cố
        </label>
        <Input
          id="loc-q"
          type="search"
          value={loc.q}
          onChange={(e) => doiTimKiem(e.target.value)}
          placeholder="Ví dụ: Nguyễn, 0901, vòi nước…"
        />
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-trang-thai">
          Trạng thái
        </label>
        <Select
          id="loc-trang-thai"
          value={loc.trang_thai}
          onChange={(e) => doiO("trang_thai", e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="MOI">Mới</option>
          <option value="DANG_DI">Đang đi</option>
          <option value="DANG_LAM">Đang làm</option>
          <option value="HOAN_THANH">Hoàn thành</option>
          <option value="DA_HUY">Đã hủy</option>
        </Select>
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-tho">
          Thợ
        </label>
        <Select
          id="loc-tho"
          value={loc.tho}
          onChange={(e) => doiO("tho", e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="chua_gan">Chưa gán thợ</option>
          {thoDanhSach.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ten}
              {t.dang_hoat_dong ? "" : " (ngừng)"}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-uu-tien">
          Ưu tiên
        </label>
        <Select
          id="loc-uu-tien"
          value={loc.uu_tien}
          onChange={(e) => doiO("uu_tien", e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="THAP">Thấp</option>
          <option value="TRUNG_BINH">Trung bình</option>
          <option value="CAO">Cao</option>
        </Select>
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-loai-ngay">
          Lọc ngày theo
        </label>
        <Select
          id="loc-loai-ngay"
          value={loc.loai_ngay}
          onChange={(e) => doiO("loai_ngay", e.target.value)}
        >
          <option value="tao">Ngày tạo</option>
          <option value="hoan_thanh">Ngày hoàn thành</option>
        </Select>
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-tu">
          Từ ngày
        </label>
        <Input
          id="loc-tu"
          type="date"
          value={loc.tu}
          onChange={(e) => doiO("tu", e.target.value)}
        />
      </div>

      <div>
        <label className={CLASS_NHAN} htmlFor="loc-den">
          Đến ngày
        </label>
        <Input
          id="loc-den"
          type="date"
          value={loc.den}
          onChange={(e) => doiO("den", e.target.value)}
        />
      </div>

      {coLoc && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="button" variant="outline" size="sm" onClick={xoaLoc}>
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}
