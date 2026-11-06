import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import { capNhatPhieuViec } from "@/lib/actions/phieu-viec";
import SuaPhieuViecForm from "./SuaPhieuViecForm";

function dinhDangTien(soTien: number) {
  return soTien.toLocaleString("vi-VN") + " ₫";
}

export default async function SuaPhieuViecPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const phieuViecId = docIdTrang(id);
  if (phieuViecId === null) {
    notFound();
  }

  const [phieuViec, danhSachTho, danhSachVatTu, danhSachAnh] =
    await Promise.all([
      prisma.phieuViec.findUnique({
        where: { id: phieuViecId },
        include: { khach_hang: true },
      }),
      prisma.nguoiDung.findMany({
        where: { vai_tro: "THO", dang_hoat_dong: true },
        select: { id: true, ten: true },
        orderBy: { ten: "asc" },
      }),
      prisma.vatTuSuDung.findMany({
        where: { phieu_viec_id: phieuViecId },
        include: { vat_tu: true },
        orderBy: { id: "asc" },
      }),
      prisma.anhPhieuViec.findMany({
        where: { phieu_viec_id: phieuViecId },
        orderBy: { id: "asc" },
      }),
    ]);

  if (!phieuViec) {
    notFound();
  }

  const capNhatVoiId = capNhatPhieuViec.bind(null, phieuViec.id);

  // gia là Decimal -> đổi sang số thường trước khi tính
  const dongVatTu = danhSachVatTu.map((dong) => {
    const donGia = Number(dong.vat_tu.gia);
    return {
      id: dong.id,
      ten: dong.vat_tu.ten,
      donVi: dong.vat_tu.don_vi,
      soLuong: dong.so_luong,
      donGia,
      thanhTien: donGia * dong.so_luong,
    };
  });
  const tongTienVatTu = dongVatTu.reduce(
    (tong, dong) => tong + dong.thanhTien,
    0,
  );

  const nhomAnh = [
    {
      tieuDe: "Trước khi làm",
      danhSach: danhSachAnh.filter((anh) => anh.loai === "TRUOC"),
    },
    {
      tieuDe: "Sau khi làm",
      danhSach: danhSachAnh.filter((anh) => anh.loai === "SAU"),
    },
  ];

  return (
    <>
      <SuaPhieuViecForm
        phieuViec={phieuViec}
        danhSachTho={danhSachTho}
        capNhatAction={capNhatVoiId}
      />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-primary)]">
          Vật tư đã dùng
        </h2>

        {dongVatTu.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            {phieuViec.khong_dung_vat_tu
              ? "Thợ xác nhận ca này không dùng vật tư."
              : "Chưa ghi vật tư."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm text-[var(--color-text)]">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-primary)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Vật tư</th>
                  <th className="px-3 py-2 text-right font-medium">Số lượng</th>
                  <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {dongVatTu.map((dong) => (
                  <tr
                    key={dong.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-3 py-2">{dong.ten}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {dong.soLuong} {dong.donVi}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {dinhDangTien(dong.donGia)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {dinhDangTien(dong.thanhTien)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)] font-semibold">
                  <td className="px-3 py-2" colSpan={3}>
                    Tổng tiền vật tư
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {dinhDangTien(tongTienVatTu)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-primary)]">
          Ảnh hiện trường
        </h2>

        <div className="space-y-5">
          {nhomAnh.map((nhom) => (
            <div key={nhom.tieuDe}>
              <h3 className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {nhom.tieuDe}
              </h3>

              {nhom.danhSach.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Chưa có ảnh.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {nhom.danhSach.map((anh) => (
                    <a
                      key={anh.id}
                      href={anh.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={anh.url}
                        alt={nhom.tieuDe}
                        loading="lazy"
                        className="aspect-square w-full rounded-md border border-[var(--color-border)] object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
