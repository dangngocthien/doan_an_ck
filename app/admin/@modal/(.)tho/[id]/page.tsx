import HopThoai from "@/components/admin/HopThoai";
import SuaThoPage from "@/app/admin/tho/[id]/page";

// Bấm "Sửa" từ danh sách thợ -> hiện form sửa dạng hộp thoại.
// Mở thẳng /admin/tho/[id] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function ThoTrongHopThoai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HopThoai tieuDe="Sửa thợ" rong="max-w-lg">
      <SuaThoPage params={params} />
    </HopThoai>
  );
}
