// Tính khoảng cách đường chim bay giữa 2 tọa độ (công thức Haversine).
// Hàm thuần, không phụ thuộc Prisma/Next → dùng được cả server lẫn client, dễ test.

const BAN_KINH_TRAI_DAT_KM = 6371;

export type ToaDo = { viDo: number; kinhDo: number };

function radian(doDo: number) {
  return (doDo * Math.PI) / 180;
}

/** Khoảng cách (km) đường chim bay giữa a và b. */
export function tinhKhoangCachKm(a: ToaDo, b: ToaDo): number {
  const dViDo = radian(b.viDo - a.viDo);
  const dKinhDo = radian(b.kinhDo - a.kinhDo);
  const h =
    Math.sin(dViDo / 2) ** 2 +
    Math.cos(radian(a.viDo)) *
      Math.cos(radian(b.viDo)) *
      Math.sin(dKinhDo / 2) ** 2;
  return 2 * BAN_KINH_TRAI_DAT_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Tọa độ hợp lệ: số hữu hạn, vĩ độ [-90, 90], kinh độ [-180, 180]. */
export function laToaDoHopLe(viDo: unknown, kinhDo: unknown): boolean {
  return (
    typeof viDo === "number" &&
    typeof kinhDo === "number" &&
    Number.isFinite(viDo) &&
    Number.isFinite(kinhDo) &&
    viDo >= -90 &&
    viDo <= 90 &&
    kinhDo >= -180 &&
    kinhDo <= 180
  );
}

/** Đọc 2 ô nhập (chuỗi) thành tọa độ; trả null nếu trống hoặc không hợp lệ. */
export function docToaDo(viDo: string, kinhDo: string): ToaDo | null {
  if (viDo.trim() === "" || kinhDo.trim() === "") return null;
  const v = Number(viDo.replace(",", "."));
  const k = Number(kinhDo.replace(",", "."));
  return laToaDoHopLe(v, k) ? { viDo: v, kinhDo: k } : null;
}
