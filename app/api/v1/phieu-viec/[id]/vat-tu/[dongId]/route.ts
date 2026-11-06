import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docIdDuong } from "@/lib/api/doc-du-lieu";
import * as vatTuSuDungService from "@/lib/services/vat-tu-su-dung";

// DELETE /api/v1/phieu-viec/{id}/vat-tu/{dongId} — Thợ xóa dòng ghi nhầm, kho tự cộng lại.
// Chỉ khi phiếu đang DANG_LAM.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; dongId: string }> },
) {
  try {
    const nguoiDung = await yeuCauDangNhap(["THO"]);
    const { id, dongId } = await params;
    const phieuViecId = docIdDuong(id, "id phiếu việc");
    const idDong = docIdDuong(dongId, "id dòng vật tư");

    await vatTuSuDungService.xoaVatTuSuDung(
      Number(nguoiDung.id),
      phieuViecId,
      idDong,
    );
    return thanhCong({ da_xoa: true, id: idDong });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
