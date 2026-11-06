import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import { capNhatVatTu } from "@/lib/actions/vat-tu";
import VatTuForm from "../VatTuForm";

export default async function SuaVatTuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vatTuId = docIdTrang(id);
  if (vatTuId === null) notFound();

  const vatTu = await prisma.vatTu.findUnique({ where: { id: vatTuId } });
  if (!vatTu) notFound();

  return (
    <VatTuForm
      tieuDe="Sửa vật tư"
      action={capNhatVatTu.bind(null, vatTu.id)}
      tonLucMo={vatTu.so_luong_ton}
      giaTri={{
        ten: vatTu.ten,
        don_vi: vatTu.don_vi,
        so_luong_ton: vatTu.so_luong_ton,
        gia: Number(vatTu.gia),
      }}
    />
  );
}
