// Lỗi nghiệp vụ "dự đoán được" (sai dữ liệu, không đủ tồn kho, sai trạng thái...).
// - Server Action: bắt lỗi này rồi trả { error: message } cho giao diện.
// - Route Handler (API): bắt lỗi này rồi trả JSON với mã HTTP = status.
// Mọi lỗi KHÁC (lỗi hệ thống, DB sập...) không phải LoiNghiepVu, được ném tiếp, không lộ ra người dùng.
//
// status: 400 sai dữ liệu · 403 không có quyền · 404 không tìm thấy · 409 xung đột trạng thái/tồn kho
export class LoiNghiepVu extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "LoiNghiepVu";
    this.status = status;
  }
}
