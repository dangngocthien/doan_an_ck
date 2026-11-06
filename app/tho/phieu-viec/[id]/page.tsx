import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import ThoPhieuViecForm from "./ThoPhieuViecForm";
import KhuVatTu from "./KhuVatTu";

export default async function ThoPhieuViecChiTietPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const phieuViecId = docIdTrang(id);
  if (phieuViecId === null) {
    notFound();
  }

  const session = await auth();
  const thoId = Number((session?.user as { id?: string })?.id);

  const phieuViec = await prisma.phieuViec.findUnique({
    where: { id: phieuViecId },
    include: {
      khach_hang: true,
      anh_phieu_viec: true,
      _count: { select: { vat_tu_su_dung: true } },
    },
  });

  if (!phieuViec) {
    notFound();
  }

  if (phieuViec.tho_id !== thoId) {
    redirect("/tho/phieu-viec");
  }

  // Đang làm mà chưa ghi vật tư và chưa xác nhận "không dùng vật tư" → khóa nút Hoàn thành
  const lyDoKhoaNut =
    phieuViec.trang_thai === "DANG_LAM" &&
    phieuViec._count.vat_tu_su_dung === 0 &&
    !phieuViec.khong_dung_vat_tu
      ? 'Cần ghi vật tư đã dùng, hoặc chọn "Ca này không dùng vật tư" ở mục Vật tư bên dưới, mới hoàn thành được.'
      : undefined;

  return (
    <>
      <ThoPhieuViecForm phieuViec={phieuViec} lyDoKhoaNut={lyDoKhoaNut} />
      <KhuVatTu
        phieuViecId={phieuViec.id}
        trangThai={phieuViec.trang_thai}
        khongDungVatTu={phieuViec.khong_dung_vat_tu}
      />
    </>
  );
}
