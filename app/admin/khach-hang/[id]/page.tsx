import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import {
  capNhatKhachHang,
  ngungHoatDongKhachHang,
} from "@/lib/actions/khach-hang";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import KhachHangForm from "../KhachHangForm";

export default async function SuaKhachHangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const khachHangId = docIdTrang(id);
  if (khachHangId === null) {
    notFound();
  }

  const khachHang = await prisma.khachHang.findUnique({
    where: { id: khachHangId },
  });

  if (!khachHang) {
    notFound();
  }

  const capNhatVoiId = capNhatKhachHang.bind(null, khachHang.id);
  const ngungHoatDongVoiId = ngungHoatDongKhachHang.bind(null, khachHang.id);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Sửa khách hàng</CardTitle>
      </CardHeader>

      <CardContent>
        <KhachHangForm
          action={capNhatVoiId}
          giaTriBanDau={{
            ten: khachHang.ten,
            sdt: khachHang.sdt,
            dia_chi: khachHang.dia_chi,
          }}
          nhanNut="Lưu thay đổi"
        />

        <form action={ngungHoatDongVoiId} className="mt-4">
          <Button type="submit" variant="danger" size="sm">
            Ngừng hoạt động khách hàng này
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
