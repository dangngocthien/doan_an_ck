import AdminKhung from "@/components/admin/AdminKhung";
import DangXuatButton from "@/components/DangXuatButton";

export default function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <AdminKhung nutDangXuat={<DangXuatButton />}>
      {children}
      {modal}
    </AdminKhung>
  );
}
