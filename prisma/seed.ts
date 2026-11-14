import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Seed chạy ngoài Next.js nên tự tạo PrismaClient riêng,
// không import lib/prisma.ts (file đó có "server-only", chỉ dành cho code chạy trong Next).
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ============================================================
// SEED: XÓA SẠCH toàn bộ dữ liệu rồi nạp lại dữ liệu mẫu.
// Chạy lại bao nhiêu lần cũng ra đúng cùng 1 bộ dữ liệu.
// ============================================================

// Ngày quá khứ: soNgay ngày trước, lúc `gio` giờ (dùng để dữ liệu nhìn tự nhiên)
function ngayTruoc(soNgay: number, gio: number) {
  const d = new Date();
  d.setDate(d.getDate() - soNgay);
  d.setHours(gio, 0, 0, 0);
  return d;
}

type TrangThai = "MOI" | "DANG_DI" | "DANG_LAM" | "HOAN_THANH" | "DA_HUY";
type UuTien = "THAP" | "TRUNG_BINH" | "CAO";

// ------------------------------------------------------------
// Dữ liệu mẫu
// ------------------------------------------------------------
// Thứ tự trong mảng = số thứ tự `tho` ở phieuMau (0..5)
// dia_chi/vi_do/kinh_do: nhà thợ. Tọa độ nhập sẵn gần đúng khu vực (seed không gọi mạng);
// bỏ trống = chưa xác định vị trí (xếp cuối khi gợi ý thợ gần)
const thoMau: {
  ten: string;
  sdt: string;
  email: string;
  dang_hoat_dong: boolean;
  dia_chi?: string;
  vi_do?: number;
  kinh_do?: number;
}[] = [
  {
    ten: "Trần Văn Hùng",
    sdt: "0905112233",
    email: "tranvanhung@gmail.com",
    dang_hoat_dong: true,
    dia_chi: "56 Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    vi_do: 10.784,
    kinh_do: 106.684,
  },
  {
    ten: "Lê Minh Tuấn",
    sdt: "0908223344",
    email: "leminhtuan@gmail.com",
    dang_hoat_dong: true,
    dia_chi: "120 Trần Hưng Đạo, Quận 5, TP.HCM",
    vi_do: 10.754,
    kinh_do: 106.663,
  },
  // Thợ đã nghỉ việc: để test soft delete, lịch sử phiếu vẫn còn
  {
    ten: "Phạm Quốc Bảo",
    sdt: "0912334455",
    email: "phamquocbao@gmail.com",
    dang_hoat_dong: false,
  },
  {
    ten: "Nguyễn Hoàng Long",
    sdt: "0933445566",
    email: "nguyenhoanglong@gmail.com",
    dang_hoat_dong: true,
    dia_chi: "25 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
    vi_do: 10.7769,
    kinh_do: 106.7009,
  },
  // Chưa có địa chỉ/tọa độ: test thợ "chưa xác định vị trí" xếp cuối gợi ý
  {
    ten: "Đặng Thanh Phong",
    sdt: "0944556677",
    email: "dangthanhphong@gmail.com",
    dang_hoat_dong: true,
  },
  // Thợ mới vào gần đây, hiện đang rảnh (không có phiếu đang xử lý)
  {
    ten: "Võ Đức Thịnh",
    sdt: "0966778899",
    email: "voducthinh@gmail.com",
    dang_hoat_dong: true,
    dia_chi: "88 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    vi_do: 10.85,
    kinh_do: 106.7717,
  },
];

// Số thứ tự `khach` ở phieuMau (0..11)
const khachMau = [
  {
    ten: "Nguyễn Thị Lan",
    sdt: "0918456721",
    dia_chi: "12 Lê Lợi, Quận 1, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Trần Quốc Khánh",
    sdt: "0983716254",
    dia_chi: "45 Nguyễn Trãi, Quận 5, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Công ty TNHH Minh Phát",
    sdt: "0903111222",
    dia_chi: "88 Cách Mạng Tháng 8, Quận 3, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Lê Hoàng Nam",
    sdt: "0935222333",
    dia_chi: "23 Phạm Văn Đồng, TP. Thủ Đức, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Phạm Thu Hà",
    sdt: "0977444555",
    dia_chi: "7 Hoàng Diệu, Quận 4, TP.HCM",
    dang_hoat_dong: true,
  },
  // Khách đã ngừng hoạt động mà vẫn còn nợ: để test công nợ vẫn hiện khách ngừng
  {
    ten: "Võ Văn Sơn",
    sdt: "0968555666",
    dia_chi: "150 Võ Văn Tần, Quận 3, TP.HCM",
    dang_hoat_dong: false,
  },
  {
    ten: "Đỗ Thị Mai",
    sdt: "0918667788",
    dia_chi: "56 Lý Thường Kiệt, Quận 10, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Quán cà phê Gió Chiều",
    sdt: "0938990011",
    dia_chi: "102 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Bùi Văn Thành",
    sdt: "0909123987",
    dia_chi: "31 Bạch Đằng, Quận Bình Thạnh, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Trương Ngọc Ánh",
    sdt: "0988456123",
    dia_chi: "18 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
    dang_hoat_dong: true,
  },
  // Khách có nhiều hóa đơn còn nợ: để bảng công nợ gộp theo khách có số hóa đơn > 1
  {
    ten: "Khách sạn Hoa Sen",
    sdt: "0901777888",
    dia_chi: "66 Trần Hưng Đạo, Quận 1, TP.HCM",
    dang_hoat_dong: true,
  },
  {
    ten: "Huỳnh Minh Triết",
    sdt: "0972335599",
    dia_chi: "9 Nguyễn Oanh, Quận Gò Vấp, TP.HCM",
    dang_hoat_dong: true,
  },
];

// `ton` là tồn kho BAN ĐẦU. Tồn kho thật lưu vào DB = ton - tổng số lượng đã dùng ở các phiếu bên dưới
const vatTuMau: {
  ten: string;
  don_vi: string;
  ton: number;
  gia: number;
  dang_hoat_dong?: boolean;
}[] = [
  { ten: "Ống nhựa PVC Ø21", don_vi: "mét", ton: 200, gia: 12000 },
  { ten: "Co nối PVC Ø21", don_vi: "cái", ton: 150, gia: 3500 },
  { ten: "Băng keo lụa", don_vi: "cuộn", ton: 80, gia: 8000 },
  { ten: "Vòi lavabo inox", don_vi: "cái", ton: 25, gia: 185000 },
  { ten: "Van khóa nước Ø21", don_vi: "cái", ton: 40, gia: 45000 },
  { ten: "Dây điện Cadivi 2.5mm²", don_vi: "mét", ton: 300, gia: 9500 },
  { ten: "Ổ cắm đôi", don_vi: "cái", ton: 30, gia: 65000 },
  { ten: "Aptomat 20A", don_vi: "cái", ton: 4, gia: 120000 }, // dùng hết => tồn 0, test "Hết hàng"
  { ten: "Bóng đèn LED 9W", don_vi: "cái", ton: 60, gia: 35000 },
  { ten: "Keo silicon", don_vi: "tuýp", ton: 35, gia: 55000 },
  { ten: "Công tắc đơn", don_vi: "cái", ton: 12, gia: 28000 },
  { ten: "Dây cấp nước inox 60cm", don_vi: "sợi", ton: 30, gia: 38000 },
  { ten: "Phao cơ bồn nước", don_vi: "cái", ton: 8, gia: 85000 }, // còn 5 => test "Sắp hết"
  { ten: "Ống thoát nước PVC Ø90", don_vi: "mét", ton: 40, gia: 58000 },
  { ten: "Bộ xả bồn cầu", don_vi: "bộ", ton: 12, gia: 165000 },
  { ten: "Đèn ốp trần LED 18W", don_vi: "cái", ton: 15, gia: 150000 },
  // Vật tư ngừng kinh doanh nhưng đã từng dùng: để test soft delete, lịch sử phiếu vẫn còn
  {
    ten: "Ống nhựa PVC Ø16",
    don_vi: "mét",
    ton: 15,
    gia: 9000,
    dang_hoat_dong: false,
  },
];

// khach / tho là số thứ tự trong 2 mảng trên (tho: null = chưa gán)
// ngayTruocNgay: phiếu được tạo cách đây mấy ngày
// vat_tu: vật tư thợ đã ghi (kho đã trừ), có thể có ở phiếu đang làm hoặc đã hủy
// Hóa đơn chỉ có ở phiếu HOAN_THANH (cần tien_cong, thanh_toan), trừ khi chua_lap_hoa_don = true
// Phiếu HOAN_THANH có vat_tu rỗng => khong_dung_vat_tu = true
type PhieuMau = {
  khach: number;
  tho: number | null;
  loai_su_co: string;
  muc_do_uu_tien: UuTien;
  trang_thai: TrangThai;
  ghi_chu: string | null;
  ngayTruocNgay: number;
  vat_tu?: [string, number][];
  tien_cong?: number;
  thanh_toan?: "DA_THU" | "CON_NO";
  chua_lap_hoa_don?: boolean;
};

const phieuMau: PhieuMau[] = [
  // --- Phiếu đang xử lý (để test luồng Admin gán thợ + Thợ đổi trạng thái tuần tự) ---
  {
    khach: 0,
    tho: null,
    loai_su_co: "Vỡ ống nước âm tường",
    muc_do_uu_tien: "CAO",
    trang_thai: "MOI",
    ghi_chu: "Nước chảy ra sàn, khách yêu cầu đi gấp",
    ngayTruocNgay: 1,
  },
  {
    khach: 1,
    tho: 0,
    loai_su_co: "Thay vòi lavabo",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "MOI",
    ghi_chu: "Khách đã mua sẵn vòi",
    ngayTruocNgay: 1,
  },
  {
    khach: 2,
    tho: 0,
    loai_su_co: "Chập điện, mất điện tầng 2",
    muc_do_uu_tien: "CAO",
    trang_thai: "DANG_DI",
    ghi_chu: null,
    ngayTruocNgay: 1,
  },
  {
    khach: 3,
    tho: 1,
    loai_su_co: "Rò rỉ nước dưới bồn rửa",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "DANG_LAM",
    ghi_chu: null,
    ngayTruocNgay: 1,
    vat_tu: [
      ["Dây cấp nước inox 60cm", 1],
      ["Băng keo lụa", 1],
    ],
  },
  {
    khach: 6,
    tho: 3,
    loai_su_co: "Thay bóng đèn phòng khách",
    muc_do_uu_tien: "THAP",
    trang_thai: "MOI",
    ghi_chu: "Khách rảnh buổi chiều",
    ngayTruocNgay: 2,
  },
  {
    khach: 10,
    tho: 4,
    loai_su_co: "Mất nước tầng 5 khách sạn",
    muc_do_uu_tien: "CAO",
    trang_thai: "DANG_DI",
    ghi_chu: "Nghi hỏng van tổng tầng 5",
    ngayTruocNgay: 1,
  },
  {
    khach: 7,
    tho: 4,
    loai_su_co: "Máy bơm nước yếu, kêu to",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "MOI",
    ghi_chu: null,
    ngayTruocNgay: 1,
  },
  {
    khach: 9,
    tho: 1,
    loai_su_co: "Lắp thêm ổ cắm khu vực bếp",
    muc_do_uu_tien: "THAP",
    trang_thai: "MOI",
    ghi_chu: "Khách muốn lắp 2 ổ",
    ngayTruocNgay: 2,
  },

  // --- Phiếu đã hủy ---
  {
    khach: 2,
    tho: null,
    loai_su_co: "Sơn lại đường ống",
    muc_do_uu_tien: "THAP",
    trang_thai: "DA_HUY",
    ghi_chu: "Khách hủy vì dời lịch",
    ngayTruocNgay: 20,
  },
  // Hủy khi đã ghi vật tư: kho KHÔNG được hoàn lại (đúng quy tắc đã chốt)
  {
    khach: 8,
    tho: 3,
    loai_su_co: "Thay dây điện nguồn phòng ngủ",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "DA_HUY",
    ghi_chu: "Khách hủy giữa chừng, vật tư đã dùng không hoàn kho",
    ngayTruocNgay: 35,
    vat_tu: [["Dây điện Cadivi 2.5mm²", 10]],
  },

  // --- Phiếu đã hoàn thành, rải đều ~6 tháng để biểu đồ doanh thu theo tháng có số ---
  // Thợ Bảo (đã nghỉ): chỉ có phiếu cũ
  {
    khach: 1,
    tho: 2,
    loai_su_co: "Thay đoạn ống PVC bị nứt",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 180,
    vat_tu: [
      ["Ống nhựa PVC Ø21", 6],
      ["Co nối PVC Ø21", 4],
      ["Băng keo lụa", 1],
    ],
    tien_cong: 180000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 6,
    tho: 2,
    loai_su_co: "Thay van khóa nước",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 165,
    vat_tu: [
      ["Van khóa nước Ø21", 1],
      ["Băng keo lụa", 1],
      ["Ống nhựa PVC Ø16", 5],
    ],
    tien_cong: 150000,
    thanh_toan: "DA_THU",
  },
  // Khách đã ngừng hoạt động nhưng còn nợ
  {
    khach: 5,
    tho: 0,
    loai_su_co: "Thay bóng đèn LED",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 150,
    vat_tu: [["Bóng đèn LED 9W", 4]],
    tien_cong: 100000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 8,
    tho: 2,
    loai_su_co: "Sửa vòi nước bị rò",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 140,
    vat_tu: [
      ["Vòi lavabo inox", 1],
      ["Băng keo lụa", 1],
      ["Keo silicon", 1],
    ],
    tien_cong: 200000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 0,
    tho: 0,
    loai_su_co: "Thay van khóa nước",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 130,
    vat_tu: [
      ["Van khóa nước Ø21", 1],
      ["Băng keo lụa", 2],
    ],
    tien_cong: 150000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 2,
    tho: 1,
    loai_su_co: "Đi lại dây điện phòng kho",
    muc_do_uu_tien: "CAO",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Công ty thanh toán cuối tháng",
    ngayTruocNgay: 120,
    vat_tu: [
      ["Dây điện Cadivi 2.5mm²", 40],
      ["Ổ cắm đôi", 3],
      ["Aptomat 20A", 2],
    ],
    tien_cong: 600000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 4,
    tho: 0,
    loai_su_co: "Thông tắc bồn cầu",
    muc_do_uu_tien: "CAO",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 110,
    vat_tu: [],
    tien_cong: 250000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 9,
    tho: 1,
    loai_su_co: "Thay công tắc, ổ cắm phòng ngủ",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 100,
    vat_tu: [
      ["Công tắc đơn", 3],
      ["Ổ cắm đôi", 2],
      ["Dây điện Cadivi 2.5mm²", 5],
    ],
    tien_cong: 150000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 10,
    tho: 4,
    loai_su_co: "Bảo trì đường nước các phòng tầng 3",
    muc_do_uu_tien: "CAO",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 95,
    vat_tu: [
      ["Ống nhựa PVC Ø21", 20],
      ["Co nối PVC Ø21", 30],
      ["Van khóa nước Ø21", 6],
      ["Băng keo lụa", 10],
      ["Keo silicon", 4],
    ],
    tien_cong: 1800000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 11,
    tho: 1,
    loai_su_co: "Lắp đèn ốp trần phòng khách",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 85,
    vat_tu: [
      ["Đèn ốp trần LED 18W", 2],
      ["Dây điện Cadivi 2.5mm²", 8],
      ["Công tắc đơn", 1],
    ],
    tien_cong: 280000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 3,
    tho: 3,
    loai_su_co: "Sửa vòi nước bị rò",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 75,
    vat_tu: [
      ["Vòi lavabo inox", 1],
      ["Băng keo lụa", 1],
      ["Keo silicon", 1],
    ],
    tien_cong: 200000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 7,
    tho: 3,
    loai_su_co: "Thay đường ống thoát nước bếp",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 70,
    vat_tu: [
      ["Ống thoát nước PVC Ø90", 3],
      ["Co nối PVC Ø21", 4],
      ["Keo silicon", 1],
    ],
    tien_cong: 450000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 0,
    tho: 3,
    loai_su_co: "Thay bóng đèn LED hành lang",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 60,
    vat_tu: [["Bóng đèn LED 9W", 6]],
    tien_cong: 120000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 6,
    tho: 0,
    loai_su_co: "Thay Aptomat nhảy liên tục",
    muc_do_uu_tien: "CAO",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 55,
    vat_tu: [["Aptomat 20A", 2]],
    tien_cong: 200000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 10,
    tho: 4,
    loai_su_co: "Thay vòi lavabo và van khóa phòng 301–305",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Khách sạn thanh toán theo quý",
    ngayTruocNgay: 50,
    vat_tu: [
      ["Vòi lavabo inox", 5],
      ["Van khóa nước Ø21", 5],
      ["Băng keo lụa", 5],
      ["Keo silicon", 2],
    ],
    tien_cong: 1500000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 8,
    tho: 1,
    loai_su_co: "Thay vòi lavabo và dây cấp nước",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 40,
    vat_tu: [
      ["Vòi lavabo inox", 1],
      ["Dây cấp nước inox 60cm", 2],
      ["Băng keo lụa", 1],
    ],
    tien_cong: 180000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 2,
    tho: 0,
    loai_su_co: "Thay ổ cắm, đi lại dây văn phòng",
    muc_do_uu_tien: "CAO",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Công ty thanh toán cuối tháng",
    ngayTruocNgay: 25,
    vat_tu: [
      ["Dây điện Cadivi 2.5mm²", 30],
      ["Ổ cắm đôi", 5],
      ["Công tắc đơn", 2],
    ],
    tien_cong: 450000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 10,
    tho: 4,
    loai_su_co: "Sửa rò rỉ bồn cầu 4 phòng",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Khách sạn thanh toán theo quý",
    ngayTruocNgay: 22,
    vat_tu: [
      ["Bộ xả bồn cầu", 4],
      ["Dây cấp nước inox 60cm", 4],
      ["Băng keo lụa", 4],
    ],
    tien_cong: 800000,
    thanh_toan: "CON_NO",
  },
  // Thợ Thịnh (mới vào)
  {
    khach: 1,
    tho: 5,
    loai_su_co: "Thay dây cấp nước bồn rửa",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 20,
    vat_tu: [
      ["Dây cấp nước inox 60cm", 1],
      ["Băng keo lụa", 1],
    ],
    tien_cong: 100000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 9,
    tho: 3,
    loai_su_co: "Thông tắc bồn rửa chén",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 14,
    vat_tu: [],
    tien_cong: 200000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 2,
    tho: 1,
    loai_su_co: "Thay bóng đèn khu vực kho",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Công ty thanh toán cuối tháng",
    ngayTruocNgay: 12,
    vat_tu: [["Bóng đèn LED 9W", 10]],
    tien_cong: 200000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 3,
    tho: 3,
    loai_su_co: "Thay phao cơ bồn nước",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 9,
    vat_tu: [["Phao cơ bồn nước", 3]],
    tien_cong: 200000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 10,
    tho: 4,
    loai_su_co: "Thay đèn ốp trần sảnh",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: "Khách sạn thanh toán theo quý",
    ngayTruocNgay: 8,
    vat_tu: [
      ["Đèn ốp trần LED 18W", 6],
      ["Dây điện Cadivi 2.5mm²", 20],
    ],
    tien_cong: 900000,
    thanh_toan: "CON_NO",
  },
  {
    khach: 4,
    tho: 5,
    loai_su_co: "Thay ổ cắm bị cháy",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 5,
    vat_tu: [["Ổ cắm đôi", 1]],
    tien_cong: 80000,
    thanh_toan: "DA_THU",
  },
  {
    khach: 7,
    tho: 0,
    loai_su_co: "Thay bộ xả bồn cầu",
    muc_do_uu_tien: "TRUNG_BINH",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 3,
    vat_tu: [
      ["Bộ xả bồn cầu", 1],
      ["Băng keo lụa", 1],
    ],
    tien_cong: 220000,
    thanh_toan: "DA_THU",
  },
  // Vừa xong, chưa lập hóa đơn: để test bước "Admin lập hóa đơn" ngay trên dữ liệu seed
  {
    khach: 0,
    tho: 0,
    loai_su_co: "Thay vòi sen tắm",
    muc_do_uu_tien: "THAP",
    trang_thai: "HOAN_THANH",
    ghi_chu: null,
    ngayTruocNgay: 1,
    vat_tu: [
      ["Dây cấp nước inox 60cm", 1],
      ["Băng keo lụa", 1],
    ],
    chua_lap_hoa_don: true,
  },
];

// Ảnh mẫu nằm trong public/uploads (cùng chỗ với ảnh thợ upload thật).
// 5 ảnh "trước" + 5 ảnh "sau", xoay vòng cho các phiếu. Tạo file bằng doi-ten-anh.ps1.
const ANH_TRUOC = [1, 2, 3, 4, 5].map((n) => `/uploads/seed-truoc-${n}.jpg`);
const ANH_SAU = [1, 2, 3, 4, 5].map((n) => `/uploads/seed-sau-${n}.jpg`);

// ------------------------------------------------------------
// Bước 1: xóa sạch (đúng thứ tự: bảng con trước, bảng cha sau)
// ------------------------------------------------------------
async function xoaSachDuLieu() {
  await prisma.hoaDon.deleteMany();
  await prisma.vatTuSuDung.deleteMany();
  await prisma.anhPhieuViec.deleteMany();
  await prisma.phieuViec.deleteMany();
  await prisma.vatTu.deleteMany();
  await prisma.khachHang.deleteMany();
  await prisma.nguoiDung.deleteMany();

  // Đặt lại bộ đếm id về 1 để id luôn ổn định sau mỗi lần seed
  for (const bang of [
    "hoa_don",
    "vat_tu_su_dung",
    "anh_phieu_viec",
    "phieu_viec",
    "vat_tu",
    "khach_hang",
    "nguoi_dung",
  ]) {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${bang} AUTO_INCREMENT = 1`);
  }
  console.log("Đã xóa sạch dữ liệu cũ.");
}

// ------------------------------------------------------------
// Bước 2: nạp dữ liệu mẫu
// ------------------------------------------------------------
async function main() {
  await xoaSachDuLieu();

  // --- Người dùng ---
  const hashAdmin = await bcrypt.hash("admin123", 10);
  const hashTho = await bcrypt.hash("tho123", 10);

  await prisma.nguoiDung.create({
    data: {
      ten: "Quản trị viên",
      sdt: "0906400500",
      email: "admin.dienthuy@gmail.com",
      mat_khau_hash: hashAdmin,
      vai_tro: "ADMIN",
    },
  });

  const thoIds: number[] = [];
  for (const t of thoMau) {
    const tho = await prisma.nguoiDung.create({
      data: {
        ...t,
        mat_khau_hash: hashTho,
        vai_tro: "THO",
      },
    });
    thoIds.push(tho.id);
  }

  // --- Khách hàng ---
  const khachIds: number[] = [];
  for (const k of khachMau) {
    const khach = await prisma.khachHang.create({ data: k });
    khachIds.push(khach.id);
  }

  // --- Vật tư: tồn kho = tồn ban đầu - tổng đã dùng ở các phiếu ---
  const daDung: Record<string, number> = {};
  for (const p of phieuMau) {
    for (const [ten, soLuong] of p.vat_tu ?? []) {
      daDung[ten] = (daDung[ten] ?? 0) + soLuong;
    }
  }

  const vatTuTheoTen: Record<string, { id: number; gia: number }> = {};
  for (const v of vatTuMau) {
    const tonConLai = v.ton - (daDung[v.ten] ?? 0);
    if (tonConLai < 0)
      throw new Error(`Vật tư "${v.ten}" bị âm tồn kho, sửa lại số liệu mẫu`);
    const vatTu = await prisma.vatTu.create({
      data: {
        ten: v.ten,
        don_vi: v.don_vi,
        so_luong_ton: tonConLai,
        gia: v.gia,
        dang_hoat_dong: v.dang_hoat_dong ?? true,
      },
    });
    vatTuTheoTen[v.ten] = { id: vatTu.id, gia: v.gia };
  }

  // --- Phiếu việc (kèm vật tư đã dùng + hóa đơn nếu đã hoàn thành) ---
  let soHoaDon = 0;
  let soAnh = 0;
  for (const [i, p] of phieuMau.entries()) {
    const khach = khachMau[p.khach];
    const ngayTao = ngayTruoc(p.ngayTruocNgay, 8);
    const daHoanThanh = p.trang_thai === "HOAN_THANH";
    const ngayHoanThanh = daHoanThanh ? ngayTruoc(p.ngayTruocNgay, 16) : null;

    const dongVatTu = (p.vat_tu ?? []).map(([ten, soLuong]) => {
      if (!vatTuTheoTen[ten])
        throw new Error(
          `Phiếu "${p.loai_su_co}" dùng vật tư không có trong danh mục: "${ten}"`,
        );
      return { vat_tu_id: vatTuTheoTen[ten].id, so_luong: soLuong };
    });

    let hoaDon;
    if (daHoanThanh && !p.chua_lap_hoa_don) {
      const tienCong = p.tien_cong ?? 0;
      const tienVatTu = (p.vat_tu ?? []).reduce(
        (tong, [ten, soLuong]) => tong + vatTuTheoTen[ten].gia * soLuong,
        0,
      );
      hoaDon = {
        create: {
          tien_cong: tienCong,
          tien_vat_tu: tienVatTu,
          tong_tien: tienCong + tienVatTu,
          trang_thai_thanh_toan: p.thanh_toan ?? "CON_NO",
          ngay_lap: ngayHoanThanh!,
        },
      };
      soHoaDon++;
    }

    // Phiếu đã qua bước "Bắt đầu sửa" (Đang làm / Hoàn thành) có ảnh trước;
    // phiếu Hoàn thành có thêm ảnh sau (đúng quy tắc nghiệp vụ)
    const dongAnh: { loai: "TRUOC" | "SAU"; url: string }[] = [];
    if (daHoanThanh || p.trang_thai === "DANG_LAM") {
      dongAnh.push({ loai: "TRUOC", url: ANH_TRUOC[i % ANH_TRUOC.length] });
    }
    if (daHoanThanh) {
      dongAnh.push({ loai: "SAU", url: ANH_SAU[i % ANH_SAU.length] });
    }

    await prisma.phieuViec.create({
      data: {
        khach_hang_id: khachIds[p.khach],
        tho_id: p.tho === null ? null : thoIds[p.tho],
        loai_su_co: p.loai_su_co,
        muc_do_uu_tien: p.muc_do_uu_tien,
        trang_thai: p.trang_thai,
        dia_chi: khach.dia_chi,
        ghi_chu: p.ghi_chu,
        ngay_tao: ngayTao,
        ngay_hoan_thanh: ngayHoanThanh,
        khong_dung_vat_tu: daHoanThanh && dongVatTu.length === 0,
        vat_tu_su_dung: { create: dongVatTu },
        hoa_don: hoaDon,
        anh_phieu_viec: { create: dongAnh },
      },
    });
    soAnh += dongAnh.length;
  }

  console.log("Đã nạp dữ liệu mẫu:");
  console.log(
    `  - Người dùng: 1 admin + ${thoMau.length} thợ (1 thợ đã ngừng hoạt động)`,
  );
  console.log(
    `  - Khách hàng: ${khachMau.length} (1 khách đã ngừng hoạt động)`,
  );
  console.log(`  - Vật tư: ${vatTuMau.length} (1 vật tư đã ngừng kinh doanh)`);
  console.log(`  - Phiếu việc: ${phieuMau.length}`);
  console.log(`  - Hóa đơn: ${soHoaDon}`);
  console.log(
    `  - Ảnh phiếu việc: ${soAnh} (file nằm ở public/uploads/seed-*.jpg)`,
  );
  console.log("Đăng nhập: admin.dienthuy@gmail.com / admin123");
  console.log(
    "           (thợ) tranvanhung@gmail.com, leminhtuan@gmail.com, nguyenhoanglong@gmail.com,",
  );
  console.log(
    "                 dangthanhphong@gmail.com, voducthinh@gmail.com / tho123",
  );
  console.log(
    "           phamquocbao@gmail.com là thợ đã nghỉ, không đăng nhập được.",
  );
  console.log(
    "Lưu ý: cần có 10 file public/uploads/seed-truoc-1..5.jpg và seed-sau-1..5.jpg (chạy doi-ten-anh.ps1).",
  );
  console.log(
    "Nhà thợ trong seed có sẵn tọa độ gần đúng; thợ Đặng Thanh Phong chưa có vị trí (để test).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
