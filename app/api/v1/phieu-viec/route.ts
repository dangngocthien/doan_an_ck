import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { thanhCong, xuLyLoi } from "@/lib/api/phan-hoi";
import { thamSoTuUrl } from "@/lib/api/tham-so";
import { docBodyJson } from "@/lib/api/doc-du-lieu";
import { docDanhSachPhieuViec } from "@/lib/services/doc-phieu-viec";
import * as phieuViecService from "@/lib/services/phieu-viec";

// GET /api/v1/phieu-viec — Admin: mọi phiếu; Thợ: chỉ phiếu của mình.
// Lọc: q, trang_thai, uu_tien, tho (id | chua_gan, chỉ Admin), loai_ngay (tao | hoan_thanh), tu, den, trang.
export async function GET(request: Request) {
  try {
    const nguoiDung = await yeuCauDangNhap();
    return thanhCong(
      await docDanhSachPhieuViec(nguoiDung, thamSoTuUrl(request)),
    );
  } catch (loi) {
    return xuLyLoi(loi);
  }
}

// POST /api/v1/phieu-viec — Admin tạo phiếu thay khách (khách gọi/nhắn Zalo).
// Khách có sẵn: { "che_do_khach": "co_san", "khach_hang_id": 1, "loai_su_co": "...",
//   "muc_do_uu_tien": "THAP|TRUNG_BINH|CAO", "dia_chi": "...", "ghi_chu": "...", "tho_id": 3 }
// Khách mới: { "che_do_khach": "moi", "khach_ten": "...", "khach_sdt": "...", "khach_dia_chi": "...", ...như trên }
// ghi_chu, tho_id, vi_do + kinh_do là tùy chọn. Kiểm tra dữ liệu nằm hết trong service.
export async function POST(request: Request) {
  try {
    await yeuCauDangNhap(["ADMIN"]);
    const body = await docBodyJson(request);

    const phieu = await phieuViecService.taoPhieuViec(
      body as phieuViecService.DuLieuTaoPhieuViec,
    );
    return thanhCong(
      {
        id: phieu.id,
        khach_hang_id: phieu.khach_hang_id,
        tho_id: phieu.tho_id,
        loai_su_co: phieu.loai_su_co,
        muc_do_uu_tien: phieu.muc_do_uu_tien,
        trang_thai: phieu.trang_thai,
        dia_chi: phieu.dia_chi,
        ghi_chu: phieu.ghi_chu,
        ngay_tao: phieu.ngay_tao,
      },
      201,
    );
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
