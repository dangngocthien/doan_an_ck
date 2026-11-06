import ExcelJS from "exceljs";
import type { BoLocBaoCao, layDuLieuBaoCao } from "@/lib/bao-cao";

// Bộ dựng file Excel báo cáo. KHÔNG import Prisma: nhận số liệu đã lấy sẵn
// từ layDuLieuBaoCao (cùng nguồn với trang Báo cáo) nên hai nơi luôn khớp nhau.

export type DuLieuBaoCao = Awaited<ReturnType<typeof layDuLieuBaoCao>>;

const TIEN = '#,##0" đ"';
const MAU_DAU_BANG = "FF0F4C81"; // --color-primary

type Gia = string | number;
type Cot = { tieuDe: string; khoa: string; rong: number; dinhDang?: string };

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

// Giờ VN (UTC+7), dạng "24/10/2026 20:30"
function ngayGioVN(d: Date) {
  const v = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(v.getUTCDate())}/${p(v.getUTCMonth() + 1)}/${v.getUTCFullYear()} ${p(v.getUTCHours())}:${p(v.getUTCMinutes())}`;
}

// Một sheet = một bảng: hàng 1 là tiêu đề (cố định khi cuộn), tùy chọn hàng tổng ở cuối.
function themBang(
  wb: ExcelJS.Workbook,
  tenSheet: string,
  cot: Cot[],
  dong: Record<string, Gia>[],
  dongTong?: Record<string, Gia>,
) {
  const ws = wb.addWorksheet(tenSheet);
  ws.columns = cot.map((c) => ({
    header: c.tieuDe,
    key: c.khoa,
    width: c.rong,
    style: c.dinhDang ? { numFmt: c.dinhDang } : {},
  }));
  ws.addRows(dong);
  if (dongTong) ws.addRow(dongTong).font = { bold: true };

  const dau = ws.getRow(1);
  dau.font = { bold: true, color: { argb: "FFFFFFFF" } };
  dau.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: MAU_DAU_BANG },
  };
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function taoExcelBaoCao(
  boLoc: BoLocBaoCao,
  du_lieu: DuLieuBaoCao,
  nguongSapHet: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Hệ thống quản lý sửa chữa điện nước";
  wb.created = new Date();

  // --- Sheet 1: Tổng quan ---
  const tq = wb.addWorksheet("Tổng quan");
  tq.columns = [{ width: 34 }, { width: 46 }];
  tq.addRow(["BÁO CÁO DỊCH VỤ SỬA CHỮA ĐIỆN NƯỚC"]).font = {
    bold: true,
    size: 14,
  };
  tq.addRow([]);
  tq.addRow(["Khoảng thời gian", moTaKhoang(boLoc.tu, boLoc.den)]);
  tq.addRow(["Thợ", du_lieu.tenThoDangLoc ?? "Tất cả thợ"]);
  tq.addRow(["Ngày xuất", ngayGioVN(new Date())]);
  tq.addRow([]);

  const them = (nhan: string, giaTri: Gia, laTien = false) => {
    const r = tq.addRow([nhan, giaTri]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { horizontal: "left" };
    if (laTien) r.getCell(2).numFmt = TIEN;
  };
  them("Số hóa đơn", du_lieu.soHoaDon);
  them("Tổng doanh thu", du_lieu.tongDaThu + du_lieu.tongConNo, true);
  them("Đã thu", du_lieu.tongDaThu, true);
  them("Còn nợ (trong khoảng lọc)", du_lieu.tongConNo, true);
  them("Tổng khách đang nợ (hiện tại)", du_lieu.tongNoHienTai, true);
  them("Tổng số phiếu việc", du_lieu.tongPhieu);

  tq.addRow([]);
  const ghiChu = [
    "Phạm vi: doanh thu theo ngày lập hóa đơn; số phiếu và vật tư dùng nhiều theo ngày tạo phiếu.",
    "Công nợ chỉ lọc theo thợ (không theo thời gian). Vật tư sắp hết không lọc.",
  ];
  for (const g of ghiChu) tq.addRow([g]).font = { italic: true };

  // --- Sheet 2: Doanh thu theo tháng ---
  themBang(
    wb,
    "Doanh thu theo tháng",
    [
      { tieuDe: "Tháng", khoa: "thang", rong: 14 },
      { tieuDe: "Đã thu", khoa: "da_thu", rong: 18, dinhDang: TIEN },
      { tieuDe: "Còn nợ", khoa: "con_no", rong: 18, dinhDang: TIEN },
      { tieuDe: "Tổng", khoa: "tong", rong: 18, dinhDang: TIEN },
    ],
    du_lieu.duLieuThang.map((t) => ({
      thang: t.thang,
      da_thu: t.da_thu,
      con_no: t.con_no,
      tong: t.da_thu + t.con_no,
    })),
    {
      thang: "Cộng",
      da_thu: du_lieu.tongDaThu,
      con_no: du_lieu.tongConNo,
      tong: du_lieu.tongDaThu + du_lieu.tongConNo,
    },
  );

  // --- Sheet 3: Công nợ ---
  themBang(
    wb,
    "Công nợ",
    [
      { tieuDe: "Khách hàng", khoa: "ten", rong: 28 },
      { tieuDe: "SĐT", khoa: "sdt", rong: 16 },
      { tieuDe: "Số hóa đơn", khoa: "so_hoa_don", rong: 14 },
      { tieuDe: "Tổng nợ", khoa: "tong_no", rong: 18, dinhDang: TIEN },
    ],
    du_lieu.danhSachNo.map((k) => ({
      ten: k.ten,
      sdt: k.sdt,
      so_hoa_don: k.soHoaDon,
      tong_no: k.tongNo,
    })),
    { ten: "Cộng", sdt: "", so_hoa_don: "", tong_no: du_lieu.tongNoHienTai },
  );

  // --- Sheet 4: Vật tư sắp hết ---
  themBang(
    wb,
    "Vật tư sắp hết",
    [
      { tieuDe: "Vật tư", khoa: "ten", rong: 30 },
      { tieuDe: "Đơn vị", khoa: "don_vi", rong: 12 },
      { tieuDe: "Tồn kho", khoa: "ton", rong: 12 },
      {
        tieuDe: `Tình trạng (tồn ≤ ${nguongSapHet})`,
        khoa: "tinh_trang",
        rong: 24,
      },
    ],
    du_lieu.vatTuSapHet.map((v) => ({
      ten: v.ten,
      don_vi: v.don_vi,
      ton: v.so_luong_ton,
      tinh_trang: v.so_luong_ton === 0 ? "Hết hàng" : "Sắp hết",
    })),
  );

  // --- Sheet 5: Vật tư dùng nhiều nhất ---
  themBang(
    wb,
    "Vật tư dùng nhiều nhất",
    [
      { tieuDe: "Vật tư", khoa: "ten", rong: 30 },
      { tieuDe: "Đơn vị", khoa: "don_vi", rong: 12 },
      { tieuDe: "Tổng đã dùng", khoa: "tong_dung", rong: 16 },
    ],
    du_lieu.vatTuDungNhieu.map((v) => ({
      ten: v.ten,
      don_vi: v.donVi,
      tong_dung: v.tongDung,
    })),
  );

  // --- Sheet 6: Phiếu theo trạng thái ---
  themBang(
    wb,
    "Phiếu theo trạng thái",
    [
      { tieuDe: "Trạng thái", khoa: "nhan", rong: 18 },
      { tieuDe: "Số phiếu", khoa: "so_phieu", rong: 12 },
    ],
    du_lieu.duLieuTrangThai.map((t) => ({
      nhan: t.nhan,
      so_phieu: t.gia_tri,
    })),
    { nhan: "Cộng", so_phieu: du_lieu.tongPhieu },
  );

  // --- Sheet 7: Phiếu theo thợ ---
  const dongTho: Record<string, Gia>[] = du_lieu.dongTho.map((t) => ({
    ten: t.ten,
    dang_xu_ly: t.dangXuLy,
    hoan_thanh: t.hoanThanh,
    da_huy: t.daHuy,
  }));
  if (du_lieu.phieuChuaGan) {
    dongTho.push({
      ten: "Chưa gán thợ",
      dang_xu_ly: du_lieu.phieuChuaGan.dangXuLy,
      hoan_thanh: du_lieu.phieuChuaGan.hoanThanh,
      da_huy: du_lieu.phieuChuaGan.daHuy,
    });
  }
  themBang(
    wb,
    "Phiếu theo thợ",
    [
      { tieuDe: "Thợ", khoa: "ten", rong: 30 },
      { tieuDe: "Đang xử lý", khoa: "dang_xu_ly", rong: 14 },
      { tieuDe: "Hoàn thành", khoa: "hoan_thanh", rong: 14 },
      { tieuDe: "Đã hủy", khoa: "da_huy", rong: 12 },
    ],
    dongTho,
  );

  // writeBuffer trả ArrayBuffer hoặc Buffer tùy phiên bản exceljs → chuẩn hóa về Buffer
  const kq = await wb.xlsx.writeBuffer();
  return Buffer.from(kq as unknown as ArrayBuffer);
}
