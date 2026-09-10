# 🎮 KẾ HOẠCH TOÀN DIỆN: PHÁT TRIỂN & TRIỂN KHAI GAME MULTIPLAYER
### (Tối Ưu Siêu Nhẹ RAM VPS < 70MB, Key Auth, Bầu Cua Realtime & Pixel Art Dân Gian)

> **Mục tiêu**: Chuyển đổi toàn diện từ web game giao diện tĩnh (`localStorage`) thành game online nhiều người chơi hoạt động ổn định trên các máy chủ VPS cấu hình thấp (512MB - 1GB RAM), xác thực bằng License Key trong Database, mô phỏng sới Bầu Cua sống động như ngoài đời thực, mang đậm phong cách mỹ thuật **Pixel Art hoài niệm dân gian**, đóng gói hoàn chỉnh bằng Docker và hướng dẫn chi tiết cách public an toàn ra toàn cầu.

---

## 📌 MỤC LỤC
1. [Kiến Trúc Kỹ Thuật & Tối Ưu RAM Server Cực Hạn](#1-kiến-trúc-kỹ-thuật--tối-ưu-ram-server-cực-hạn)
2. [Lộ Trình Triển Khai Chi Tiết Từng Phần (7 Giai Đoạn Logic)](#2-lộ-trình-triển-khai-chi-tiết-từng-phần-7-giai-đoạn-logic)
   - [Phần 1: Lõi Backend & Database SQLite Siêu Tối Ưu](#phần-1-lõi-backend--database-sqlite-siêu-tối-ưu)
   - [Phần 2: Hệ Thống License Key & Xác Thực Phiên](#phần-2-hệ-thống-license-key--xác-thực-phiên)
   - [Phần 3: Động Cơ Bầu Cua Realtime Đa Người Chơi](#phần-3-động-cơ-bầu-cua-realtime-đa-người-chơi)
   - [Phần 4: Đại Tu Mỹ Thuật Pixel Art Dân Gian Độc Bản](#phần-4-đại-tu-mỹ-thuật-pixel-art-dân-gian-độc-bản)
   - [Phần 5: Tích Hợp Đồng Bộ Giao Diện Client](#phần-5-tích-hợp-đồng-bộ-giao-diện-client)
   - [Phần 6: Đóng Gói Docker & Kiến Trúc 1 Cổng Duy Nhất](#phần-6-đóng-gói-docker--kiến-trúc-1-cổng-duy-nhất)
   - [Phần 7: Kiểm Thử Chịu Tải & Đo Đạc RAM Thực Tế](#phần-7-kiểm-thử-chịu-tải--đo-đạc-ram-thực-tế)
3. [Hướng Dẫn Triển Khai Thực Tế Lên VPS & Public Internet (Step-by-Step)](#3-hướng-dẫn-triển-khai-thực-tế-lên-vps--public-internet-step-by-step)
   - [Bước 1: Chuẩn bị VPS & Cài đặt Docker](#bước-1-chuẩn-bị-vps--cài-đặt-docker)
   - [Bước 2: Triển khai ứng dụng chỉ với 1 lệnh](#bước-2-triển-khai-ứng-dụng-chỉ-với-1-lệnh)
   - [Bước 3: Public ra Internet bằng Cloudflare Tunnel (Miễn phí 100%, có HTTPS)](#bước-3-public-ra-internet-bằng-cloudflare-tunnel-miễn-phí-100-có-https)
   - [Bước 4: Quản lý người chơi & Cấp phát Key cho bạn bè](#bước-4-quản-lý-người-chơi--cấp-phát-key-cho-bạn-bè)
4. [Sổ Tay Xử Lý Sự Cố & Vận Hành Bền Bỉ](#4-sổ-tay-xử-lý-sự-cố--vận-hành-bền-bỉ)

---

## 1. KIẾN TRÚC KỸ THUẬT & TỐI ƯU RAM SERVER CỰC HẠN

### Thách thức của máy chủ VPS giá rẻ
- Các VPS giá rẻ thường chỉ có **1 vCPU và 512MB - 1GB RAM**.
- Nếu chạy mô hình phổ thông: Nginx (20MB) + Node.js (150MB) + Socket.io (60MB) + PostgreSQL/MySQL (180MB) + Redis (50MB) ➔ Tổng RAM ngốn hơn **460MB**, chỉ cần vài người truy cập là VPS bị tràn RAM (OOM Crash).

### Bảng so sánh kiến trúc tối ưu đạt chuẩn RAM < 70MB:
| Hạng mục | Giải pháp thông thường (Nặng RAM) | **Giải pháp thiết kế của dự án (Siêu nhẹ)** | Mức tiết kiệm |
| :--- | :--- | :--- | :--- |
| **Cơ sở dữ liệu** | MySQL / PostgreSQL daemon (~180MB) | **SQLite 3 WAL Mode nhúng trực tiếp** (`PRAGMA cache_size = -2000` giới hạn cache 2MB) | **Tiết kiệm 95% RAM** (Chỉ tốn ~8-12MB) |
| **Giao thức mạng** | Socket.io + Engine.io (~60MB + packet overhead) | **Native `ws` WebSocket Engine**, định dạng JSON thu gọn hoặc binary | **Tiết kiệm 75% RAM** (~2-4KB/client) |
| **Cổng phục vụ** | Nginx reverse proxy + Node backend (2 tiến trình riêng) | **Single-Port Architecture**: Node.js tự phục vụ file web tĩnh đã nén + WebSocket trên cùng cổng `3000` | **Tiết kiệm 100% tài nguyên Nginx** |
| **Quản lý bộ nhớ** | Để V8 tự động dọn rác (dễ phình tới 1GB) | Cờ khởi động: `--max-old-space-size=128`, kích hoạt GC sớm | Giữ RAM ổn định **< 60MB - 70MB** |
| **Lưu trữ dữ liệu** | Phụ thuộc bên ngoài | **Docker Volume `./data`**: File `.db` nằm ngoài máy chủ, không bao giờ mất khi restart | An toàn tuyệt đối |

---

## 2. LỘ TRÌNH TRIỂN KHAI CHI TIẾT TỪNG PHẦN (7 GIAI ĐOẠN LOGIC)

Lộ trình được sắp xếp theo đúng trình tự phụ thuộc: **Lõi dữ liệu ➔ Bảo mật/Auth ➔ Động cơ Realtime ➔ Mỹ thuật Pixel ➔ Tích hợp Client ➔ Đóng gói Docker ➔ Kiểm thử nghiệm thu**.

```
  [Phần 1: Backend & DB SQLite]
                 │
                 ▼
  [Phần 2: Key Auth & Quản lý User]
                 │
                 ▼
  [Phần 3: Động cơ Bầu Cua Realtime Server-Authoritative]
                 │
                 ▼
  [Phần 4: Thiết kế Bộ Mỹ Thuật Pixel Art Dân Gian]
                 │
                 ▼
  [Phần 5: Tích hợp Giao diện & Kết nối Client]
                 │
                 ▼
  [Phần 6: Đóng gói Docker & Single-Port Serve]
                 │
  [Phần 3: Vật phẩm Server, Kinh tế & Nhiệm vụ]
                 │
                 ▼
  [Phần 4: Động cơ Bầu Cua Realtime Server-Authoritative]
                 │
                 ▼
  [Phần 5: Thiết kế Bộ Mỹ Thuật Pixel Art Dân Gian]
                 │
                 ▼
  [Phần 6: Tích hợp Giao diện & Kết nối Client]
                 │
                 ▼
  [Phần 7: Đóng gói Docker & Single-Port Serve]
                 │
                 ▼
  [Phần 8: Đo đạc RAM VPS & Public Internet]
```

---

#### PHẦN 1: LÕI BACKEND & DATABASE SQLITE SIÊU TỐI ƯU
*Mục tiêu: Xây dựng nền tảng máy chủ độc lập, không phụ thuộc database ngoài, sẵn sàng xử lý dữ liệu với tốc độ cao.*

1. **Khởi tạo Database SQLite WAL Mode (`server/db.js`)**:
   - Sử dụng `node:sqlite` (tích hợp sẵn trong Node 22) hoặc `better-sqlite3`.
   - Cấu hình tối ưu bộ nhớ: `WAL mode`, `cache_size = -2000` (giới hạn cache 2MB), `temp_store = MEMORY`.
2. **Thiết kế Bảng Dữ Liệu (Schema)**:
   - `access_keys`: Lưu danh sách key, hạn dùng, trạng thái kích hoạt, Xu/Lượng khởi tạo.
   - `users`: Lưu đầy đủ hồ sơ người chơi (nickname, level, exp, xu, luong, energy, appearance, farm_plots, inventory, chickens, quests, stats).
   - `baucua_rounds` & `baucua_bets`: Lưu lịch sử cược và ván xúc xắc.
3. **Cơ chế Tự Động Khởi Tạo Dữ Liệu Mẫu (Auto-Seeding)**:
   - Tự động tạo sẵn một số key mẫu khi chạy lần đầu: `KEY-VIP-8888`, `KEY-TEST-0001`, `KEY-TEST-0002`.

---

### PHẦN 2: HỆ THỐNG LICENSE KEY, PHÂN QUYỀN & GIAO DIỆN ADMIN WEB DASHBOARD
*Mục tiêu: Đảm bảo bảo mật, phân quyền tài khoản Admin, và cung cấp một trang quản trị trực quan ngay trên trình duyệt để Admin quản lý toàn bộ hệ thống mà không cần gõ lệnh terminal.*

1. **Phân Quyền Tài Khoản & Cơ Chế Admin Key (`server/keyManager.js`)**:
   - Thêm cột `role` ('player' | 'admin') vào bảng `access_keys` và `users`.
   - Tạo sẵn mã **Admin Master Key** độc quyền (Ví dụ: `KEY-ADMIN-ROOT-9999`).
   - Khi đăng nhập bằng Admin Key:
     - Giao diện game tự động hiển thị nút biểu tượng **🛡️ Admin Panel** trên góc thanh công cụ.
     - Mở khóa toàn bộ các quyền năng can thiệp hệ thống.

2. **Giao Diện Quản Trị Trực Quan Web (`src/components/AdminModal.tsx`)**:
   - 🔑 **Tab 1: Quản Lý & Sinh Mã Key**:
     - Form sinh key: Chọn số lượng (1, 5, 10, 50 key), đặt tiền khởi tạo (Xu/Lượng), đặt tên người nhận, ghi chú.
     - Bảng tra cứu key: Tìm kiếm, lọc key đang hoạt động / đã khóa, nút Copy 1 chạm để gửi cho bạn bè, nút Khóa (Ban)/Kích hoạt lại.
   - 👥 **Tab 2: Quản Lý Người Chơi & Túi Đồ**:
     - Danh sách tất cả người chơi trong DB kèm trạng thái Online/Offline (xanh/xám).
     - Xem và chỉnh sửa trực tiếp số Xu, Lượng, Level, Exp, Năng lượng của từng người.
     - Nút **Kick Player** (đá người chơi ra khỏi game ngay lập tức) và Khóa tài khoản.
     - Nút **Tặng Quà**: Bơm trực tiếp hạt giống, cá hiếm, cần câu hoặc thời trang vào túi đồ của người chơi.
   - 📊 **Tab 3: Giám Sát Server & Tiêu Thụ RAM VPS**:
     - Hiển thị thông số RAM thực tế: RSS, Heap Used, Heap Total, Tỉ lệ RAM VPS (đảm bảo theo dõi được RAM < 70MB).
     - Số lượng người chơi đang online (CCU).
     - Tình trạng sới Bầu Cua (Ván hiện tại, tổng tiền đang cược trong làng).
   - 📢 **Tab 4: Phát Thông Báo Toàn Server (Global Announcement)**:
     - Soạn tin nhắn thông báo (chạy chữ đỏ/vàng trên đầu màn hình game) gửi tới tất cả người chơi trong tích tắc.
   - 📜 **Tab 5: Lịch Sử Ván Chơi & Nhật Ký Giao Dịch**:
     - Xem kết quả xúc xắc 50 ván Bầu Cua gần nhất, tổng tiền cược của làng và tổng tiền nhà cái đã trả thưởng.

3. **Cơ Chế Kiểm Soát Phiên Duy Nhất (Single Active Session)**:
   - Ngắt kết nối phiên cũ ngay lập tức nếu phát hiện cùng 1 Key đăng nhập từ thiết bị/tab khác (`KICK_DUPLICATE_LOGIN`).

4. **Công Cụ Quản Trị Sinh Key Qua Terminal (`server/scripts/generate_keys.js`)**:
   - Dành cho Admin muốn sinh key nhanh qua dòng lệnh SSH khi không mở web: `node server/scripts/generate_keys.js --count 20 --xu 50000`.


---

#### PHẦN 3: HỆ THỐNG VẬT PHẨM ĐA DẠNG, BẤT ĐỘNG SẢN NHÀ Ở, SHOWROOM XE CỘ & NHIỆM VỤ
*Mục tiêu: Đa dạng hóa trải nghiệm với hơn 50+ vật phẩm, hệ thống mua nhà nâng cấp biệt thự, showroom xe cộ và thú cưỡi lộng lẫy; toàn bộ tài sản lưu thật trên Server; cân bằng kinh tế bền vững và chuỗi nhiệm vụ hấp dẫn.*

3. **Hệ Thống Trao Đổi Buôn Bán Đa Dạng (P2P Trading, Bán Shop & Sàn Chợ Đêm)**:
   - 🏪 **Bán Cho NPC Thương Lái (NPC Shop)**:
     - Bán trực tiếp nông sản thu hoạch, cá câu được, trứng gà, len cừu cho Lái Buôn để nhận Xu ngay lập tức.
   - 🤝 **Giao Dịch Trực Tiếp 1-1 Giữa Người Chơi (P2P Trade Window)**:
     - Click vào bất kỳ người chơi nào tại Công viên / Sới Bầu Cua ➔ Chọn "Giao Dịch".
     - Mở cửa sổ giao dịch 2 bên: Mỗi bên đặt lên các vật phẩm (Cá hiếm, hạt giống, thời trang, phân bón) và số Xu muốn trao đổi.
     - Cơ chế Khóa & Xác Nhận 2 bước chống lừa đảo (Anti-Scam): Khi cả 2 cùng bấm Xác Nhận, Server thực thi Transaction chuyển giao đồ và tiền an toàn 100%.
   - 🎪 **Sàn Giao Dịch / Chợ Đêm Tự Do (Marketplace & Kiot Bày Bán)**:
     - Người chơi có thể tự mở sạp bán đồ: Chọn vật phẩm muốn bán, định giá bán (Ví dụ: Cá Rồng Kim Long giá 6,000 Xu).
     - Người chơi khác dạo chợ bấm "Mua Ngay": Đồ chuyển vào túi người mua, tiền tự động chuyển vào ví người bán (kể cả khi người bán đang offline).

4. **Hệ Thống Bất Động Sản & Nhà Ở Đại Gia (Real Estate System)**:
   - 🏠 **5 Cấp bậc Nhà Ở nâng cấp**:
     - *Nhà Tranh Mái Lá*: Khởi đầu miễn phí, Max Energy 100.
     - *Nhà Ngói Ba Gian Sân Vườn*: 25,000 Xu, Max Energy 130, tốc độ hồi phục năng lượng +30%.
     - *Nhà Phố 2 Tầng Hiện Đại*: 80,000 Xu + 15 Lượng, Max Energy 160, hồi phục năng lượng +60%.
     - *Biệt Thự Vườn Avatar*: 250,000 Xu + 50 Lượng, Max Energy 200, có hồ bơi riêng, gara đỗ siêu xe.
     - *Lâu Đài Hoàng Gia Kim Cương*: 1,000,000 Xu + 200 Lượng, Max Energy 300, hào quang phát sáng đỉnh cao đại gia.
   - **Quyền lợi & Tính năng Nhà ở**:
     - Ngủ trên giường giúp hồi phục thể lực nhanh gấp nhiều lần.
     - Trang trí nội thất pixel: Giường nệm êm, Bàn ghế gỗ mun, Tủ lạnh trữ đồ uống, Tivi màn hình cong, Bể cá rồng phong thủy.
     - Mời bạn bè về thăm nhà và mở tiệc giao lưu.

5. **Showroom Xe Cộ & Thú Cưỡi Sang Trọng (Vehicles & Mounts)**:
   - 🚲 *Xe Đạp Phượng Hoàng*: 2,000 Xu (Tăng 20% tốc độ).
   - 🛵 *Xe Cub 50cc*: 8,000 Xu (Tăng 40% tốc độ, khói pô pixel).
   - 🏍️ *Xe SH Ý / Vespa*: 35,000 Xu + 10 Lượng (Tăng 65% tốc độ).
   - 🏎️ *Siêu Xe Mui Trần Pixel Lambo*: 150,000 Xu + 50 Lượng (Tăng 100% tốc độ, vệt sáng bánh xe).
   - 🛸 *Phi Thuyền Không Gian UFO*: 500,000 Xu + 100 Lượng (Bay lơ lửng, hào quang neon).
   - 🐎 *Ngựa Bạch Mã Thần Thoại*: 300,000 Xu + 80 Lượng (Vó ngựa phát hào quang).


3. **Hệ Thống Vật Phẩm Phong Phú 5 Nhánh Lớn (50+ Vật Phẩm Độc Bản)**:
   - 🌾 *Nông nghiệp*: 15 loại cây trồng (Lúa, Cà rốt, Ngô, Cà chua, Dưa hấu, Hoa sen, Dâu tây hoàng gia, Táo vàng...).
   - 🎣 *Ngư nghiệp*: 16 loài sinh vật (Cá rô, Cá lóc, Tôm càng, Cua Cà Mau, Cá mập, Cá rồng Kim Long, Rùa vàng...).
   - 🐔 *Chăn nuôi*: 4 loài (Gà ri đẻ trứng vàng, Vịt cỏ, Bò sữa Hà Lan, Cừu tuyết cho len).
   - 🧪 *Tiêu hao & Dụng cụ*: Nước giải khát hồi Energy (Trà chanh, Cà phê phin, Bò húc), Phân bón 3 cấp, Cần câu 5 cấp, Mồi câu 4 loại.
   - 👒 *Thời trang Pixel*: 20+ món nón lá, áo bà ba, áo dài, vest công tử, cánh thiên thần/ác ma/tiên nữ.

4. **Xác Thực Hành Động & Chống Hack Chặt Chẽ Từ Server**:
   - `BUY_HOUSE` / `BUY_VEHICLE` / `BUY_SHOP_ITEM` / `SELL_INVENTORY_ITEM` / `PLANT_CROP` / `HARVEST_CROP` / `CATCH_FISH`.

5. **Hệ Thống Nhiệm Vụ Hằng Ngày Đa Dạng (`server/questEngine.js`)**:
   - Tự động reset mỗi ngày, theo dõi tiến trình tự động từ server (Nông nghiệp, Ngư nghiệp, Chăn nuôi, Bầu Cua, Lái xe, Mua sắm), phát thưởng Xu + Exp.



---

### PHẦN 4: ĐỘNG CƠ BẦU CUA REALTIME ĐA NGƯỜI CHƠI
*Mục tiêu: Tái hiện trọn vẹn cảm giác quây quần bên chiếu Bầu Cua ngoài đời thực.*

1. **State Machine Chu Kỳ Ván Chơi (Vòng lặp 41 giây liên tục)**:
   - **Giai đoạn 1: Đặt Cược (25 giây)**:
     - Mở nhận cược.
     - Người chơi đặt cược ➔ Server trừ tiền tạm giữ, cập nhật tổng cược của làng và cược của riêng người đó.
     - Bắn sự kiện realtime cho toàn bộ người trong phòng: Hiển thị cọc tiền/chip bay vào ô linh vật.
   - **Giai đoạn 2: Lắc Bát Đĩa Kín (4 giây)**:
     - Đóng cổng cược (không nhận thêm bất kỳ cược nào).
     - Server sinh kết quả 3 viên xúc xắc ngẫu nhiên (sử dụng thuật toán chống gian lận).
     - Gửi lệnh cho toàn bộ client chạy animation đĩa sứ lắc rung chuyển cùng âm thanh xóc lách cách.
   - **Giai đoạn 3: Nặn Bát / Kéo Nắp Tương Tác (7 giây)**:
     - Bát vẫn úp kín trên đĩa.
     - Cho phép người chơi tự dùng chuột/ngón tay chạm vuốt kéo nắp bát hé lộ góc xúc xắc để tạo cảm giác nghẹt thở.
     - Hết 7s: Nắp tự động bật mở hoàn toàn, 3 viên xúc xắc phát sáng.
   - **Giai đoạn 4: Trả Thưởng & Vinh Danh (5 giây)**:
     - Tính toán tiền thắng theo công thức chuẩn dân gian: Hoàn lại tiền cược + thưởng theo số mặt xuất hiện (x1, x2, x3).
     - Thực hiện cập nhật số dư vào DB qua SQLite Transaction đảm bảo toàn vẹn dữ liệu.
     - Thông báo vinh danh người thắng lớn lên kênh chat chung.
     - Lưu kết quả ván vào bảng lịch sử soi cầu.
2. **Heartbeat & Tự Giải Phóng RAM**:
   - Kiểm tra kết nối mỗi 15 giây. Nếu client mất kết nối, giải phóng ngay bộ nhớ tạm của người chơi đó ra khỏi RAM.

---

### PHẦN 4: ĐẠI TU MỸ THUẬT PIXEL ART DÂN GIAN ĐỘC BẢN
*Mục tiêu: Thoát khỏi hình ảnh AI phẳng chung chung, kiến tạo phong cách 16-bit retro ấm cúng.*

1. **Hệ Thống Asset Pixel 6 Linh Vật Bầu Cua (48x48 / 64x64)**:
   - 🍐 **Bầu (Gourd)**: Quả bầu hồ lô vàng ươm thắt eo dải lụa đỏ, đổ bóng pixel nổi khối.
   - 🦀 **Cua (Crab)**: Cua đồng mai đỏ gạch giương 2 càng oai vệ.
   - 🦐 **Tôm (Shrimp)**: Tôm càng xanh mướt uốn cong, râu tôm pixel mềm mại.
   - 🐟 **Cá (Fish)**: Cá chép hoa văn vảy ánh bạc pha đỏ may mắn.
   - 🐓 **Gà (Rooster)**: Gà trống lửa dũng mãnh, mào đỏ tươi, đuôi xòe lông ngũ sắc.
   - 🦌 **Nai (Stag)**: Chú nai vàng rừng sâu quý phái với cặp sừng nhung phân nhánh.
2. **Bộ Bát Đĩa Sành Sứ & Xúc Xắc Isometric Pixel**:
   - Chiếc đĩa tròn tráng men hoa sen màu lam cổ truyền.
   - Nắp bát sứ có núm cầm tròn, hỗ trợ kéo trượt mượt mà khi người chơi "nặn".
   - 3 viên xúc xắc vẽ theo góc nhìn Isometric 3D pixel nhìn thấy rõ các mặt.
3. **Hệ Thống Chip Cược & Đồng Xu Pixel**:
   - Chip tiền phỏng theo đồng xu thời phong kiến đúc rỗng vuông ở giữa (các mệnh giá 50, 100, 500, 1.000, 5.000 Xu).
   - Hiệu ứng xu vàng bay và hiệu ứng nổ pháo hoa pixel ăn mừng.
4. **Phông Chữ & Styling Pixelated**:
   - Tích hợp phông chữ pixel hiển thị sắc nét tiếng Việt có dấu.
   - CSS `image-rendering: pixelated;` và đường viền nẹp gỗ pixel (`box-shadow` nổi khối không khử răng cưa).

---

### PHẦN 5: TÍCH HỢP ĐỒNG BỘ GIAO DIỆN CLIENT
*Mục tiêu: Đưa toàn bộ dữ liệu thật từ Server lên giao diện người dùng.*

1. **Cải Tạo Giao Diện Đăng Nhập (`LoginModal.tsx`)**:
   - Bỏ form đăng nhập giả lập `localStorage`.
   - Cung cấp ô nhập **Mã Key Truy Cập** nổi bật phong cách retro.
   - Hiển thị gợi ý các key mẫu cho người mới thử nghiệm.
   - Gọi API xác thực `POST /api/auth/login-key` nhận hồ sơ thật và Session Token.
2. **Cải Tạo Bàn Chơi Bầu Cua (`MiniGameArea.tsx`)**:
   - Kết nối tới WebSocket phòng Bầu Cua.
   - Hiển thị đồng hồ đếm ngược đồng bộ toàn bộ người chơi theo Server.
   - Bổ sung bảng cược làng: Nhìn thấy tổng cược của cả làng và cược của bản thân.
   - Tích hợp component `BauCuaBowl` với tính năng kéo nắp bát nặn xúc xắc bằng chuột hoặc cảm ứng trên điện thoại.
   - Bảng lịch sử cầu (hiển thị 10 ván gần nhất để người chơi soi cầu).
3. **Đồng Bộ Số Dư Tài Khoản Thực Tế**:
   - Cập nhật số dư Xu/Lượng trên thanh TopBar ngay khi thắng/thua cược mà không cần reload trang.

---

### PHẦN 6: ĐÓNG GÓI DOCKER & KIẾN TRÚC 1 CỔNG DUY NHẤT
*Mục tiêu: Đơn giản hóa triển khai, chỉ cần 1 lệnh là chạy toàn bộ hệ thống.*

1. **Viết `Dockerfile` Multi-Stage Tối Ưu Dung Lượng**:
   - Stage 1: Build React Vite thành các file HTML/JS/CSS tĩnh tối ưu.
   - Stage 2: Sử dụng base image `node:22-alpine` (dung lượng < 150MB).
   - Copy mã nguồn server và file build frontend vào container.
   - Thiết lập biến môi trường khống chế RAM: `ENV NODE_OPTIONS="--max-old-space-size=128"`.
2. **Viết `server/index.js` Phục Vụ Cả Web & WebSocket (Single Port `3000`)**:
   - Express nhẹ phục vụ thư mục `dist/` (web giao diện).
   - Gắn WebSocket Server (`ws`) trực tiếp lên cùng HTTP Server đó.
   - Lợi ích: **Chỉ cần mở đúng 1 cổng `3000`**, không cần cài đặt thêm Nginx, không bị lỗi CORS.
3. **Viết `docker-compose.yml` Chuẩn Sản Phẩm**:
   - Cấu hình port mapping: `3000:3000`.
   - Cấu hình mount volume: `./data:/app/data` (Bảo toàn database SQLite).
   - Giới hạn RAM cứng cho container: `memory: 256M` (Không bao giờ làm treo VPS của bạn).
   - Đính kèm sẵn dịch vụ **Cloudflare Tunnel (`cloudflared`)** (tùy chọn bật tắt bằng 1 dòng).

---

### PHẦN 7: KIỂM THỬ CHỊU TẢI & ĐO ĐẠC RAM THỰC TẾ
*Mục tiêu: Đảm bảo game chạy mượt mà, không giật lag và không rò rỉ bộ nhớ.*

1. **Kiểm Thử Đồng Bộ Đa Người Chơi**:
   - Mở 2 trình duyệt riêng biệt với 2 mã Key khác nhau.
   - Kiểm tra: Khi người chơi A đặt cược ➔ Người chơi B nhìn thấy ngay cọc tiền bay vào ô và số tiền làng tăng lên.
   - Kiểm tra: Kết quả lắc xúc xắc và thời gian mở bát đồng bộ 100% trên cả 2 màn hình.
2. **Kiểm Thử Chống Đăng Nhập Trùng**:
   - Đăng nhập cùng 1 Key ở tab thứ hai ➔ Tab thứ nhất lập tức bị ngắt kết nối kèm thông báo.
3. **Đo Đạc Bộ Nhớ RAM**:
   - Chạy lệnh `docker stats` để xác nhận RAM sử dụng thực tế **dưới 60MB - 70MB**.

---

## 3. HƯỚNG DẪN TRIỂN KHAI THỰC TẾ LÊN VPS & PUBLIC INTERNET (STEP-BY-STEP)

Dưới đây là cẩm nang chi tiết từng bước để bạn đưa game từ máy tính cá nhân lên VPS và mở cho mọi người chơi.

### BƯỚC 1: CHUẨN BỊ VPS & CÀI ĐẶT DOCKER
Nếu VPS của bạn (Ubuntu/Debian) chưa có Docker, hãy kết nối SSH vào VPS và chạy các lệnh sau:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Docker & Docker Compose plugin chính thức
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Cho phép chạy Docker không cần quyền root (tùy chọn)
sudo usermod -aG docker $USER
```

---

### BƯỚC 2: TRIỂN KHAI ỨNG DỤNG CHỈ VỚI 1 LỆNH

1. **Tải mã nguồn lên VPS**:
   - Có thể dùng Git clone hoặc dùng WinSCP/FileZilla copy toàn bộ thư mục dự án lên VPS (ví dụ đặt tại `/root/gamevps`).
2. **Khởi động hệ thống**:
   ```bash
   cd /root/gamevps
   docker compose up -d --build
   ```
3. **Kiểm tra trạng thái**:
   ```bash
   docker compose ps
   docker stats
   ```
   *Bạn sẽ thấy container `game-server` chạy ổn định với mức RAM chỉ dao động từ **35MB - 55MB**!*

---

### BƯỚC 3: PUBLIC RA INTERNET BẰNG CLOUDFLARE TUNNEL (MIỄN PHÍ 100%, CÓ HTTPS)

Đây là cách hiện đại và an toàn nhất hiện nay để đưa game ra ngoài Internet:
- **Không cần mở bất kỳ port nào trên modem hay VPS**.
- **Không bị lộ địa chỉ IP thật của VPS** (Tránh hoàn toàn nguy cơ bị dò quét, tấn công DDoS).
- **Tự động có chứng chỉ bảo mật HTTPS và WSS** (kết nối WebSocket an toàn trên mọi trình duyệt).

#### Cách làm cực kỳ đơn giản (mất 2 phút):
1. Truy cập trang web miễn phí của Cloudflare: [one.dash.cloudflare.com](https://one.dash.cloudflare.com/) (Cloudflare Zero Trust).
2. Vào mục **Networks** ➔ **Tunnels** ➔ Nhấn **Create a Tunnel**.
3. Đặt tên (ví dụ: `game-baucua`), chọn môi trường là **Docker**.
4. Cloudflare sẽ cấp cho bạn một chuỗi mã Token dài (ví dụ: `eyJhIjoiYm...`).
5. Mở file `.env` hoặc `docker-compose.yml` trên VPS, điền mã token vào:
   ```yaml
   TUNNEL_TOKEN=eyJhIjoiYm...
   ```
6. Chạy lệnh:
   ```bash
   docker compose up -d
   ```
7. Trên giao diện Cloudflare, tại phần **Public Hostnames**:
   - Gắn tên miền của bạn (ví dụ: `game.tenmiencuaban.com`).
   - Chọn Service Type: `HTTP` và URL: `game:3000`.

➔ **Xong!** Ngay lập tức người chơi trên toàn thế giới có thể truy cập vào `https://game.tenmiencuaban.com` để chơi game mượt mà!

*(Nếu bạn không có tên miền riêng, Cloudflare cũng hỗ trợ link tạm thời Quick Tunnel hoàn toàn miễn phí).*

---

### BƯỚC 4: QUẢN LÝ NGƯỜI CHƠI & CẤP PHÁT KEY CHO BẠN BÈ

Để tạo thêm các mã Key mới cho bạn bè hoặc người chơi mới, bạn chỉ cần gõ lệnh trực tiếp vào container:

```bash
# Tạo 10 key mới, mỗi key có sẵn 50,000 Xu và 20 Lượng
docker compose exec game node server/scripts/generate_keys.js --count 10 --xu 50000 --luong 20

# Tạo 1 key VIP đặc biệt
docker compose exec game node server/scripts/generate_keys.js --key "KEY-VIP-TIENDAT" --xu 500000 --luong 100
```
Lệnh sẽ in ra danh sách mã Key. Bạn chỉ cần gửi mã Key đó cho người chơi để họ đăng nhập vào game!

---

## 4. SỔ TAY XỬ LÝ SỰ CỐ & VẬN HÀNH BỀN BỈ

1. **Xem nhật ký hoạt động (Logs)**:
   ```bash
   docker compose logs -f game
   ```
2. **Sao lưu dữ liệu (Backup Database)**:
   - Toàn bộ dữ liệu nằm trong thư mục `./data/game.db` trên VPS.
   - Bạn chỉ cần copy file `game.db` này cất đi là toàn bộ tài khoản, số dư, lịch sử ván chơi được bảo toàn nguyên vẹn 100%.
3. **Cập nhật code mới khi có thay đổi**:
   ```bash
   git pull
   docker compose up -d --build
   ```
   *Dữ liệu người chơi không hề bị ảnh hưởng khi rebuild lại container.*
