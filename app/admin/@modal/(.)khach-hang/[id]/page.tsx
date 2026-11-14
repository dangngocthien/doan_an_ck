import HopThoai from "@/components/admin/HopThoai";
import SuaKhachHangPage from "@/app/admin/khach-hang/[id]/page";

// Bấm "Sửa" từ danh sách khách hàng -> hiện form sửa dạng hộp thoại.
// Mở thẳng /admin/khach-hang/[id] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function KhachHangTrongHopThoai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HopThoai tieuDe="Sửa khách hàng" rong="max-w-lg">
      <SuaKhachHangPage params={params} />
    </HopThoai>
  );
}
