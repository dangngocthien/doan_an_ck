import { prisma } from "@/lib/prisma";
import { NGUONG_SAP_HET } from "@/lib/bao-cao";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import {
  docChuoiLoc,
  docLuaChon,
  type NguoiGoi,
  type ThamSoLoc,
} from "@/lib/services/tham-so-loc";

// Logic ĐỌC vật tư cho REST API.
// Mặc định chỉ trả vật tư đang dùng; Admin muốn xem thêm thì truyền ?trang_thai=ngung|tat_ca.
// Thợ luôn chỉ thấy vật tư đang dùng (vật tư ngừng dùng thì không ghi được).

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.vatTu.count>[0]>["where"]
>;

const LOC_TRANG_THAI = ["tat_ca", "dang_dung", "ngung"] as const;
const LOC_TON_KHO = ["tat_ca", "sap_het", "het_hang"] as const;

export async function docDanhSachVatTu(nguoi: NguoiGoi, tham: ThamSoLoc) {
  const q = docChuoiLoc(tham.q);
  const trangThai =
    docLuaChon(tham.trang_thai, LOC_TRANG_THAI, "trang_thai") ?? "dang_dung";
  const tonKho = docLuaChon(tham.ton_kho, LOC_TON_KHO, "ton_kho") ?? "tat_ca";

  const where: DieuKien = {};
  if (q) where.ten = { contains: q };
  if (nguoi.vai_tro === "THO" || trangThai === "dang_dung")
    where.dang_hoat_dong = true;
  else if (trangThai === "ngung") where.dang_hoat_dong = false;
  if (tonKho === "sap_het") where.so_luong_ton = { lte: NGUONG_SAP_HET };
  if (tonKho === "het_hang") where.so_luong_ton = 0;

  const tong = await prisma.vatTu.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(docTrang(tham.trang), tong);
  const danhSach = await prisma.vatTu.findMany({
    where,
    orderBy: [{ dang_hoat_dong: "desc" }, { ten: "asc" }, { id: "asc" }],
    skip,
    take,
  });

  return {
    danh_sach: danhSach.map((v) => ({
      id: v.id,
      ten: v.ten,
      don_vi: v.don_vi,
      so_luong_ton: v.so_luong_ton,
      gia: Number(v.gia), // Decimal -> số thường
      dang_hoat_dong: v.dang_hoat_dong,
    })),
    phan_trang: { trang, tong_trang: tongTrang, tong, so_dong: take },
  };
}
