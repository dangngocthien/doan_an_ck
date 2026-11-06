import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docBodyJson, docIdDuong } from "@/lib/api/doc-du-lieu";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as vatTuSuDungService from "@/lib/services/vat-tu-su-dung";

// PUT /api/v1/phieu-viec/{id}/khong-dung-vat-tu — Thợ xác nhận / bỏ xác nhận "ca không dùng vật tư".
// Body: { "gia_tri": true }. Phiếu phải đang DANG_LAM và chưa ghi dòng vật tư nào (khi gia_tri = true).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const nguoiDung = await yeuCauDangNhap(["THO"]);
    const phieuViecId = docIdDuong((await params).id, "id phiếu việc");
    const body = await docBodyJson(request);
    if (typeof body.gia_tri !== "boolean")
      throw new LoiNghiepVu("gia_tri phải là true hoặc false.", 400);

    await vatTuSuDungService.datKhongDungVatTu(
      Number(nguoiDung.id),
      phieuViecId,
      body.gia_tri,
    );
    return thanhCong({ id: phieuViecId, khong_dung_vat_tu: body.gia_tri });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
