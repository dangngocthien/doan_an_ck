import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Logic nghiệp vụ vật tư-theo-phiếu của THỢ. Dùng chung cho Server Action (web) và Route Handler (API).
// Quy ước: hàm nhận thoId ĐÃ được xác thực ở lớp gọi; không dùng FormData/redirect/revalidatePath.
// Thành công thì trả về bình thường, lỗi nghiệp vụ thì ném LoiNghiepVu.

const INT_TOI_DA = 2_147_483_647; // cột so_luong là INT

function kiemTraIdPhieu(phieuViecId: number) {
  if (!Number.isInteger(phieuViecId) || phieuViecId <= 0)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);
}

export async function ghiVatTu(
  thoId: number,
  phieuViecId: number,
  vatTuId: number,
  soLuong: number,
): Promise<void> {
  kiemTraIdPhieu(phieuViecId);
  if (!Number.isInteger(vatTuId) || vatTuId <= 0)
    throw new LoiNghiepVu("Vui lòng chọn vật tư.", 400);
  if (!Number.isInteger(soLuong) || soLuong <= 0)
    throw new LoiNghiepVu("Số lượng phải là số nguyên lớn hơn 0.", 400);
  if (soLuong > INT_TOI_DA) throw new LoiNghiepVu("Số lượng quá lớn.", 400);

  await prisma.$transaction(async (tx) => {
    const phieu = await tx.phieuViec.findUnique({
      where: { id: phieuViecId },
      select: { tho_id: true, trang_thai: true },
    });
    if (!phieu || phieu.tho_id !== thoId)
      throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
    if (phieu.trang_thai !== "DANG_LAM")
      throw new LoiNghiepVu(
        "Chỉ ghi vật tư khi phiếu đang ở trạng thái Đang làm.",
        409,
      );

    // Trừ kho có điều kiện: chỉ trừ khi còn đủ, tránh tồn kho âm dù 2 người ghi cùng lúc
    const tru = await tx.vatTu.updateMany({
      where: {
        id: vatTuId,
        dang_hoat_dong: true,
        so_luong_ton: { gte: soLuong },
      },
      data: { so_luong_ton: { decrement: soLuong } },
    });
    if (tru.count === 0) {
      const vatTu = await tx.vatTu.findUnique({
        where: { id: vatTuId },
        select: { ten: true, so_luong_ton: true, dang_hoat_dong: true },
      });
      if (!vatTu) throw new LoiNghiepVu("Vật tư không tồn tại.", 404);
      if (!vatTu.dang_hoat_dong)
        throw new LoiNghiepVu(`${vatTu.ten} đã ngừng sử dụng.`, 409);
      throw new LoiNghiepVu(
        `Không đủ tồn kho: ${vatTu.ten} chỉ còn ${vatTu.so_luong_ton}.`,
        409,
      );
    }

    await tx.vatTuSuDung.create({
      data: {
        phieu_viec_id: phieuViecId,
        vat_tu_id: vatTuId,
        so_luong: soLuong,
      },
    });

    // Đã có vật tư thật thì không còn là "ca không dùng vật tư"
    await tx.phieuViec.update({
      where: { id: phieuViecId },
      data: { khong_dung_vat_tu: false },
    });
  });
}

// Thợ xác nhận (hoặc bỏ xác nhận) "ca này không dùng vật tư"
export async function datKhongDungVatTu(
  thoId: number,
  phieuViecId: number,
  giaTri: boolean,
): Promise<void> {
  kiemTraIdPhieu(phieuViecId);

  await prisma.$transaction(async (tx) => {
    const phieu = await tx.phieuViec.findUnique({
      where: { id: phieuViecId },
      select: { tho_id: true, trang_thai: true },
    });
    if (!phieu || phieu.tho_id !== thoId)
      throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
    if (phieu.trang_thai !== "DANG_LAM")
      throw new LoiNghiepVu(
        "Chỉ thay đổi được khi phiếu đang ở trạng thái Đang làm.",
        409,
      );

    if (giaTri) {
      const soDong = await tx.vatTuSuDung.count({
        where: { phieu_viec_id: phieuViecId },
      });
      if (soDong > 0)
        throw new LoiNghiepVu(
          'Phiếu này đã ghi vật tư nên không thể chọn "Không dùng vật tư".',
          409,
        );
    }

    await tx.phieuViec.update({
      where: { id: phieuViecId },
      data: { khong_dung_vat_tu: giaTri },
    });
  });
}

// Thợ xóa 1 dòng vật tư ghi nhầm: xóa dòng + cộng lại kho trong cùng 1 transaction.
// Chỉ khi phiếu còn DANG_LAM (sau Hoàn thành thì tiền vật tư trên hóa đơn đã chốt).
export async function xoaVatTuSuDung(
  thoId: number,
  phieuViecId: number,
  dongId: number,
): Promise<void> {
  if (
    !Number.isInteger(phieuViecId) ||
    phieuViecId <= 0 ||
    !Number.isInteger(dongId) ||
    dongId <= 0
  )
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);

  await prisma.$transaction(async (tx) => {
    const dong = await tx.vatTuSuDung.findFirst({
      where: {
        id: dongId,
        phieu_viec_id: phieuViecId,
        phieu_viec: { tho_id: thoId },
      },
      select: {
        so_luong: true,
        vat_tu_id: true,
        phieu_viec: { select: { trang_thai: true } },
      },
    });
    if (!dong) throw new LoiNghiepVu("Không tìm thấy dòng vật tư.", 404);
    if (dong.phieu_viec.trang_thai !== "DANG_LAM")
      throw new LoiNghiepVu(
        "Chỉ xóa được vật tư khi phiếu đang ở trạng thái Đang làm.",
        409,
      );

    // Xóa có điều kiện: 2 tab cùng xóa 1 dòng, hoặc phiếu vừa chuyển trạng thái -> count = 0
    // -> hủy cả transaction (kho không bị cộng đôi)
    const xoa = await tx.vatTuSuDung.deleteMany({
      where: {
        id: dongId,
        phieu_viec_id: phieuViecId,
        phieu_viec: { tho_id: thoId, trang_thai: "DANG_LAM" },
      },
    });
    if (xoa.count === 0)
      throw new LoiNghiepVu("Dòng vật tư này không còn để xóa.", 409);

    await tx.vatTu.update({
      where: { id: dong.vat_tu_id },
      data: { so_luong_ton: { increment: dong.so_luong } },
    });
  });
}
