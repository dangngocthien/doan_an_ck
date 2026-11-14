import HopThoai from "@/components/admin/HopThoai";
import SuaVatTuPage from "@/app/admin/vat-tu/[id]/page";

// Bấm "Sửa" từ danh sách vật tư -> hiện form sửa dạng hộp thoại.
// Mở thẳng /admin/vat-tu/[id] hoặc tải lại trang -> vẫn ra trang đầy đủ như cũ.
export default function VatTuTrongHopThoai({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HopThoai tieuDe="Sửa vật tư" rong="max-w-xl">
      <SuaVatTuPage params={params} />
    </HopThoai>
  );
}
