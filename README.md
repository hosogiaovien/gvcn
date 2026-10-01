# 🏆 THI ĐUA LỚP - HỆ THỐNG QUẢN LÝ THI ĐUA HỌC ĐƯỜNG TOÀN DIỆN
> **Dành cho Trường TH&THCS BÀN LONG (Năm học 2026–2027)**  
> Stack: **React + TypeScript + Vite + Tailwind CSS + Firebase + Vercel**  
> Quy trình triển khai: **GitHub → Vercel (Production-Ready)**

---

## 📖 MỤC LỤC
1. [Giới thiệu hệ thống](#1-giới-thiệu-hệ-thống)
2. [7 Vai trò & Ma trận phân quyền (RBAC)](#2-7-vai-trò--ma-trận-phân-quyền-rbac)
3. [Tài khoản mẫu đăng nhập kiểm thử](#3-tài-khoản-mẫu-đăng-nhập-kiểm-thử)
4. [Hướng dẫn Cầm tay chỉ việc: Cấu hình Firebase](#4-hướng-dẫn-cầm-tay-chỉ-việc-cấu-hình-firebase)
5. [Hướng dẫn Cầm tay chỉ việc: Triển khai lên Vercel](#5-hướng-dẫn-cầm-tay-chỉ-việc-triển-khai-lên-vercel)
6. [Chạy Local Development](#6-chạy-local-development)
7. [Bảo mật & Quy tắc phân định thứ hạng (Tie-Break)](#7-bảo-mật--quy-tắc-phân-định-thứ-hạng-tie-break)

---

## 1. GIỚI THIỆU HỆ THỐNG

**THI ĐUA LỚP** là giải pháp số hóa toàn diện công tác thi đua nền nếp và học tập của học sinh, tổ và lớp học dành cho trường phổ thông:
* **Chấm thi đua nhanh & Hàng loạt:** Hỗ trợ chấm nhiều học sinh và chọn nhiều tiêu chí điểm cộng/trừ trong 1 thao tác. Điểm số được hệ thống áp đặt tự động theo tiêu chí, chống gian lận điểm.
* **Quy trình phê duyệt chặt chẽ:** Điểm do Tổ trưởng ghi nhận được đưa vào hàng chờ duyệt để GVCN phê duyệt hoặc từ chối có lý do.
* **Tổng kết tuần (Snapshot Locking):** Tự do chọn chu kỳ ngày bắt đầu - ngày kết thúc. Khi chốt tuần, snapshot đóng băng dữ liệu. Nếu mở lại (reopen) bắt buộc nhập lý do và ghi nhận Audit Log.
* **Cổng phụ huynh & Mã QR an toàn:** Phụ huynh chỉ cần quét mã QR bằng Zalo hoặc Camera điện thoại để xem bảng xếp hạng lớp. Token chia sẻ ngẫu nhiên an toàn, tuyệt đối không lộ thông tin cá nhân hay nhật ký nội bộ.
* **Xuất nhập Excel & Báo cáo:** Xuất danh sách học sinh, bảng xếp hạng ra file Excel chuẩn; hỗ trợ nhập học sinh từ Excel có preview và kiểm tra lỗi từng dòng.

---

## 2. 7 VAI TRÒ & MA TRẬN PHÂN QUYỀN (RBAC)

| Chức năng | Admin | Hiệu trưởng | Phó HT | Tổng phụ trách | Giám thị | GVCN | Tổ trưởng |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Xem toàn trường** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Quản lý người dùng** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Quản lý lớp & khối** | ✓ | Xem | Xem | Xem | Xem | Lớp mình | ✗ |
| **Quản lý học sinh** | ✓ | Xem | Xem | Xem | Xem | Lớp mình | Tổ mình |
| **Chấm thi đua** | ✓ | Cấu hình | Cấu hình | Tùy cấu hình | Tùy cấu hình | ✓ | ✓ (chờ duyệt) |
| **Duyệt điểm Tổ trưởng** | ✓ | Xem | Xem | Xem | Xem | ✓ | ✗ |
| **Tiêu chí thi đua** | ✓ | Xem | Xem | Xem | Xem | Lớp mình | ✗ |
| **Xếp hạng & Tie-Break**| ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Tổng kết tuần / tháng** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Xem |
| **Mã QR & Link Phụ huynh**| ✓ | Xem | Xem | Xem | Xem | ✓ | ✗ |
| **Audit Log (Nhật ký)** | ✓ | ✗ | ✗ | ✗ | ✗ | Lớp mình | ✗ |

---

## 3. TÀI KHOẢN MẪU ĐĂNG NHẬP KIỂM THỬ

Hệ thống đã chuẩn bị sẵn bộ dữ liệu mẫu lớp **9A1 (40 học sinh, 4 tổ, 15 tiêu chí)**.  
*Tất cả tài khoản mẫu có mật khẩu mặc định:* **`123456`**

| Vai trò | Username | Họ và tên | Phạm vi |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | Quản Trị Viên Hệ Thống | Toàn quyền cấu hình |
| **HIỆU TRƯỞNG** | `hieutruong` | Thầy Nguyễn Văn Nam | Toàn trường (Chỉ xem) |
| **PHÓ HIỆU TRƯỞNG** | `phohieutruong` | Cô Trần Thị Hương | Toàn trường (Chỉ xem) |
| **TỔNG PHỤ TRÁCH** | `tongphutrach` | Thầy Lê Hoàng Long | Toàn trường + Nền nếp |
| **GIÁM THỊ** | `giamthi` | Thầy Bùi Văn Dũng | Ghi nhận vi phạm |
| **GVCN** | `gvcn9a1` | Cô Lê Thị Mai | Lớp 9A1 (Chấm, duyệt, chốt tuần) |
| **TỔ TRƯỞNG** | `totruong1` | Nguyễn Văn An | Tổ 1 - Lớp 9A1 (10 thành viên) |

*(Trên thanh điều hướng Navbar có sẵn menu đổi nhanh vai trò giúp kiểm thử chức năng lập tức).*

---

## 4. HƯỚNG DẪN CẦM TAY CHỈ VIỆC: CẤU HÌNH FIREBASE

### Bước 1: Tạo dự án Firebase mới
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập tài khoản Google.
2. Bấm **Add project** (Thêm dự án) → Đặt tên dự án (ví dụ: `thidua-banlong`) → Bấm **Continue** (tắt Google Analytics nếu không cần) → Bấm **Create project**.

### Bước 2: Kích hoạt Authentication (Xác thực)
1. Tại menu bên trái, chọn **Build** → **Authentication** → Bấm **Get started**.
2. Chọn tab **Sign-in method** → Chọn **Email/Password**.
3. Bật công tắc **Enable** ở dòng đầu tiên (Email/Password) → Bấm **Save**.  
   *(Lưu ý: Hệ thống sử dụng cơ chế định danh nội bộ `@thidua.school`, người dùng chỉ cần nhập username & password thông thường).*

### Bước 3: Tạo cơ sở dữ liệu Cloud Firestore
1. Tại menu bên trái, chọn **Build** → **Firestore Database** → Bấm **Create database**.
2. Chọn vị trí lưu trữ gần Việt Nam: `asia-southeast1` (Singapore) hoặc `asia-east1`.
3. Chọn **Start in production mode** → Bấm **Create**.

### Bước 4: Thiết lập Firestore Security Rules & Indexes
1. Tại giao diện Firestore Database, chuyển qua tab **Rules** (Quy tắc).
2. Sao chép toàn bộ nội dung từ file `firestore.rules` trong thư mục dự án và dán vào đây → Bấm **Publish**.
3. Chuyển qua tab **Indexes** (Chỉ mục) và tạo các chỉ mục kết hợp như trong file `firestore.indexes.json`.

### Bước 5: Lấy thông số cấu hình Web App (Frontend)
1. Bấm vào biểu tượng bánh răng ⚙️ ở góc trên bên trái → Chọn **Project settings**.
2. Kéo xuống mục **Your apps** → Bấm vào biểu tượng Web **`</>`**.
3. Đặt App nickname (ví dụ: `ThiDuaWeb`) → Bấm **Register app**.
4. Bạn sẽ thấy object `firebaseConfig` gồm:
   * `apiKey`
   * `authDomain`
   * `projectId`
   * `storageBucket`
   * `messagingSenderId`
   * `appId`  
   *(Lưu lại các giá trị này để cấu hình ở Bước tiếp theo).*

### Bước 6: Lấy Firebase Admin SDK Key (Phía Server)
1. Vẫn trong trang **Project settings**, chuyển sang tab **Service accounts**.
2. Bấm **Generate new private key** → Xác nhận tải về file JSON.
3. Mở file JSON tải về:
   * `project_id` → tương ứng biến `FIREBASE_PROJECT_ID`
   * `client_email` → tương ứng biến `FIREBASE_CLIENT_EMAIL`
   * `private_key` → tương ứng biến `FIREBASE_PRIVATE_KEY`

---

## 5. HƯỚNG DẪN CẦM TAY CHỈ VIỆC: TRIỂN KHAI LÊN VERCEL

### Bước 1: Đẩy mã nguồn lên GitHub
Mở Terminal trong thư mục dự án và chạy:
```bash
git init
git add .
git commit -m "feat: complete school competition management system"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/thidua-lop.git
git push -u origin main
```

### Bước 2: Kết nối và Import dự án trên Vercel
1. Đăng nhập vào [Vercel](https://vercel.com/).
2. Bấm **Add New...** → Chọn **Project**.
3. Chọn tài khoản GitHub của bạn và bấm **Import** tại repository `thidua-lop`.
4. Tại mục **Framework Preset**, Vercel sẽ tự động nhận diện là **Vite**.

### Bước 3: Thêm Biến Môi Trường (Environment Variables)
Tại phần **Environment Variables** trên Vercel, nhập lần lượt các biến sau:

#### A. Nhóm biến Client (Bắt buộc có tiền tố VITE_):
| Name | Giá trị mẫu |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `thidua-banlong.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `thidua-banlong` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `thidua-banlong.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abcdef123456` |

#### B. Nhóm biến Serverless Functions (Bảo mật - Tuyệt đối không có VITE_):
| Name | Giá trị mẫu |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | `thidua-banlong` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxx@thidua-banlong.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIEvgI...==\n-----END PRIVATE KEY-----\n"` |

### Bước 4: Deploy & Sử dụng
1. Bấm **Deploy**. Vercel sẽ tự động cài đặt dependency, build project và tạo domain sản phẩm (ví dụ: `https://thidua-lop.vercel.app`).
2. Mở đường link ứng dụng trên trình duyệt.
3. Đăng nhập bằng tài khoản Quản trị: `admin` / `123456`.
4. Bấm nút **"Đẩy Seed vào Firestore"** để nạp sẵn 40 học sinh lớp 9A1 và bộ 15 tiêu chí vào cơ sở dữ liệu thật trên Firebase!

---

## 6. CHẠY LOCAL DEVELOPMENT

1. Clone dự án về máy:
   ```bash
   git clone https://github.com/<tai-khoan>/thidua-lop.git
   cd thidua-lop
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env.local` dựa trên file `.env.example` và điền cấu hình Firebase của bạn.
4. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
   Ứng dụng khởi chạy tại: `http://localhost:3000`

---

## 7. BẢO MẬT & QUY TẮC PHÂN ĐỊNH THỨ HẠNG (TIE-BREAK)

### A. Thuật toán Tie-Break phân định thứ hạng:
1. **Ưu tiên 1:** Tổng điểm thi đua cao hơn xếp trên.
2. **Ưu tiên 2:** Nếu bằng điểm, xét học sinh có tổng điểm trừ ít hơn (chấp hành nội quy tốt hơn).
3. **Ưu tiên 3:** Nếu vẫn bằng nhau, xét số lượt đạt điểm cộng nhiều hơn.
4. **Ưu tiên 4:** Xếp đồng hạng.

### B. Cơ chế bảo mật dữ liệu công khai:
* Token chia sẻ cho phụ huynh được tạo bằng chuỗi ngẫu nhiên 32 ký tự an toàn (`crypto.getRandomValues`).
* Endpoint công khai chỉ cung cấp dữ liệu tổng hợp đã được loại bỏ thông tin nhạy cảm. Phụ huynh **không thể** truy cập hồ sơ tài khoản, mật khẩu, số điện thoại hay nhật ký audit của nhà trường.
* GVCN có thể thu hồi (khóa) link hoặc tạo mã bảo mật mới bất kỳ lúc nào chỉ bằng 1 cú nhấp chuột.
