import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
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
import PhanTrang from "@/components/admin/PhanTrang";
import { docTrang, tinhPhanTrang } from "@/lib/phan-trang";
import NhanThanhToan from "./NhanThanhToan";
import BoLocHoaDon from "./BoLocHoaDon";

type DieuKien = NonNullable<
  NonNullable<Parameters<typeof prisma.hoaDon.count>[0]>["where"]
>;
type GiaTri = string | string[] | undefined;

function mot(v: GiaTri): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

const MS_MOT_NGAY = 24 * 60 * 60 * 1000;
const LECH_VN = 7 * 60 * 60 * 1000; // múi giờ Việt Nam (UTC+7)

// "YYYY-MM-DD" → 00:00 ngày đó theo giờ Việt Nam. Ngày không hợp lệ (vd 2026-02-31) → null.
function dauNgayVN(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  if (
    utc.getUTCFullYear() !== y ||
    utc.getUTCMonth() !== mo - 1 ||
    utc.getUTCDate() !== d
  ) {
    return null;
  }
  return new Date(utc.getTime() - LECH_VN);
}

// Chỉ nhận số nguyên dương tối đa 10 chữ số (cột tong_tien là DECIMAL(12,2))
function docTien(v: string): string {
  return /^\d{1,10}$/.test(v) ? v : "";
}

export default async function TrangDanhSachHoaDon({
  searchParams,
}: {
  searchParams: Promise<{
    q?: GiaTri;
    trang_thai?: GiaTri;
    tu_ngay?: GiaTri;
    den_ngay?: GiaTri;
    tien_tu?: GiaTri;
    tien_den?: GiaTri;
    trang?: GiaTri;
  }>;
}) {
  const sp = await searchParams;

  // Đọc và kiểm tra bộ lọc từ URL
  const q = mot(sp.q).slice(0, 100);
  const trangThaiTho = mot(sp.trang_thai);
  const loc: "DA_THU" | "CON_NO" | undefined =
    trangThaiTho === "DA_THU" || trangThaiTho === "CON_NO"
      ? trangThaiTho
      : undefined;
  const tuDate = dauNgayVN(mot(sp.tu_ngay));
  const denDate = dauNgayVN(mot(sp.den_ngay));
  const tuNgay = tuDate ? mot(sp.tu_ngay) : "";
  const denNgay = denDate ? mot(sp.den_ngay) : "";
  const tienTu = docTien(mot(sp.tien_tu));
  const tienDen = docTien(mot(sp.tien_den));

  const where: DieuKien = {};
  if (loc) where.trang_thai_thanh_toan = loc;
  if (q) {
    where.phieu_viec = {
      khach_hang: { OR: [{ ten: { contains: q } }, { sdt: { contains: q } }] },
    };
  }
  // Khoảng ngày lập tính theo giờ Việt Nam, gồm cả ngày đầu và ngày cuối
  if (tuDate || denDate) {
    where.ngay_lap = {};
    if (tuDate) where.ngay_lap.gte = tuDate;
    if (denDate) where.ngay_lap.lt = new Date(denDate.getTime() + MS_MOT_NGAY);
  }
  if (tienTu || tienDen) {
    where.tong_tien = {};
    if (tienTu) where.tong_tien.gte = Number(tienTu);
    if (tienDen) where.tong_tien.lte = Number(tienDen);
  }

  // Phân trang: đếm trước, kẹp số trang, rồi mới lấy dữ liệu.
  // Danh sách "phiếu chưa lập hóa đơn" là việc cần làm nên không phân trang.
  const [tong, phieuChuaLap] = await Promise.all([
    prisma.hoaDon.count({ where }),
    prisma.phieuViec.findMany({
      where: { trang_thai: "HOAN_THANH", hoa_don: null },
      orderBy: { ngay_hoan_thanh: "desc" },
      include: { khach_hang: true },
    }),
  ]);
  const { trang, tongTrang, skip, take } = tinhPhanTrang(
    docTrang(sp.trang),
    tong,
  );
  const danhSachHoaDon = await prisma.hoaDon.findMany({
    where,
    // id làm khóa phụ để thứ tự giữa các trang ổn định
    orderBy: [{ ngay_lap: "desc" }, { id: "desc" }],
    skip,
    take,
    include: { phieu_viec: { include: { khach_hang: true } } },
  });

  // Chỉ giữ lại bộ lọc khác mặc định khi chuyển trang
  const thamSo: Record<string, string> = {};
  if (q) thamSo.q = q;
  if (loc) thamSo.trang_thai = loc;
  if (tuNgay) thamSo.tu_ngay = tuNgay;
  if (denNgay) thamSo.den_ngay = denNgay;
  if (tienTu) thamSo.tien_tu = tienTu;
  if (tienDen) thamSo.tien_den = tienDen;
  const dangLoc = Object.keys(thamSo).length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
        Hóa đơn
      </h1>

      {/* Phiếu đã hoàn thành nhưng chưa lập hóa đơn */}
      <Card>
        <CardHeader>
          <CardTitle>
            Phiếu hoàn thành chưa lập hóa đơn ({phieuChuaLap.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phieuChuaLap.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Không có phiếu nào cần lập hóa đơn.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Phiếu</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sự cố</TableHead>
                  <TableHead>Hoàn thành</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {phieuChuaLap.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>#{p.id}</TableCell>
                    <TableCell>{p.khach_hang.ten}</TableCell>
                    <TableCell>{p.loai_su_co}</TableCell>
                    <TableCell>
                      {p.ngay_hoan_thanh
                        ? p.ngay_hoan_thanh.toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/hoa-don/lap/${p.id}`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        Lập hóa đơn
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Danh sách hóa đơn */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách hóa đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BoLocHoaDon
            giaTriBanDau={{
              q,
              trangThai: loc ?? "tat_ca",
              tuNgay,
              denNgay,
              tienTu,
              tienDen,
            }}
          />

          {danhSachHoaDon.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {dangLoc
                ? "Không có hóa đơn nào phù hợp bộ lọc."
                : "Chưa có hóa đơn nào."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày lập</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachHoaDon.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>#{h.id}</TableCell>
                    <TableCell>{h.phieu_viec.khach_hang.ten}</TableCell>
                    <TableCell>
                      {h.ngay_lap.toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {dinhDangTien(Number(h.tong_tien))}
                    </TableCell>
                    <TableCell>
                      <NhanThanhToan trangThai={h.trang_thai_thanh_toan} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/hoa-don/${h.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Xem
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <PhanTrang
            duongDan="/admin/hoa-don"
            thamSo={thamSo}
            trang={trang}
            tongTrang={tongTrang}
            tong={tong}
          />
        </CardContent>
      </Card>
    </div>
  );
}
