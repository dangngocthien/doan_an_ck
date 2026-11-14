import HopThoai from "@/components/admin/HopThoai";
import TrangLapHoaDon from "@/app/admin/hoa-don/lap/[phieuId]/page";

// Bấm "Lập hóa đơn" từ danh sách -> hiện form lập hóa đơn dạng hộp thoại.
// Mở thẳng /admin/hoa-don/lap/[phieuId] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function LapHoaDonTrongHopThoai({
  params,
}: {
  params: Promise<{ phieuId: string }>;
}) {
  return (
    <HopThoai tieuDe="Lập hóa đơn">
      <TrangLapHoaDon params={params} />
    </HopThoai>
  );
}
