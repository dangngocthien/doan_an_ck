import HopThoai from "@/components/admin/HopThoai";
import ThemThoPage from "@/app/admin/tho/moi/page";

// Bấm "+ Thêm thợ" từ danh sách -> hiện form thêm dạng hộp thoại.
// Phải có file riêng này: nếu không, (.)tho/[id] sẽ bắt "moi" làm id rồi báo 404.
// Mở thẳng /admin/tho/moi hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function ThemThoTrongHopThoai() {
  return (
    <HopThoai tieuDe="Thêm thợ" rong="max-w-lg">
      <ThemThoPage />
    </HopThoai>
  );
}
