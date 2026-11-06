"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as vatTuService from "@/lib/services/vat-tu";
import type { KetQuaHanhDong } from "@/lib/actions/tho-phieu-viec";

async function laAdmin() {
  const session = await auth();
  return (
    (session?.user as { vai_tro?: string } | undefined)?.vai_tro === "ADMIN"
  );
}

function docForm(formData: FormData) {
  return {
    ten: formData.get("ten"),
    don_vi: formData.get("don_vi"),
    so_luong_ton: formData.get("so_luong_ton"),
    gia: formData.get("gia"),
  };
}

export async function taoVatTu(
  _prev: KetQuaHanhDong,
  formData: FormData,
): Promise<KetQuaHanhDong> {
  if (!(await laAdmin())) return { error: "Không có quyền thực hiện." };

  try {
    await vatTuService.taoVatTu(docForm(formData));
  } catch (loi) {
    if (loi instanceof LoiNghiepVu) return { error: loi.message };
    throw loi;
  }

  revalidatePath("/admin/vat-tu");
  redirect("/admin/vat-tu"); // ngoài try/catch vì redirect hoạt động bằng cách ném lỗi
}

export async function capNhatVatTu(
  id: number,
  _prev: KetQuaHanhDong,
  formData: FormData,
): Promise<KetQuaHanhDong> {
  if (!(await laAdmin())) return { error: "Không có quyền thực hiện." };

  try {
    await vatTuService.capNhatVatTu(
      id,
      docForm(formData),
      formData.get("ton_luc_mo"),
    );
  } catch (loi) {
    if (loi instanceof LoiNghiepVu) return { error: loi.message };
    throw loi;
  }

  revalidatePath("/admin/vat-tu");
  redirect("/admin/vat-tu");
}
