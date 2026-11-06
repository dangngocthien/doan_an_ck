import { Nhan } from "@/components/admin/NhanTrangThai";

export default function NhanThanhToan({
  trangThai,
}: {
  trangThai: "DA_THU" | "CON_NO";
}) {
  const daThu = trangThai === "DA_THU";
  return (
    <Nhan kieu={daThu ? "ok" : "danger"}>{daThu ? "Đã thu" : "Còn nợ"}</Nhan>
  );
}
