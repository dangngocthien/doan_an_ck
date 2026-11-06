"use server";

import { auth } from "@/auth";
import { timToaDoTuDiaChi } from "@/lib/geocode";

// Chỉ Admin được tra (tránh người ngoài đốt hạn mức key)
async function laAdmin() {
  const session = await auth();
  const nguoiDung = session?.user as { vai_tro?: string } | undefined;
  return nguoiDung?.vai_tro === "ADMIN";
}

export async function timToaDoTheoDiaChi(diaChi: string) {
  if (!(await laAdmin())) return { diem: null, apXi: false };
  return timToaDoTuDiaChi(String(diaChi));
}
