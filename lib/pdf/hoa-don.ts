import path from "node:path";
import PDFDocument from "pdfkit";

// Dữ liệu đã được route chuẩn bị sẵn (số thuần, không phụ thuộc Prisma)
export type DuLieuHoaDon = {
  id: number;
  ngayLap: Date;
  daThu: boolean;
  khachTen: string;
  khachSdt: string;
  suCo: string;
  thoTen: string | null;
  phieuId: number;
  vatTu: { ten: string; soLuong: number; donVi: string }[];
  tienCong: number;
  tienVatTu: number;
  tongTien: number;
};

// Font TTF tĩnh đặt ở assets/fonts/ (pdfkit không nhúng được font biến thiên)
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

const dinhDangNgay = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Tự ghép dấu chấm hàng nghìn, tránh phụ thuộc ICU và ký hiệu ₫ (có thể thiếu glyph)
function tien(so: number) {
  return `${String(Math.round(so)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
}

type Doc = PDFKit.PDFDocument;

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

function dongThongTin(doc: Doc, nhan: string, giaTri: string) {
  const y = doc.y;
  doc.font("thuong").fontSize(10).fillColor(MAU_MO);
  doc.text(nhan, MEP, y, { width: 90 });
  const yNhan = doc.y;
  doc.fillColor(MAU_CHU).text(giaTri, MEP + 90, y, { width: RONG - 90 });
  doc.y = Math.max(yNhan, doc.y) + 5;
}

function dongTien(doc: Doc, nhan: string, giaTri: string, dam = false) {
  const y = doc.y;
  doc
    .font(dam ? "dam" : "thuong")
    .fontSize(dam ? 12 : 10)
    .fillColor(dam ? MAU_CHINH : MAU_CHU);
  doc.text(nhan, MEP + RONG - 260, y, { width: 120 });
  doc.text(giaTri, MEP + RONG - 140, y, { width: 140, align: "right" });
  doc.y = y + (dam ? 22 : 18);
}

function ve(doc: Doc, d: DuLieuHoaDon) {
  doc.registerFont("thuong", FONT_THUONG);
  doc.registerFont("dam", FONT_DAM);

  // Tiêu đề + số hóa đơn, trạng thái
  doc.font("dam").fontSize(22).fillColor(MAU_CHINH).text("HÓA ĐƠN", MEP, MEP);
  doc
    .font("thuong")
    .fontSize(11)
    .fillColor(MAU_MO)
    .text(`Số #${d.id}`, MEP, MEP + 2, { width: RONG, align: "right" });
  doc
    .font("dam")
    .fontSize(11)
    .fillColor(d.daThu ? MAU_OK : MAU_NO)
    .text(d.daThu ? "ĐÃ THU" : "CÒN NỢ", MEP, MEP + 18, {
      width: RONG,
      align: "right",
    });
  doc.y = MEP + 44;
  duongKe(doc, doc.y);
  doc.y += 14;

  // Thông tin chung
  dongThongTin(doc, "Ngày lập", dinhDangNgay.format(d.ngayLap));
  dongThongTin(doc, "Khách hàng", `${d.khachTen} — ${d.khachSdt}`);
  dongThongTin(doc, "Sự cố", d.suCo);
  dongThongTin(doc, "Thợ", d.thoTen ?? "—");
  dongThongTin(doc, "Phiếu việc", `#${d.phieuId}`);
  doc.y += 10;

  // Bảng vật tư
  canCho(doc, 80);
  doc.font("dam").fontSize(11).fillColor(MAU_CHINH).text("Vật tư đã dùng", MEP, doc.y);
  doc.y += 6;

  const yDau = doc.y;
  doc.rect(MEP, yDau, RONG, 24).fill(MAU_NEN_BANG);
  doc.font("dam").fontSize(10).fillColor(MAU_CHU);
  doc.text("Vật tư", MEP + 8, yDau + 7, { width: RONG - 140 });
  doc.text("Số lượng", MEP + RONG - 120, yDau + 7, { width: 112, align: "right" });
  doc.y = yDau + 24;

  if (d.vatTu.length === 0) {
    doc.font("thuong").fontSize(10).fillColor(MAU_MO);
    doc.text("Không có vật tư.", MEP + 8, doc.y + 8);
    doc.y += 12;
  } else {
    for (const v of d.vatTu) {
      canCho(doc, 30);
      const y = doc.y;
      doc.font("thuong").fontSize(10).fillColor(MAU_CHU);
      doc.text(v.ten, MEP + 8, y + 7, { width: RONG - 140 });
      const yTen = doc.y;
      doc.text(`${v.soLuong} ${v.donVi}`, MEP + RONG - 120, y + 7, {
        width: 112,
        align: "right",
      });
      const yCuoi = Math.max(yTen, doc.y) + 7;
      duongKe(doc, yCuoi);
      doc.y = yCuoi;
    }
  }
  doc.y += 16;

  // Tổng tiền (số lấy từ hóa đơn, đã chốt lúc lập)
  canCho(doc, 90);
  dongTien(doc, "Tiền công", tien(d.tienCong));
  dongTien(doc, "Tiền vật tư", tien(d.tienVatTu));
  doc.y += 2;
  duongKe(doc, doc.y);
  doc.y += 8;
  dongTien(doc, "Tổng tiền", tien(d.tongTien), true);
}

export function taoPdfHoaDon(d: DuLieuHoaDon): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Truyền font qua option để pdfkit không nạp font Helvetica mặc định
    const doc = new PDFDocument({
      size: "A4",
      margin: MEP,
      font: FONT_THUONG,
      info: { Title: `Hóa đơn #${d.id}` },
    });
    const phan: Buffer[] = [];
    doc.on("data", (c: Buffer) => phan.push(c));
    doc.on("end", () => resolve(Buffer.concat(phan)));
    doc.on("error", reject);
    try {
      ve(doc, d);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
