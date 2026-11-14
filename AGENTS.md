<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:du-an -->

# Dự án: quản lý dịch vụ sửa chữa điện nước (đồ án tốt nghiệp)

Đọc file này trước, KHÔNG quét cả repo. Cần thêm: `README.md` (cài đặt, tiến độ), `docs/api.md` (REST), `prisma/schema.prisma` (dữ liệu, 182 dòng). **Đừng đọc `prisma/seed.ts` (915 dòng)** trừ khi sửa dữ liệu mẫu.

## Nghiệp vụ
- 2 vai trò: **ADMIN** (phiếu, thợ, khách, vật tư, hóa đơn, báo cáo) và **THO** (xem phiếu được giao, đổi trạng thái, chụp ảnh, ghi vật tư). Khách KHÔNG đăng nhập; Admin tạo phiếu thay.
- Phiếu việc: `MOI → DANG_DI → DANG_LAM → HOAN_THANH`, hoặc `DA_HUY`. Hóa đơn có trạng thái riêng `CON_NO | DA_THU` (đừng nhầm với trạng thái phiếu). 1 phiếu = 1 hóa đơn.
- Ảnh: `TRUOC` chụp ở bước DANG_DI, `SAU` ở DANG_LAM (`lib/anh-phieu-viec.ts`); cần ≥1 ảnh TRUOC để sang DANG_LAM, ≥1 ảnh SAU + vật tư (hoặc "không dùng vật tư") để HOAN_THANH. Admin chỉ xem ảnh.
- "Xóa" = soft delete `dang_hoat_dong` (khách, thợ, vật tư); phiếu dùng `DA_HUY`, không xóa cứng. Rảnh/bận của thợ tính từ phiếu DANG_DI/DANG_LAM, không có cột DB, chỉ để tham khảo.

## Quy tắc làm việc
- Nghĩ trước, nêu giả định. Code tối thiểu, sửa đúng chỗ; việc ngoài yêu cầu thì nói rõ. Thiếu file thì hỏi, không đoán.
- Kiểm tra sau mỗi thay đổi: `npx tsc --noEmit` và `npx eslint app components lib`. `npm run build` cần DB + mạng (font Google).
- Người dùng chạy Windows PowerShell: không có `grep`/`sed` (dùng `Select-String`); đường dẫn có `[ ]` dùng `-LiteralPath`. Lệnh/ví dụ đưa cho họ phải là PowerShell, dùng giá trị thật.
- Tên biến/hàm/component **tiếng Việt không dấu**. Alias `@/` = gốc project (không có `src/`). Không dán key/mật khẩu vào chat/commit.

## Công nghệ (đã khóa)
Next.js 16.3.5 (App Router, Turbopack, React 19) · TypeScript · Tailwind v4 (1 theme sáng) · MariaDB + **Prisma 7.10** (adapter `@prisma/adapter-mariadb`; schema `prisma/schema.prisma`; config `prisma7.config.ts`; client sinh ra ở `generated/prisma`, **có commit**) · NextAuth v5 beta (Credentials, JWT, bcryptjs) · pdfkit, exceljs, recharts · Geoapify (geocode).

## Bản đồ
- `app/admin/{khach-hang,tho,phieu-viec,vat-tu,hoa-don,bao-cao}/`: `page.tsx` (danh sách), `BoLocXxx.tsx` (bộ lọc), `moi/`, `[id]/`, form riêng. `app/admin/layout.tsx` bọc `components/admin/AdminKhung`.
- `app/tho/{phieu-viec,phieu-viec/[id],ho-so}/`: khu Thợ, mobile-first. `app/login`, `app/page.tsx` (điều hướng theo vai trò).
- `app/api/v1/**/route.ts`: REST (11 endpoint + 3 route tải file; đăng nhập qua NextAuth). `app/api/auth/[...nextauth]`.
- `middleware.ts` (chặn theo `vai_tro`; matcher `/admin`, `/tho`), `auth.config.ts` (nhẹ, có `trustHost: true`), `auth.ts` (Prisma + bcrypt).
- `lib/actions/*`: Server Action. `lib/services/*`: nghiệp vụ + Prisma. `lib/api/*`: helper REST. `lib/pdf/*`, `lib/excel/*`: xuất file. `lib/{bao-cao,goi-y-tho,khoang-cach,geocode,phan-trang,chuan-hoa-sdt,doc-id,dinh-dang-tien,anh-phieu-viec,prisma,utils}.ts`.
- `components/ui/*` (Button `outline|danger`, Input, Label, Card, Table, Select), `components/admin/{AdminKhung,AdminSidebar,PhanTrang,NhanTrangThai,HopThoai}.tsx`, `components/tho/ThoDieuHuong.tsx`.
- `assets/fonts/` (TTF cho PDF), `docs/api.md`, `public/uploads/` (ảnh upload; chỉ `seed-*` là ảnh mẫu).

## Khuôn mẫu bắt buộc theo
- **Service layer:** `lib/services/*.ts` không `"use server"`, không `FormData`/`redirect`/`revalidatePath`; lỗi nghiệp vụ ném `LoiNghiepVu(message, status)` (400/403/404/409). Server Action (`lib/actions/*`) mỏng: kiểm quyền → đọc FormData → gọi `import * as xService` → bắt `LoiNghiepVu` thành `{ error }` → `revalidatePath` + `redirect`. Admin action tự kiểm bằng `laAdmin()` khai báo riêng từng file. **Chưa tách service:** `actions/{khach-hang,tho,vat-tu-trang-thai,geocode}`, `taiAnh/xoaAnh` trong `tho-phieu-viec`.
- **REST:** mỗi route tự `await yeuCauDangNhap([...])` (middleware không chặn `/api`), khuôn `try { ...; return thanhCong(...) } catch (loi) { return xuLyLoi(loi) }`. Trả dữ liệu bằng `select` (không `include`), `Decimal → Number`, không trả `mat_khau_hash` hay địa chỉ/tọa độ thợ.
- **Popup admin (parallel + intercepting route):** `app/admin/layout.tsx` nhận slot `modal`. Mỗi `app/admin/@modal/(.)X/[id]/page.tsx` bọc `<HopThoai tieuDe="..." rong="max-w-lg">` quanh trang gốc `app/admin/X/[id]/page.tsx` (import default). Đã có: `phieu-viec`, `khach-hang`, `tho`. **Chưa có:** `vat-tu`, `hoa-don`, `bao-cao`. Giữ nguyên `@modal/default.tsx` và `@modal/[...catchAll]` (trả `null`, để popup đóng khi chuyển trang). Action phải `redirect` về danh sách thì popup mới tự đóng. F5/mở thẳng URL vẫn ra trang đầy đủ.
- **Bộ lọc + phân trang:** state trên URL searchParams. Server: `mot()` đọc tham số → whitelist `as const` → dựng `where: DieuKien` → `count` → `tinhPhanTrang` → `findMany({ skip, take })`, `orderBy` có khóa phụ `id`; 10 dòng/trang. Client `BoLocXxx.tsx`: ô gõ debounce 400ms, ô chọn áp ngay, `router.replace(..., { scroll: false })`, bỏ `trang` khi đổi lọc.
- **UI:** màu qua CSS variable trong `app/globals.css`; mọi `<input>/<select>` cần `bg-white text-gray-900`; ô nút trong bảng thêm `whitespace-nowrap`; thẻ dùng `Card`. Khu Thợ kiểm ~375px (`h-dvh`, tab đáy dưới 640px); Admin dưới 1024px sidebar thành ngăn kéo.
- **Id trên URL:** trang web dùng `docIdTrang` (`null` → `notFound()`), API dùng `docIdDuong` (ném 400). Không dùng `Number(id)` trần. `params`, `searchParams` là Promise.
- **SĐT:** `chuanHoaSdt` + `LOI_SDT` (`lib/chuan-hoa-sdt.ts`), chỉ đầu số di động `^0[35789]\d{8}$`.
- **Múi giờ:** DB lưu UTC, VN = +7 (`LECH_GIO_VN_MS` trong `lib/bao-cao.ts`; lọc ngày hóa đơn dùng `dauNgayVN()` khai báo trong `app/admin/hoa-don/page.tsx`).

## Bẫy đã gặp
- `middleware.ts` chạy Edge: chỉ import `@/auth.config`, **không** import `@/auth`, `@/lib/prisma`, `bcryptjs`. Sửa `callbacks` thì sửa trong `auth.config.ts`.
- File `"use server"` chỉ export hàm async (hằng/hàm đồng bộ để file riêng). `server-only` ở `lib/prisma.ts`, `lib/geocode.ts`: script seed không được import. `lib/geocode.ts` và `lib/actions/geocode.ts` là 2 file khác nhau, trùng tên.
- Không truyền nguyên bản ghi `nguoiDung` xuống client (có `mat_khau_hash`, tọa độ nhà thợ): dùng `select`. `tsc` sạch KHÔNG chứng minh không lộ dữ liệu; kiểm bằng View Page Source tìm `mat_khau_hash`. Ngoại lệ có chủ đích: `vi_do/kinh_do` nhà thợ xuống form tạo phiếu Admin (gợi ý thợ gần tính ở client).
- Sửa schema: tắt `npm run dev` → `npx prisma db push --config prisma7.config.ts` → `npx prisma generate --config prisma7.config.ts` → chạy lại. Quên generate → `Unknown argument`.
- `npx prisma db seed` **XÓA SẠCH 7 bảng** rồi nạp lại. Chỉ chạy khi người dùng tự yêu cầu.
- Lost update: sửa vật tư gửi `ton_luc_mo`, ghi bằng `updateMany where`; trừ kho trong 1 transaction. `updateMany().count` trên MariaDB có thể đếm theo dòng thực sự đổi.
- Đổi quy tắc hủy phiếu phải sửa 2 chỗ: `CANH_BAO` (`phieu-viec/HuyPhieuViecButton.tsx`) và `TRANG_THAI_CHO_PHEP_HUY` (`lib/services/phieu-viec.ts`).
- Có HAI thư mục `api`: `lib/api/` (helper) và `app/api/v1/` (địa chỉ thật, URL phải có `v1`).
- Cột `nguoi_dung.vi_tri_cap_nhat_luc` không còn dùng (chưa xóa). Không có `ngay_thu` trong `hoa_don`.
- Geocode (Geoapify): bỏ kết quả `confidence` < 0,25, timeout 5s, lỗi không chặn tạo thợ/phiếu. Đo bằng số liệu thật trước khi sửa.

<!-- END:du-an -->
