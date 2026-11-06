import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { xuLyLoi } from "@/lib/api/phan-hoi";
import { docBoLoc, layDuLieuBaoCao, NGUONG_SAP_HET } from "@/lib/bao-cao";
import { taoPdfBaoCao } from "@/lib/pdf/bao-cao";

// pdfkit đọc file font/dữ liệu lúc chạy => bắt buộc runtime Node.
export const runtime = "nodejs";

// GET /api/v1/bao-cao/xuat-pdf?tu=&den=&tho= — xuất PDF đúng bộ lọc đang xem (chỉ Admin).
// Tham số giống trang Báo cáo và file Excel (docBoLoc).
export async function GET(req: Request) {
  try {
    await yeuCauDangNhap(["ADMIN"]);

    const thamSo = Object.fromEntries(new URL(req.url).searchParams);
    const { boLoc } = docBoLoc(thamSo);
    const duLieu = await layDuLieuBaoCao(boLoc);
    const file = await taoPdfBaoCao(boLoc, duLieu, NGUONG_SAP_HET);

    const ten = `bao-cao_${boLoc.tu ?? "dau"}_${boLoc.den ?? "nay"}.pdf`;
    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ten}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
