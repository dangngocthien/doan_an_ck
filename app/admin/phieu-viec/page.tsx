import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import PhanTrang from "@/components/admin/PhanTrang";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import BoLocPhieuViec from "./BoLocPhieuViec";
import HuyPhieuViecButton from "./HuyPhieuViecButton";
import {
  AvatarTen,
  ChamUuTien,
  Nhan,
  NhanTrangThai,
} from "@/components/admin/NhanTrangThai";

// Danh sách giá trị hợp lệ để kiểm tra tham số trên URL
const DANH_SACH_TRANG_THAI = [
  "MOI",
  "DANG_DI",
  "DANG_LAM",
  "HOAN_THANH",
  "DA_HUY",
] as const;
const DANH_SACH_UU_TIEN = ["THAP", "TRUNG_BINH", "CAO"] as const;

type ThamSoUrl = Record<string, string | string[] | undefined>;

function layChuoi(giaTri: string | string[] | undefined): string {
  const v = Array.isArray(giaTri) ? giaTri[0] : giaTri;
  return (v ?? "").trim();
}

// "2026-10-02" -> đầu/cuối ngày theo GIỜ VIỆT NAM (UTC+7)
function docNgayVN(chuoi: string, cuoiNgay: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(chuoi)) return null;
  const gio = cuoiNgay ? "23:59:59.999" : "00:00:00.000";
  const ngay = new Date(`${chuoi}T${gio}+07:00`);
  return Number.isNaN(ngay.getTime()) ? null : ngay;
}

const dinhDangNgayVN = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function hienNgay(ngay: Date | null): string {
  return ngay ? dinhDangNgayVN.format(ngay) : "—";
}

export default async function DanhSachPhieuViecPage({
  searchParams,
}: {
  searchParams: Promise<ThamSoUrl>;
}) {
  const sp = await searchParams;

  // --- Đọc & kiểm tra tham số lọc ---
  const q = layChuoi(sp.q);
  const trangThaiTho = layChuoi(sp.trang_thai);
  const trangThai =
    DANH_SACH_TRANG_THAI.find((t) => t === trangThaiTho) ?? null;
  const uuTienTho = layChuoi(sp.uu_tien);
  const uuTien = DANH_SACH_UU_TIEN.find((u) => u === uuTienTho) ?? null;

  const thoTho = layChuoi(sp.tho);
  const thoLoc: "chua_gan" | number | null =
    thoTho === "chua_gan"
      ? "chua_gan"
      : /^\d+$/.test(thoTho)
        ? Number(thoTho)
        : null;

  const loaiNgay =
    layChuoi(sp.loai_ngay) === "hoan_thanh" ? "hoan_thanh" : "tao";
  const tuChuoi = layChuoi(sp.tu);
  const denChuoi = layChuoi(sp.den);
  const tuNgay = docNgayVN(tuChuoi, false);
  const denNgay = docNgayVN(denChuoi, true);

  const khoangNgay = {
    ...(tuNgay ? { gte: tuNgay } : {}),
    ...(denNgay ? { lte: denNgay } : {}),
  };
  const coKhoangNgay = tuNgay !== null || denNgay !== null;

  // `where` dùng chung cho cả đếm tổng lẫn lấy dữ liệu
  const where = {
    ...(trangThai ? { trang_thai: trangThai } : {}),
    ...(uuTien ? { muc_do_uu_tien: uuTien } : {}),
    ...(thoLoc === "chua_gan"
      ? { tho_id: null }
      : thoLoc !== null
        ? { tho_id: thoLoc }
        : {}),
    ...(coKhoangNgay
      ? loaiNgay === "hoan_thanh"
        ? { ngay_hoan_thanh: khoangNgay }
        : { ngay_tao: khoangNgay }
      : {}),
    ...(q
      ? {
          OR: [
            { loai_su_co: { contains: q } },
            { khach_hang: { ten: { contains: q } } },
            { khach_hang: { sdt: { contains: q } } },
          ],
        }
      : {}),
  };

  // --- Phân trang: đếm trước, kẹp số trang, rồi mới lấy dữ liệu ---
  const [tong, thoDanhSach] = await Promise.all([
    prisma.phieuViec.count({ where }),
    prisma.nguoiDung.findMany({
      where: { vai_tro: "THO" },
      select: { id: true, ten: true, dang_hoat_dong: true },
      orderBy: { ten: "asc" },
    }),
  ]);
  const { trang, tongTrang, skip, take } = tinhPhanTrang(
    docTrang(sp.trang),
    tong,
  );
  const danhSach = await prisma.phieuViec.findMany({
    where,
    // id làm khóa phụ: nhiều phiếu cùng giờ tạo thì thứ tự giữa các trang vẫn ổn định
    orderBy: [{ ngay_tao: "desc" }, { id: "desc" }],
    skip,
    take,
    include: { khach_hang: true, tho: { select: { id: true, ten: true } } },
  });

  const dangLoc = Boolean(
    q || trangThai || uuTien || thoLoc !== null || coKhoangNgay,
  );

  // Bộ lọc đã kiểm tra → giữ lại trong link chuyển trang
  const thamSoLoc: Record<string, string> = {};
  if (q) thamSoLoc.q = q;
  if (trangThai) thamSoLoc.trang_thai = trangThai;
  if (thoLoc !== null) thamSoLoc.tho = String(thoLoc);
  if (uuTien) thamSoLoc.uu_tien = uuTien;
  if (loaiNgay === "hoan_thanh") thamSoLoc.loai_ngay = loaiNgay;
  if (tuNgay) thamSoLoc.tu = tuChuoi;
  if (denNgay) thamSoLoc.den = denChuoi;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phiếu việc</CardTitle>
        <Link
          href="/admin/phieu-viec/moi"
          className={buttonVariants({ size: "sm" })}
        >
          + Tạo phiếu việc
        </Link>
      </CardHeader>

      <CardContent>
        <BoLocPhieuViec
          giaTriBanDau={{
            q,
            trang_thai: trangThai ?? "",
            tho: thoLoc === null ? "" : String(thoLoc),
            uu_tien: uuTien ?? "",
            loai_ngay: loaiNgay,
            tu: tuNgay ? tuChuoi : "",
            den: denNgay ? denChuoi : "",
          }}
          thoDanhSach={thoDanhSach}
        />

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Loại sự cố</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Thợ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày hoàn thành</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-6 text-[var(--color-text-muted)]"
                    >
                      {dangLoc
                        ? "Không có phiếu việc nào khớp bộ lọc."
                        : "Chưa có phiếu việc nào."}
                    </TableCell>
                  </TableRow>
                )}
                {danhSach.map((pv) => (
                  <TableRow key={pv.id}>
                    <TableCell className="font-medium">
                      {pv.khach_hang.ten}
                      <div className="text-xs font-normal text-[var(--color-text-muted)]">
                        {pv.khach_hang.sdt}
                      </div>
                    </TableCell>
                    <TableCell>{pv.loai_su_co}</TableCell>
                    <TableCell>
                      <ChamUuTien mucDo={pv.muc_do_uu_tien} />
                    </TableCell>
                    <TableCell>
                      {pv.tho ? (
                        <AvatarTen ten={pv.tho.ten} />
                      ) : (
                        <Nhan kieu="off">Chưa gán</Nhan>
                      )}
                    </TableCell>
                    <TableCell>
                      <NhanTrangThai trangThai={pv.trang_thai} />
                    </TableCell>
                    <TableCell>{hienNgay(pv.ngay_tao)}</TableCell>
                    <TableCell>{hienNgay(pv.ngay_hoan_thanh)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/phieu-viec/${pv.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Xem / Sửa
                        </Link>
                        <HuyPhieuViecButton
                          id={pv.id}
                          trangThai={pv.trang_thai}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <PhanTrang
          duongDan="/admin/phieu-viec"
          thamSo={thamSoLoc}
          trang={trang}
          tongTrang={tongTrang}
          tong={tong}
        />
      </CardContent>
    </Card>
  );
}
