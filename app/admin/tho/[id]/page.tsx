import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { docIdTrang } from "@/lib/doc-id";
import { capNhatTho, ngungHoatDongTho } from "@/lib/actions/tho";
import SuaThoForm from "./SuaThoForm";

export default async function SuaThoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thoId = docIdTrang(id);
  if (thoId === null) {
    notFound();
  }

  const tho = await prisma.nguoiDung.findFirst({
    where: { id: thoId, vai_tro: "THO" },
    // Chỉ lấy trường form cần: không đưa mat_khau_hash, tọa độ xuống trình duyệt
    select: {
      id: true,
      ten: true,
      sdt: true,
      email: true,
      dia_chi: true,
      vi_do: true,
      kinh_do: true,
    },
  });

  if (!tho) {
    notFound();
  }

  const capNhatVoiId = capNhatTho.bind(null, tho.id);
  const ngungHoatDongVoiId = ngungHoatDongTho.bind(null, tho.id);

  return (
    <SuaThoForm
      tho={{
        id: tho.id,
        ten: tho.ten,
        sdt: tho.sdt,
        email: tho.email,
        dia_chi: tho.dia_chi,
        co_vi_tri: tho.vi_do !== null && tho.kinh_do !== null,
      }}
      capNhatAction={capNhatVoiId}
      ngungHoatDongAction={ngungHoatDongVoiId}
    />
  );
}
