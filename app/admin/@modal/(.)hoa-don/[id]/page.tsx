import HopThoai from "@/components/admin/HopThoai";
import TrangChiTietHoaDon from "@/app/admin/hoa-don/[id]/page";

// Bấm "Xem" từ danh sách hóa đơn -> hiện chi tiết hóa đơn dạng hộp thoại.
// Mở thẳng /admin/hoa-don/[id] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function HoaDonTrongHopThoai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HopThoai tieuDe="Chi tiết hóa đơn" rong="max-w-xl">
      <TrangChiTietHoaDon params={params} />
    </HopThoai>
  );
}
