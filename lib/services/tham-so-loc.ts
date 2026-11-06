import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Đọc và kiểm tra tham số lọc (query string) cho các API GET.
// Khác trang web (giá trị lạ thì bỏ qua), API trả 400 để người gọi biết mình gửi sai.

export type ThamSoLoc = Record<string, string | undefined>;

// Người gọi API đã được xác thực ở lớp route
export type NguoiGoi = { id: number; vai_tro: "ADMIN" | "THO" };

const INT_TOI_DA = 2_147_483_647; // Prisma Int là 32-bit: lớn hơn sẽ ném lỗi hệ thống
const MS_MOT_NGAY = 24 * 60 * 60 * 1000;
const LECH_VN = 7 * 60 * 60 * 1000; // múi giờ Việt Nam (UTC+7), không có giờ mùa hè

function loiThamSo(ten: string) {
  return new LoiNghiepVu(`Tham số ${ten} không hợp lệ.`, 400);
}

export function docChuoiLoc(giaTri: string | undefined, toiDa = 100): string {
  return (giaTri ?? "").trim().slice(0, toiDa);
}

// Rỗng => null; thuộc danh sách => giá trị đó; còn lại => 400.
export function docLuaChon<T extends string>(
  giaTri: string | undefined,
  danhSach: readonly T[],
  ten: string,
): T | null {
  const s = (giaTri ?? "").trim();
  if (s === "") return null;
  const t = danhSach.find((x) => x === s);
  if (t === undefined) throw loiThamSo(ten);
  return t;
}

// Rỗng => null; số nguyên dương trong khoảng Int => số; còn lại => 400.
export function docIdLoc(giaTri: string | undefined, ten: string): number | null {
  const s = (giaTri ?? "").trim();
  if (s === "") return null;
  if (!/^\d+$/.test(s)) throw loiThamSo(ten);
  const n = Number(s);
  if (n <= 0 || n > INT_TOI_DA) throw loiThamSo(ten);
  return n;
}

// Số tiền nguyên không âm, tối đa 10 chữ số (cột Decimal(12,2)).
export function docTienLoc(giaTri: string | undefined, ten: string): number | null {
  const s = (giaTri ?? "").trim();
  if (s === "") return null;
  if (!/^\d{1,10}$/.test(s)) throw loiThamSo(ten);
  return Number(s);
}

// "YYYY-MM-DD" => 00:00 ngày đó theo giờ Việt Nam. Ngày không có thật (2026-02-31) => 400.
export function docNgayVN(giaTri: string | undefined, ten: string): Date | null {
  const s = (giaTri ?? "").trim();
  if (s === "") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw loiThamSo(ten);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  if (
    utc.getUTCFullYear() !== y ||
    utc.getUTCMonth() !== mo - 1 ||
    utc.getUTCDate() !== d
  )
    throw loiThamSo(ten);
  return new Date(utc.getTime() - LECH_VN);
}

// 00:00 ngày kế tiếp: dùng với `lt` để lấy trọn cả ngày cuối của khoảng lọc.
export function ngaySau(dauNgay: Date): Date {
  return new Date(dauNgay.getTime() + MS_MOT_NGAY);
}
