import HopThoai from "@/components/admin/HopThoai";
import TaoPhieuViecPage from "@/app/admin/phieu-viec/moi/page";

// Bấm "+ Tạo phiếu việc" từ danh sách -> hiện form tạo dạng hộp thoại.
// Phải có file riêng này: nếu không, (.)phieu-viec/[id] sẽ bắt "moi" làm id rồi báo 404.
// Mở thẳng /admin/phieu-viec/moi hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function TaoPhieuViecTrongHopThoai() {
  return (
    <HopThoai tieuDe="Tạo phiếu việc">
      <TaoPhieuViecPage />
    </HopThoai>
  );
}
