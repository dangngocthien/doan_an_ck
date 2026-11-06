import { prisma } from "@/lib/prisma";
import TaoPhieuViecForm from "./TaoPhieuViecForm";

export default async function TaoPhieuViecPage() {
  const [danhSachKhachHang, thoTrongDb, phieuDangBan] = await Promise.all([
    prisma.khachHang.findMany({
      where: { dang_hoat_dong: true },
      orderBy: { ten: "asc" },
    }),
    prisma.nguoiDung.findMany({
      where: { vai_tro: "THO", dang_hoat_dong: true },
      orderBy: { ten: "asc" },
    }),
    // Bận = đang có phiếu DANG_DI hoặc DANG_LAM (cùng quy ước Module 2)
    prisma.phieuViec.findMany({
      where: {
        trang_thai: { in: ["DANG_DI", "DANG_LAM"] },
        tho_id: { not: null },
      },
      select: { tho_id: true },
      distinct: ["tho_id"],
    }),
  ]);

  const idThoBan = new Set(phieuDangBan.map((p) => p.tho_id));
  const danhSachTho = thoTrongDb.map((t) => ({
    id: t.id,
    ten: t.ten,
    ban: idThoBan.has(t.id),
    viDo: t.vi_do,
    kinhDo: t.kinh_do,
  }));

  return (
    <TaoPhieuViecForm
      danhSachKhachHang={danhSachKhachHang}
      danhSachTho={danhSachTho}
    />
  );
}
