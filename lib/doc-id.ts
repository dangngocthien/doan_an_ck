// Đọc id trên URL của trang web (/xxx/[id]). Hợp lệ => số nguyên dương trong giới hạn INT,
// không hợp lệ => null (trang gọi notFound()). Hàm thuần, không import Prisma.
// Khác docIdDuong ở lib/api/doc-du-lieu.ts: hàm đó ném LoiNghiepVu 400 cho Route Handler.

const INT_TOI_DA = 2_147_483_647; // cột id là INT: lớn hơn sẽ làm Prisma báo lỗi

export function docIdTrang(chuoi: string): number | null {
  if (!/^\d{1,10}$/.test(chuoi)) return null;
  const so = Number(chuoi);
  if (so <= 0 || so > INT_TOI_DA) return null;
  return so;
}
