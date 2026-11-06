import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { thamSoTuUrl } from "@/lib/api/tham-so";
import { docDanhSachVatTu } from "@/lib/services/doc-vat-tu";

// GET /api/v1/vat-tu — Admin và Thợ.
// Lọc: q, trang_thai (dang_dung | ngung | tat_ca; mặc định dang_dung), ton_kho (sap_het | het_hang), trang.
export async function GET(request: Request) {
  try {
    const nguoiDung = await yeuCauDangNhap();
    return thanhCong(await docDanhSachVatTu(nguoiDung, thamSoTuUrl(request)));
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
