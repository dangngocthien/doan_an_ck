// Dùng chung cho server action và form (client). Không để trong file "use server"
// vì file đó chỉ được export hàm async.

export type LoaiAnhPhieu = "TRUOC" | "SAU";

// Mỗi loại ảnh chỉ được thêm/xóa ở đúng 1 trạng thái của phiếu:
// - Ảnh trước khi làm: chụp khi thợ đã tới nơi (Đang đi), trước khi bấm "Bắt đầu sửa chữa"
// - Ảnh sau khi làm:  chụp khi sửa xong (Đang làm), trước khi bấm "Hoàn thành công việc"
export const TRANG_THAI_CHUP_ANH: Record<LoaiAnhPhieu, string> = {
  TRUOC: "DANG_DI",
  SAU: "DANG_LAM",
};

// Trả về null nếu được phép; ngược lại trả về lý do để hiển thị cho thợ.
export function lyDoKhongChupAnh(
  loai: LoaiAnhPhieu,
  trangThai: string,
): string | null {
  if (trangThai === TRANG_THAI_CHUP_ANH[loai]) return null;

  if (trangThai === "HOAN_THANH" || trangThai === "DA_HUY") {
    return "Phiếu đã đóng, không thể thêm hoặc xóa ảnh.";
  }

  if (loai === "TRUOC") {
    return trangThai === "MOI"
      ? 'Chụp ảnh này khi đã tới nơi, sau khi bấm "Bắt đầu di chuyển".'
      : "Đã bắt đầu sửa chữa nên ảnh trước khi làm đã được khóa.";
  }

  return 'Chụp ảnh này sau khi sửa xong, ở bước "Đang làm".';
}
