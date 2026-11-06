import Link from "next/link";
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
import { docBoLoc, layDuLieuBaoCao, NGUONG_SAP_HET } from "@/lib/bao-cao";
import { Nhan } from "@/components/admin/NhanTrangThai";
import BieuDoDoanhThu from "./BieuDoDoanhThu";
import BieuDoThanhNgang from "./BieuDoThanhNgang";
import BoLocBaoCao from "./BoLocBaoCao";

// "2026-01-31" → "31/01/2026"
function dinhDangNgay(s: string) {
  const [n, t, d] = s.split("-");
  return `${d}/${t}/${n}`;
}

function moTaKhoang(tu: string | null, den: string | null) {
  if (tu && den) return `Từ ${dinhDangNgay(tu)} đến ${dinhDangNgay(den)}`;
  if (tu) return `Từ ${dinhDangNgay(tu)} trở đi`;
  if (den) return `Đến hết ${dinhDangNgay(den)}`;
  return "Toàn bộ thời gian";
}

export default async function TrangBaoCao({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { boLoc, macDinhTu, macDinhDen, mucNhanh, dangLoc } = docBoLoc(
    await searchParams,
  );
  const {
    thoId,
    tenThoDangLoc,
    danhSachTho,
    soHoaDon,
    duLieuThang,
    tongDaThu,
    tongConNo,
    danhSachNo,
    tongNoHienTai,
    vatTuSapHet,
    vatTuDungNhieu,
    duLieuTrangThai,
    tongPhieu,
    dongTho,
    phieuChuaGan,
  } = await layDuLieuBaoCao(boLoc);

  const moTaLoc = `${moTaKhoang(boLoc.tu, boLoc.den)}${
    tenThoDangLoc ? `, thợ ${tenThoDangLoc}` : ""
  }.`;

  // Luôn gửi tu/den tường minh (rỗng = không giới hạn) để file xuất khớp 100% màn hình đang xem
  const thamSoXuat = new URLSearchParams({
    tu: boLoc.tu ?? "",
    den: boLoc.den ?? "",
  });
  if (thoId !== null) thamSoXuat.set("tho", String(thoId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          Báo cáo
        </h1>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/v1/bao-cao/xuat-excel?${thamSoXuat.toString()}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Xuất Excel
          </a>
          <a
            href={`/api/v1/bao-cao/xuat-pdf?${thamSoXuat.toString()}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Xuất PDF
          </a>
        </div>
      </div>

      <BoLocBaoCao
        tu={boLoc.tu}
        den={boLoc.den}
        thoId={thoId}
        macDinhTu={macDinhTu}
        macDinhDen={macDinhDen}
        danhSachTho={danhSachTho}
        mucNhanh={mucNhanh}
        dangLoc={dangLoc}
      />

      <Card>
        <CardHeader className="flex-wrap gap-2">
          <CardTitle>Doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-[var(--color-text-muted)]">{moTaLoc}</p>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[linear-gradient(135deg,#145f9c,#0b3b65)] p-4 text-white shadow-[0_18px_36px_-14px_rgba(15,76,129,0.65)]">
              <dt className="text-sm text-white/75">Tổng doanh thu</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight">
                {dinhDangTien(tongDaThu + tongConNo)}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <dt className="text-sm text-[var(--color-text-muted)]">Đã thu</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-ok)]">
                {dinhDangTien(tongDaThu)}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <dt className="text-sm text-[var(--color-text-muted)]">Còn nợ</dt>
              <dd
                className={`mt-1 text-2xl font-bold tracking-tight ${tongConNo > 0 ? "text-[var(--color-danger)]" : ""}`}
              >
                {dinhDangTien(tongConNo)}
              </dd>
            </div>
          </dl>

          {soHoaDon === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Không có hóa đơn nào phù hợp bộ lọc.
            </p>
          ) : (
            <BieuDoDoanhThu duLieu={duLieuThang} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap gap-2">
          <CardTitle>Công nợ hiện tại</CardTitle>
          <Link
            href="/admin/hoa-don?trang_thai=CON_NO"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Xem hóa đơn còn nợ
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Tổng khách đang nợ
              {tenThoDangLoc ? ` (phiếu của ${tenThoDangLoc})` : ""}
            </p>
            <p className="text-lg font-semibold">
              {dinhDangTien(tongNoHienTai)}
            </p>
          </div>

          {danhSachNo.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Không có khách hàng nào đang nợ.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Số hóa đơn</TableHead>
                  <TableHead>Tổng nợ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachNo.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>{k.ten}</TableCell>
                    <TableCell>{k.sdt}</TableCell>
                    <TableCell>{k.soHoaDon}</TableCell>
                    <TableCell className="font-semibold">
                      {dinhDangTien(k.tongNo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap gap-2">
          <CardTitle>Vật tư</CardTitle>
          <Link
            href="/admin/vat-tu"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Xem toàn bộ tồn kho
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Sắp hết (tồn từ {NGUONG_SAP_HET} trở xuống)
            </h3>
            {vatTuSapHet.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Không có vật tư nào sắp hết.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vật tư</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Tình trạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vatTuSapHet.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.ten}</TableCell>
                      <TableCell>
                        {v.so_luong_ton} {v.don_vi}
                      </TableCell>
                      <TableCell>
                        <Nhan kieu={v.so_luong_ton === 0 ? "danger" : "warn"}>
                          {v.so_luong_ton === 0 ? "Hết hàng" : "Sắp hết"}
                        </Nhan>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Dùng nhiều nhất (top 5)
            </h3>
            {vatTuDungNhieu.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Không có vật tư nào được ghi vào phiếu việc phù hợp bộ lọc.
              </p>
            ) : (
              <BieuDoThanhNgang
                duLieu={vatTuDungNhieu.map((v) => ({
                  nhan: v.ten,
                  gia_tri: v.tongDung,
                  don_vi: v.donVi,
                }))}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Số phiếu việc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Theo trạng thái (tổng {tongPhieu} phiếu)
            </h3>
            {tongPhieu === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Không có phiếu việc nào phù hợp bộ lọc.
              </p>
            ) : (
              <BieuDoThanhNgang duLieu={duLieuTrangThai} />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Theo thợ
            </h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Thợ</TableHead>
                  <TableHead>Đang xử lý</TableHead>
                  <TableHead>Hoàn thành</TableHead>
                  <TableHead>Đã hủy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dongTho.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.ten}</TableCell>
                    <TableCell>{t.dangXuLy}</TableCell>
                    <TableCell>{t.hoanThanh}</TableCell>
                    <TableCell>{t.daHuy}</TableCell>
                  </TableRow>
                ))}
                {phieuChuaGan && (
                  <TableRow>
                    <TableCell>Chưa gán thợ</TableCell>
                    <TableCell>{phieuChuaGan.dangXuLy}</TableCell>
                    <TableCell>{phieuChuaGan.hoanThanh}</TableCell>
                    <TableCell>{phieuChuaGan.daHuy}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="text-xs text-[var(--color-text-muted)]">
              Đang xử lý gồm các phiếu Mới, Đang đi và Đang làm.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
