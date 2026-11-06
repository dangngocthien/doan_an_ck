import "server-only";

// Tra địa chỉ -> tọa độ bằng Geoapify. Chỉ chạy ở server (key nằm trong .env, không lộ ra trình duyệt).
// Muốn đổi nhà cung cấp (Goong, LocationIQ...) thì chỉ sửa file này, giữ nguyên chữ ký hàm.

export type DiemToaDo = { viDo: number; kinhDo: number };

// apXi = true: chỉ chính xác đến mức đường/khu vực (không khớp số nhà)
export type KetQuaTimDiaChi = { diem: DiemToaDo | null; apXi: boolean };

// ---- Khu vực hoạt động của cửa hàng (đổi sang thành phố khác thì chỉ sửa 2 hằng số này) ----
// Kết quả nằm ngoài vòng tròn bị Geoapify loại hẳn: địa chỉ không rõ sẽ báo "không thấy"
// thay vì bị tra nhầm sang nơi khác (đã gặp thật: địa chỉ ở Quận 1 bị tra ra Đà Lạt).
const TAM_KHU_VUC = { kinhDo: 106.7009, viDo: 10.7769 }; // TP.HCM
const BAN_KINH_KHU_VUC_M = 50_000;

const URL_TIM_DIA_CHI = "https://api.geoapify.com/v1/geocode/search";
// Các lần thử chạy song song nên tổng thời gian chờ không quá mức này
const THOI_GIAN_CHO_MS = 5000;
// Geoapify thiếu dữ liệu số nhà/đường ở Việt Nam, khi không khớp nó đoán sang nơi khác
// với độ tin cậy rất thấp (đã gặp: 0,02–0,06). Dưới ngưỡng này thì bỏ kết quả, thử cách viết kế tiếp.
const DO_TIN_CAY_TOI_THIEU = 0.25;
const DO_DAI_TOI_DA = 191; // bằng cột dia_chi trong DB

// Chỉ nhận kết quả đủ cụ thể để so khoảng cách thợ. Kết quả cấp thành phố/tỉnh/quốc gia bị bỏ.
const LOAI_CHINH_XAC = new Set(["building", "amenity"]);
const LOAI_CHAP_NHAN = new Set([
  ...LOAI_CHINH_XAC,
  "street",
  "suburb",
  "district",
]);

const KHONG_THAY: KetQuaTimDiaChi = { diem: null, apXi: false };

// Đoạn địa chỉ là đơn vị hành chính: "P4", "P.4", "Phường Bến Nghé", "Q.1", "Quận 5", "TP.HCM"...
// Tên phường/quận hay đổi và viết tắt đủ kiểu nên ta thử thêm bản không có chúng.
const DOAN_HANH_CHINH =
  /^(p\.?\s*\d|q\.?\s*\d|f\.?\s*\d|phường|xã|quận|huyện|thị xã|thị trấn|tx\.|tt\.|h\.|tp\.?|thành phố|tỉnh|hồ chí minh|tphcm|hcm|sài gòn|sai gon|việt nam|vietnam)/i;

// "227 Nguyễn Văn Cừ" -> "Nguyễn Văn Cừ"; "Số 12/3 Lê Lợi" -> "Lê Lợi"
function boSoNha(diaChi: string): string {
  return diaChi
    .replace(/^\s*(số\s*)?\d+[a-zA-Z]?([/-]\d+[a-zA-Z]?)*\s*,?\s*/i, "")
    .trim();
}

// "12 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM" -> "Phường Bến Nghé, Quận 1, TP.HCM"
// (từ đoạn hành chính đầu tiên trở đi; không có đoạn hành chính thì trả "")
function phanHanhChinh(diaChi: string): string {
  const cacDoan = diaChi.split(",").map((d) => d.trim()).filter(Boolean);
  const viTri = cacDoan.findIndex((d, i) => i > 0 && DOAN_HANH_CHINH.test(d));
  return viTri === -1 ? "" : cacDoan.slice(viTri).join(", ");
}

// Các cách viết để thử lần lượt: nguyên văn → bỏ số nhà (giữ phường/quận) → chỉ phường/quận.
// Không thử riêng tên đường (tên đường trùng ở nhiều quận, dễ tra nhầm vài km).
function cacLanThu(goc: string): { text: string; boSoNha: boolean }[] {
  const ds: { text: string; boSoNha: boolean }[] = [];
  const them = (text: string, coBoSoNha: boolean) => {
    const t = text.trim();
    if (t.length >= 5 && !ds.some((d) => d.text === t)) {
      ds.push({ text: t, boSoNha: coBoSoNha });
    }
  };

  const hanhChinh = phanHanhChinh(goc);
  them(goc, false);
  if (hanhChinh) {
    them(boSoNha(goc), true);
    them(hanhChinh, true);
  }
  return ds;
}

async function goiGeoapify(
  text: string,
  apiKey: string,
): Promise<{ diem: DiemToaDo; loai: string; doTinCay: number | null } | null> {
  const url = new URL(URL_TIM_DIA_CHI);
  url.searchParams.set("text", text);
  url.searchParams.set(
    "filter",
    `circle:${TAM_KHU_VUC.kinhDo},${TAM_KHU_VUC.viDo},${BAN_KINH_KHU_VUC_M}|countrycode:vn`,
  );
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(THOI_GIAN_CHO_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    // Ném lỗi (429 = vượt hạn mức, 401 = sai key...) để không gọi thêm lần nữa. Không đưa URL vào lỗi vì URL chứa key.
    throw new Error(`Geoapify trả HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    results?: {
      lat?: unknown;
      lon?: unknown;
      result_type?: unknown;
      rank?: { confidence?: unknown };
    }[];
  };
  const kq = json.results?.[0];
  if (!kq || typeof kq.lat !== "number" || typeof kq.lon !== "number") {
    return null;
  }
  if (Math.abs(kq.lat) > 90 || Math.abs(kq.lon) > 180) return null;

  const loai = typeof kq.result_type === "string" ? kq.result_type : "unknown";
  if (!LOAI_CHAP_NHAN.has(loai)) return null; // quá chung (cấp thành phố/tỉnh...)

  const doTinCay =
    typeof kq.rank?.confidence === "number" ? kq.rank.confidence : null;
  if (doTinCay !== null && doTinCay < DO_TIN_CAY_TOI_THIEU) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[geocode] bỏ kết quả độ tin cậy thấp (${doTinCay.toFixed(2)}) cho: "${text}"`,
      );
    }
    return null;
  }

  const lamTron = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    diem: { viDo: lamTron(kq.lat), kinhDo: lamTron(kq.lon) },
    loai,
    doTinCay,
  };
}

// Không bao giờ ném lỗi: mọi sự cố (mất mạng, hết hạn mức, địa chỉ lạ) đều trả "không thấy"
// để form tạo phiếu vẫn dùng được.
export async function timToaDoTuDiaChi(
  diaChi: string,
): Promise<KetQuaTimDiaChi> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.warn("[geocode] Thiếu GEOAPIFY_API_KEY trong .env");
    return KHONG_THAY;
  }

  const goc = diaChi.trim();
  if (!goc || goc.length > DO_DAI_TOI_DA) return KHONG_THAY;

  try {
    const lanThu = cacLanThu(goc);
    // Gọi cả các cách viết cùng lúc (tra lần lượt có thể mất ~10 giây mỗi lần khi dịch vụ chậm),
    // rồi xét kết quả theo thứ tự ưu tiên: chi tiết nhất trước. Lần nào lỗi/quá giờ thì coi như không có.
    const cacKetQua = lanThu.map((l) =>
      goiGeoapify(l.text, apiKey).catch((loi) => {
        console.error(
          "[geocode] Lỗi khi tra địa chỉ:",
          loi instanceof Error ? loi.message : "không rõ",
        );
        return null;
      }),
    );
    for (let i = 0; i < lanThu.length; i++) {
      const kq = await cacKetQua[i];
      if (!kq) continue;

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[geocode] khớp ở lần thử ${i + 1}/${lanThu.length}: "${lanThu[i].text}" (loại: ${kq.loai}, độ tin cậy: ${kq.doTinCay?.toFixed(2) ?? "?"})`,
        );
      }
      return {
        diem: kq.diem,
        apXi: lanThu[i].boSoNha || !LOAI_CHINH_XAC.has(kq.loai),
      };
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[geocode] không có kết quả trong khu vực cho: "${goc}" (đã thử ${lanThu.length} cách viết)`,
      );
    }
    return KHONG_THAY;
  } catch (loi) {
    console.error(
      "[geocode] Lỗi khi tra địa chỉ:",
      loi instanceof Error ? loi.message : "không rõ",
    );
    return KHONG_THAY;
  }
}
