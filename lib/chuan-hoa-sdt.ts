// Quy tắc SĐT dùng chung cho Khách hàng, Thợ và Phiếu việc (khách mới).
// Không đặt trong file "use server" vì file đó chỉ được export hàm async.

export const LOI_SDT =
  "Số điện thoại không hợp lệ. Nhập số di động Việt Nam 10 số, ví dụ 0901234567.";

// Trả về SĐT dạng 0xxxxxxxxx, hoặc null nếu không hợp lệ.
// Chấp nhận dấu cách/chấm/gạch ngang và đầu số +84 hoặc 84.
export function chuanHoaSdt(sdt: string): string | null {
  let s = sdt.replace(/[\s.\-]/g, "");
  if (s.startsWith("+84")) s = "0" + s.slice(3);
  else if (s.startsWith("84")) s = "0" + s.slice(2);
  return /^0[35789]\d{8}$/.test(s) ? s : null;
}
