# 🌾 NÔNG TRẠI & SÒNG BÀI DÂN GIAN REALTIME (VPS DOCKER READY)

Hệ thống game nhập vai nông trại kết hợp sòng bài Bầu Cua Tôm Cá thời gian thực, xây dựng trên nền tảng **React 19 + TypeScript + Vite** và **Node.js 22 + SQLite 3 WAL**, tối ưu hóa cực hạn để chạy trên VPS Docker với mức tiêu thụ **RAM < 70MB**.

---

## 🌟 Các Tính Năng Nổi Bật

1. **Xác thực bằng Key (Key-Based Authentication)**:
   - Đăng nhập an toàn qua Key, kiểm soát 1 phiên hoạt động duy nhất (đá phiên cũ khi đăng nhập nơi khác).
   - Tích hợp tài khoản **Admin** và người chơi thường.

2. **Kinh Tế Game Đa Dạng (50+ Vật Phẩm)**:
   - **Trồng trọt & Thu hoạch**: Lúa, Cà Chua, Dâu Tây, Cà Rốt, Hoa Hồng Vàng, Nhân Sâm Ngàn Năm.
   - **Câu cá**: Cá Rô Phi, Cá Chép Vàng, Cá Hồi, Tôm Hùm Hoàng Đế, Thủy Quái Kỳ Lôi Ngư.
   - **Bất Động Sản**: Lều Tranh, Nhà Cấp 4, Nhà Ngói Ba Gian, Biệt Thự Sân Vườn, Dinh Thự Hoàng Gia.
   - **Xe Cộ & Thú Cưỡi**: Xe Đạp Cổ Điển, Xe Cub 50cc, Vespa Ý, SH 150i, Siêu Xe Thể Thao, Rồng Thần Hoàng Kim (tăng tốc độ di chuyển).

3. **Chợ Đêm (Marketplace - P2P Trading)**:
   - Người chơi tự do treo bán nông sản, thủy sản và vật phẩm hiếm cho toàn máy chủ mua bán bằng Xu.

4. **Bầu Cua Tôm Cá Realtime Multiplayer ("Nặn Bát" Đỉnh Cao)**:
   - Chu kỳ phòng chơi 41 giây khép kín: **Đặt cược (25s) ➔ Lắc đĩa (4s) ➔ Nặn bát (7s) ➔ Mở bát & Trả thưởng (5s)**.
   - Bát gốm sứ hoa lam & đĩa men ngọc với cơ chế vuốt/kéo chuột để nặn bát trực tiếp.
   - Hiển thị mức cược làng thời gian thực và lịch sử kết quả các ván trước (Soi cầu).

5. **Bảng Điều Khiển Quản Trị (Admin Dashboard)**:
   - Giám sát RAM & Uptime máy chủ theo thời gian thực.
   - Quản lý Key: Tạo mới, gia hạn, vô hiệu hóa / kick người chơi.
   - Chỉnh sửa số dư Xu, Lượng của bất kỳ người chơi nào.
   - Bắn thông báo toàn máy chủ (Marquee Broadcast).
   - Xem nhật ký hệ thống (Audit Logs).

---

## 🔑 Danh Sách Key Trải Nghiệm Mẫu

| Loại Tài Khoản | Key Code | Vai Trò | Số Dư Khởi Tạo |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `KEY-ADMIN-ROOT-9999` | Quản trị toàn quyền | 999,999 Xu / 9,999 Lượng |
| **VIP Player** | `KEY-VIP-8888` | Người chơi | 100,000 Xu / 500 Lượng |
| **Test Player 1** | `KEY-TEST-0001` | Người chơi | 10,000 Xu / 50 Lượng |
| **Test Player 2** | `KEY-TEST-0002` | Người chơi | 5,000 Xu / 20 Lượng |

---

## 🚀 Hướng Dẫn Chạy & Test Thử

### Cách 1: Chạy trực tiếp trên máy (Node.js)

1. **Cài đặt thư viện**:
   ```bash
   npm install
   ```

2. **Build giao diện**:
   ```bash
   npm run build
   ```

3. **Khởi động Game Server**:
   ```bash
   node server/index.js
   ```

4. Mở trình duyệt truy cập: **`http://localhost:3000`**

---

### Cách 2: Triển khai bằng Docker trên VPS (<70MB RAM)

1. **Khởi chạy container**:
   ```bash
   docker compose up -d --build
   ```

2. **Kiểm tra trạng thái & RAM**:
   ```bash
   docker stats gamevps_app
   ```

3. Dữ liệu tài khoản và database được lưu vĩnh viễn trong thư mục `./data` trên VPS.

---

### 🌐 Cách Public Cho Mọi Người Chơi Không Cần Mở Port (Cloudflare Tunnel)

Bạn có thể đưa game lên Internet với HTTPS hoàn toàn miễn phí mà không cần mở port modem/VPS:

1. Cài đặt **`cloudflared`** trên VPS:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```

2. Chạy tunnel trực tiếp:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare sẽ sinh ra 1 đường link công khai (ví dụ: `https://your-game-name.trycloudflare.com`). Bạn có thể gửi link này cho mọi người cùng vào chơi realtime!
