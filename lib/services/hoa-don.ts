import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Logic hóa đơn. Dùng chung cho Server Action (web) và Route Handler (API).
// Quyền ADMIN được kiểm tra ở lớp gọi; không dùng FormData/redirect/revalidatePath.

// Decimal(12,2) chứa tối đa 9.999.999.999,99
const TIEN_TOI_DA = 9_999_999_999;

type TrangThaiThanhToan = "DA_THU" | "CON_NO";

function kiemTraId(id: number) {
  if (!Number.isInteger(id) || id <= 0)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);
}

// Nhận mọi kiểu đầu vào (chuỗi từ form, số hoặc chuỗi từ JSON) và trả về số nguyên hợp lệ.
// Phải xét chuỗi rỗng riêng vì Number("") = 0.
function docTienCong(giaTri: unknown): number {
  const raw = String(giaTri ?? "").trim();
  const so = Number(raw);
  if (raw === "" || !Number.isInteger(so) || so < 0 || so > TIEN_TOI_DA)
    throw new LoiNghiepVu("Tiền công phải là số nguyên từ 0 trở lên.", 400);
  return so;
}

// Trả về id hóa đơn vừa tạo
export async function lapHoaDon(
  phieuViecId: number,
  tienCongDauVao: unknown,
): Promise<number> {
  kiemTraId(phieuViecId);
  const tienCong = docTienCong(tienCongDauVao);

  const phieu = await prisma.phieuViec.findUnique({
    where: { id: phieuViecId },
    select: { trang_thai: true, hoa_don: { select: { id: true } } },
  });
  if (!phieu) throw new LoiNghiepVu("Không tìm thấy phiếu việc.", 404);
  if (phieu.trang_thai !== "HOAN_THANH")
    throw new LoiNghiepVu("Chỉ lập hóa đơn cho phiếu đã hoàn thành.", 409);
  if (phieu.hoa_don) throw new LoiNghiepVu("Phiếu này đã có hóa đơn.", 409);

  // Tiền vật tư tính ở server theo giá HIỆN TẠI rồi lưu cố định vào hóa đơn
  const dong = await prisma.vatTuSuDung.findMany({
    where: { phieu_viec_id: phieuViecId },
    select: { so_luong: true, vat_tu: { select: { gia: true } } },
  });
  const tienVatTu =
    Math.round(
      dong.reduce((tong, d) => tong + Number(d.vat_tu.gia) * d.so_luong, 0) *
        100,
    ) / 100;

  try {
    const hoaDon = await prisma.hoaDon.create({
      data: {
        phieu_viec_id: phieuViecId,
        tien_cong: tienCong,
        tien_vat_tu: tienVatTu,
        tong_tien: tienCong + tienVatTu,
      },
    });
    return hoaDon.id;
  } catch (e) {
    // P2002: trùng phieu_viec_id (2 Admin bấm lập cùng lúc)
    if ((e as { code?: string }).code === "P2002")
      throw new LoiNghiepVu("Phiếu này đã có hóa đơn.", 409);
    throw e;
  }
}

export async function doiTrangThaiThanhToan(
  id: number,
  trangThai: string,
): Promise<void> {
  kiemTraId(id);
  if (trangThai !== "DA_THU" && trangThai !== "CON_NO")
    throw new LoiNghiepVu("Trạng thái không hợp lệ.", 400);
  const moi: TrangThaiThanhToan = trangThai;

  const hoaDon = await prisma.hoaDon.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!hoaDon) throw new LoiNghiepVu("Không tìm thấy hóa đơn.", 404);

  await prisma.hoaDon.update({
    where: { id },
    data: { trang_thai_thanh_toan: moi },
  });
}

export async function capNhatTienCong(
  hoaDonId: number,
  tienCongDauVao: unknown,
): Promise<void> {
  kiemTraId(hoaDonId);
  const tienCong = docTienCong(tienCongDauVao);

  const hoaDon = await prisma.hoaDon.findUnique({
    where: { id: hoaDonId },
    select: { tien_vat_tu: true, trang_thai_thanh_toan: true },
  });
  if (!hoaDon) throw new LoiNghiepVu("Không tìm thấy hóa đơn.", 404);
  if (hoaDon.trang_thai_thanh_toan !== "CON_NO")
    throw new LoiNghiepVu(
      "Chỉ sửa được hóa đơn còn nợ. Hãy chuyển về Còn nợ trước.",
      409,
    );

  // tien_vat_tu đã chốt lúc lập, giữ nguyên; chỉ tính lại tổng
  const tongTien =
    Math.round((tienCong + Number(hoaDon.tien_vat_tu)) * 100) / 100;

  // Điều kiện CON_NO nằm ngay trong where để chặn trường hợp ai đó vừa bấm "Đã thu"
  const ketQua = await prisma.hoaDon.updateMany({
    where: { id: hoaDonId, trang_thai_thanh_toan: "CON_NO" },
    data: { tien_cong: tienCong, tong_tien: tongTien },
  });
  if (ketQua.count === 0)
    throw new LoiNghiepVu(
      "Hóa đơn vừa được đổi trạng thái. Hãy tải lại trang.",
      409,
    );
}
