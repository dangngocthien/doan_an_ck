import HopThoai from "@/components/admin/HopThoai";
import ThemKhachHangPage from "@/app/admin/khach-hang/moi/page";

// Bấm "+ Thêm khách hàng" từ danh sách -> hiện form thêm dạng hộp thoại.
// Phải có file riêng này: nếu không, (.)khach-hang/[id] sẽ bắt "moi" làm id rồi báo 404.
// Mở thẳng /admin/khach-hang/moi hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function ThemKhachHangTrongHopThoai() {
  return (
    <HopThoai tieuDe="Thêm khách hàng" rong="max-w-lg">
      <ThemKhachHangPage />
    </HopThoai>
  );
}
