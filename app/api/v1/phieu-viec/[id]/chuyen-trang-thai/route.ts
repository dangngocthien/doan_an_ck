import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { docBodyJson, docIdDuong } from "@/lib/api/doc-du-lieu";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as trangThaiService from "@/lib/services/trang-thai-phieu-viec";

// POST /api/v1/phieu-viec/{id}/chuyen-trang-thai — Thợ chuyển phiếu của mình sang bước kế tiếp.
// Body (tùy chọn): { "tu_trang_thai": "DANG_DI" } — trạng thái client đang thấy; lệch DB => 409.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const nguoiDung = await yeuCauDangNhap(["THO"]);
    const phieuViecId = docIdDuong((await params).id, "id phiếu việc");
    const body = await docBodyJson(request, true);

    const tu = body.tu_trang_thai;
    if (tu !== undefined && typeof tu !== "string")
      throw new LoiNghiepVu("tu_trang_thai phải là chuỗi.", 400);

    const trangThaiMoi = await trangThaiService.chuyenTrangThaiTiepTheo(
      Number(nguoiDung.id),
      phieuViecId,
      tu,
    );
    return thanhCong({ id: phieuViecId, trang_thai: trangThaiMoi });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
