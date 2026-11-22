import HopThoai from "@/components/admin/HopThoai";
import ThemVatTuPage from "@/app/admin/vat-tu/moi/page";

// Bấm "+ Thêm vật tư" từ danh sách -> hiện form thêm dạng hộp thoại.
// Phải có file riêng này: nếu không, (.)vat-tu/[id] sẽ bắt "moi" làm id rồi báo 404.
// Mở thẳng /admin/vat-tu/moi hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function ThemVatTuTrongHopThoai() {
  return (
    <HopThoai tieuDe="Thêm vật tư" rong="max-w-xl">
      <ThemVatTuPage />
    </HopThoai>
  );
}
