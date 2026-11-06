import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ngungDungVatTu,
  kichHoatLaiVatTu,
} from "@/lib/actions/vat-tu-trang-thai";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import PhanTrang from "@/components/admin/PhanTrang";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import BoLocVatTu from "./BoLocVatTu";
import { Nhan } from "@/components/admin/NhanTrangThai";

// Tồn kho ≤ ngưỡng này được coi là "sắp hết" (chưa có cột riêng từng vật tư)
const NGUONG_SAP_HET = 5;

// Giá trị hợp lệ của bộ lọc; giá trị lạ trên URL sẽ về mặc định
const LOC_TRANG_THAI = ["tat_ca", "dang_dung", "ngung"] as const;
const LOC_TON_KHO = ["tat_ca", "sap_het", "het_hang"] as const;

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.vatTu.count>[0]>["where"]
>;
type GiaTri = string | string[] | undefined;

function mot(v: GiaTri): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function DanhSachVatTuPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: GiaTri;
    trang_thai?: GiaTri;
    ton_kho?: GiaTri;
    trang?: GiaTri;
  }>;
}) {
  const sp = await searchParams;

  // Đọc và kiểm tra bộ lọc từ URL
  const q = mot(sp.q).slice(0, 100);
  const trangThai =
    LOC_TRANG_THAI.find((x) => x === mot(sp.trang_thai)) ?? "tat_ca";
  const tonKho = LOC_TON_KHO.find((x) => x === mot(sp.ton_kho)) ?? "tat_ca";

  const where: DieuKien = {};
  if (q) where.ten = { contains: q };
  if (trangThai === "dang_dung") where.dang_hoat_dong = true;
  if (trangThai === "ngung") where.dang_hoat_dong = false;
  if (tonKho === "sap_het") where.so_luong_ton = { lte: NGUONG_SAP_HET };
  if (tonKho === "het_hang") where.so_luong_ton = 0;

  const tong = await prisma.vatTu.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(docTrang(sp.trang), tong);

  // Vật tư đang dùng lên trước, đã ngừng dùng xuống cuối;
  // id làm khóa phụ để thứ tự giữa các trang ổn định
  const danhSachVatTu = await prisma.vatTu.findMany({
    where,
    orderBy: [{ dang_hoat_dong: "desc" }, { ten: "asc" }, { id: "asc" }],
    skip,
    take,
  });

  // Chỉ giữ lại bộ lọc khác mặc định khi chuyển trang
  const thamSo: Record<string, string> = {};
  if (q) thamSo.q = q;
  if (trangThai !== "tat_ca") thamSo.trang_thai = trangThai;
  if (tonKho !== "tat_ca") thamSo.ton_kho = tonKho;
  const dangLoc = Object.keys(thamSo).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vật tư</CardTitle>
        <Link
          href="/admin/vat-tu/moi"
          className={buttonVariants({ size: "sm" })}
        >
          + Thêm vật tư
        </Link>
      </CardHeader>

      <CardContent>
        <BoLocVatTu
          giaTriBanDau={{ q, trangThai, tonKho }}
          nguongSapHet={NGUONG_SAP_HET}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {danhSachVatTu.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-[var(--color-text-muted)]"
                >
                  {dangLoc
                    ? "Không có vật tư nào phù hợp bộ lọc."
                    : "Chưa có vật tư nào."}
                </TableCell>
              </TableRow>
            )}
            {danhSachVatTu.map((vt) => (
              <TableRow
                key={vt.id}
                className={
                  vt.dang_hoat_dong
                    ? undefined
                    : "text-[var(--color-text-muted)]"
                }
              >
                <TableCell className="font-medium">
                  {vt.ten}
                  {!vt.dang_hoat_dong && (
                    <Nhan kieu="off" className="ml-2">
                      Ngừng dùng
                    </Nhan>
                  )}
                </TableCell>
                <TableCell>{vt.don_vi}</TableCell>
                <TableCell
                  className={
                    vt.dang_hoat_dong && vt.so_luong_ton === 0
                      ? "font-medium text-[var(--color-danger)]"
                      : undefined
                  }
                >
                  {vt.so_luong_ton}
                </TableCell>
                <TableCell>
                  {Number(vt.gia).toLocaleString("vi-VN")} ₫
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/vat-tu/${vt.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Sửa
                    </Link>
                    <form
                      action={
                        vt.dang_hoat_dong
                          ? ngungDungVatTu.bind(null, vt.id)
                          : kichHoatLaiVatTu.bind(null, vt.id)
                      }
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className={
                          vt.dang_hoat_dong
                            ? "text-[var(--color-danger)]"
                            : undefined
                        }
                      >
                        {vt.dang_hoat_dong ? "Ngừng dùng" : "Kích hoạt lại"}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <PhanTrang
          duongDan="/admin/vat-tu"
          thamSo={thamSo}
          trang={trang}
          tongTrang={tongTrang}
          tong={tong}
        />
      </CardContent>
    </Card>
  );
}
