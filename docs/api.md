# Tài liệu REST API — Hệ thống quản lý dịch vụ sửa chữa điện nước

Tiền tố chung: `/api/v1`. Khi chạy local: `http://localhost:3000/api/v1`.

API dùng chung lớp service (`lib/services/*`) với giao diện web nên quy tắc nghiệp vụ giống hệt nhau. API gồm các luồng: luồng Thợ (chuyển trạng thái, ghi vật tư), các thao tác đọc, tạo phiếu việc và đổi trạng thái thanh toán.

File Postman đi kèm: [`postman/API-Dich-vu-dien-nuoc.postman_collection.json`](../postman/API-Dich-vu-dien-nuoc.postman_collection.json) (Collection v2.1, 40 request, biến `baseUrl = http://localhost:3000`).

## 1. Đăng nhập

API dùng **cookie session của NextAuth** (JWT), không có token thứ hai. Phải đăng nhập trước, sau đó gọi các endpoint bên dưới với cùng cookie.

| Bước | Request | Ghi chú |
|---|---|---|
| 1 | `GET /api/auth/csrf` | Trả `csrfToken`. Dùng ngay, không lưu lâu |
| 2 | `POST /api/auth/callback/credentials` | Body `x-www-form-urlencoded`: `csrfToken`, `email`, `password` |

Đăng nhập thành công khi cookie `authjs.session-token` xuất hiện cho `localhost`. Muốn đổi Admin ↔ Thợ: xóa cookie, rồi chạy lại hai bước trên với tài khoản khác.

Tài khoản dữ liệu mẫu (seed):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin.dienthuy@gmail.com` | `admin123` |
| Thợ (Lê Minh Tuấn, id 3) | `leminhtuan@gmail.com` | `tho123` |

## 2. Quy ước chung

**Thành công:** HTTP 200 (riêng tạo phiếu: 201).

```json
{ "data": { } }
```

**Lỗi:**

```json
{ "error": { "message": "Bạn chưa đăng nhập." } }
```

**Danh sách có phân trang:**

```json
{
  "data": {
    "danh_sach": [ ],
    "phan_trang": { "trang": 1, "tong_trang": 4, "tong": 36, "so_dong": 10 }
  }
}
```

Mỗi trang 10 dòng. Giá trị bộ lọc không hợp lệ trả **400** (khác với trang web, nơi giá trị lạ bị bỏ qua).

**Dữ liệu trả về:**
- Chỉ trả các trường cần thiết (không trả toàn bộ bản ghi).
- Không bao giờ trả `mat_khau_hash`.
- Thông tin thợ trong phiếu chỉ gồm `id`, `ten`, `sdt`; không trả địa chỉ hay tọa độ nhà thợ.
- Số tiền (`Decimal` trong DB) được trả dưới dạng số (`Number`).

## 3. Mã lỗi

| Mã | Ý nghĩa | Ví dụ |
|---|---|---|
| 400 | Sai dữ liệu đầu vào | Thiếu trường, sai kiểu, giá trị lọc lạ, id sai định dạng (ví dụ `/phieu-viec/abc`), id vượt giới hạn |
| 401 | Chưa đăng nhập | "Bạn chưa đăng nhập." |
| 403 | Sai vai trò, hoặc phiếu không phải của mình | "Bạn không có quyền thực hiện thao tác này." |
| 404 | Không tìm thấy | Id không tồn tại |
| 409 | Xung đột nghiệp vụ | Hết tồn kho, sai trạng thái, phiếu đã có hóa đơn |

### Quy tắc 401 / 403

Mỗi route tự gọi `yeuCauDangNhap([...vai trò được phép])` **trước khi đọc body**:
- Chưa đăng nhập → **401**.
- Đăng nhập nhưng sai vai trò → **403**. Ví dụ Admin gọi route của Thợ bị 403.

### Lưu ý: mã lỗi khi Thợ truy cập phiếu của thợ khác

Hiện trạng chưa đồng nhất, ghi nhận nguyên trạng:

| Endpoint | Mã khi phiếu không thuộc thợ đang đăng nhập |
|---|---|
| `GET /phieu-viec/{id}` | 403 |
| `POST /phieu-viec/{id}/chuyen-trang-thai` | 403 |
| `POST /phieu-viec/{id}/vat-tu` | 404 |
| `DELETE /phieu-viec/{id}/vat-tu/{dongId}` | 404 |
| `PUT /phieu-viec/{id}/khong-dung-vat-tu` | 404 |

Ngoài ra, khi `so_luong` sai kiểu, tầng API trả "so_luong phải là số nguyên hợp lệ."; khi là số nhưng không hợp lệ (≤ 0), service trả "Số lượng phải là số nguyên lớn hơn 0." Hai thông báo khác nhau nhưng cùng mã 400.

## 4. Tổng quan endpoint

11 endpoint nghiệp vụ, cộng với đăng nhập (mục 1) là 12 endpoint:

| # | Method | Đường dẫn | Vai trò | Mô tả |
|---|---|---|---|---|
| 1 | GET | `/me` | Admin, Thợ | Thông tin người đang đăng nhập |
| 2 | GET | `/phieu-viec` | Admin, Thợ | Danh sách phiếu việc (Thợ chỉ thấy phiếu của mình) |
| 3 | GET | `/phieu-viec/{id}` | Admin, Thợ | Chi tiết phiếu (Thợ chỉ xem phiếu của mình) |
| 4 | POST | `/phieu-viec` | Admin | Tạo phiếu việc (201) |
| 5 | POST | `/phieu-viec/{id}/chuyen-trang-thai` | Thợ | Chuyển phiếu sang bước kế tiếp |
| 6 | POST | `/phieu-viec/{id}/vat-tu` | Thợ | Ghi vật tư đã dùng |
| 7 | DELETE | `/phieu-viec/{id}/vat-tu/{dongId}` | Thợ | Xóa dòng vật tư ghi nhầm |
| 8 | PUT | `/phieu-viec/{id}/khong-dung-vat-tu` | Thợ | Đánh dấu ca không dùng vật tư |
| 9 | GET | `/vat-tu` | Admin, Thợ | Danh sách vật tư |
| 10 | GET | `/hoa-don` | Admin | Danh sách hóa đơn |
| 11 | PUT | `/hoa-don/{id}/thanh-toan` | Admin | Đổi trạng thái thanh toán |

Và 3 route tải file (mục 7). `GET /hoa-don` chỉ dành cho Admin: Thợ gọi sẽ bị 403.

## 5. Chi tiết endpoint

### 5.1 `GET /me`
Trả thông tin người đang đăng nhập. Dùng để kiểm tra phiên.

### 5.2 `GET /phieu-viec`
Trả danh sách có phân trang (mục 2). **Thợ** gọi thì hệ thống tự ép `tho_id` bằng id trong session; không thể xem phiếu của thợ khác, và danh sách của Thợ sắp theo `ngay_tao` giảm dần. Ví dụ giá trị lọc sai: `?trang_thai=ABC` → 400.

### 5.3 `GET /phieu-viec/{id}`
Chi tiết một phiếu. Thợ xem phiếu không phải của mình → 403 (xem mục 3).

### 5.4 `POST /phieu-viec` (Admin, 201)

Hai chế độ khách hàng:

**Khách có sẵn:**
```json
{
  "che_do_khach": "co_san",
  "khach_hang_id": 1,
  "loai_su_co": "Ro ri ong nuoc",
  "muc_do_uu_tien": "TRUNG_BINH",
  "dia_chi": "12 Nguyen Trai, Quan 5, TP.HCM",
  "tho_id": 3
}
```

**Khách mới** (tạo khách và phiếu trong cùng một transaction):
```json
{
  "che_do_khach": "moi",
  "khach_ten": "Nguyen Van Test",
  "khach_sdt": "0901234567",
  "khach_dia_chi": "45 Le Loi, Quan 1, TP.HCM",
  "loai_su_co": "Mat dien",
  "muc_do_uu_tien": "CAO",
  "dia_chi": "45 Le Loi, Quan 1, TP.HCM"
}
```

Trường tùy chọn: `ghi_chu`, `tho_id`, và cặp `vi_do` + `kinh_do`. Khách mới thiếu `khach_dia_chi` → 400. `tho_id` vượt giới hạn INT (ví dụ `3000000000`) → 400.

| Trường | Quy tắc |
|---|---|
| `muc_do_uu_tien` | `THAP`, `TRUNG_BINH` hoặc `CAO` |
| `khach_sdt` | Chuẩn hóa về dạng `0xxxxxxxxx`, đúng mẫu `^0[35789]\d{8}$` (chấp nhận `+84`, `84`, dấu cách, chấm, gạch) |
| Độ dài tối đa | Tên khách 100, địa chỉ 191, loại sự cố 100, ghi chú 500 |
| `khach_hang_id`, `tho_id` | Phải là số nguyên không vượt giới hạn INT |
| Địa chỉ khách mới | Bắt buộc |

Phản hồi 201:
```json
{
  "data": {
    "id": 37,
    "khach_hang_id": 1,
    "tho_id": 3,
    "loai_su_co": "Ro ri ong nuoc",
    "muc_do_uu_tien": "TRUNG_BINH",
    "trang_thai": "MOI",
    "dia_chi": "12 Nguyen Trai, Quan 5, TP.HCM",
    "ghi_chu": null,
    "ngay_tao": "2026-11-06T03:00:00.000Z"
  }
}
```

(Giá trị `id` và `ngay_tao` ở trên chỉ minh họa; giá trị thật phụ thuộc DB.)

### 5.5 `POST /phieu-viec/{id}/chuyen-trang-thai` (Thợ)

Chuyển phiếu **đúng một bước**: `MOI` → `DANG_DI` → `DANG_LAM` → `HOAN_THANH`. Body tùy chọn:

```json
{ "tu_trang_thai": "DANG_DI" }
```

`tu_trang_thai` là trạng thái client đang thấy. Giá trị không thuộc danh sách trạng thái (ví dụ `"ABC"`) → 400; phiếu đã đổi ở nơi khác (ví dụ mở hai tab) nên không còn khớp → 409. Điều kiện nghiệp vụ:

| Chuyển sang | Điều kiện |
|---|---|
| `DANG_LAM` | Có ít nhất 1 ảnh **Trước** |
| `HOAN_THANH` | Có ít nhất 1 ảnh **Sau**, và có ít nhất 1 dòng vật tư **hoặc** đã đánh dấu "không dùng vật tư" |

Thiếu điều kiện thì bị từ chối (đã test: thiếu ảnh Trước → 409). Ảnh chưa upload được qua API, nên ca cần ảnh phải chụp trên web trước.

### 5.6 `POST /phieu-viec/{id}/vat-tu` (Thợ)

```json
{ "vat_tu_id": 4, "so_luong": 2 }
```

`so_luong` phải là **số nguyên thật** (không phải chuỗi), lớn hơn 0: `"2"`, `0`, `-1` đều bị 400. Chỉ ghi được khi phiếu đang `DANG_LAM` (phiếu `MOI`/`DANG_DI`/`HOAN_THANH` → 409). Không đủ tồn → 409. Kho được trừ ngay trong cùng transaction.

### 5.7 `DELETE /phieu-viec/{id}/vat-tu/{dongId}` (Thợ)

Xóa một dòng vật tư ghi nhầm. Chỉ khi phiếu đang `DANG_LAM`; kho được cộng lại. Xóa lại dòng đã xóa → 404.

### 5.8 `PUT /phieu-viec/{id}/khong-dung-vat-tu` (Thợ)

```json
{ "gia_tri": true }
```

`gia_tri` phải là boolean (gửi chuỗi `"true"` → 400). Phiếu đã có dòng vật tư mà đặt `true` → 409.

### 5.9 `GET /vat-tu`
Mặc định chỉ trả vật tư đang dùng. Admin có thêm `?trang_thai=ngung` (vật tư đã ngừng) hoặc `?trang_thai=tat_ca`. Thợ luôn chỉ thấy vật tư đang dùng.

### 5.10 `GET /hoa-don`
Danh sách hóa đơn có phân trang. Chỉ Admin; Thợ gọi → 403.

### 5.11 `PUT /hoa-don/{id}/thanh-toan` (Admin)

```json
{ "trang_thai_thanh_toan": "DA_THU" }
```

Giá trị hợp lệ: `DA_THU` hoặc `CON_NO`; giá trị khác (ví dụ `DA_HUY`) → 400, hóa đơn không tồn tại → 404. Tổng các hóa đơn `CON_NO` chính là công nợ.

## 6. Hai trạng thái dễ nhầm

- `trang_thai` của **phiếu việc**: `MOI`, `DANG_DI`, `DANG_LAM`, `HOAN_THANH`, `DA_HUY`.
- `trang_thai_thanh_toan` của **hóa đơn**: `DA_THU`, `CON_NO`.

## 7. Route tải file (chỉ Admin)

| Method | Đường dẫn | Kết quả |
|---|---|---|
| GET | `/hoa-don/{id}/pdf` | PDF hóa đơn |
| GET | `/bao-cao/xuat-excel` | Excel báo cáo |
| GET | `/bao-cao/xuat-pdf` | PDF báo cáo |

Trả file nhị phân, không bọc trong `{ "data": ... }`. Lỗi vẫn trả JSON theo mục 2.

## 8. Ví dụ luồng kiểm thử nhanh (Postman)

Số trong ngoặc là số thứ tự request trong file Postman.

1. Đăng nhập Thợ Lê Minh Tuấn (1, 2b), rồi xem danh sách phiếu của mình (11).
2. Ghi vật tư vào phiếu 4 (16), thử `so_luong` sai (18, 19, 20) và hết tồn (21).
3. Chuyển phiếu 8 từ `MOI` sang `DANG_DI` (30); chuyển tiếp khi chưa có ảnh Trước thì bị 409 (31).
4. Xóa cookie, đăng nhập Admin (1, 2), tạo phiếu (33), đổi thanh toán hóa đơn 1 (36).

Các request ca lỗi (400, 401, 403, 404, 409) có mã mong đợi ghi sẵn trong tên request.
