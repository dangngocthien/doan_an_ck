// Chuyển sang bất kỳ trang admin nào khác (vd: lưu xong chuyển về danh sách) thì hộp thoại phải đóng.
// Khi điều hướng phía client, slot không khớp route sẽ giữ nguyên nội dung cũ,
// nên cần route "bắt hết" trả về null để xóa hộp thoại.
export default function CatchAll() {
  return null;
}
