import HopThoai from "@/components/admin/HopThoai";
import SuaPhieuViecPage from "@/app/admin/phieu-viec/[id]/page";

// Bấm "Xem / Sửa" từ trong khu admin -> hiện trang chi tiết phiếu việc dạng hộp thoại.
// Mở thẳng /admin/phieu-viec/[id] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function PhieuViecTrongHopThoai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HopThoai tieuDe="Chi tiết phiếu việc">
      <SuaPhieuViecPage params={params} />
    </HopThoai>
  );
}
