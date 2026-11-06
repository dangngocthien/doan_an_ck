import { prisma } from "@/lib/prisma";
import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { traLoi, xuLyLoi } from "@/lib/api/phan-hoi";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import { taoPdfHoaDon } from "@/lib/pdf/hoa-don";

// pdfkit đọc file font/dữ liệu lúc chạy => bắt buộc runtime Node.
export const runtime = "nodejs";

// GET /api/v1/hoa-don/{id}/pdf — tải hóa đơn PDF (chỉ Admin).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await yeuCauDangNhap(["ADMIN"]);

    const { id: idRaw } = await params;
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0)
      throw new LoiNghiepVu("Mã hóa đơn không hợp lệ.", 400);

    const hoaDon = await prisma.hoaDon.findUnique({
      where: { id },
      include: {
        phieu_viec: {
          include: {
            khach_hang: true,
            tho: { select: { id: true, ten: true } },
          },
        },
      },
    });
    if (!hoaDon) throw new LoiNghiepVu("Không tìm thấy hóa đơn.", 404);

    const dongVatTu = await prisma.vatTuSuDung.findMany({
      where: { phieu_viec_id: hoaDon.phieu_viec_id },
      include: { vat_tu: true },
      orderBy: { id: "asc" },
    });

    const phieu = hoaDon.phieu_viec;
    const pdf = await taoPdfHoaDon({
      id: hoaDon.id,
      ngayLap: hoaDon.ngay_lap,
      daThu: hoaDon.trang_thai_thanh_toan === "DA_THU",
      khachTen: phieu.khach_hang.ten,
      khachSdt: phieu.khach_hang.sdt,
      suCo: phieu.loai_su_co,
      thoTen: phieu.tho ? phieu.tho.ten : null,
      phieuId: phieu.id,
      vatTu: dongVatTu.map((d) => ({
        ten: d.vat_tu.ten,
        soLuong: d.so_luong,
        donVi: d.vat_tu.don_vi,
      })),
      tienCong: Number(hoaDon.tien_cong),
      tienVatTu: Number(hoaDon.tien_vat_tu),
      tongTien: Number(hoaDon.tong_tien),
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hoa-don-${hoaDon.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (loi) {
    // Lỗi trả JSON giống các route API khác (401/403/400/404/500).
    return xuLyLoi(loi);
  }
}
