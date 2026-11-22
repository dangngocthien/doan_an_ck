import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ngungHoatDongKhachHang } from "@/lib/actions/khach-hang";
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
import BoLocKhachHang from "./BoLocKhachHang";
import { Nhan } from "@/components/admin/NhanTrangThai";

// Giá trị hợp lệ của bộ lọc; giá trị lạ trên URL sẽ về mặc định
const LOC_HOAT_DONG = ["hoat_dong", "ngung", "tat_ca"] as const;
const LOC_NO = ["tat_ca", "co_no", "khong_no"] as const;
const LOC_SAP_XEP = ["moi", "ten_tang", "ten_giam"] as const;

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.khachHang.count>[0]>["where"]
>;
type GiaTri = string | string[] | undefined;

function mot(v: GiaTri): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function DanhSachKhachHangPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: GiaTri;
    trang_thai?: GiaTri;
    no?: GiaTri;
    sap_xep?: GiaTri;
    trang?: GiaTri;
  }>;
}) {
  const sp = await searchParams;

  // Đọc và kiểm tra bộ lọc từ URL
  const q = mot(sp.q).slice(0, 100);
  const hoatDong =
    LOC_HOAT_DONG.find((x) => x === mot(sp.trang_thai)) ?? "hoat_dong";
  const no = LOC_NO.find((x) => x === mot(sp.no)) ?? "tat_ca";
  const sapXep = LOC_SAP_XEP.find((x) => x === mot(sp.sap_xep)) ?? "moi";

  const where: DieuKien = {};
  if (hoatDong === "hoat_dong") where.dang_hoat_dong = true;
  if (hoatDong === "ngung") where.dang_hoat_dong = false;
  if (q) {
    where.OR = [{ ten: { contains: q } }, { sdt: { contains: q } }];
  }
  // Còn nợ = có ≥1 phiếu mà hóa đơn ở trạng thái CON_NO.
  // Lọc ngay trong truy vấn để `count` và phân trang đúng.
  if (no === "co_no") {
    where.phieu_viec = {
      some: { hoa_don: { is: { trang_thai_thanh_toan: "CON_NO" } } },
    };
  }
  if (no === "khong_no") {
    where.phieu_viec = {
      none: { hoa_don: { is: { trang_thai_thanh_toan: "CON_NO" } } },
    };
  }

  // id làm khóa phụ để thứ tự giữa các trang ổn định
  const orderBy =
    sapXep === "ten_tang"
      ? [{ ten: "asc" as const }, { id: "desc" as const }]
      : sapXep === "ten_giam"
        ? [{ ten: "desc" as const }, { id: "desc" as const }]
        : [{ created_at: "desc" as const }, { id: "desc" as const }];

  // Phân trang: đếm trước, kẹp số trang, rồi mới lấy dữ liệu.
  // Kẹp trang còn giúp trường hợp "Ngừng hoạt động" khách cuối của trang cuối:
  // trang đó hết dòng thì tự lùi về trang trước, không bị trang trống.
  const tong = await prisma.khachHang.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(
    docTrang(sp.trang),
    tong,
  );
  const danhSachKhachHang = await prisma.khachHang.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      _count: {
        select: {
          phieu_viec: {
            where: { hoa_don: { is: { trang_thai_thanh_toan: "CON_NO" } } },
          },
        },
      },
    },
  });

  // Chỉ giữ lại bộ lọc khác mặc định khi chuyển trang
  const thamSo: Record<string, string> = {};
  if (q) thamSo.q = q;
  if (hoatDong !== "hoat_dong") thamSo.trang_thai = hoatDong;
  if (no !== "tat_ca") thamSo.no = no;
  if (sapXep !== "moi") thamSo.sap_xep = sapXep;
  const dangLoc = Boolean(q) || hoatDong !== "hoat_dong" || no !== "tat_ca";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Khách hàng</CardTitle>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- dùng <a>, không dùng <Link>: popup (.)khach-hang/[id] bắt "moi" làm id rồi báo 404 */}
        <a href="/admin/khach-hang/moi" className={buttonVariants({ size: "sm" })}>
          + Thêm khách hàng
        </a>
      </CardHeader>

      <CardContent>
        <BoLocKhachHang
          giaTriBanDau={{ q, hoatDong, no, sapXep }}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Công nợ</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {danhSachKhachHang.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-[var(--color-text-muted)]">
                  {dangLoc
                    ? "Không có khách hàng nào phù hợp bộ lọc."
                    : "Chưa có khách hàng nào."}
                </TableCell>
              </TableRow>
            )}
            {danhSachKhachHang.map((kh) => {
              const soHoaDonNo = kh._count.phieu_viec;
              return (
                <TableRow key={kh.id}>
                  <TableCell className="font-medium">
                    {kh.ten}
                    {!kh.dang_hoat_dong && (
                      <Nhan kieu="off" className="ml-2">
                        Đã ngừng
                      </Nhan>
                    )}
                  </TableCell>
                  <TableCell>{kh.sdt}</TableCell>
                  <TableCell>{kh.dia_chi}</TableCell>
                  <TableCell>
                    {soHoaDonNo > 0 ? (
                      <Nhan kieu="danger">
                        Còn nợ ({soHoaDonNo} hóa đơn)
                      </Nhan>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/khach-hang/${kh.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Sửa
                      </Link>
                      {kh.dang_hoat_dong && (
                        <form action={ngungHoatDongKhachHang.bind(null, kh.id)}>
                          <Button type="submit" variant="danger" size="sm">
                            Ngừng hoạt động
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <PhanTrang
          duongDan="/admin/khach-hang"
          thamSo={thamSo}
          trang={trang}
          tongTrang={tongTrang}
          tong={tong}
        />
      </CardContent>
    </Card>
  );
}
