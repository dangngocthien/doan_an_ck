import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Giới hạn chặn trên (tránh Prisma ném lỗi khi giá trị vượt kiểu cột).
// Nếu schema.prisma của bạn khai báo cột nhỏ hơn (vd @db.VarChar(50), Decimal(8,2)) thì sửa các hằng này cho khớp.
const TEN_TOI_DA = 100;
const DON_VI_TOI_DA = 20;
const TON_TOI_DA = 2_147_483_647; // INT của MariaDB
const GIA_TOI_DA = 99_999_999; // an toàn cho Decimal(10,2) trở lên

export type DuLieuVatTu = {
  ten: string;
  don_vi: string;
  so_luong_ton: number;
  gia: number;
};

// Nhận chuỗi (từ form) hoặc số (từ JSON). Chuỗi rỗng, âm, thập phân, chữ => null.
// (Không dùng Number("") vì ra 0.)
function docSoNguyenKhongAm(giaTri: unknown): number | null {
  if (typeof giaTri === "number") {
    return Number.isInteger(giaTri) && giaTri >= 0 ? giaTri : null;
  }
  if (typeof giaTri === "string") {
    const s = giaTri.trim();
    if (!/^\d+$/.test(s)) return null;
    return Number(s);
  }
  return null;
}

function docChuoi(giaTri: unknown): string {
  return typeof giaTri === "string" ? giaTri.trim() : "";
}

// Dùng chung cho Server Action (FormData) và REST API (JSON): đầu vào là unknown.
export function docDuLieuVatTu(raw: {
  ten?: unknown;
  don_vi?: unknown;
  so_luong_ton?: unknown;
  gia?: unknown;
}): DuLieuVatTu {
  const ten = docChuoi(raw.ten);
  const don_vi = docChuoi(raw.don_vi);

  if (!ten) throw new LoiNghiepVu("Vui lòng nhập tên vật tư.", 400);
  if (ten.length > TEN_TOI_DA)
    throw new LoiNghiepVu(`Tên vật tư tối đa ${TEN_TOI_DA} ký tự.`, 400);
  if (!don_vi)
    throw new LoiNghiepVu("Vui lòng nhập đơn vị (cái, mét, cuộn...).", 400);
  if (don_vi.length > DON_VI_TOI_DA)
    throw new LoiNghiepVu(`Đơn vị tối đa ${DON_VI_TOI_DA} ký tự.`, 400);

  const so_luong_ton = docSoNguyenKhongAm(raw.so_luong_ton);
  if (so_luong_ton === null)
    throw new LoiNghiepVu("Số lượng tồn phải là số nguyên từ 0 trở lên.", 400);
  if (so_luong_ton > TON_TOI_DA)
    throw new LoiNghiepVu("Số lượng tồn quá lớn.", 400);

  const gia = docSoNguyenKhongAm(raw.gia);
  if (gia === null)
    throw new LoiNghiepVu("Giá phải là số nguyên từ 0 trở lên.", 400);
  if (gia > GIA_TOI_DA)
    throw new LoiNghiepVu(
      `Giá tối đa ${GIA_TOI_DA.toLocaleString("vi-VN")} đồng.`,
      400,
    );

  return { ten, don_vi, so_luong_ton, gia };
}

export async function taoVatTu(raw: Parameters<typeof docDuLieuVatTu>[0]) {
  const duLieu = docDuLieuVatTu(raw);
  return prisma.vatTu.create({ data: duLieu });
}

// tonLucMo = số tồn mà người dùng nhìn thấy lúc mở form.
// - Không đổi ô tồn (số gửi lên == tonLucMo): chỉ cập nhật tên/đơn vị/giá,
//   KHÔNG đụng so_luong_ton => không bao giờ ghi đè số thợ vừa trừ.
// - Có đổi ô tồn: chỉ ghi nếu tồn trong DB vẫn đúng bằng tonLucMo, ngược lại 409.
export async function capNhatVatTu(
  id: number,
  raw: Parameters<typeof docDuLieuVatTu>[0],
  tonLucMoRaw: unknown,
) {
  if (!Number.isInteger(id) || id <= 0)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ.", 400);

  const duLieu = docDuLieuVatTu(raw);

  const tonLucMo = docSoNguyenKhongAm(tonLucMoRaw);
  if (tonLucMo === null || tonLucMo > TON_TOI_DA)
    throw new LoiNghiepVu("Dữ liệu không hợp lệ. Hãy tải lại trang.", 400);

  const khongDoiTon = duLieu.so_luong_ton === tonLucMo;

  if (khongDoiTon) {
    const { ten, don_vi, gia } = duLieu;
    try {
      await prisma.vatTu.update({ where: { id }, data: { ten, don_vi, gia } });
    } catch (loi) {
      if ((loi as { code?: string }).code === "P2025")
        throw new LoiNghiepVu("Không tìm thấy vật tư.", 404);
      throw loi;
    }
    return;
  }

  // Có đổi tồn: dòng chắc chắn thay đổi nên count = 0 nghĩa là không khớp điều kiện.
  const ketQua = await prisma.vatTu.updateMany({
    where: { id, so_luong_ton: tonLucMo },
    data: duLieu,
  });
  if (ketQua.count === 0) {
    const tonTai = await prisma.vatTu.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!tonTai) throw new LoiNghiepVu("Không tìm thấy vật tư.", 404);
    throw new LoiNghiepVu(
      "Tồn kho vừa thay đổi (có thợ vừa ghi vật tư). Hãy tải lại trang rồi nhập lại.",
      409,
    );
  }
}
