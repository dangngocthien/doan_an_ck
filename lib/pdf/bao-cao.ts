import path from "node:path";
import PDFDocument from "pdfkit";
import type { BoLocBaoCao, layDuLieuBaoCao } from "@/lib/bao-cao";

// Bộ vẽ báo cáo PDF. KHÔNG import Prisma: nhận số liệu đã lấy sẵn từ layDuLieuBaoCao
// (cùng nguồn với trang Báo cáo và file Excel) nên ba nơi luôn khớp nhau.
// Dùng lại font/lề/màu/cách ngắt trang giống lib/pdf/hoa-don.ts.

type DuLieuBaoCao = Awaited<ReturnType<typeof layDuLieuBaoCao>>;

const FONT_THUONG = path.join(
  process.cwd(),
  "assets",
  "fonts",
  "BeVietnamPro-Regular.ttf",
);
const FONT_DAM = path.join(
  process.cwd(),
  "assets",
  "fonts",
  "BeVietnamPro-Bold.ttf",
);

const MEP = 48;
const RONG = 595.28 - MEP * 2; // A4 trừ lề hai bên

const MAU_CHINH = "#0f4c81";
const MAU_CHU = "#131f2b";
const MAU_MO = "#6b7785";
const MAU_VIEN = "#e7eaee";
const MAU_NEN_BANG = "#f2f4f8";
const MAU_OK = "#15803d";
const MAU_NO = "#b3261e";

type Doc = PDFKit.PDFDocument;
type Cot = { tieuDe: string; ti_le: number; canh?: "left" | "right" };

// Tự ghép dấu chấm hàng nghìn, tránh phụ thuộc ICU và ký hiệu ₫ (có thể thiếu glyph)
function tien(so: number) {
  return `${String(Math.round(so)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
}

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

function duongKe(doc: Doc, y: number) {
  doc
    .moveTo(MEP, y)
    .lineTo(MEP + RONG, y)
    .lineWidth(1)
    .strokeColor(MAU_VIEN)
    .stroke();
}

// Sang trang mới nếu không đủ chỗ cho khối cao `can` điểm
function canCho(doc: Doc, can: number) {
  if (doc.y + can > doc.page.height - MEP) {
    doc.addPage();
    doc.y = MEP;
  }
}

function tieuMuc(doc: Doc, chu: string) {
  canCho(doc, 70);
  doc.y += 12;
  doc.font("dam").fontSize(13).fillColor(MAU_CHINH).text(chu, MEP, doc.y);
  doc.y += 6;
}

function tieuPhu(doc: Doc, chu: string) {
  canCho(doc, 60);
  doc.y += 4;
  doc.font("dam").fontSize(10).fillColor(MAU_CHU).text(chu, MEP, doc.y);
  doc.y += 6;
}

function ghiChu(doc: Doc, chu: string) {
  doc.font("thuong").fontSize(9).fillColor(MAU_MO).text(chu, MEP, doc.y, {
    width: RONG,
  });
  doc.y += 4;
}

// Bảng: ti_le là tỉ lệ độ rộng cột (tự co về vừa RONG). Qua trang thì vẽ lại hàng tiêu đề.
function bang(doc: Doc, cot: Cot[], dong: string[][], dongTong?: string[]) {
  const tongTiLe = cot.reduce((s, c) => s + c.ti_le, 0);
  const rong = cot.map((c) => (c.ti_le / tongTiLe) * RONG);
  const x = rong.map((_, i) => MEP + rong.slice(0, i).reduce((s, r) => s + r, 0));

  const veTieuDe = () => {
    const y = doc.y;
    doc.rect(MEP, y, RONG, 24).fill(MAU_NEN_BANG);
    doc.font("dam").fontSize(10).fillColor(MAU_CHU);
    cot.forEach((c, i) =>
      doc.text(c.tieuDe, x[i] + 8, y + 7, {
        width: rong[i] - 16,
        align: c.canh ?? "left",
      }),
    );
    doc.y = y + 24;
  };

  const veDong = (o: string[], dam: boolean) => {
    doc.font(dam ? "dam" : "thuong").fontSize(10);
    const cao = Math.max(
      ...o.map((t, i) => doc.heightOfString(t, { width: rong[i] - 16 })),
    );
    if (doc.y + cao + 14 > doc.page.height - MEP) {
      doc.addPage();
      doc.y = MEP;
      veTieuDe();
    }
    const y = doc.y;
    doc.font(dam ? "dam" : "thuong").fontSize(10).fillColor(MAU_CHU);
    o.forEach((t, i) =>
      doc.text(t, x[i] + 8, y + 7, {
        width: rong[i] - 16,
        align: cot[i].canh ?? "left",
      }),
    );
    const yCuoi = y + cao + 14;
    duongKe(doc, yCuoi);
    doc.y = yCuoi;
  };

  canCho(doc, 24 + 36);
  veTieuDe();
  if (dong.length === 0) {
    canCho(doc, 30);
    doc.font("thuong").fontSize(10).fillColor(MAU_MO);
    doc.text("Không có dữ liệu.", MEP + 8, doc.y + 8);
    doc.y += 30;
  } else {
    for (const o of dong) veDong(o, false);
  }
  if (dongTong) veDong(dongTong, true);
  doc.y += 10;
}

function theTong(
  doc: Doc,
  muc: { nhan: string; giaTri: string; mau: string }[],
) {
  canCho(doc, 60);
  const khoang = 10;
  const w = (RONG - khoang * (muc.length - 1)) / muc.length;
  const y = doc.y;
  muc.forEach((m, i) => {
    const x = MEP + i * (w + khoang);
    doc.roundedRect(x, y, w, 52, 6).lineWidth(1).strokeColor(MAU_VIEN).stroke();
    doc.font("thuong").fontSize(9).fillColor(MAU_MO);
    doc.text(m.nhan, x + 10, y + 9, { width: w - 20 });
    doc.font("dam").fontSize(13).fillColor(m.mau);
    doc.text(m.giaTri, x + 10, y + 26, { width: w - 20 });
  });
  doc.y = y + 52 + 6;
}

function ve(
  doc: Doc,
  boLoc: BoLocBaoCao,
  d: DuLieuBaoCao,
  nguongSapHet: number,
) {
  doc.registerFont("thuong", FONT_THUONG);
  doc.registerFont("dam", FONT_DAM);

  // Tiêu đề + ngày xuất
  doc.font("dam").fontSize(22).fillColor(MAU_CHINH).text("BÁO CÁO", MEP, MEP);
  doc
    .font("thuong")
    .fontSize(10)
    .fillColor(MAU_MO)
    .text(`Ngày xuất: ${ngayGioVN(new Date())}`, MEP, MEP + 8, {
      width: RONG,
      align: "right",
    });
  doc.y = MEP + 36;
  duongKe(doc, doc.y);
  doc.y += 12;

  const dongTT = (nhan: string, giaTri: string) => {
    const y = doc.y;
    doc.font("thuong").fontSize(10).fillColor(MAU_MO).text(nhan, MEP, y, {
      width: 100,
    });
    doc.fillColor(MAU_CHU).text(giaTri, MEP + 100, y, { width: RONG - 100 });
    doc.y = y + 17;
  };
  dongTT("Khoảng thời gian", moTaKhoang(boLoc.tu, boLoc.den));
  dongTT("Thợ", d.tenThoDangLoc ?? "Tất cả thợ");

  // 1. Doanh thu
  tieuMuc(doc, "1. Doanh thu");
  theTong(doc, [
    { nhan: "Tổng doanh thu", giaTri: tien(d.tongDaThu + d.tongConNo), mau: MAU_CHINH },
    { nhan: "Đã thu", giaTri: tien(d.tongDaThu), mau: MAU_OK },
    { nhan: "Còn nợ", giaTri: tien(d.tongConNo), mau: d.tongConNo > 0 ? MAU_NO : MAU_CHU },
  ]);
  ghiChu(doc, `Số hóa đơn: ${d.soHoaDon}. Tính theo ngày lập hóa đơn.`);
  doc.y += 6;
  bang(
    doc,
    [
      { tieuDe: "Tháng", ti_le: 2 },
      { tieuDe: "Đã thu", ti_le: 3, canh: "right" },
      { tieuDe: "Còn nợ", ti_le: 3, canh: "right" },
      { tieuDe: "Tổng", ti_le: 3, canh: "right" },
    ],
    d.duLieuThang.map((t) => [
      t.thang,
      tien(t.da_thu),
      tien(t.con_no),
      tien(t.da_thu + t.con_no),
    ]),
    d.duLieuThang.length > 0
      ? ["Cộng", tien(d.tongDaThu), tien(d.tongConNo), tien(d.tongDaThu + d.tongConNo)]
      : undefined,
  );

  // 2. Công nợ
  tieuMuc(doc, "2. Công nợ hiện tại");
  ghiChu(
    doc,
    `Tổng khách đang nợ${d.tenThoDangLoc ? ` (phiếu của ${d.tenThoDangLoc})` : ""}: ${tien(d.tongNoHienTai)}. Công nợ chỉ lọc theo thợ, không theo thời gian.`,
  );
  doc.y += 6;
  bang(
    doc,
    [
      { tieuDe: "Khách hàng", ti_le: 4 },
      { tieuDe: "SĐT", ti_le: 3 },
      { tieuDe: "Số hóa đơn", ti_le: 2, canh: "right" },
      { tieuDe: "Tổng nợ", ti_le: 3, canh: "right" },
    ],
    d.danhSachNo.map((k) => [k.ten, k.sdt, String(k.soHoaDon), tien(k.tongNo)]),
    d.danhSachNo.length > 0 ? ["Cộng", "", "", tien(d.tongNoHienTai)] : undefined,
  );

  // 3. Vật tư
  tieuMuc(doc, "3. Vật tư");
  tieuPhu(doc, `Sắp hết (tồn từ ${nguongSapHet} trở xuống, không lọc theo thời gian)`);
  bang(
    doc,
    [
      { tieuDe: "Vật tư", ti_le: 5 },
      { tieuDe: "Tồn kho", ti_le: 3, canh: "right" },
      { tieuDe: "Tình trạng", ti_le: 3 },
    ],
    d.vatTuSapHet.map((v) => [
      v.ten,
      `${v.so_luong_ton} ${v.don_vi}`,
      v.so_luong_ton === 0 ? "Hết hàng" : "Sắp hết",
    ]),
  );
  tieuPhu(doc, "Dùng nhiều nhất (top 5, tính theo ngày tạo phiếu)");
  bang(
    doc,
    [
      { tieuDe: "Vật tư", ti_le: 5 },
      { tieuDe: "Tổng đã dùng", ti_le: 3, canh: "right" },
    ],
    d.vatTuDungNhieu.map((v) => [v.ten, `${v.tongDung} ${v.donVi}`]),
  );

  // 4. Số phiếu việc
  tieuMuc(doc, "4. Số phiếu việc");
  ghiChu(doc, "Tính theo ngày tạo phiếu.");
  doc.y += 6;
  tieuPhu(doc, "Theo trạng thái");
  bang(
    doc,
    [
      { tieuDe: "Trạng thái", ti_le: 5 },
      { tieuDe: "Số phiếu", ti_le: 3, canh: "right" },
    ],
    d.duLieuTrangThai.map((t) => [t.nhan, String(t.gia_tri)]),
    ["Cộng", String(d.tongPhieu)],
  );

  tieuPhu(doc, "Theo thợ");
  const dongTho = d.dongTho.map((t) => [
    t.ten,
    String(t.dangXuLy),
    String(t.hoanThanh),
    String(t.daHuy),
  ]);
  if (d.phieuChuaGan) {
    dongTho.push([
      "Chưa gán thợ",
      String(d.phieuChuaGan.dangXuLy),
      String(d.phieuChuaGan.hoanThanh),
      String(d.phieuChuaGan.daHuy),
    ]);
  }
  bang(
    doc,
    [
      { tieuDe: "Thợ", ti_le: 5 },
      { tieuDe: "Đang xử lý", ti_le: 3, canh: "right" },
      { tieuDe: "Hoàn thành", ti_le: 3, canh: "right" },
      { tieuDe: "Đã hủy", ti_le: 2, canh: "right" },
    ],
    dongTho,
  );
  ghiChu(doc, "Đang xử lý gồm các phiếu Mới, Đang đi và Đang làm.");

  // Đánh số trang (cần bufferPages). Hạ lề dưới về 0 khi viết để pdfkit không tự thêm trang.
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const leDuoi = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font("thuong")
      .fontSize(9)
      .fillColor(MAU_MO)
      .text(`Trang ${i - start + 1}/${count}`, MEP, doc.page.height - 32, {
        width: RONG,
        align: "center",
      });
    doc.page.margins.bottom = leDuoi;
  }
}

export function taoPdfBaoCao(
  boLoc: BoLocBaoCao,
  duLieu: DuLieuBaoCao,
  nguongSapHet: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Truyền font qua option để pdfkit không nạp font Helvetica mặc định
    const doc = new PDFDocument({
      size: "A4",
      margin: MEP,
      font: FONT_THUONG,
      bufferPages: true,
      info: { Title: "Báo cáo" },
    });
    const phan: Buffer[] = [];
    doc.on("data", (c: Buffer) => phan.push(c));
    doc.on("end", () => resolve(Buffer.concat(phan)));
    doc.on("error", reject);
    try {
      ve(doc, boLoc, duLieu, nguongSapHet);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
