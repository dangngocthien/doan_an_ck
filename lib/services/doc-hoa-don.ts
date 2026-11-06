import { prisma } from "@/lib/prisma";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import {
  docChuoiLoc,
  docLuaChon,
  docNgayVN,
  docTienLoc,
  ngaySau,
  type ThamSoLoc,
} from "@/lib/services/tham-so-loc";

// Logic ĐỌC hóa đơn cho REST API. Quyền ADMIN được kiểm tra ở lớp route.

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.hoaDon.count>[0]>["where"]
>;

const TRANG_THAI_THANH_TOAN = ["DA_THU", "CON_NO"] as const;

export async function docDanhSachHoaDon(tham: ThamSoLoc) {
  const q = docChuoiLoc(tham.q);
  const trangThai = docLuaChon(tham.trang_thai, TRANG_THAI_THANH_TOAN, "trang_thai");
  const tuNgay = docNgayVN(tham.tu_ngay, "tu_ngay");
  const denNgay = docNgayVN(tham.den_ngay, "den_ngay");
  const tienTu = docTienLoc(tham.tien_tu, "tien_tu");
  const tienDen = docTienLoc(tham.tien_den, "tien_den");

  const where: DieuKien = {};
  if (trangThai) where.trang_thai_thanh_toan = trangThai;
  if (q) {
    where.phieu_viec = {
      khach_hang: { OR: [{ ten: { contains: q } }, { sdt: { contains: q } }] },
    };
  }
  if (tuNgay || denNgay) {
    const khoang: { gte?: Date; lt?: Date } = {};
    if (tuNgay) khoang.gte = tuNgay;
    if (denNgay) khoang.lt = ngaySau(denNgay); // gồm trọn ngày cuối
    where.ngay_lap = khoang;
  }
  if (tienTu !== null || tienDen !== null) {
    const khoang: { gte?: number; lte?: number } = {};
    if (tienTu !== null) khoang.gte = tienTu;
    if (tienDen !== null) khoang.lte = tienDen;
    where.tong_tien = khoang;
  }

  const tong = await prisma.hoaDon.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(docTrang(tham.trang), tong);
  const danhSach = await prisma.hoaDon.findMany({
    where,
    orderBy: [{ ngay_lap: "desc" }, { id: "desc" }],
    skip,
    take,
    select: {
      id: true,
      phieu_viec_id: true,
      ngay_lap: true,
      tien_cong: true,
      tien_vat_tu: true,
      tong_tien: true,
      trang_thai_thanh_toan: true,
      phieu_viec: {
        select: { khach_hang: { select: { id: true, ten: true, sdt: true } } },
      },
    },
  });

  return {
    danh_sach: danhSach.map((h) => ({
      id: h.id,
      phieu_viec_id: h.phieu_viec_id,
      ngay_lap: h.ngay_lap,
      // Decimal -> số thường
      tien_cong: Number(h.tien_cong),
      tien_vat_tu: Number(h.tien_vat_tu),
      tong_tien: Number(h.tong_tien),
      trang_thai_thanh_toan: h.trang_thai_thanh_toan,
      khach_hang: h.phieu_viec.khach_hang,
    })),
    phan_trang: { trang, tong_trang: tongTrang, tong, so_dong: take },
  };
}
