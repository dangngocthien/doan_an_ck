import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Logic THỢ chuyển phiếu việc sang bước tiếp theo. Dùng chung cho Server Action (web) và Route Handler (API).
// thoId đã được xác thực ở lớp gọi; không dùng FormData/redirect/revalidatePath.

export type TrangThaiMoi = "DANG_DI" | "DANG_LAM" | "HOAN_THANH";

const TRANG_THAI_TIEP_THEO: Record<string, TrangThaiMoi | null> = {
  MOI: "DANG_DI",
  DANG_DI: "DANG_LAM",
  DANG_LAM: "HOAN_THANH",
  HOAN_THANH: null,
  DA_HUY: null,
};

// Trả về trạng thái mới của phiếu.
// tuTrangThai (tùy chọn, chỉ API dùng): trạng thái mà client đang thấy. Nếu khác trạng thái
// hiện tại trong DB thì từ chối (409), tránh "tab cũ" đẩy phiếu qua bước kế ngoài ý muốn.
export async function chuyenTrangThaiTiepTheo(
  thoId: number,
  phieuViecId: number,
  tuTrangThai?: string,
): Promise<TrangThaiMoi> {
  if (!Number.isInteger(phieuViecId) || phieuViecId <= 0)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);
  if (
    tuTrangThai !== undefined &&
    !Object.hasOwn(TRANG_THAI_TIEP_THEO, tuTrangThai)
  )
    throw new LoiNghiepVu("tu_trang_thai không hợp lệ.", 400);

  const phieu = await prisma.phieuViec.findUnique({
    where: { id: phieuViecId },
  });
  if (!phieu || phieu.tho_id !== thoId)
    throw new LoiNghiepVu("Bạn không có quyền cập nhật phiếu này.", 403);

  if (tuTrangThai !== undefined && tuTrangThai !== phieu.trang_thai)
    throw new LoiNghiepVu(
      "Phiếu đã đổi trạng thái so với dữ liệu bạn đang xem. Hãy tải lại.",
      409,
    );

  const tiepTheo = TRANG_THAI_TIEP_THEO[phieu.trang_thai];
  if (!tiepTheo)
    throw new LoiNghiepVu(
      "Phiếu này không thể chuyển sang trạng thái tiếp theo.",
      409,
    );

  // Chốt chặn ảnh: bắt đầu sửa chữa cần ảnh trước khi làm; hoàn thành cần ảnh sau khi làm
  if (tiepTheo === "DANG_LAM" || tiepTheo === "HOAN_THANH") {
    const loaiCanCo = tiepTheo === "DANG_LAM" ? "TRUOC" : "SAU";
    const soAnh = await prisma.anhPhieuViec.count({
      where: { phieu_viec_id: phieuViecId, loai: loaiCanCo },
    });
    if (soAnh === 0)
      throw new LoiNghiepVu(
        tiepTheo === "DANG_LAM"
          ? "Cần chụp ít nhất 1 ảnh trước khi làm trước khi bắt đầu sửa chữa."
          : "Cần chụp ít nhất 1 ảnh sau khi làm trước khi hoàn thành công việc.",
        409,
      );
  }

  if (tiepTheo === "HOAN_THANH" && !phieu.khong_dung_vat_tu) {
    const soDongVatTu = await prisma.vatTuSuDung.count({
      where: { phieu_viec_id: phieuViecId },
    });
    if (soDongVatTu === 0)
      throw new LoiNghiepVu(
        'Cần ghi vật tư đã dùng, hoặc chọn "Ca này không dùng vật tư", trước khi hoàn thành.',
        409,
      );
  }

  // Điều kiện trạng thái hiện tại nằm ngay trong where: nếu phiếu vừa đổi trạng thái ở nơi khác
  // (2 tab, bấm đúp...) thì count = 0, không ghi đè.
  const ketQua = await prisma.phieuViec.updateMany({
    where: { id: phieuViecId, tho_id: thoId, trang_thai: phieu.trang_thai },
    data: {
      trang_thai: tiepTheo,
      ngay_hoan_thanh: tiepTheo === "HOAN_THANH" ? new Date() : undefined,
    },
  });
  if (ketQua.count === 0)
    throw new LoiNghiepVu(
      "Phiếu vừa được cập nhật ở nơi khác. Hãy tải lại trang.",
      409,
    );

  return tiepTheo;
}
