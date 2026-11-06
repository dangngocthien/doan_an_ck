import { NextResponse } from "next/server";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// Định dạng JSON thống nhất cho REST API /api/v1:
//   thành công: { "data": ... }
//   lỗi:        { "error": { "message": "..." } }

export function thanhCong(data: unknown, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function traLoi(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

// Dùng trong catch của mọi route:
// - LoiNghiepVu: trả đúng mã HTTP + thông báo của nó.
// - Lỗi khác (DB sập, bug...): ghi log ở terminal, trả 500 chung chung, KHÔNG lộ chi tiết.
export function xuLyLoi(loi: unknown) {
  if (loi instanceof LoiNghiepVu) return traLoi(loi.message, loi.status);
  console.error(loi);
  return traLoi("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", 500);
}
