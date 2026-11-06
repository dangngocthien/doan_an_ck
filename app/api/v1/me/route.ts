import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";

// GET /api/v1/me — xem tài khoản đang đăng nhập (mọi vai trò).
export async function GET() {
  try {
    const nguoiDung = await yeuCauDangNhap();
    return thanhCong(nguoiDung);
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
