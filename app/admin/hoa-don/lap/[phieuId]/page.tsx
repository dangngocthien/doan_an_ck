import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
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
import LapHoaDonForm from "./LapHoaDonForm";

export default async function TrangLapHoaDon({
  params,
}: {
  params: Promise<{ phieuId: string }>;
}) {
  const { phieuId: phieuIdRaw } = await params;
  const phieuId = docIdTrang(phieuIdRaw);
  if (phieuId === null) notFound();

  const phieu = await prisma.phieuViec.findUnique({
    where: { id: phieuId },
    include: { khach_hang: true, hoa_don: { select: { id: true } } },
  });
  if (!phieu) notFound();
  if (phieu.hoa_don) redirect(`/admin/hoa-don/${phieu.hoa_don.id}`);

  const khungTrang = (noiDung: ReactNode) => (
    <div className="space-y-4">
      <Link href="/admin/hoa-don" className="text-sm text-[var(--color-primary)] hover:underline">
        ← Quay lại danh sách
      </Link>
      <Card className="max-w-2xl">{noiDung}</Card>
    </div>
  );

  if (phieu.trang_thai !== "HOAN_THANH") {
    return khungTrang(
      <CardContent>
        <p className="text-sm text-[var(--color-text)]">
          Phiếu #{phieu.id} chưa hoàn thành nên chưa thể lập hóa đơn.
        </p>
      </CardContent>
    );
  }

  // Truy vấn riêng, đổi Decimal -> number ở server
  const dongVatTu = (
    await prisma.vatTuSuDung.findMany({
      where: { phieu_viec_id: phieuId },
      include: { vat_tu: true },
      orderBy: { id: "asc" },
    })
  ).map((d) => {
    const gia = Number(d.vat_tu.gia);
    return {
      id: d.id,
      ten: d.vat_tu.ten,
      don_vi: d.vat_tu.don_vi,
      so_luong: d.so_luong,
      gia,
      thanh_tien: gia * d.so_luong,
    };
  });
  const tienVatTu = dongVatTu.reduce((t, d) => t + d.thanh_tien, 0);

  return khungTrang(
    <>
      <CardHeader>
        <CardTitle>Lập hóa đơn cho phiếu #{phieu.id}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text)] space-y-1">
          <p>
            <span className="text-[var(--color-text-muted)]">Khách hàng: </span>
            {phieu.khach_hang.ten} — {phieu.khach_hang.sdt}
          </p>
          <p className="break-words">
            <span className="text-[var(--color-text-muted)]">Sự cố: </span>
            {phieu.loai_su_co}
          </p>
          <p className="break-words">
            <span className="text-[var(--color-text-muted)]">Địa chỉ: </span>
            {phieu.dia_chi}
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
                {phieu.khong_dung_vat_tu
                  ? "Thợ xác nhận ca này không dùng vật tư."
                  : "Chưa ghi vật tư."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vật tư</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dongVatTu.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.ten}</TableCell>
                      <TableCell>
                        {d.so_luong} {d.don_vi}
                      </TableCell>
                      <TableCell>{dinhDangTien(d.gia)}</TableCell>
                      <TableCell>{dinhDangTien(d.thanh_tien)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="font-semibold">
                      Tiền vật tư
                    </TableCell>
                    <TableCell className="font-semibold">
                      {dinhDangTien(tienVatTu)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Tiền vật tư được chốt theo giá hiện tại và lưu cố định khi lập hóa đơn.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <LapHoaDonForm phieuViecId={phieu.id} tienVatTu={tienVatTu} />
        </section>
      </CardContent>
    </>
  );
}
