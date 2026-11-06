import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { thamSoTuUrl } from "@/lib/api/tham-so";
import { docDanhSachHoaDon } from "@/lib/services/doc-hoa-don";

// GET /api/v1/hoa-don — chỉ Admin.
// Lọc: q, trang_thai (DA_THU | CON_NO), tu_ngay, den_ngay, tien_tu, tien_den, trang.
export async function GET(request: Request) {
  try {
    await yeuCauDangNhap(["ADMIN"]);
    return thanhCong(await docDanhSachHoaDon(thamSoTuUrl(request)));
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
