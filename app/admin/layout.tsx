import AdminKhung from "@/components/admin/AdminKhung";
import DangXuatButton from "@/components/DangXuatButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminKhung nutDangXuat={<DangXuatButton />}>{children}</AdminKhung>;
}
