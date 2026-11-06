import { tinhKhoangCachKm, type ToaDo } from "@/lib/khoang-cach";

export type ThoGoiY = {
  id: number;
  ten: string;
  ban: boolean;
  // Tọa độ nhà thợ; null = chưa xác định
  viDo: number | null;
  kinhDo: number | null;
};

export type KetQuaGoiY = ThoGoiY & {
  khoangCachKm: number | null; // null = thợ chưa có vị trí
};

/**
 * Xếp thợ theo thứ tự: rảnh trước bận → gần trước xa → chưa có vị trí xếp cuối.
 * Không loại thợ nào: Admin vẫn tự quyết (đúng quy ước "Rảnh/Bận không chặn gán").
 */
export function goiYThoGanNhat(
  danhSachTho: ThoGoiY[],
  diemSuCo: ToaDo,
): KetQuaGoiY[] {
  const ketQua: KetQuaGoiY[] = danhSachTho.map((t) => ({
    ...t,
    khoangCachKm:
      t.viDo !== null && t.kinhDo !== null
        ? tinhKhoangCachKm(diemSuCo, { viDo: t.viDo, kinhDo: t.kinhDo })
        : null,
  }));

  return ketQua.sort((a, b) => {
    if (a.ban !== b.ban) return a.ban ? 1 : -1;
    if (a.khoangCachKm !== null && b.khoangCachKm !== null)
      return a.khoangCachKm - b.khoangCachKm;
    if (a.khoangCachKm !== b.khoangCachKm) return a.khoangCachKm === null ? 1 : -1;
    return a.ten.localeCompare(b.ten, "vi");
  });
}
