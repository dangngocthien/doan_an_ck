import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GhiVatTuForm from "./GhiVatTuForm";
import KhongDungVatTuForm from "./KhongDungVatTuForm";
import XoaVatTuButton from "./XoaVatTuButton";

export default async function KhuVatTu({
  phieuViecId,
  trangThai,
  khongDungVatTu,
}: {
  phieuViecId: number;
  trangThai: string;
  khongDungVatTu: boolean;
}) {
  const choGhi = trangThai === "DANG_LAM";

  const [daDung, danhMuc] = await Promise.all([
    prisma.vatTuSuDung.findMany({
      where: { phieu_viec_id: phieuViecId },
      include: { vat_tu: { select: { ten: true, don_vi: true } } },
      orderBy: { id: "asc" },
    }),
    choGhi
      ? prisma.vatTu.findMany({
          where: { so_luong_ton: { gt: 0 }, dang_hoat_dong: true },
          select: { id: true, ten: true, don_vi: true, so_luong_ton: true },
          orderBy: { ten: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <Card className="mx-auto mt-4 max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Vật tư đã dùng</CardTitle>
      </CardHeader>
      <CardContent>
        {daDung.length === 0 ? (
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            {khongDungVatTu
              ? "Ca này không dùng vật tư."
              : "Chưa ghi vật tư nào."}
          </p>
        ) : (
          <ul className="mb-3 divide-y divide-[var(--color-border)] text-sm">
            {daDung.map((d) => (
              <li key={d.id} className="flex justify-between gap-3 py-2">
                <span className="break-words">{d.vat_tu.ten}</span>
                <span className="flex shrink-0 items-start gap-2">
                  <span className="py-1 font-medium">
                    {d.so_luong} {d.vat_tu.don_vi}
                  </span>
                  {choGhi && (
                    <XoaVatTuButton
                      phieuViecId={phieuViecId}
                      dongId={d.id}
                      ten={d.vat_tu.ten}
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {choGhi ? (
          <>
            <GhiVatTuForm phieuViecId={phieuViecId} danhMuc={danhMuc} />
            {daDung.length === 0 && (
              <KhongDungVatTuForm
                phieuViecId={phieuViecId}
                daChon={khongDungVatTu}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Chỉ ghi được vật tư khi phiếu ở trạng thái Đang làm.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
