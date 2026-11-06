import { yeuCauDangNhap } from "@/lib/api/kiem-quyen";
import { xuLyLoi } from "@/lib/api/phan-hoi";
import { docBoLoc, layDuLieuBaoCao, NGUONG_SAP_HET } from "@/lib/bao-cao";
import { taoExcelBaoCao } from "@/lib/excel/bao-cao";

// exceljs cần runtime Node.
export const runtime = "nodejs";

// GET /api/v1/bao-cao/xuat-excel?tu=&den=&tho= — xuất Excel đúng bộ lọc đang xem (chỉ Admin).
// Tham số giống trang Báo cáo (docBoLoc): không có tham số = cả năm hiện tại;
// tham số rỗng (?tu=&den=) = không giới hạn; sai định dạng = mặc định.
export async function GET(req: Request) {
  try {
    await yeuCauDangNhap(["ADMIN"]);

    const thamSo = Object.fromEntries(new URL(req.url).searchParams);
    const { boLoc } = docBoLoc(thamSo);
    const duLieu = await layDuLieuBaoCao(boLoc);
    const file = await taoExcelBaoCao(boLoc, duLieu, NGUONG_SAP_HET);

    const ten = `bao-cao_${boLoc.tu ?? "dau"}_${boLoc.den ?? "nay"}.xlsx`;
    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${ten}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (loi) {
    return xuLyLoi(loi);
  }
}
