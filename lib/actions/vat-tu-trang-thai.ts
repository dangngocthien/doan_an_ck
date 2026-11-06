"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function laAdmin(): Promise<boolean> {
  const session = await auth();
  return (session?.user as { vai_tro?: string } | undefined)?.vai_tro === "ADMIN";
}

async function datTrangThaiVatTu(vatTuId: number, dangHoatDong: boolean) {
  if (!(await laAdmin())) return;
  if (!Number.isInteger(vatTuId) || vatTuId <= 0) return;
  await prisma.vatTu.updateMany({
    where: { id: vatTuId },
    data: { dang_hoat_dong: dangHoatDong },
  });
  revalidatePath("/admin/vat-tu");
}

export async function ngungDungVatTu(vatTuId: number): Promise<void> {
  await datTrangThaiVatTu(vatTuId, false);
}

export async function kichHoatLaiVatTu(vatTuId: number): Promise<void> {
  await datTrangThaiVatTu(vatTuId, true);
}
