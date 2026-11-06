import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Đọc và kiểm tra dữ liệu đầu vào của Route Handler. Lỗi => LoiNghiepVu 400.
// route.ts ghi KHÔNG cần tự parse: dùng 3 hàm dưới đây.

const INT_TOI_DA = 2_147_483_647; // cột id/so_luong là INT: lớn hơn sẽ làm Prisma báo lỗi 500

// Id trên đường dẫn (chuỗi) -> số nguyên dương trong giới hạn INT
export function docIdDuong(giaTri: string, ten: string): number {
  if (!/^\d{1,10}$/.test(giaTri))
    throw new LoiNghiepVu(`${ten} không hợp lệ.`, 400);
  const so = Number(giaTri);
  if (so <= 0 || so > INT_TOI_DA)
    throw new LoiNghiepVu(`${ten} không hợp lệ.`, 400);
  return so;
}

// Body JSON phải là một object. choPhepRong = true: body trống được coi là {}
export async function docBodyJson(
  request: Request,
  choPhepRong = false,
): Promise<Record<string, unknown>> {
  const chu = await request.text();
  if (!chu.trim()) {
    if (choPhepRong) return {};
    throw new LoiNghiepVu("Thiếu nội dung JSON.", 400);
  }
  let du: unknown;
  try {
    du = JSON.parse(chu);
  } catch {
    throw new LoiNghiepVu("Nội dung gửi lên không phải JSON hợp lệ.", 400);
  }
  if (typeof du !== "object" || du === null || Array.isArray(du))
    throw new LoiNghiepVu("Nội dung JSON phải là một object.", 400);
  return du as Record<string, unknown>;
}

// Giá trị trong JSON phải là SỐ (không nhận chuỗi "5") nguyên, không vượt INT
export function docSoNguyen(giaTri: unknown, ten: string): number {
  if (
    typeof giaTri !== "number" ||
    !Number.isInteger(giaTri) ||
    giaTri > INT_TOI_DA
  )
    throw new LoiNghiepVu(`${ten} phải là số nguyên hợp lệ.`, 400);
  return giaTri;
}
