"use client";

import { useState, useRef, useActionState, type FocusEvent } from "react";
import { taoPhieuViec } from "@/lib/actions/phieu-viec";
import { timToaDoTheoDiaChi } from "@/lib/actions/geocode";
import { docToaDo } from "@/lib/khoang-cach";
import { goiYThoGanNhat, type ThoGoiY } from "@/lib/goi-y-tho";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type KhachHang = { id: number; ten: string; sdt: string };
type Diem = { viDo: number; kinhDo: number };
type TrangThaiForm = Awaited<ReturnType<typeof taoPhieuViec>>;
type KetQuaTim = Awaited<ReturnType<typeof timToaDoTheoDiaChi>>;

export default function TaoPhieuViecForm({
  danhSachKhachHang,
  danhSachTho,
}: {
  danhSachKhachHang: KhachHang[];
  danhSachTho: ThoGoiY[];
}) {
  const [cheDoKhach, setCheDoKhach] = useState<"co_san" | "moi">("co_san");
  const [thoId, setThoId] = useState("");
  // Điểm sự cố: hệ thống tự tra từ "Địa chỉ sửa chữa".
  // Dùng cho gợi ý thợ + lưu vào phiếu (qua 2 trường ẩn vi_do, kinh_do)
  const [diem, setDiem] = useState<Diem | null>(null);

  // Nhớ địa chỉ vừa tra cùng kết quả (Promise): không tra lại khi địa chỉ không đổi,
  // và lúc bấm Tạo phiếu có thể đợi kết quả đang tra dở.
  const boNhoRef = useRef<{
    diaChi: string;
    ketQua: Promise<KetQuaTim>;
  } | null>(null);

  function traCuu(diaChi: string): Promise<KetQuaTim> {
    if (boNhoRef.current?.diaChi === diaChi) return boNhoRef.current.ketQua;
    const ketQua = timToaDoTheoDiaChi(diaChi).catch(
      (): KetQuaTim => ({ diem: null, apXi: false }),
    );
    boNhoRef.current = { diaChi, ketQua };
    return ketQua;
  }

  async function khiRoiODiaChi(e: FocusEvent<HTMLInputElement>) {
    const diaChi = e.target.value.trim();
    if (!diaChi || boNhoRef.current?.diaChi === diaChi) return;

    setDiem(null); // điểm cũ thuộc địa chỉ cũ, bỏ để khỏi lưu nhầm
    const ketQuaTim = traCuu(diaChi);
    const ketQua = await ketQuaTim;
    if (boNhoRef.current?.ketQua !== ketQuaTim) return; // địa chỉ đã đổi

    setDiem(ketQua.diem);
  }

  const [state, formAction, dangXuLy] = useActionState(
    async (truocDo: TrangThaiForm, formData: FormData) => {
      // Admin gõ địa chỉ xong bấm Enter/Tạo phiếu ngay (chưa kịp rời ô hoặc đang tra dở):
      // tra/đợi kết quả ở đây để phiếu vẫn có tọa độ.
      const diaChi = String(formData.get("dia_chi") ?? "").trim();
      if (diaChi) {
        const daTra = boNhoRef.current?.diaChi === diaChi;
        if (!daTra || !formData.get("vi_do")) {
          const ketQua = await traCuu(diaChi);
          formData.set("vi_do", ketQua.diem ? String(ketQua.diem.viDo) : "");
          formData.set("kinh_do", ketQua.diem ? String(ketQua.diem.kinhDo) : "");
        }
      }
      return taoPhieuViec(truocDo, formData);
    },
    {},
  );

  const diemSuCo = diem ? docToaDo(String(diem.viDo), String(diem.kinhDo)) : null;
  const goiY = diemSuCo ? goiYThoGanNhat(danhSachTho, diemSuCo).slice(0, 5) : [];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Tạo phiếu việc</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="che_do_khach" value={cheDoKhach} />

          <div>
            <Label>Khách hàng</Label>
            <div className="mt-1 flex gap-4 text-sm text-[var(--color-text)]">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={cheDoKhach === "co_san"}
                  onChange={() => setCheDoKhach("co_san")}
                />
                Khách có sẵn
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={cheDoKhach === "moi"}
                  onChange={() => setCheDoKhach("moi")}
                />
                Khách mới
              </label>
            </div>
          </div>

          {cheDoKhach === "co_san" ? (
            <div>
              <Label htmlFor="khach_hang_id">Chọn khách hàng</Label>
              <Select
                id="khach_hang_id"
                name="khach_hang_id"
                required
                className="mt-1"
              >
                <option value="">-- Chọn khách hàng --</option>
                {danhSachKhachHang.map((kh) => (
                  <option key={kh.id} value={kh.id}>
                    {kh.ten} — {kh.sdt}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="space-y-4 rounded border border-[var(--color-border)] p-4">
              <div>
                <Label htmlFor="khach_ten">Tên khách hàng mới</Label>
                <Input
                  id="khach_ten"
                  name="khach_ten"
                  type="text"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="khach_sdt">Số điện thoại</Label>
                <Input
                  id="khach_sdt"
                  name="khach_sdt"
                  type="tel"
                  required
                  pattern="0[35789][0-9]{8}"
                  maxLength={10}
                  title="Nhập đủ 10 số di động, đầu số 03, 05, 07, 08 hoặc 09"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="khach_dia_chi">Địa chỉ khách hàng</Label>
                <Input
                  id="khach_dia_chi"
                  name="khach_dia_chi"
                  type="text"
                  required
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="loai_su_co">Loại sự cố</Label>
            <Input
              id="loai_su_co"
              name="loai_su_co"
              type="text"
              required
              placeholder="VD: Rò rỉ ống nước, chập điện..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dia_chi">Địa chỉ sửa chữa</Label>
            <Input
              id="dia_chi"
              name="dia_chi"
              type="text"
              required
              onBlur={khiRoiODiaChi}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="muc_do_uu_tien">Mức độ ưu tiên</Label>
            <Select
              id="muc_do_uu_tien"
              name="muc_do_uu_tien"
              defaultValue="TRUNG_BINH"
              className="mt-1"
            >
              <option value="THAP">Thấp</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="CAO">Cao</option>
            </Select>
          </div>

          <input type="hidden" name="vi_do" value={diem ? String(diem.viDo) : ""} />
          <input type="hidden" name="kinh_do" value={diem ? String(diem.kinhDo) : ""} />

          {goiY.length > 0 && (
            <div className="space-y-3 rounded border border-[var(--color-border)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Gợi ý thợ gần nhất
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Khoảng cách tính từ nhà thợ, theo đường chim bay (ước lượng).
              </p>
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {goiY.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0 break-words">
                      <p className="font-medium text-[var(--color-text)]">
                        {t.ten} — {t.ban ? "Bận" : "Rảnh"}
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        {t.khoangCachKm === null
                          ? "Chưa xác định vị trí"
                          : `${t.khoangCachKm.toLocaleString("vi-VN", {
                              maximumFractionDigits: 1,
                            })} km`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={thoId === String(t.id)}
                      onClick={() => setThoId(String(t.id))}
                    >
                      {thoId === String(t.id) ? "Đã chọn" : "Chọn"}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Label htmlFor="tho_id">Gán thợ (có thể để sau)</Label>
            <Select
              id="tho_id"
              name="tho_id"
              value={thoId}
              onChange={(e) => setThoId(e.target.value)}
              className="mt-1"
            >
              <option value="">-- Chưa gán --</option>
              {danhSachTho.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten} — {t.ban ? "Bận" : "Rảnh"}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="ghi_chu">Ghi chú (tuỳ chọn)</Label>
            <textarea
              id="ghi_chu"
              name="ghi_chu"
              rows={3}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <Button type="submit" disabled={dangXuLy} className="w-full">
            {dangXuLy ? "Đang lưu..." : "Tạo phiếu việc"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
