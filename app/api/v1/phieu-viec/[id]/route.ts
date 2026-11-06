import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docChiTietPhieuViec } from "@/lib/services/doc-phieu-viec";

// GET /api/v1/phieu-viec/{id} — Admin: mọi phiếu; Thợ: chỉ phiếu được giao (phiếu khác => 403).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const nguoiDung = await yeuCauDangNhap();
    const { id } = await params;
    return thanhCong(await docChiTietPhieuViec(nguoiDung, id));
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
