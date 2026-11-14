# Hệ thống quản lý dịch vụ sửa chữa điện nước

Đồ án tốt nghiệp: điều phối công việc sửa chữa điện nước, quản lý kho vật tư và công nợ. Thợ dùng điện thoại là chính; Admin dùng laptop. Khách hàng **không** đăng nhập (gọi/nhắn Zalo, Admin tạo phiếu thay).

> Làm việc với AI/Claude: đọc `AGENTS.md` trước (bản đồ file, quy ước, bẫy đã gặp), không cần quét cả repo.

## Chức năng
| Vai trò | Làm được |
|---|---|
| **Admin** | Quản lý phiếu việc (tạo, gán thợ, sửa, hủy, xem ảnh), thợ, khách hàng, vật tư, hóa đơn và thanh toán; báo cáo (doanh thu, công nợ, vật tư, số phiếu) xuất Excel/PDF; gợi ý thợ gần nhất theo địa chỉ |
| **Thợ** | Xem phiếu được giao, đổi trạng thái từng bước, chụp ảnh trước/sau, ghi vật tư đã dùng, xem hồ sơ |

Luồng phiếu: `Mới → Đang đi → Đang làm → Hoàn thành` (hoặc `Đã hủy`). Hóa đơn có trạng thái riêng `Còn nợ / Đã thu`; tổng hóa đơn Còn nợ = công nợ. Chưa làm: cổng khách hàng, gửi hóa đơn qua Zalo.

## Công nghệ
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · MariaDB + Prisma 7 · NextAuth v5 (Credentials, JWT) · pdfkit · exceljs · recharts · Geoapify (geocode). Kiến trúc: Server Action và REST API `/api/v1` dùng chung một lớp service (`lib/services`).

## Cài đặt và chạy (PowerShell)
Cần Node.js 20.9 trở lên (đã chạy với 22) và một MariaDB/MySQL đang chạy.

```powershell
# 1. Tạo database rỗng (trong MariaDB): CREATE DATABASE ten_db CHARACTER SET utf8mb4;
# 2. Tạo file .env ở thư mục gốc (xem bảng dưới)
npm install
npx prisma db push --config prisma7.config.ts      # tạo 7 bảng
npx prisma generate --config prisma7.config.ts     # sinh client vào generated/prisma
npx prisma db seed --config prisma7.config.ts      # nạp dữ liệu mẫu (XÓA SẠCH 7 bảng trước)
npm run dev                                        # http://localhost:3000
```

Chạy bản production để demo: `npm run build` rồi `npm start`.

**Biến môi trường (`.env`, không commit):**

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Có | `mysql://user:matkhau@localhost:3306/ten_db` |
| `AUTH_SECRET` | Có khi `npm start` | Chuỗi ngẫu nhiên, vd PowerShell: `[Convert]::ToBase64String((1..32 \| ForEach-Object { Get-Random -Maximum 256 }))` |
| `GEOAPIFY_API_KEY` | Không | Để tra tọa độ (gợi ý thợ gần). Thiếu thì chức năng này không hoạt động, các phần khác vẫn chạy |

Sửa `schema.prisma` thì tắt `npm run dev`, chạy lại `db push` rồi `generate`.

## Tài khoản mẫu (sau khi seed)
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin.dienthuy@gmail.com` | `admin123` |
| Thợ | `tranvanhung@gmail.com`, `leminhtuan@gmail.com`, `nguyenhoanglong@gmail.com`, `dangthanhphong@gmail.com`, `voducthinh@gmail.com` | `tho123` |

Seed còn có thợ `phamquocbao@gmail.com` (đã ngừng hoạt động). Thợ Phong và Bảo không có vị trí nhà, dùng để thử ca "chưa xác định vị trí".

## Cấu trúc thư mục
```
app/admin/   khu Admin (danh sách, moi/, [id]/, bộ lọc; popup ở @modal/)
app/tho/     khu Thợ (phieu-viec, ho-so)
app/api/v1/  REST API;  app/api/auth/  NextAuth
lib/         actions (Server Action), services (nghiệp vụ), api (helper REST), pdf, excel, tiện ích
components/  ui/ (nút, thẻ, bảng...), admin/, tho/
prisma/      schema.prisma, seed.ts     generated/prisma  client Prisma (có commit)
docs/api.md  tài liệu REST API          assets/fonts  phông cho PDF
```
Chi tiết từng file và quy ước nằm trong `AGENTS.md`.

## REST API
Tiền tố `/api/v1`, đăng nhập bằng cookie session NextAuth (không có token riêng). Gồm 11 endpoint nghiệp vụ và 3 route tải file Admin (PDF hóa đơn, Excel/PDF báo cáo); đăng nhập đi qua NextAuth. Đầy đủ endpoint, body, mã lỗi: `docs/api.md`.

## Tiến độ (cập nhật 14/11/2026)
**Đã xong:** toàn bộ module nghiệp vụ, kiểm thử thủ công end-to-end, service layer, bộ lọc và phân trang, xuất Excel/PDF, gợi ý thợ gần nhất, REST API, giao diện v2 (dùng được trên điện thoại ~375px), rà soát lộ dữ liệu.
**Mới:** popup Xem/Sửa thay trang riêng ở Admin cho phiếu việc, khách hàng, thợ, hóa đơn (lập và chi tiết), vật tư. Các trang "Thêm mới" vẫn là trang đầy đủ.
**Còn lại:** viết báo cáo cuối kỳ.

**Việc treo (chỉ làm khi cần):**
- Dropdown thợ ở trang sửa phiếu chưa hiện Rảnh/Bận.
- Hóa đơn: chưa hủy được; tên cửa hàng/logo trên PDF.
- Khai báo kiểu `session.user` (`id`, `vai_tro`) cho NextAuth.
- Báo cáo: "Dùng nhiều nhất" đang tính cả phiếu đã hủy; muốn dòng tiền thực thì thêm `ngay_thu` vào `hoa_don`.
- Postman: collection `postman/API-Dich-vu-dien-nuoc.postman_collection.json` (40 request) được `docs/api.md` nhắc tới nhưng **chưa có trong repo**.
- Dọn dẹp: cột `vi_tri_cap_nhat_luc` không còn dùng, token `--color-sidebar-*`, vài hàm định dạng ngày lặp.

## Hạn chế đã biết
- Không có chức năng nâng cao: sổ kho + nhập hàng (hiện nhập thêm bằng sửa số tồn), kiểm thử tự động, nhật ký thao tác.
- Hủy phiếu đang làm không hoàn kho; phiếu hủy không khôi phục; không sửa số lượng vật tư đã ghi; chưa kích hoạt lại thợ/khách đã ngừng.
- Rảnh/Bận chỉ để tham khảo, không chặn gán. Hai tab cũ có thể đẩy phiếu qua bước kế; Admin sửa phiếu bằng form có thể kéo ngược trạng thái.
- SĐT chỉ nhận đầu số di động (03/05/07/08/09); `khach_hang.sdt` không unique. Ảnh tối đa 5MB, chưa nén ở trình duyệt.
- Gợi ý thợ gần dùng khoảng cách đường chim bay, giả định thợ xuất phát từ nhà; dữ liệu Geoapify/OSM thiếu số nhà nhiều nơi, địa chỉ không khớp có thể chờ tới ~5 giây; phụ thuộc dịch vụ ngoài (3.000 request/ngày).
- API chỉ phủ luồng Thợ, các thao tác đọc, tạo phiếu và đổi thanh toán; chưa có qua API: sửa/hủy phiếu, vật tư, lập hóa đơn, quản lý khách/thợ, upload ảnh.
- Chạy local, chưa triển khai HTTPS.
