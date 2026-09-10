# 🚀 HƯỚNG DẪN TRIỂN KHAI GAME LÊN VPS BẰNG DOCKER

Tài liệu này hướng dẫn chi tiết từng bước để đưa Game lên bất kỳ VPS nào (Ubuntu, Debian, CentOS, AlmaLinux) với Docker, tối ưu hóa bộ nhớ cực hạn (<70MB RAM) và mở game ra toàn cầu qua Cloudflare Tunnel hoàn toàn miễn phí.

---

## 📋 1. Yêu Cầu Cấu Hình VPS
- **RAM**: Tối thiểu 512MB RAM (Khuyến nghị 1GB - 2GB RAM).
- **CPU**: 1 Core.
- **Dung lượng đĩa**: 5GB SSD.
- **Hệ điều hành**: Ubuntu 20.04 / 22.04 / 24.04 LTS hoặc Debian 11 / 12.

---

## ⚡ 2. Các Bước Triển Khai Nhanh (3 Phút)

### Bước 1: Kết nối vào VPS qua SSH
```bash
ssh root@<IP_VPS_CUA_BAN>
```

### Bước 2: Cài đặt Docker & Git (Nếu VPS chưa có)
Chạy lệnh sau trên Ubuntu/Debian:
```bash
# Cập nhật gói hệ thống
apt update && apt upgrade -y

# Cài đặt Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y git docker-compose-plugin
```

### Bước 3: Clone Mã Nguồn Từ GitHub
```bash
# Clone dự án về thư mục gamevps
git clone https://github.com/ChiBaoDev/gamevps.git
cd gamevps
```

### Bước 4: Chạy Triển Khai Bằng Script 1-Click
```bash
# Cấp quyền thực thi và chạy script deploy
chmod +x deploy.sh
./deploy.sh
```

Hoặc chạy trực tiếp bằng Docker Compose:
```bash
docker compose up -d --build
```

---

## 🎮 3. Kiểm Tra & Truy Cập Game

Sau khi triển khai xong, game sẽ chạy ngay tại:
- **Địa chỉ Web**: `http://<IP_VPS_CUA_BAN>:3000`
- **Mã Key Master Admin**: `KEY-ADMIN-ROOT-9999` (Mở khóa toàn bộ quyền Admin Dashboard, tạo Key, quản lý số dư, phát thông báo).
- **Mã Key Người Chơi Mẫu**: `KEY-VIP-8888`, `KEY-TEST-0001`, `KEY-TEST-0002`.

---

## 🌐 4. Mở Game Ra Toàn Cầu Bằng Cloudflare Tunnel (Miễn Phí, Có HTTPS & Chống DDoS)

Cloudflare Tunnel giúp người khác truy cập qua tên miền riêng (ví dụ: `game.yourdomain.com`) hoặc link ngrok/cloudflare mà không cần mở port modem, không lộ IP VPS.

1. Đăng nhập vào [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Vào mục **Networks** ➔ **Tunnels** ➔ Nhấn **Create a Tunnel** (Chọn Cloudflared).
3. Đặt tên Tunnel (ví dụ: `gamevps`).
4. Sao chép đoạn mã Token (dạng chuỗi `eyJh...`).
5. Mở file `docker-compose.yml` trên VPS:
   ```bash
   nano docker-compose.yml
   ```
6. Bỏ dấu comment `#` ở phần `tunnel` và dán Token vào:
   ```yaml
   tunnel:
     image: cloudflare/cloudflared:latest
     container_name: gamevps_tunnel
     restart: unless-stopped
     command: tunnel run
     environment:
       - TUNNEL_TOKEN=dán_token_của_bạn_vào_đây
     depends_on:
       - gamevps
   ```
7. Trong Cloudflare Dashboard, tại tab **Public Hostname**, cấu hình:
   - **Service Type**: `HTTP`
   - **URL**: `gamevps:3000`
8. Khởi động lại Docker:
   ```bash
   docker compose up -d
   ```
👉 Bạn đã có thể truy cập game bằng tên miền có ổ khóa xanh HTTPS/WSS bảo mật!

---

## 📊 5. Các Lệnh Quản Trị Hệ Thống Hữu Ích

| Thao Tác | Lệnh Terminal |
| :--- | :--- |
| **Xem mức tiêu thụ RAM container** | `docker stats gamevps_app --no-stream` |
| **Xem nhật ký hoạt động (Logs)** | `docker logs -f gamevps_app` |
| **Khởi động lại Game Server** | `docker compose restart` |
| **Dừng Game Server** | `docker compose down` |
| **Cập nhật code mới nhất từ GitHub** | `git pull origin main && ./deploy.sh` |
| **Sao lưu Database** | File database nằm tại `./data/game.db`. Bạn chỉ cần copy file này để backup. |

---

## 🛡️ 6. Quản Lý Admin Panel Ngay Trên Web
Sau khi đăng nhập bằng key `KEY-ADMIN-ROOT-9999`:
- Nhấn vào nút **ADMIN** màu đỏ trên thanh TopBar.
- Bạn có thể:
  - 🔑 Sinh hàng loạt Key mới cho bạn bè.
  - 👥 Xem danh sách người chơi online, chỉnh sửa Xu, Lượng, Level.
  - 📢 Phát thông báo chạy chữ trên đỉnh màn hình cho toàn bộ máy chủ.
  - 📈 Theo dõi mức tiêu thụ RAM và CPU realtime.
