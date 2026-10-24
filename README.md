# My Princess Plan 👑💕

Ứng dụng lập kế hoạch hẹn hò siêu dễ thương dạng **PWA (Progressive Web App)** chạy mượt trên cả **PC & Mobile**, hỗ trợ kéo thả Sticker vào khung giờ, dán tự do Sticker trang trí, gửi Giấy nhớ (Sticky Notes) kèm hình ảnh biểu cảm AI dễ thương/hài hước, hiệu ứng âm thanh Web Audio và đồng bộ đa nền tảng theo **Mã Phòng (PIN)**.

## ✨ Tính năng nổi bật

1. **4 Bộ Sticker & Biểu cảm Đáng Yêu (AI-Generated + Kawaii Badges)**:
   - 👑 **Công Chúa & Hoàng Tử Chibi**: Rước nàng, chạy xe tay ga hồng, tặng hoa, lên đồ xinh...
   - 🐰🐻 **Thỏ Trắng & Gấu Nâu**: Ôm nạp năng lượng, ăn sập phố, cõng nàng, gắp thú bông...
   - 🧋 **Hoạt Động Hẹn Hò**: Trà sữa full topping, lẩu/nướng BBQ, xem phim rạp, chụp Photobooth, workshop làm gốm, ngắm hoàng hôn...
   - 🥺 **Biểu Cảm Lầy Lội / Đáng Yêu**: Giận dỗi đòi quà, Năn nỉ chốt đơn, Chốt đơn hào hứng 1000%, Ngủ nướng cao su, Thẻ đen bao nuôi...
2. **Giao diện Kéo Thả (Drag & Drop) + Chạm Để Thả Nhanh (Mobile-Friendly)**:
   - Kéo thả Sticker hoạt động vào các khung giờ (**Buổi Sáng, Buổi Trưa, Buổi Chiều, Buổi Tối** hoặc tự tạo khung giờ mới).
   - **Dán Sticker Tự Do (Scrapbook Canvas)**: Dán và nắm kéo các sticker trang trí ở bất kỳ đâu trên bảng lịch trình.
3. **Gửi Giấy Nhớ (Sticky Notes) & Sắc Lệnh Công Chúa**:
   - Đính kèm hình ảnh biểu cảm nhân vật, chọn màu giấy Pastel và gắn trực tiếp vào từng khung giờ hoặc Góc nhắn nhủ chung.
   - Nút **"👑 Công Chúa Chốt Đơn!"** bắn pháo hoa Confetti + âm thanh Fanfare Hoàng Gia.
   - Nút **"😤 Đòi Đổi Kèo"** và **"🧋 Đút Lót Trà Sữa"**.
4. **Hiệu ứng Âm thanh & Nhạc hộp (Web Audio API)**:
   - Tiếng *Pop*, *Boing*, *Chime*, *Fanfare*, *Pout* và nhạc nền hộp nhạc Pastel nhẹ nhàng bật/tắt tùy ý.
5. **Đồng bộ Đa Nền Tảng (PIN + Firebase Realtime / Share Link)**:
   - Chia sẻ nhanh qua đường link có chứa Mã Phòng (`?pin=CONGCHUA`).
   - Hỗ trợ đồng bộ Realtime tức thì qua **Firebase Firestore** (cấu hình qua biến môi trường Vercel hoặc dán trực tiếp trong mục **⚙️ Cài Đặt** của App).

---

## 🚀 Hướng dẫn Chạy Thử trên Máy (Local)

```bash
npm install
npm run dev
```

---

## 🌐 Hướng dẫn Upload lên GitHub & Deploy lên Vercel

1. **Đẩy code lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: My Princess Plan PWA"
   git branch -M main
   git remote add origin https://github.com/<ten-tai-khoan>/<ten-repo>.git
   git push -u origin main
   ```
2. **Deploy lên Vercel**:
   - Truy cập [vercel.com](https://vercel.com) -> **Add New Project** -> Chọn repo GitHub vừa tạo.
   - Framework Preset: **Vite** (Vercel sẽ tự động nhận diện từ `vercel.json` và `package.json`).
   - *(Tùy chọn)* Để bật đồng bộ Realtime tự động cho mọi thiết bị mà không cần dán trong UI, thêm các biến **Environment Variables** từ Firebase Project của bạn:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
   - Bấm **Deploy** là xong!
