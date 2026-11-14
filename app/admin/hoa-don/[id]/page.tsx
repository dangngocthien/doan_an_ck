import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { dinhDangTien } from "@/lib/dinh-dang-tien";
import { doiTrangThaiThanhToan } from "@/lib/actions/hoa-don";
import NhanThanhToan from "../NhanThanhToan";
import SuaTienCongForm from "./SuaTienCongForm";

export default async function TrangChiTietHoaDon({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idRaw } = await params;
  const id = docIdTrang(idRaw);
  if (id === null) notFound();

  const hoaDon = await prisma.hoaDon.findUnique({
    where: { id },
    include: {
      phieu_viec: {
        include: { khach_hang: true, tho: { select: { id: true, ten: true } } },
      },
    },
  });
  if (!hoaDon) notFound();

  // Chỉ hiện tên + số lượng; số tiền lấy từ hóa đơn (đã chốt lúc lập)
  const dongVatTu = await prisma.vatTuSuDung.findMany({
    where: { phieu_viec_id: hoaDon.phieu_viec_id },
    include: { vat_tu: true },
    orderBy: { id: "asc" },
  });

  const phieu = hoaDon.phieu_viec;
  const daThu = hoaDon.trang_thai_thanh_toan === "DA_THU";

  return (
    <Card className="max-w-2xl">
        <CardHeader className="flex-wrap gap-3 pr-14 sm:pr-14">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Hóa đơn #{hoaDon.id}</CardTitle>
            <NhanThanhToan trangThai={hoaDon.trang_thai_thanh_toan} />
          </div>
          <a
            href={`/api/v1/hoa-don/${hoaDon.id}/pdf`}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-md border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
          >
            Tải PDF
          </a>
        </CardHeader>

        <CardContent className="space-y-4">
          <section className="space-y-1 rounded-lg border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text)]">
            <p>
              <span className="text-[var(--color-text-muted)]">Ngày lập: </span>
              {hoaDon.ngay_lap.toLocaleDateString("vi-VN")}
            </p>
            <p>
              <span className="text-[var(--color-text-muted)]">Khách hàng: </span>
              {phieu.khach_hang.ten} — {phieu.khach_hang.sdt}
            </p>
            <p className="break-words">
              <span className="text-[var(--color-text-muted)]">Sự cố: </span>
              {phieu.loai_su_co}
            </p>
            <p>
              <span className="text-[var(--color-text-muted)]">Thợ: </span>
              {phieu.tho ? phieu.tho.ten : "—"}
            </p>
            <p>
              <span className="text-[var(--color-text-muted)]">Phiếu việc: </span>
              <Link
                href={`/admin/phieu-viec/${phieu.id}`}
                className="text-[var(--color-primary)] hover:underline"
              >
                #{phieu.id}
              </Link>
            </p>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-white">
            <div className="rounded-t-lg border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--color-primary)]">
                Vật tư đã dùng
              </h2>
            </div>
            <div className="p-4">
              {dongVatTu.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Không có vật tư.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Vật tư</TableHead>
                      <TableHead>Số lượng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dongVatTu.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.vat_tu.ten}</TableCell>
                        <TableCell>
                          {d.so_luong} {d.vat_tu.don_vi}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>

          <section className="space-y-2 rounded-lg border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text)]">
            <div className="flex justify-between">
              <span>Tiền công</span>
              <span>{dinhDangTien(Number(hoaDon.tien_cong))}</span>
            </div>
            <div className="flex justify-between">
              <span>Tiền vật tư</span>
              <span>{dinhDangTien(Number(hoaDon.tien_vat_tu))}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-semibold">
              <span>Tổng tiền</span>
              <span>{dinhDangTien(Number(hoaDon.tong_tien))}</span>
            </div>
          </section>

          {!daThu && (
            <section className="rounded-lg border border-[var(--color-border)] bg-white p-4">
              <SuaTienCongForm
                hoaDonId={hoaDon.id}
                tienCong={Number(hoaDon.tien_cong)}
              />
            </section>
          )}

          <form
            action={doiTrangThaiThanhToan.bind(
              null,
              hoaDon.id,
              daThu ? "CON_NO" : "DA_THU",
            )}
          >
            <Button
              type="submit"
              variant={daThu ? "outline" : "primary"}
              className="w-full sm:w-auto"
            >
              {daThu ? "Chuyển về Còn nợ" : "Đánh dấu Đã thu"}
            </Button>
          </form>
        </CardContent>
    </Card>
  );
}
