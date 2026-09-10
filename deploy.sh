#!/bin/bash
# =========================================================
# GAME VPS - SCRIPT TRIỂN KHAI DOCKER 1-CLICK TỰ ĐỘNG
# =========================================================

echo "🚀 Bắt đầu quá trình build và khởi chạy Game Server..."

# 1. Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Lỗi: Chưa cài đặt Docker trên máy chủ. Vui lòng cài Docker trước!"
    exit 1
fi

# 2. Tạo thư mục lưu database nếu chưa có
mkdir -p data

# 3. Dừng container cũ nếu đang chạy
echo "🛑 Dừng container cũ..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# 4. Build lại image mới nhất
echo "🔨 Đang đóng gói Docker Container (Build Vite + Node.js)..."
docker compose build || docker-compose build

# 5. Khởi động container chạy ngầm
echo "⚡ Khởi động dịch vụ..."
docker compose up -d || docker-compose up -d

# 6. Kiểm tra trạng thái
sleep 3
echo "========================================================="
echo "🎉 GAME SERVER ĐÃ TRIỂN KHAI THÀNH CÔNG!"
echo "🌐 Truy cập tại: http://<IP_VPS>:3000"
echo "🛡️ Admin Key: KEY-ADMIN-ROOT-9999"
echo "📊 Kiểm tra RAM container: docker stats gamevps_app --no-stream"
echo "📜 Xem nhật ký: docker logs -f gamevps_app"
echo "========================================================="
