// Số dòng mỗi trang — đổi 1 chỗ này là áp dụng cho cả Phiếu việc, Hóa đơn, Khách hàng
export const SO_DONG_MOI_TRANG = 10;

// Đọc `?trang=` từ URL: chỉ nhận số nguyên dương, sai thì về trang 1
export function docTrang(giaTri: string | string[] | undefined): number {
  const v = (Array.isArray(giaTri) ? giaTri[0] : giaTri)?.trim() ?? "";
  return /^\d+$/.test(v) ? Math.max(1, Number(v)) : 1;
}

// Kẹp trang yêu cầu vào [1, tongTrang] rồi tính skip/take cho Prisma.
// Gọi SAU khi đã `count` — nên trang vượt quá (link cũ, nút Back, dữ liệu vừa giảm)
// sẽ tự về trang cuối, không bị trang trống.
export function tinhPhanTrang(trangYeuCau: number, tong: number) {
  const tongTrang = Math.max(1, Math.ceil(tong / SO_DONG_MOI_TRANG));
  const trang = Math.min(Math.max(1, trangYeuCau), tongTrang);
  return {
    trang,
    tongTrang,
    skip: (trang - 1) * SO_DONG_MOI_TRANG,
    take: SO_DONG_MOI_TRANG,
  };
}
