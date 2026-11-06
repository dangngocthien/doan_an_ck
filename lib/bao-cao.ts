import { prisma } from "@/lib/prisma";

// Giờ Việt Nam = UTC+7. DB lưu UTC nên phải cộng lệch khi gom theo tháng.
const LECH_GIO_VN_MS = 7 * 60 * 60 * 1000;
const MOT_NGAY_MS = 24 * 60 * 60 * 1000;

// Vật tư có tồn kho <= ngưỡng này được coi là "sắp hết"
export const NGUONG_SAP_HET = 5;

const NHAN_TRANG_THAI = [
  { gia_tri: "MOI", nhan: "Mới" },
  { gia_tri: "DANG_DI", nhan: "Đang đi" },
  { gia_tri: "DANG_LAM", nhan: "Đang làm" },
  { gia_tri: "HOAN_THANH", nhan: "Hoàn thành" },
  { gia_tri: "DA_HUY", nhan: "Đã hủy" },
] as const;

type ThamSo = Record<string, string | string[] | undefined>;

// tu/den: "YYYY-MM-DD" (giờ VN), null = không giới hạn. thoId: null = tất cả thợ.
export type BoLocBaoCao = {
  tu: string | null;
  den: string | null;
  thoId: number | null;
};

type DieuKienHoaDon = NonNullable<
  NonNullable<Parameters<typeof prisma.hoaDon.count>[0]>["where"]
>;
type DieuKienPhieu = NonNullable<
  NonNullable<Parameters<typeof prisma.phieuViec.count>[0]>["where"]
>;
type DieuKienDung = NonNullable<
  NonNullable<Parameters<typeof prisma.vatTuSuDung.count>[0]>["where"]
>;

function mot(giaTri: string | string[] | undefined) {
  return Array.isArray(giaTri) ? giaTri[0] : giaTri;
}

function ngayHopLe(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [n, t, d] = s.split("-").map(Number);
  if (n < 2000 || n > 2100) return false;
  const x = new Date(Date.UTC(n, t - 1, d));
  return (
    x.getUTCFullYear() === n && x.getUTCMonth() === t - 1 && x.getUTCDate() === d
  );
}

// Không có tham số → mặc định; tham số rỗng → không giới hạn; sai định dạng → mặc định
function docNgay(giaTri: string | string[] | undefined, macDinh: string) {
  const v = mot(giaTri);
  if (v === undefined) return macDinh;
  if (v === "") return null;
  return ngayHopLe(v) ? v : macDinh;
}

function dinhDangISO(nam: number, thang0: number, ngay: number) {
  return new Date(Date.UTC(nam, thang0, ngay)).toISOString().slice(0, 10);
}

// Đọc bộ lọc từ searchParams. Mặc định (không có tham số) = cả năm hiện tại, mọi thợ.
export function docBoLoc(thamSo: ThamSo) {
  const homNay = new Date(Date.now() + LECH_GIO_VN_MS);
  const nam = homNay.getUTCFullYear();
  const thang0 = homNay.getUTCMonth();

  const macDinhTu = dinhDangISO(nam, 0, 1);
  const macDinhDen = dinhDangISO(nam, 11, 31);

  let tu = docNgay(thamSo.tu, macDinhTu);
  let den = docNgay(thamSo.den, macDinhDen);
  if (tu && den && tu > den) [tu, den] = [den, tu];

  const tho = mot(thamSo.tho)?.trim() ?? "";
  const thoId = /^\d+$/.test(tho) ? Number(tho) : null;

  const boLoc: BoLocBaoCao = { tu, den, thoId };

  // Nút chọn nhanh khoảng thời gian (tính ở server để client khỏi xử lý ngày/giờ)
  const mucNhanh = [
    {
      nhan: "Tháng này",
      tu: dinhDangISO(nam, thang0, 1),
      den: dinhDangISO(nam, thang0 + 1, 0),
    },
    {
      nhan: "3 tháng gần đây",
      tu: dinhDangISO(nam, thang0 - 2, 1),
      den: dinhDangISO(nam, thang0 + 1, 0),
    },
    { nhan: "Năm nay", tu: macDinhTu, den: macDinhDen },
    { nhan: "Tất cả", tu: "", den: "" },
  ];

  const dangLoc = ["tu", "den", "tho"].some((k) => thamSo[k] !== undefined);

  return { boLoc, macDinhTu, macDinhDen, mucNhanh, dangLoc };
}

// [tu 00:00, den+1 ngày 00:00) theo giờ VN, đổi về UTC để truy vấn
function khoangThoiGian(tu: string | null, den: string | null) {
  const khoang: { gte?: Date; lt?: Date } = {};
  if (tu) khoang.gte = new Date(Date.parse(`${tu}T00:00:00Z`) - LECH_GIO_VN_MS);
  if (den) {
    khoang.lt = new Date(
      Date.parse(`${den}T00:00:00Z`) + MOT_NGAY_MS - LECH_GIO_VN_MS,
    );
  }
  return khoang;
}

function chiSoThangCua(d: Date) {
  const v = new Date(d.getTime() + LECH_GIO_VN_MS);
  return v.getUTCFullYear() * 12 + v.getUTCMonth();
}

function chiSoTuChuoi(s: string) {
  const [n, t] = s.split("-").map(Number);
  return n * 12 + (t - 1);
}

// Toàn bộ số liệu của trang Báo cáo (và sau này là file xuất) theo bộ lọc.
// Doanh thu: theo ngày lập hóa đơn. Số phiếu + vật tư dùng nhiều: theo ngày tạo phiếu.
// Công nợ: chỉ lọc theo thợ. Vật tư sắp hết: không lọc.
export async function layDuLieuBaoCao({
  tu,
  den,
  thoId: thoIdYeuCau,
}: BoLocBaoCao) {
  const danhSachTho = await prisma.nguoiDung.findMany({
    where: { vai_tro: "THO" },
    orderBy: { ten: "asc" },
    select: { id: true, ten: true, dang_hoat_dong: true },
  });
  // thoId lạ (không có trong DB) → coi như không lọc
  const thoId =
    thoIdYeuCau !== null && danhSachTho.some((t) => t.id === thoIdYeuCau)
      ? thoIdYeuCau
      : null;

  const khoang = khoangThoiGian(tu, den);

  const whereHoaDon: DieuKienHoaDon = {
    ngay_lap: khoang,
    ...(thoId !== null && { phieu_viec: { tho_id: thoId } }),
  };
  const whereConNo: DieuKienHoaDon = {
    trang_thai_thanh_toan: "CON_NO",
    ...(thoId !== null && { phieu_viec: { tho_id: thoId } }),
  };
  const wherePhieu: DieuKienPhieu = {
    ngay_tao: khoang,
    ...(thoId !== null && { tho_id: thoId }),
  };
  const whereDung: DieuKienDung = { phieu_viec: wherePhieu };

  const [
    danhSachHoaDon,
    hoaDonConNo,
    vatTuSapHet,
    tongDungTheoVatTu,
    phieuTheoTrangThai,
    phieuTheoTho,
  ] = await Promise.all([
    prisma.hoaDon.findMany({
      where: whereHoaDon,
      select: { ngay_lap: true, tong_tien: true, trang_thai_thanh_toan: true },
    }),
    prisma.hoaDon.findMany({
      where: whereConNo,
      select: {
        tong_tien: true,
        phieu_viec: {
          select: { khach_hang: { select: { id: true, ten: true, sdt: true } } },
        },
      },
    }),
    prisma.vatTu.findMany({
      where: {
        dang_hoat_dong: true,
        so_luong_ton: { lte: NGUONG_SAP_HET },
      },
      orderBy: { so_luong_ton: "asc" },
      select: { id: true, ten: true, don_vi: true, so_luong_ton: true },
    }),
    prisma.vatTuSuDung.groupBy({
      by: ["vat_tu_id"],
      where: whereDung,
      _sum: { so_luong: true },
      orderBy: { _sum: { so_luong: "desc" } },
      take: 5,
    }),
    prisma.phieuViec.groupBy({
      by: ["trang_thai"],
      where: wherePhieu,
      _count: { _all: true },
    }),
    prisma.phieuViec.groupBy({
      by: ["tho_id", "trang_thai"],
      where: wherePhieu,
      _count: { _all: true },
    }),
  ]);

  // Doanh thu theo tháng: từ tháng của `tu` đến tháng của `den`
  // (không giới hạn đầu/cuối thì lấy theo hóa đơn sớm nhất/muộn nhất)
  const duLieuThang: { thang: string; da_thu: number; con_no: number }[] = [];
  const cacChiSo = danhSachHoaDon.map((h) => chiSoThangCua(h.ngay_lap));
  if (cacChiSo.length > 0) {
    const dau = tu ? chiSoTuChuoi(tu) : Math.min(...cacChiSo);
    const cuoi = den ? chiSoTuChuoi(den) : Math.max(...cacChiSo);
    const nhieuNam = Math.floor(dau / 12) !== Math.floor(cuoi / 12);
    for (let i = dau; i <= cuoi; i++) {
      const thang = (i % 12) + 1;
      duLieuThang.push({
        thang: nhieuNam ? `T${thang}/${Math.floor(i / 12)}` : `T${thang}`,
        da_thu: 0,
        con_no: 0,
      });
    }
    for (const h of danhSachHoaDon) {
      const dong = duLieuThang[chiSoThangCua(h.ngay_lap) - dau];
      const tien = Number(h.tong_tien);
      if (h.trang_thai_thanh_toan === "DA_THU") dong.da_thu += tien;
      else dong.con_no += tien;
    }
  }
  const tongDaThu = duLieuThang.reduce((s, t) => s + t.da_thu, 0);
  const tongConNo = duLieuThang.reduce((s, t) => s + t.con_no, 0);

  // Công nợ: gộp theo khách hàng
  const noTheoKhach = new Map<
    number,
    { id: number; ten: string; sdt: string; soHoaDon: number; tongNo: number }
  >();
  for (const h of hoaDonConNo) {
    const kh = h.phieu_viec.khach_hang;
    const hienCo = noTheoKhach.get(kh.id) ?? {
      id: kh.id,
      ten: kh.ten,
      sdt: kh.sdt,
      soHoaDon: 0,
      tongNo: 0,
    };
    hienCo.soHoaDon += 1;
    hienCo.tongNo += Number(h.tong_tien);
    noTheoKhach.set(kh.id, hienCo);
  }
  const danhSachNo = Array.from(noTheoKhach.values()).sort(
    (a, b) => b.tongNo - a.tongNo,
  );
  const tongNoHienTai = danhSachNo.reduce((s, k) => s + k.tongNo, 0);

  // Vật tư dùng nhiều nhất (top 5)
  const thongTinVatTuDung = await prisma.vatTu.findMany({
    where: { id: { in: tongDungTheoVatTu.map((d) => d.vat_tu_id) } },
    select: { id: true, ten: true, don_vi: true },
  });
  const vatTuDungNhieu = tongDungTheoVatTu.map((d) => {
    const vt = thongTinVatTuDung.find((v) => v.id === d.vat_tu_id);
    return {
      id: d.vat_tu_id,
      ten: vt?.ten ?? `Vật tư #${d.vat_tu_id}`,
      donVi: vt?.don_vi ?? "",
      tongDung: d._sum.so_luong ?? 0,
    };
  });

  // Số phiếu: theo trạng thái, và theo thợ (kể cả phiếu chưa gán)
  const demTheoTrangThai = new Map<string, number>(
    phieuTheoTrangThai.map((p) => [p.trang_thai, p._count._all]),
  );
  const duLieuTrangThai = NHAN_TRANG_THAI.map((t) => ({
    nhan: t.nhan,
    gia_tri: demTheoTrangThai.get(t.gia_tri) ?? 0,
  }));
  const tongPhieu = duLieuTrangThai.reduce((s, t) => s + t.gia_tri, 0);

  type DemPhieu = { dangXuLy: number; hoanThanh: number; daHuy: number };
  const demTheoTho = new Map<number | null, DemPhieu>();
  for (const p of phieuTheoTho) {
    const dem = demTheoTho.get(p.tho_id) ?? {
      dangXuLy: 0,
      hoanThanh: 0,
      daHuy: 0,
    };
    const n = p._count._all;
    if (p.trang_thai === "HOAN_THANH") dem.hoanThanh += n;
    else if (p.trang_thai === "DA_HUY") dem.daHuy += n;
    else dem.dangXuLy += n;
    demTheoTho.set(p.tho_id, dem);
  }
  const khongCoPhieu: DemPhieu = { dangXuLy: 0, hoanThanh: 0, daHuy: 0 };

  const tenHienThi = (t: (typeof danhSachTho)[number]) =>
    t.dang_hoat_dong ? t.ten : `${t.ten} (ngừng hoạt động)`;

  const dongTho = danhSachTho
    .map((t) => ({
      id: t.id,
      ten: tenHienThi(t),
      hoatDong: t.dang_hoat_dong,
      ...(demTheoTho.get(t.id) ?? khongCoPhieu),
    }))
    .filter((t) =>
      thoId !== null
        ? t.id === thoId
        : // Thợ ngừng hoạt động mà không có phiếu nào thì không cần hiện
          t.hoatDong || t.dangXuLy + t.hoanThanh + t.daHuy > 0,
    );
  const phieuChuaGan = demTheoTho.get(null);

  return {
    thoId,
    tenThoDangLoc: thoId !== null ? dongTho[0]?.ten ?? null : null,
    danhSachTho: danhSachTho.map((t) => ({ id: t.id, ten: tenHienThi(t) })),
    soHoaDon: danhSachHoaDon.length,
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
  };
}
