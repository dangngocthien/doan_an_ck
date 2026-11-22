import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ngungHoatDongTho } from "@/lib/actions/tho";
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
import BoLocTho from "./BoLocTho";
import { AvatarTen, Nhan } from "@/components/admin/NhanTrangThai";

// Giá trị hợp lệ của bộ lọc; giá trị lạ trên URL sẽ về mặc định
const LOC_HOAT_DONG = ["hoat_dong", "ngung", "tat_ca"] as const;
const LOC_BAN_RON = ["tat_ca", "ron", "ban"] as const;

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.nguoiDung.count>[0]>["where"]
>;
type GiaTri = string | string[] | undefined;

function mot(v: GiaTri): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function DanhSachThoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: GiaTri;
    trang_thai?: GiaTri;
    ban_ron?: GiaTri;
    trang?: GiaTri;
  }>;
}) {
  const sp = await searchParams;

  // Đọc và kiểm tra bộ lọc từ URL
  const q = mot(sp.q).slice(0, 100);
  const hoatDong =
    LOC_HOAT_DONG.find((x) => x === mot(sp.trang_thai)) ?? "hoat_dong";
  const banRon = LOC_BAN_RON.find((x) => x === mot(sp.ban_ron)) ?? "tat_ca";

  const where: DieuKien = { vai_tro: "THO" };
  if (hoatDong === "hoat_dong") where.dang_hoat_dong = true;
  if (hoatDong === "ngung") where.dang_hoat_dong = false;
  if (q) {
    where.OR = [
      { ten: { contains: q } },
      { sdt: { contains: q } },
      { email: { contains: q } },
    ];
  }
  // Bận = có ≥1 phiếu DANG_DI/DANG_LAM (9.12). Lọc ngay trong truy vấn
  // để `count` và phân trang đúng.
  if (banRon === "ban") {
    where.phieu_viec = {
      some: { trang_thai: { in: ["DANG_DI", "DANG_LAM"] } },
    };
  }
  if (banRon === "ron") {
    where.phieu_viec = {
      none: { trang_thai: { in: ["DANG_DI", "DANG_LAM"] } },
    };
  }

  const tong = await prisma.nguoiDung.count({ where });
  const { trang, tongTrang, skip, take } = tinhPhanTrang(docTrang(sp.trang), tong);

  const danhSachTho = await prisma.nguoiDung.findMany({
    where,
    // id làm khóa phụ để thứ tự giữa các trang ổn định
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    skip,
    take,
    include: {
      _count: {
        select: {
          phieu_viec: {
            where: { trang_thai: { in: ["DANG_DI", "DANG_LAM"] } },
          },
        },
      },
    },
  });

  // Chỉ giữ lại bộ lọc khác mặc định khi chuyển trang
  const thamSo: Record<string, string> = {};
  if (q) thamSo.q = q;
  if (hoatDong !== "hoat_dong") thamSo.trang_thai = hoatDong;
  if (banRon !== "tat_ca") thamSo.ban_ron = banRon;
  const dangLoc = Object.keys(thamSo).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thợ</CardTitle>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- dùng <a>, không dùng <Link>: popup (.)tho/[id] bắt "moi" làm id rồi báo 404 */}
        <a href="/admin/tho/moi" className={buttonVariants({ size: "sm" })}>
          + Thêm thợ
        </a>
      </CardHeader>

      <CardContent>
        <BoLocTho giaTriBanDau={{ q, trangThai: hoatDong, banRon }} />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {danhSachTho.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-[var(--color-text-muted)]">
                  {dangLoc ? "Không có thợ nào phù hợp bộ lọc." : "Chưa có thợ nào."}
                </TableCell>
              </TableRow>
            )}
            {danhSachTho.map((tho) => {
              const dangBan = tho._count.phieu_viec > 0;
              return (
                <TableRow key={tho.id}>
                  <TableCell className="font-medium">
                    <AvatarTen ten={tho.ten} />
                  </TableCell>
                  <TableCell>{tho.sdt}</TableCell>
                  <TableCell>{tho.email}</TableCell>
                  <TableCell>
                    {tho.dang_hoat_dong ? (
                      <Nhan kieu={dangBan ? "warn" : "ok"}>
                        {dangBan ? "Đang bận" : "Rảnh"}
                      </Nhan>
                    ) : (
                      <Nhan kieu="off">Đã ngừng</Nhan>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tho/${tho.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Sửa
                      </Link>
                      {tho.dang_hoat_dong && (
                        <form action={ngungHoatDongTho.bind(null, tho.id)}>
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
          duongDan="/admin/tho"
          thamSo={thamSo}
          trang={trang}
          tongTrang={tongTrang}
          tong={tong}
        />
      </CardContent>
    </Card>
  );
}
