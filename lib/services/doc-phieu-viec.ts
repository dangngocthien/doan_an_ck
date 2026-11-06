import { prisma } from "@/lib/prisma";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import {
  docChuoiLoc,
  docIdLoc,
  docLuaChon,
  docNgayVN,
  ngaySau,
  type NguoiGoi,
  type ThamSoLoc,
} from "@/lib/services/tham-so-loc";

// Logic ĐỌC phiếu việc cho REST API. Phạm vi theo vai trò:
// - ADMIN: mọi phiếu.
// - THO: chỉ phiếu của mình (tho_id lấy từ session, KHÔNG nhận từ client).

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.phieuViec.count>[0]>["where"]
>;

const TRANG_THAI = ["MOI", "DANG_DI", "DANG_LAM", "HOAN_THANH", "DA_HUY"] as const;
const UU_TIEN = ["THAP", "TRUNG_BINH", "CAO"] as const;
const LOAI_NGAY = ["tao", "hoan_thanh"] as const;

// Chỉ liệt kê từng trường cần trả, không dùng include: nguoi_dung có mat_khau_hash.
const CHON_DANH_SACH = {
  id: true,
  loai_su_co: true,
  muc_do_uu_tien: true,
  trang_thai: true,
  dia_chi: true,
  ngay_tao: true,
  ngay_hoan_thanh: true,
  khach_hang: { select: { id: true, ten: true, sdt: true } },
  tho: { select: { id: true, ten: true } },
} as const;

export async function docDanhSachPhieuViec(nguoi: NguoiGoi, tham: ThamSoLoc) {
  const q = docChuoiLoc(tham.q);
  const trangThai = docLuaChon(tham.trang_thai, TRANG_THAI, "trang_thai");
  const uuTien = docLuaChon(tham.uu_tien, UU_TIEN, "uu_tien");
  const loaiNgay = docLuaChon(tham.loai_ngay, LOAI_NGAY, "loai_ngay") ?? "tao";
  const tu = docNgayVN(tham.tu, "tu");
  const den = docNgayVN(tham.den, "den");

  const where: DieuKien = {};
  if (trangThai) where.trang_thai = trangThai;
  if (uuTien) where.muc_do_uu_tien = uuTien;

  if (nguoi.vai_tro === "THO") {
    where.tho_id = nguoi.id; // ép theo session, bỏ qua tham số ?tho=
  } else if ((tham.tho ?? "").trim() === "chua_gan") {
    where.tho_id = null;
  } else {
    const thoId = docIdLoc(tham.tho, "tho");
    if (thoId !== null) where.tho_id = thoId;
  }

  if (tu || den) {
    const khoang: { gte?: Date; lt?: Date } = {};
    if (tu) khoang.gte = tu;
    if (den) khoang.lt = ngaySau(den); // gồm trọn ngày cuối
    if (loaiNgay === "hoan_thanh") where.ngay_hoan_thanh = khoang;
    else where.ngay_tao = khoang;
  }

  if (q) {
    where.OR = [
      { loai_su_co: { contains: q } },
      { khach_hang: { ten: { contains: q } } },
      { khach_hang: { sdt: { contains: q } } },
    ];
  }

  // Đếm trước, kẹp số trang, rồi mới lấy dữ liệu (giống trang web)
  const tong = await prisma.phieuViec.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(docTrang(tham.trang), tong);
  const danhSach = await prisma.phieuViec.findMany({
    where,
    orderBy: [{ ngay_tao: "desc" }, { id: "desc" }],
    skip,
    take,
    select: CHON_DANH_SACH,
  });

  return {
    danh_sach: danhSach,
    phan_trang: { trang, tong_trang: tongTrang, tong, so_dong: take },
  };
}

function lamTron2(so: number): number {
  return Math.round(so * 100) / 100;
}

export async function docChiTietPhieuViec(nguoi: NguoiGoi, idChuoi: string) {
  const id = docIdLoc(idChuoi, "id");
  if (id === null) throw new LoiNghiepVu("Tham số id không hợp lệ.", 400);

  const phieu = await prisma.phieuViec.findUnique({
    where: { id },
    select: {
      ...CHON_DANH_SACH,
      tho_id: true,
      ghi_chu: true,
      khong_dung_vat_tu: true,
      vi_do: true,
      kinh_do: true,
      khach_hang: { select: { id: true, ten: true, sdt: true, dia_chi: true } },
      tho: { select: { id: true, ten: true, sdt: true } },
      vat_tu_su_dung: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          so_luong: true,
          vat_tu: { select: { id: true, ten: true, don_vi: true, gia: true } },
        },
      },
      anh_phieu_viec: {
        orderBy: { id: "asc" },
        select: { id: true, loai: true, url: true, uploaded_at: true },
      },
    },
  });
  if (!phieu) throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
  if (nguoi.vai_tro === "THO" && phieu.tho_id !== nguoi.id)
    throw new LoiNghiepVu("Bạn không có quyền xem phiếu này.", 403);

  // Decimal -> số thường (JSON mặc định ra chuỗi "150000.00")
  const vatTu = phieu.vat_tu_su_dung.map((d) => {
    const donGia = Number(d.vat_tu.gia);
    return {
      id: d.id,
      vat_tu_id: d.vat_tu.id,
      ten: d.vat_tu.ten,
      don_vi: d.vat_tu.don_vi,
      so_luong: d.so_luong,
      don_gia: donGia,
      thanh_tien: lamTron2(donGia * d.so_luong),
    };
  });

  const anh = (loai: "TRUOC" | "SAU") =>
    phieu.anh_phieu_viec
      .filter((a) => a.loai === loai)
      .map((a) => ({ id: a.id, url: a.url, uploaded_at: a.uploaded_at }));

  return {
    id: phieu.id,
    loai_su_co: phieu.loai_su_co,
    muc_do_uu_tien: phieu.muc_do_uu_tien,
    trang_thai: phieu.trang_thai,
    dia_chi: phieu.dia_chi,
    ghi_chu: phieu.ghi_chu,
    ngay_tao: phieu.ngay_tao,
    ngay_hoan_thanh: phieu.ngay_hoan_thanh,
    khong_dung_vat_tu: phieu.khong_dung_vat_tu,
    vi_do: phieu.vi_do,
    kinh_do: phieu.kinh_do,
    khach_hang: phieu.khach_hang,
    tho: phieu.tho,
    vat_tu: vatTu,
    tong_tien_vat_tu: lamTron2(vatTu.reduce((t, d) => t + d.thanh_tien, 0)),
    anh: { truoc: anh("TRUOC"), sau: anh("SAU") },
  };
}
