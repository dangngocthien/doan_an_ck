import { taoKhachHang } from "@/lib/actions/khach-hang";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import KhachHangForm from "../KhachHangForm";

export default function ThemKhachHangPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Thêm khách hàng</CardTitle>
      </CardHeader>

      <CardContent>
        <KhachHangForm action={taoKhachHang} nhanNut="Lưu" />
      </CardContent>
    </Card>
  );
}
