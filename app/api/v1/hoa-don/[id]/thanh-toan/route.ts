import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docBodyJson, docIdDuong } from "@/lib/api/doc-du-lieu";
import * as hoaDonService from "@/lib/services/hoa-don";

// PUT /api/v1/hoa-don/{id}/thanh-toan — Admin đổi trạng thái thanh toán.
// Body: { "trang_thai_thanh_toan": "DA_THU" } hoặc { "trang_thai_thanh_toan": "CON_NO" }.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await yeuCauDangNhap(["ADMIN"]);
    const hoaDonId = docIdDuong((await params).id, "id hóa đơn");
    const body = await docBodyJson(request);
    // Không phải chuỗi => "" => service trả 400 "Trạng thái không hợp lệ."
    const trangThai =
      typeof body.trang_thai_thanh_toan === "string"
        ? body.trang_thai_thanh_toan
        : "";

    await hoaDonService.doiTrangThaiThanhToan(hoaDonId, trangThai);
    return thanhCong({ id: hoaDonId, trang_thai_thanh_toan: trangThai });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
