import { prisma } from "@/lib/prisma";
import { chuanHoaSdt, LOI_SDT } from "@/lib/chuan-hoa-sdt";
import { docToaDo } from "@/lib/khoang-cach";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Giới hạn độ dài chuỗi (tránh Prisma ném lỗi khi vượt kiểu cột).
// Nếu schema.prisma khai báo cột nhỏ hơn (vd @db.VarChar(100)) thì sửa các hằng này cho khớp.
const TEN_KHACH_TOI_DA = 100;
const DIA_CHI_TOI_DA = 191;
const LOAI_SU_CO_TOI_DA = 100;
const GHI_CHU_TOI_DA = 500;
const INT_TOI_DA = 2_147_483_647; // id là cột INT: lớn hơn sẽ làm Prisma báo lỗi 500

const MUC_DO_UU_TIEN = ["THAP", "TRUNG_BINH", "CAO"] as const;
type MucDoUuTien = (typeof MUC_DO_UU_TIEN)[number];

const TRANG_THAI = [
  "MOI",
  "DANG_DI",
  "DANG_LAM",
  "HOAN_THANH",
  "DA_HUY",
] as const;
type TrangThai = (typeof TRANG_THAI)[number];

// Hủy chỉ áp dụng cho phiếu chưa xong. Đổi quy tắc hủy thì sửa thêm CANH_BAO ở HuyPhieuViecButton.tsx.
const TRANG_THAI_CHO_PHEP_HUY = ["MOI", "DANG_DI", "DANG_LAM"] as const;

// Dữ liệu thô từ form (FormData) hoặc JSON (API): mọi trường đều là unknown.
export type DuLieuTaoPhieuViec = {
  che_do_khach?: unknown; // "co_san" | "moi"
  khach_hang_id?: unknown;
  khach_ten?: unknown;
  khach_sdt?: unknown;
  khach_dia_chi?: unknown;
  loai_su_co?: unknown;
  muc_do_uu_tien?: unknown;
  dia_chi?: unknown;
  ghi_chu?: unknown;
  tho_id?: unknown;
  vi_do?: unknown; // điểm sự cố chọn trên bản đồ (tùy chọn, phải đi cùng kinh_do)
  kinh_do?: unknown;
};

export type DuLieuSuaPhieuViec = {
  muc_do_uu_tien?: unknown;
  trang_thai?: unknown;
  dia_chi?: unknown;
  ghi_chu?: unknown;
  tho_id?: unknown;
};

// ---------- Hàm đọc/kiểm tra dữ liệu ----------

function docChuoiBatBuoc(
  giaTri: unknown,
  loiTrong: string,
  toiDa: number,
  loiQuaDai: string,
): string {
  const s = typeof giaTri === "string" ? giaTri.trim() : "";
  if (!s) throw new LoiNghiepVu(loiTrong, 400);
  if (s.length > toiDa) throw new LoiNghiepVu(loiQuaDai, 400);
  return s;
}

function docGhiChu(giaTri: unknown): string | null {
  const s = typeof giaTri === "string" ? giaTri.trim() : "";
  if (!s) return null;
  if (s.length > GHI_CHU_TOI_DA)
    throw new LoiNghiepVu(`Ghi chú tối đa ${GHI_CHU_TOI_DA} ký tự.`, 400);
  return s;
}

// Id tùy chọn: rỗng/null/undefined => null; số nguyên dương (hoặc chuỗi số) => số; còn lại => 400.
function docIdTuyChon(giaTri: unknown, loi: string): number | null {
  if (giaTri === null || giaTri === undefined) return null;
  if (typeof giaTri === "string") {
    const s = giaTri.trim();
    if (s === "") return null;
    if (!/^\d+$/.test(s)) throw new LoiNghiepVu(loi, 400);
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n <= 0 || n > INT_TOI_DA)
      throw new LoiNghiepVu(loi, 400);
    return n;
  }
  if (typeof giaTri === "number") {
    if (!Number.isSafeInteger(giaTri) || giaTri <= 0 || giaTri > INT_TOI_DA)
      throw new LoiNghiepVu(loi, 400);
    return giaTri;
  }
  throw new LoiNghiepVu(loi, 400);
}

// Điểm sự cố tùy chọn: cả hai rỗng => null (phiếu không có tọa độ); thiếu một nửa hoặc sai khoảng => 400.
function docDiemSuCo(
  viDo: unknown,
  kinhDo: unknown,
): { vi_do: number; kinh_do: number } | null {
  const chuoi = (g: unknown) =>
    typeof g === "number" ? String(g) : typeof g === "string" ? g.trim() : "";
  const v = chuoi(viDo);
  const k = chuoi(kinhDo);
  if (v === "" && k === "") return null;
  const diem = v === "" || k === "" ? null : docToaDo(v, k);
  if (!diem) throw new LoiNghiepVu("Tọa độ điểm sự cố không hợp lệ.", 400);
  return { vi_do: diem.viDo, kinh_do: diem.kinhDo };
}

function docMucDo(giaTri: unknown): MucDoUuTien {
  if (
    typeof giaTri === "string" &&
    (MUC_DO_UU_TIEN as readonly string[]).includes(giaTri)
  ) {
    return giaTri as MucDoUuTien;
  }
  throw new LoiNghiepVu("Mức độ ưu tiên không hợp lệ.", 400);
}

function docTrangThai(giaTri: unknown): TrangThai {
  if (
    typeof giaTri === "string" &&
    (TRANG_THAI as readonly string[]).includes(giaTri)
  ) {
    return giaTri as TrangThai;
  }
  throw new LoiNghiepVu("Trạng thái không hợp lệ.", 400);
}

function docIdPhieu(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);
}

// Thợ được gán phải tồn tại, đúng vai trò THO và còn hoạt động.
async function kiemTraTho(thoId: number) {
  const tho = await prisma.nguoiDung.findUnique({
    where: { id: thoId },
    select: { vai_tro: true, dang_hoat_dong: true },
  });
  if (!tho || tho.vai_tro !== "THO")
    throw new LoiNghiepVu("Không tìm thấy thợ được chọn.", 400);
  if (!tho.dang_hoat_dong)
    throw new LoiNghiepVu("Thợ này đã ngừng hoạt động, hãy chọn thợ khác.", 400);
}

// ---------- Nghiệp vụ ----------

export async function taoPhieuViec(raw: DuLieuTaoPhieuViec) {
  const loaiSuCo = docChuoiBatBuoc(
    raw.loai_su_co,
    "Vui lòng nhập loại sự cố.",
    LOAI_SU_CO_TOI_DA,
    `Loại sự cố tối đa ${LOAI_SU_CO_TOI_DA} ký tự.`,
  );
  const mucDoUuTien = docMucDo(raw.muc_do_uu_tien);
  const diaChi = docChuoiBatBuoc(
    raw.dia_chi,
    "Vui lòng nhập địa chỉ làm việc.",
    DIA_CHI_TOI_DA,
    `Địa chỉ tối đa ${DIA_CHI_TOI_DA} ký tự.`,
  );
  const ghiChu = docGhiChu(raw.ghi_chu);
  const thoId = docIdTuyChon(raw.tho_id, "Thợ được chọn không hợp lệ.");
  const diemSuCo = docDiemSuCo(raw.vi_do, raw.kinh_do);
  const laKhachMoi = raw.che_do_khach === "moi";

  // Chuẩn bị dữ liệu khách (kiểm tra xong hết rồi mới ghi DB)
  let khachCoSanId: number | null = null;
  let khachMoi: { ten: string; sdt: string; dia_chi: string } | null = null;

  if (laKhachMoi) {
    const ten = docChuoiBatBuoc(
      raw.khach_ten,
      "Vui lòng nhập tên khách hàng.",
      TEN_KHACH_TOI_DA,
      `Tên khách hàng tối đa ${TEN_KHACH_TOI_DA} ký tự.`,
    );
    const sdt = typeof raw.khach_sdt === "string" ? chuanHoaSdt(raw.khach_sdt) : null;
    if (!sdt) throw new LoiNghiepVu(LOI_SDT, 400);
    const diaChiKhach = docChuoiBatBuoc(
      raw.khach_dia_chi,
      "Vui lòng nhập địa chỉ khách hàng.",
      DIA_CHI_TOI_DA,
      `Địa chỉ khách hàng tối đa ${DIA_CHI_TOI_DA} ký tự.`,
    );
    khachMoi = { ten, sdt, dia_chi: diaChiKhach };
  } else {
    khachCoSanId = docIdTuyChon(raw.khach_hang_id, "Khách hàng không hợp lệ.");
    if (khachCoSanId === null)
      throw new LoiNghiepVu("Vui lòng chọn khách hàng.", 400);
    const khach = await prisma.khachHang.findUnique({
      where: { id: khachCoSanId },
      select: { dang_hoat_dong: true },
    });
    if (!khach) throw new LoiNghiepVu("Không tìm thấy khách hàng.", 400);
    if (!khach.dang_hoat_dong)
      throw new LoiNghiepVu("Khách hàng này đã ngừng hoạt động.", 400);
  }

  if (thoId !== null) await kiemTraTho(thoId);

  // Tạo khách (nếu là khách mới) + tạo phiếu trong 1 transaction:
  // phiếu lỗi thì khách cũng không được tạo (hết khách "mồ côi").
  try {
    return await prisma.$transaction(async (tx) => {
      let khachHangId: number;
      if (khachMoi) {
        const k = await tx.khachHang.create({ data: khachMoi });
        khachHangId = k.id;
      } else {
        khachHangId = khachCoSanId as number;
      }

      return tx.phieuViec.create({
        data: {
          khach_hang_id: khachHangId,
          tho_id: thoId,
          loai_su_co: loaiSuCo,
          muc_do_uu_tien: mucDoUuTien,
          dia_chi: diaChi,
          ghi_chu: ghiChu,
          vi_do: diemSuCo?.vi_do ?? null,
          kinh_do: diemSuCo?.kinh_do ?? null,
        },
      });
    });
  } catch (loi) {
    // Chỉ có tác dụng nếu cột sdt của khach_hang là unique
    if (khachMoi && (loi as { code?: string }).code === "P2002")
      throw new LoiNghiepVu(
        "Số điện thoại này đã có trong danh sách khách hàng. Hãy chọn khách có sẵn.",
        409,
      );
    throw loi;
  }
}

export async function capNhatPhieuViec(id: number, raw: DuLieuSuaPhieuViec) {
  docIdPhieu(id);

  const mucDoUuTien = docMucDo(raw.muc_do_uu_tien);
  const trangThai = docTrangThai(raw.trang_thai);
  const diaChi = docChuoiBatBuoc(
    raw.dia_chi,
    "Vui lòng nhập địa chỉ làm việc.",
    DIA_CHI_TOI_DA,
    `Địa chỉ tối đa ${DIA_CHI_TOI_DA} ký tự.`,
  );
  const ghiChu = docGhiChu(raw.ghi_chu);
  const thoId = docIdTuyChon(raw.tho_id, "Thợ được chọn không hợp lệ.");

  const hienTai = await prisma.phieuViec.findUnique({
    where: { id },
    select: {
      trang_thai: true,
      ngay_hoan_thanh: true,
      tho_id: true,
      hoa_don: { select: { id: true } },
    },
  });
  if (!hienTai) throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);

  // Hủy chỉ đi qua huyPhieuViec; hủy rồi thì không đổi lại
  if (hienTai.trang_thai === "DA_HUY")
    throw new LoiNghiepVu("Phiếu này đã hủy, không thể chỉnh sửa.", 409);
  if (trangThai === "DA_HUY")
    throw new LoiNghiepVu(
      'Để hủy phiếu, dùng nút "Hủy phiếu" ở danh sách phiếu việc.',
      400,
    );

  // Phiếu đã có hóa đơn thì phải giữ ở trạng thái Hoàn thành
  if (hienTai.hoa_don && trangThai !== "HOAN_THANH")
    throw new LoiNghiepVu(
      `Phiếu này đã có hóa đơn #${hienTai.hoa_don.id}, không thể đổi sang trạng thái khác.`,
      409,
    );

  // Thợ giữ nguyên (kể cả thợ đã ngừng hoạt động) thì không kiểm lại;
  // chỉ kiểm khi đổi sang thợ khác.
  if (thoId !== null && thoId !== hienTai.tho_id) await kiemTraTho(thoId);

  // Chỉ ghi ngày hoàn thành khi MỚI chuyển sang Hoàn thành;
  // lưu lại phiếu đang Hoàn thành thì giữ nguyên ngày cũ.
  let ngayHoanThanh: Date | null = null;
  if (trangThai === "HOAN_THANH") {
    ngayHoanThanh =
      hienTai.trang_thai === "HOAN_THANH" && hienTai.ngay_hoan_thanh
        ? hienTai.ngay_hoan_thanh
        : new Date();
  }

  try {
    await prisma.phieuViec.update({
      where: { id },
      data: {
        tho_id: thoId,
        muc_do_uu_tien: mucDoUuTien,
        trang_thai: trangThai,
        dia_chi: diaChi,
        ghi_chu: ghiChu,
        ngay_hoan_thanh: ngayHoanThanh,
      },
    });
  } catch (loi) {
    if ((loi as { code?: string }).code === "P2025")
      throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
    throw loi;
  }
}

// Hủy phiếu (xóa mềm). Hủy phiếu Đang làm KHÔNG hoàn kho vật tư đã trừ (ghi vào Hạn chế).
// Điều kiện trạng thái nằm ngay trong where: thợ vừa Hoàn thành ở tab khác thì không hủy được.
export async function huyPhieuViec(id: number) {
  docIdPhieu(id);

  const ketQua = await prisma.phieuViec.updateMany({
    where: { id, trang_thai: { in: [...TRANG_THAI_CHO_PHEP_HUY] } },
    data: { trang_thai: "DA_HUY" },
  });

  if (ketQua.count === 0) {
    // Dòng chắc chắn đổi (sang DA_HUY) nên count = 0 nghĩa là không khớp điều kiện
    const tonTai = await prisma.phieuViec.findUnique({
      where: { id },
      select: { trang_thai: true },
    });
    if (!tonTai) throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
    throw new LoiNghiepVu(
      "Phiếu này không thể hủy ở trạng thái hiện tại.",
      409,
    );
  }
}
