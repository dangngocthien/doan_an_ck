import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docBodyJson, docIdDuong, docSoNguyen } from "@/lib/api/doc-du-lieu";
import * as vatTuSuDungService from "@/lib/services/vat-tu-su-dung";

// POST /api/v1/phieu-viec/{id}/vat-tu — Thợ ghi vật tư đã dùng (tự trừ kho).
// Body: { "vat_tu_id": 3, "so_luong": 2 }. Phiếu phải đang DANG_LAM.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const nguoiDung = await yeuCauDangNhap(["THO"]);
    const phieuViecId = docIdDuong((await params).id, "id phiếu việc");
    const body = await docBodyJson(request);
    const vatTuId = docSoNguyen(body.vat_tu_id, "vat_tu_id");
    const soLuong = docSoNguyen(body.so_luong, "so_luong");

    await vatTuSuDungService.ghiVatTu(
      Number(nguoiDung.id),
      phieuViecId,
      vatTuId,
      soLuong,
    );
    return thanhCong(
      { phieu_viec_id: phieuViecId, vat_tu_id: vatTuId, so_luong: soLuong },
      201,
    );
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
