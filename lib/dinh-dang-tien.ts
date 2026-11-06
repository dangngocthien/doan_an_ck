// Định dạng tiền VND: 1500000 -> "1.500.000 ₫"
export function dinhDangTien(giaTri: number): string {
  return giaTri.toLocaleString("vi-VN") + " ₫";
}
