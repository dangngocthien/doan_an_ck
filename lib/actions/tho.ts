"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { chuanHoaSdt, LOI_SDT } from "@/lib/chuan-hoa-sdt";
import { timToaDoTuDiaChi } from "@/lib/geocode";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Kiểm tra người gọi là ADMIN (middleware chỉ chặn route, không chặn gọi trực tiếp Server Action)
async function laAdmin() {
  const session = await auth();
  return (session?.user as { vai_tro?: string } | undefined)?.vai_tro === "ADMIN";
}

const LOI_KHONG_CO_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

const DO_DAI_DIA_CHI_NHA = 191; // bằng cột nguoi_dung.dia_chi
const LOI_DIA_CHI_DAI = `Địa chỉ nhà tối đa ${DO_DAI_DIA_CHI_NHA} ký tự.`;

// Địa chỉ nhà thợ từ form: bỏ khoảng trắng thừa, để trống = null
function docDiaChiNha(formData: FormData): string | null {
  const diaChi = String(formData.get("dia_chi") ?? "").trim();
  return diaChi === "" ? null : diaChi;
}

export type TrangThaiFormTho = { error?: string };

export async function taoTho(
  _prevState: TrangThaiFormTho,
  formData: FormData
): Promise<TrangThaiFormTho> {
  if (!(await laAdmin())) return { error: LOI_KHONG_CO_QUYEN };
  const ten = formData.get("ten") as string;
  const sdt = formData.get("sdt") as string;
  const email = formData.get("email") as string;
  const matKhau = formData.get("mat_khau") as string;
  const diaChiNha = docDiaChiNha(formData);

  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan) {
    return { error: LOI_SDT };
  }
  if (diaChiNha && diaChiNha.length > DO_DAI_DIA_CHI_NHA) {
    return { error: LOI_DIA_CHI_DAI };
  }

  const matKhauHash = await bcrypt.hash(matKhau, 10);

  // Tra không ra vẫn lưu thợ (vi_do/kinh_do = null), không chặn thao tác
  const viTri = diaChiNha ? (await timToaDoTuDiaChi(diaChiNha)).diem : null;

  try {
    await prisma.nguoiDung.create({
      data: {
        ten,
        sdt: sdtChuan,
        email,
        mat_khau_hash: matKhauHash,
        vai_tro: "THO",
        dia_chi: diaChiNha,
        vi_do: viTri?.viDo ?? null,
        kinh_do: viTri?.kinhDo ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Email này đã được sử dụng, vui lòng chọn email khác." };
    }
    throw err;
  }

  revalidatePath("/admin/tho");
  redirect("/admin/tho");
}

export async function capNhatTho(
  id: number,
  _prevState: TrangThaiFormTho,
  formData: FormData
): Promise<TrangThaiFormTho> {
  if (!(await laAdmin())) return { error: LOI_KHONG_CO_QUYEN };
  const ten = formData.get("ten") as string;
  const sdt = formData.get("sdt") as string;
  const email = formData.get("email") as string;
  const diaChiNha = docDiaChiNha(formData);

  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan) {
    return { error: LOI_SDT };
  }
  if (diaChiNha && diaChiNha.length > DO_DAI_DIA_CHI_NHA) {
    return { error: LOI_DIA_CHI_DAI };
  }

  const hienTai = await prisma.nguoiDung.findFirst({
    where: { id, vai_tro: "THO" },
    select: { dia_chi: true, vi_do: true, kinh_do: true },
  });
  if (!hienTai) return { error: "Không tìm thấy thợ." };

  // Chỉ tra lại khi địa chỉ đổi hoặc thợ chưa có tọa độ; địa chỉ không đổi thì giữ nguyên tọa độ.
  // Tra không ra thì xóa tọa độ cũ (thuộc địa chỉ cũ) để không gợi ý theo nhà cũ.
  let viTri: { vi_do?: number | null; kinh_do?: number | null } = {};
  const doiDiaChi = diaChiNha !== hienTai.dia_chi;
  const thieuToaDo = hienTai.vi_do === null || hienTai.kinh_do === null;
  if (diaChiNha === null) {
    if (doiDiaChi) viTri = { vi_do: null, kinh_do: null };
  } else if (doiDiaChi || thieuToaDo) {
    const diem = (await timToaDoTuDiaChi(diaChiNha)).diem;
    viTri = { vi_do: diem?.viDo ?? null, kinh_do: diem?.kinhDo ?? null };
  }

  try {
    await prisma.nguoiDung.update({
      where: { id },
      data: { ten, sdt: sdtChuan, email, dia_chi: diaChiNha, ...viTri },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Email này đã được sử dụng, vui lòng chọn email khác." };
    }
    throw err;
  }

  revalidatePath("/admin/tho");
  redirect("/admin/tho");
}

export async function ngungHoatDongTho(id: number) {
  if (!(await laAdmin())) throw new Error(LOI_KHONG_CO_QUYEN);
  await prisma.nguoiDung.update({
    where: { id },
    data: { dang_hoat_dong: false },
  });

  revalidatePath("/admin/tho");
  redirect("/admin/tho");
}
