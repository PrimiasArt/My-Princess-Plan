import { AppLanguage, StickyNoteItem } from '../types/plan';
import { STICKERS } from '../data/stickers';

const LANG_STORAGE_KEY = 'princess_plan_language';

export function getSavedLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'vi';
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang === 'th' || urlLang === 'vi') {
    localStorage.setItem(LANG_STORAGE_KEY, urlLang);
    return urlLang;
  }
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === 'th' ? 'th' : 'vi';
}

export function setSavedLanguage(lang: AppLanguage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang === 'th' ? 'th' : 'vi';
}

// Bidirectional phrase dictionary for default/sample plan contents
const PHRASE_PAIRS: Array<[string, string]> = [
  ['Hoàng Tử 🤴', 'เจ้าชาย 🤴'],
  ['Công Chúa 👸', 'เจ้าหญิง 👸'],
  ['Lịch Trình Cưng Chiều Công Chúa 👑✨', 'แพลนตามใจเจ้าหญิงสุดที่รัก 👑✨'],
  ['Foodtour Ăn Sập Phố Cùng Nàng 🧋🍲', 'ตะลุยกินของอร่อยทั่วเมืองกับหวานใจ 🧋🍲'],
  ['Kế Hoạch Đi Chơi Mới 💕', 'แพลนเดทใหม่สุดน่ารัก 💕'],
  ['Tone Hồng Pastel / Trắng Tinh Khôi 👗🌸', 'โทนชมพูพาสเทล / ขาวละมุน 👗🌸'],
  ['Đồ đôi năng động thoải mái 👕👟', 'ชุดคู่รักสบายๆ สุดคิวท์ 👕👟'],
  ['Đang hóng đi chơi 1000% 🤩💕', 'ตื่นเต้นอยากไปเที่ยว 1000% 🤩💕'],
  ['Đói bụng meo meo sẵn sàng càn quét 🤤🍢', 'หิวโซพร้อมตะลุยกินทุกอย่างแล้ว 🤤🍢'],
  [
    'Đang chờ Công chúa đóng dấu phê duyệt lịch trình này nha! 👑',
    'กำลังรอเจ้าหญิงประทับตราอนุมัติแพลนเดทนี้อยู่นะคะ! 👑',
  ],
  [
    '👑 Công chúa đã duyệt kèo đi ăn sập phố! Nhớ chuẩn bị bụng đói nha! 💖',
    '👑 เจ้าหญิงอนุมัติทริปตะลุยกินแล้ว! เตรียมท้องให้ว่างไว้ได้เลยน้า! 💖',
  ],
  ['Buổi Sáng Ngọt Ngào', 'ช่วงเช้าแสนหวาน'],
  ['Buổi Trưa Nạp Năng Lượng', 'มื้อเที่ยงเติมพลัง'],
  ['Buổi Chiều Vui Chơi', 'ช่วงบ่ายตะลอนเที่ยว'],
  ['Buổi Tối Lãng Mạn', 'มื้อค่ำสุดโรแมนติก'],
  ['Buổi Chiều Khởi Động', 'ช่วงบ่ายเริ่มต้นความอร่อย'],
  ['Buổi Tối Ăn Ngon Hết Mình', 'มื้อค่ำจัดเต็มพุงกาง'],
  ['Khung giờ tự chọn', 'ช่วงเวลาพิเศษ'],
  ['Đón tận cửa nhà Công chúa 🏰', 'รับถึงหน้าบ้านเจ้าหญิง 🏰'],
  [
    'Mang sẵn nón bảo hiểm xinh + 1 ly trà sữa ít đá làm quà khởi động!',
    'เตรียมหมวกกันน็อคน่ารักๆ + ชานมไข่มุกหวานน้อยมาฝากเป็นรางวัลเริ่มต้นวัน!',
  ],
  ['Tiệm Cafe Pastel Garden 🌸', 'คาเฟ่ Pastel Garden สุดคิวท์ 🌸'],
  [
    'Chụp ảnh góc ban công ngập nắng cho Công chúa đăng story.',
    'ถ่ายรูปมุมระเบียงแสงสวยๆ ให้เจ้าหญิงเอาไปลงสตอรี่ไอจี',
  ],
  ['Nhà hàng Lẩu & Nướng Hàn Quốc 🥩', 'ร้านปิ้งย่างเกาหลี & ชาบูหม้อไฟ 🥩'],
  [
    'Hoàng tử phụ trách nướng thịt và pha nước chấm chuẩn vị.',
    'เจ้าชายรับหน้าที่ปิ้งหมูและปรุงน้ำจิ้มรสเด็ดให้เจ้าหญิง',
  ],
  ['Photo Time Studio 🎞️', 'สตูดิโอถ่ายรูป Photo Time 🎞️'],
  [
    'Đội băng đô tai thỏ & vương miện chụp 2 tấm 4-cuts siêu lầy!',
    'ใส่ที่คาดผมหูกระต่ายและมงกุฎ ถ่ายรูป 4 ช่องสุดกวนด้วยกัน!',
  ],
  ['Tiệm Trà Sữa Yêu Thích 🧋', 'ร้านชานมไข่มุกร้านโปรด 🧋'],
  [
    '70% đường, ít đá, thêm kem cheese và trân châu trắng.',
    'หวาน 70% น้ำแข็งน้อย เพิ่มครีมชีสและไข่มุกบุกเคี้ยวหนึบ',
  ],
  ['Cung đường ven hồ hóng gió 🛵', 'ถนนเลียบทะเลสาบรับลมเย็นๆ 🛵'],
  [
    'Chạy chầm chậm ngắm đèn phố buổi tối & nói chuyện trên trời dưới đất.',
    'ขับรถช้าๆ ชมไฟประดับยามค่ำคืนและคุยกันไปตลอดทาง',
  ],
  ['Rạp chiếu phim ghế đôi Sweetbox 🍿', 'โรงภาพยนตร์ที่นั่งคู่ Sweetbox 🍿'],
  [
    'Nhớ mang theo áo khoác mỏng kẻo trong rạp máy lạnh hơi lạnh nha!',
    'อย่าลืมพกเสื้อคลุมบางๆ ไปด้วยน้า ในโรงหนังแอร์เย็นฉ่ำ!',
  ],
  ['Khu vui chơi Arcade Center 🧸', 'โซนตู้คีบตุ๊กตา Arcade Center 🧸'],
  ['Tiệm Kem Gelato Phố Đi Bộ 🍦', 'ร้านไอศกรีมเจลาโต้ถนนคนเดิน 🍦'],
  [
    'Công chúa nhớ mang theo chiếc kẹp tóc nơ hồng mới mua nha, hôm nay mình chụp thật nhiều ảnh xinh! 📸💕',
    'เจ้าหญิงอย่าลืมพกกิ๊บติดผมโบว์สีชมพูอันใหม่มานะคะ วันนี้เราจะถ่ายรูปสวยๆ กันเยอะๆ เลย! 📸💕',
  ],
  [
    'Cho em xin phép trễ 10 phút để uốn tóc nha! Mà qua đón nhớ có trà sữa đút lót đó hihi 🧋😤',
    'ขออนุญาตเลท 10 นาทีม้วนผมสวยๆ นะคะ! ตอนมารับอย่าลืมชานมไข่มุกมาติดสินบนด้วยล่ะ ฮิฮิ 🧋😤',
  ],
  [
    'Mọi chi phí ăn chơi hôm nay đã có Thẻ Đen của Hoàng tử tài trợ 100%, Công chúa chỉ cần cười thật tươi thôi! 💳✨',
    'ค่าใช้จ่ายเที่ยววันนี้บัตรดำของเจ้าชายเปย์ให้ 100% เลยครับ เจ้าหญิงแค่ยิ้มหวานๆ ก็พอ! 💳✨',
  ],
  [
    'Hôm nay đi bộ nhiều mỏi chân là Gấu nâu phải cõng Thỏ trắng về đó nha! 🐻🐰💕',
    'วันนี้เดินเยอะถ้าเมื่อยขา พี่หมีต้องให้ต้าวกระต่ายขี่หลังกลับบ้านด้วยน้า! 🐻🐰💕',
  ],
  ['Vừa xong', 'เมื่อสักครู่'],
  ['Lưu ý quan trọng 📌', 'โน้ตสำคัญมาก 📌'],
  ['Sắc lệnh Hoàng Gia 👑', 'ประกาศิตเจ้าหญิง 👑'],
  ['Sắc lệnh Công Chúa 👑', 'ประกาศิตเจ้าหญิง 👑'],
  ['Đừng quên nha 💕', 'ห้ามลืมเด็ดขาดน้า 💕'],
  ['Order trà sữa 🧋', 'ออเดอร์ชานมไข่มุก 🧋'],
  ['Mặc đồ xinh 👗', 'แต่งตัวสวยๆ น้า 👗'],
  ['Năn nỉ chốt đơn 🥺', 'อ้อนขออนุมัติแพลน 🥺'],
  ['Thương nhau 1000% 💕', 'รักกัน 1000% เลย 💕'],
  ['Hóng tới ngày mai quá!', 'ตื่นเต้นอยากให้ถึงพรุ่งนี้เร็วๆ จัง!'],
  ['Ghi chú lịch trình dễ thương 💕', 'โน้ตกิจกรรมสุดน่ารัก 💕'],
  ['60 phút', '60 นาที'],
];

// Add all sticker VI <-> TH pairs automatically
for (const st of STICKERS) {
  PHRASE_PAIRS.push([st.name, st.nameTh]);
  PHRASE_PAIRS.push([st.subtitle, st.subtitleTh]);
  if (st.defaultNote && st.defaultNoteTh) {
    PHRASE_PAIRS.push([st.defaultNote, st.defaultNoteTh]);
  }
  if (st.defaultDuration && st.defaultDurationTh) {
    PHRASE_PAIRS.push([st.defaultDuration, st.defaultDurationTh]);
  }
}

const VI_TO_TH_MAP = new Map<string, string>(PHRASE_PAIRS.map(([vi, th]) => [vi, th]));
const TH_TO_VI_MAP = new Map<string, string>(PHRASE_PAIRS.map(([vi, th]) => [th, vi]));

export function localizeDynamicText(text: string | undefined, lang: AppLanguage): string {
  if (!text) return '';
  if (lang === 'th') {
    return VI_TO_TH_MAP.get(text) ?? text;
  }
  return TH_TO_VI_MAP.get(text) ?? text;
}

export const QUICK_NOTE_TEMPLATES: Record<AppLanguage, string[]> = {
  vi: [
    'Qua đón em nhớ mang theo trà sữa ít đá 70% đường nha! 🧋💕',
    'Hôm nay Công chúa mặc váy xinh lắm, nhớ chuẩn bị chụp 500 tấm ảnh nha! 📸👗',
    'Cho em xin phép cao su 15 phút để uốn tóc nha hihi 😴🌸',
    'Đi chơi mỏi chân là Hoàng tử phải cõng Công chúa đó! 🐻🐰',
    'Mọi chi phí hôm nay để Hoàng tử lo hết, Nàng chỉ việc vui thôi! 💳✨',
  ],
  th: [
    'ตอนมารับอย่าลืมซื้อชานมไข่มุกหวาน 70% น้ำแข็งน้อยมาฝากด้วยน้า! 🧋💕',
    'วันนี้เจ้าหญิงแต่งตัวจัดเต็ม เตรียมถ่ายรูปให้ 500 รูปเลยนะ! 📸👗',
    'ขออนุญาตเลท 15 นาทีม้วนผมแต่งหน้าแป๊บนึงนะคะ ฮิฮิ 😴🌸',
    'ถ้าเดินเที่ยวเมื่อยขา เจ้าชายต้องให้เจ้าหญิงขี่หลังด้วยน้า! 🐻🐰',
    'ทริปนี้เจ้าชายสายเปย์ดูแลให้หมดเลย เจ้าหญิงแค่ยิ้มหวานๆ ก็พอ! 💳✨',
  ],
};

export const NOTE_TAGS_BY_LANG: Record<AppLanguage, string[]> = {
  vi: [
    'Lưu ý quan trọng 📌',
    'Sắc lệnh Công Chúa 👑',
    'Đừng quên nha 💕',
    'Order trà sữa 🧋',
    'Mặc đồ xinh 👗',
    'Năn nỉ chốt đơn 🥺',
  ],
  th: [
    'โน้ตสำคัญมาก 📌',
    'ประกาศิตเจ้าหญิง 👑',
    'ห้ามลืมเด็ดขาดน้า 💕',
    'ออเดอร์ชานมไข่มุก 🧋',
    'แต่งตัวสวยๆ น้า 👗',
    'อ้อนขออนุมัติแพลน 🥺',
  ],
};

export const NOTE_COLOR_LABELS: Record<
  AppLanguage,
  Record<StickyNoteItem['color'], string>
> = {
  vi: {
    pink: 'Hồng Dâu 🍓',
    yellow: 'Vàng Bơ 🧈',
    mint: 'Xanh Mint 🌱',
    lavender: 'Tím Mộng Mơ 💜',
    peach: 'Cam Đào 🍑',
  },
  th: {
    pink: 'ชมพูสตรอว์เบอร์รี 🍓',
    yellow: 'เหลืองเนยสด 🧈',
    mint: 'เขียวมิ้นท์ 🌱',
    lavender: 'ม่วงลาเวนเดอร์ 💜',
    peach: 'ส้มพีช 🍑',
  },
};

export const UI_TEXT = {
  vi: {
    appSubtitle: 'Kéo thả lịch trình hẹn hò',
    pwaBadge: 'PWA Couple Planner 💕',
    roomPinLabel: 'Mã Phòng',
    roomPinTooltip: 'Đổi mã phòng PIN hoặc cài đặt đồng bộ Firebase',
    shareBtn: 'Gửi Cho Nàng',
    copiedBtn: 'Đã Copy Link!',
    muteTooltip: 'Tắt hiệu ứng âm thanh',
    unmuteTooltip: 'Bật hiệu ứng âm thanh',
    bgmOn: 'Nhạc: Bật',
    bgmOff: 'Nhạc nền',
    bgmTooltip: 'Bật/tắt nhạc hộp dễ thương',
    installAppBtn: 'Cài App',
    installAppTooltip: 'Cài đặt App về điện thoại / máy tính',
    holdingSticker: 'Đang cầm Sticker:',
    holdingHint: 'Chạm vào nút "+ Thả vào khung giờ này" bên dưới hoặc dán tự do lên bảng!',
    floatActionBtn: '✨ Dán Tự Do Lên Bảng',
    cancelSelectBtn: 'Bỏ chọn',
    newPlanBtn: 'Tạo Plan Ngày Mới',
    deletePlanBtn: 'Xóa Plan này',
    confirmDeletePlan: 'Xóa kế hoạch',
    planTitlePlaceholder: 'Tên buổi hẹn hò...',
    dateLabel: 'Ngày hẹn hò',
    startTimeLabel: 'Giờ xuất phát',
    dressCodeLabel: 'Dress Code',
    dressCodePlaceholder: 'Tone màu trang phục...',
    princessMoodLabel: 'Mood của Nàng',
    princessMoodPlaceholder: 'Tâm trạng hôm nay...',
    statusApproved: 'ĐÃ DUYỆT PLAN 👑',
    statusRevision: 'ĐÒI ĐỔI KÈO 😤',
    statusPending: 'CHỜ CÔNG CHÚA DUYỆT',
    approveBtn: 'Công Chúa Chốt Đơn!',
    revisionBtn: '😤 Đòi Đổi Kèo',
    revisionTooltip: 'Yêu cầu đổi món hoặc đòi thêm kèo',
    bobaTooltip: 'Đút lót thêm 1 ly trà sữa!',
    stickerVaultTitle: 'Kho Sticker Đáng Yêu (32+)',
    stickerVaultSubtitle: 'Kéo thả vào khung giờ hoặc chạm để chọn nhanh!',
    sendNoteBtn: '+ Gửi Note',
    searchStickerPlaceholder: 'Tìm sticker: trà sữa, lẩu, dỗi, rước nàng...',
    stickyWallTitle: 'Góc Giấy Nhớ & Dặn Dò Chú Ý Cho Plan',
    stickyWallSubtitle: 'Gửi lời nhắn kèm biểu cảm đáng yêu hoặc sắc lệnh của Công Chúa!',
    writeNewNoteBtn: 'Viết Giấy Nhớ Mới',
    emptyNotesText: 'Chưa có giấy nhớ nào! Hãy bấm "Viết Giấy Nhớ Mới" để dặn dò người ấy nha 💕',
    fromLabel: 'Từ:',
    deleteNoteTooltip: 'Xóa giấy nhớ',
    timelineTitle: '🗓️ Khung Giờ Lịch Trình Đi Chơi',
    timelineSubtitle:
      'Kéo thả Sticker hoạt động vào từng buổi, hoặc kéo các Sticker nổi trang trí quanh bảng!',
    addSlotBtn: 'Thêm Khung Giờ',
    floatingCountLabel: '✨ Sticker trang trí đang dán trên bảng',
    floatingDragHint: '(Bạn có thể nắm kéo các sticker nổi bên dưới tới bất kỳ vị trí nào!)',
    removeFloatingTooltip: 'Gỡ sticker này',
    dropHereBtnPrefix: '+ Thả',
    dropHereBtnSuffix: 'vào đây!',
    attachSlotNoteBtn: '📌 Gắn Note',
    deleteSlotTooltip: 'Xóa khung giờ này',
    emptySlotTitle: '✨ Kéo thả Sticker hoạt động vào khung giờ này!',
    emptySlotSubtitle: '(Hoặc chạm chọn 1 Sticker bên kho rồi bấm vào đây)',
    addedByLabel: 'Thêm bởi:',
    timeRangePlaceholder: 'Khung giờ...',
    locationPlaceholder: 'Nhập địa điểm / quán ăn...',
    activityNotePlaceholder: 'Ghi chú nhỏ cho hoạt động này...',
    heartTooltip: 'Thả tim yêu thích hoạt động này',
    deleteActivityTooltip: 'Xóa hoạt động',
    waitingDate: 'Đang chờ chọn ngày hẹn 💕',
    dateArrived: '🎉 Đã tới giờ đi chơi cùng Công Chúa rồi!',
    countdownPrefix: 'Còn',
    daysUnit: 'ngày',
    hoursUnit: 'g',
    minsUnit: 'p',
    secsUnit: 's',
    approvedMsgTemplate: (name: string, time: string) =>
      `👑 ${name} đã CHỐT ĐƠN 100 điểm lúc ${time}! Hóng tới ngày đi chơi quá đi! 💖`,
    revisionDefaultMsg:
      'Công chúa yêu cầu bổ sung thêm trà sữa và kèo ăn vặt trước khi chốt đơn! 😤🧋',
    revisionMsgTemplate: (name: string, msg: string) =>
      `😤 ${name} yêu cầu chỉnh sửa: "${msg}"`,
    noteModalTitle: '💌 Gửi Giấy Nhớ & Note Chú Ý',
    noteModalSubtitle: 'Đính kèm hình ảnh biểu cảm đáng yêu hoặc lầy lội vào lịch trình!',
    noteStep1: '1. Chọn Hình Ảnh Biểu Cảm Đính Kèm:',
    noteStep2: '2. Gắn vào Khung Giờ:',
    noteAllDayOption: '📋 Góc Nhắn Nhủ Chung Cả Ngày',
    noteStep3: '3. Nhãn Chú Ý:',
    noteStep4: '4. Màu Giấy Nhớ Pastel:',
    noteQuickSuggestLabel: '✨ Gợi ý câu nhắn dễ thương (Chạm để điền nhanh):',
    noteStep5: '5. Nội dung lời nhắn',
    noteTextareaPlaceholder:
      'Ví dụ: Qua đón em nhớ mang theo trà sữa ít đá nha, không là em dỗi đó! 💕',
    cancelBtn: 'Hủy',
    submitNoteBtn: 'Dán Giấy Nhớ Lên Plan!',
    revisionModalTitle: '😤 Công Chúa Yêu Cầu Đổi Món / Đòi Thêm Kèo!',
    revisionModalSubtitle: 'Hãy viết sắc lệnh để Hoàng Tử lập tức cập nhật lại lịch trình!',
    revisionQuote:
      '"Hứ! Lịch trình này cần phải bổ sung thêm món ngon hoặc quà dễ thương thì Công Chúa mới chịu bấm duyệt nha!" 👑🧋',
    revisionInputLabel: 'Nội dung Công Chúa muốn đổi hoặc thêm:',
    revisionInputPlaceholder:
      'Ví dụ: Đổi quán trưa sang ăn lẩu Haidilao + thêm kèo chụp Photobooth lúc chiều nha!',
    revisionCancelBtn: 'Thôi tha cho đó',
    revisionSubmitBtn: '😤 Ban Hành Sắc Lệnh!',
    settingsModalTitle: '⚙️ Cài Đặt Cặp Đôi & Đồng Bộ Đa Nền Tảng',
    settingsModalSubtitle: 'Đổi biệt danh, Mã Phòng (PIN) và kết nối Firebase Realtime',
    princeNicknameLabel: 'Biệt danh Hoàng Tử:',
    princessNicknameLabel: 'Biệt danh Công Chúa:',
    roomPinInputLabel: '🔑 Mã Phòng Chung (Room PIN):',
    roomPinHelpText:
      'Hai bạn chỉ cần nhập chung Mã Phòng này (hoặc bấm nút "Gửi Cho Nàng" trên thanh công cụ) để xem và chỉnh sửa chung 1 bảng Plan!',
    firebaseConfigLabel: '☁️ Cấu hình Firebase Firestore Realtime (Tùy chọn):',
    firebaseConfigHelp:
      'Mặc định app hỗ trợ chia sẻ qua Link & lưu tự động trên máy. Để đồng bộ thời gian thực (Realtime) giữa PC và Điện thoại của 2 người, bạn có thể dán JSON firebaseConfig vào đây (hoặc cài biến môi trường VITE_FIREBASE_* trên Vercel):',
    closeBtn: 'Đóng',
    saveSettingsBtn: 'Lưu & Đồng Bộ Ngay',
    newPlanModalTitle: '🗓️ Tạo Plan Đi Chơi Mới',
    newPlanModalSubtitle: 'Lên kế hoạch cho buổi hẹn tiếp theo của Hoàng Tử & Công Chúa',
    newPlanNameLabel: 'Tên buổi đi chơi / Dịp kỷ niệm:',
    newPlanNamePlaceholder: 'Ví dụ: Kỷ niệm 1 năm yêu nhau 💖 / Foodtour cuối tuần 🍜',
    createPlanSubmitBtn: '✨ Tạo Plan Ngay',
    slotModalTitle: '⏰ Thêm Khung Giờ Mới',
    slotModalSubtitle: 'Tạo thêm khung giờ tăng 2, tăng 3 hoặc khuya lãng mạn',
    slotNameLabel: 'Tên buổi / Khung giờ:',
    slotNamePlaceholder: 'Ví dụ: Tăng 3 Ăn Đêm Ngắm Sao',
    slotIconLabel: 'Biểu tượng:',
    slotTimeLabel: 'Khoảng thời gian:',
    slotTimePlaceholder: 'Ví dụ: 22:00 - 23:30',
    pwaModalTitle: '📱 Cài Đặt App My Princess Plan (PWA)',
    pwaModalSubtitle: 'Sử dụng mượt mà như ứng dụng thật trên iPhone, Android và PC!',
    pwaIosTitle: '🍎 Trên iPhone / iPad (Safari):',
    pwaIosSteps:
      '1. Bấm vào nút Chia sẻ (Share) ở thanh dưới cùng trình duyệt Safari.\n2. Cuộn xuống và chọn "Thêm vào Màn hình chính" (Add to Home Screen).',
    pwaAndroidTitle: '🤖 Trên Android (Chrome):',
    pwaAndroidSteps:
      '1. Bấm vào biểu tượng 3 chấm dọc ở góc phải trên cùng Chrome.\n2. Chọn "Cài đặt ứng dụng" (Install App) hoặc "Thêm vào Màn hình chính".',
    pwaPcTitle: '💻 Trên Máy tính PC / Laptop (Chrome / Edge):',
    pwaPcSteps:
      'Bấm vào biểu tượng Cài đặt (hình màn hình có mũi tên xuống) nằm ở góc phải thanh địa chỉ URL để ghim App ra Desktop!',
  },
  th: {
    appSubtitle: 'ลากวางสติกเกอร์จัดแพลนเดทสุดคิวท์',
    pwaBadge: 'PWA แพลนเดทคู่รัก 💕',
    roomPinLabel: 'รหัสห้อง',
    roomPinTooltip: 'เปลี่ยนรหัสห้อง PIN หรือตั้งค่าซิงค์ข้อมูล Firebase',
    shareBtn: 'แชร์ให้หวานใจ',
    copiedBtn: 'คัดลอกลิงก์แล้ว!',
    muteTooltip: 'ปิดเสียงเอฟเฟกต์',
    unmuteTooltip: 'เปิดเสียงเอฟเฟกต์',
    bgmOn: 'เพลง: เปิด',
    bgmOff: 'เพลงประกอบ',
    bgmTooltip: 'เปิด/ปิดเสียงเพลงกล่องดนตรี',
    installAppBtn: 'ติดตั้งแอป',
    installAppTooltip: 'ติดตั้งแอปลงมือถือ / คอมพิวเตอร์',
    holdingSticker: 'กำลังถือสติกเกอร์:',
    holdingHint: 'แตะปุ่ม "+ วางในเวลานี้" ด้านล่าง หรือแปะลอยตกแต่งบนบอร์ดได้เลย!',
    floatActionBtn: '✨ แปะสติกเกอร์ลอยบนบอร์ด',
    cancelSelectBtn: 'ยกเลิก',
    newPlanBtn: 'สร้างแพลนวันใหม่',
    deletePlanBtn: 'ลบแพลนนี้',
    confirmDeletePlan: 'ต้องการลบแพลน',
    planTitlePlaceholder: 'ตั้งชื่อทริปเดท...',
    dateLabel: 'วันที่นัดเดท',
    startTimeLabel: 'เวลานัดเจอกัน',
    dressCodeLabel: 'ธีมชุด (Dress Code)',
    dressCodePlaceholder: 'โทนสีเสื้อผ้า...',
    princessMoodLabel: 'อารมณ์เจ้าหญิงวันนี้',
    princessMoodPlaceholder: 'ความรู้สึกวันนี้...',
    statusApproved: 'เจ้าหญิงอนุมัติแล้ว 👑',
    statusRevision: 'ขอเปลี่ยนแพลน 😤',
    statusPending: 'รอเจ้าหญิงอนุมัติ',
    approveBtn: 'เจ้าหญิงอนุมัติแพลน!',
    revisionBtn: '😤 ขอแก้แพลน',
    revisionTooltip: 'ขอเปลี่ยนร้านหรือเพิ่มรายการของกิน',
    bobaTooltip: 'ติดสินบนด้วยชานมไข่มุก +1 แก้ว!',
    stickerVaultTitle: 'คลังสติกเกอร์สุดน่ารัก (32+)',
    stickerVaultSubtitle: 'ลากวางลงช่วงเวลา หรือแตะเพื่อเลือกวางด่วน!',
    sendNoteBtn: '+ เขียนโน้ต',
    searchStickerPlaceholder: 'ค้นหาสติกเกอร์: ชานม, ชาบู, งอน, มารับ...',
    stickyWallTitle: 'มุมกระดาษโน้ต & ข้อความสำคัญของแพลน',
    stickyWallSubtitle: 'ส่งข้อความพร้อมสติกเกอร์อ้อนๆ หรือประกาศิตจากเจ้าหญิง!',
    writeNewNoteBtn: 'เขียนกระดาษโน้ตใหม่',
    emptyNotesText: 'ยังไม่มีกระดาษโน้ตเลย! กดปุ่ม "เขียนกระดาษโน้ตใหม่" เพื่อฝากข้อความถึงหวานใจน้า 💕',
    fromLabel: 'จาก:',
    deleteNoteTooltip: 'ลบกระดาษโน้ต',
    timelineTitle: '🗓️ ตารางเวลาทริปเดทของเรา',
    timelineSubtitle:
      'ลากสติกเกอร์กิจกรรมใส่แต่ละช่วงเวลา หรือลากสติกเกอร์ลอยตกแต่งรอบๆ บอร์ด!',
    addSlotBtn: 'เพิ่มช่วงเวลา',
    floatingCountLabel: '✨ สติกเกอร์ตกแต่งบนบอร์ด',
    floatingDragHint: '(สามารถคลิกค้างและลากสติกเกอร์ลอยด้านล่างไปวางตรงไหนก็ได้เลย!)',
    removeFloatingTooltip: 'เอาสติกเกอร์นี้ออก',
    dropHereBtnPrefix: '+ วาง',
    dropHereBtnSuffix: 'ตรงนี้เลย!',
    attachSlotNoteBtn: '📌 แปะโน้ต',
    deleteSlotTooltip: 'ลบช่วงเวลานี้',
    emptySlotTitle: '✨ ลากสติกเกอร์กิจกรรมมาวางในช่วงเวลานี้ได้เลย!',
    emptySlotSubtitle: '(หรือแตะเลือกสติกเกอร์จากคลังแล้วกดตรงนี้)',
    addedByLabel: 'เพิ่มโดย:',
    timeRangePlaceholder: 'ช่วงเวลา...',
    locationPlaceholder: 'ระบุสถานที่ / ชื่อร้าน...',
    activityNotePlaceholder: 'โน้ตเพิ่มเติมสำหรับกิจกรรมนี้...',
    heartTooltip: 'กดหัวใจให้กิจกรรมนี้',
    deleteActivityTooltip: 'ลบกิจกรรม',
    waitingDate: 'กำลังรอเลือกวันนัดเดท 💕',
    dateArrived: '🎉 ถึงเวลาไปออกเดทกับเจ้าหญิงแล้ว!',
    countdownPrefix: 'อีก',
    daysUnit: 'วัน',
    hoursUnit: 'ชม.',
    minsUnit: 'นาที',
    secsUnit: 'วิ',
    approvedMsgTemplate: (name: string, time: string) =>
      `👑 ${name} อนุมัติแพลนเต็ม 100 คะแนนเมื่อเวลา ${time}! ตื่นเต้นอยากไปเที่ยวแล้ว! 💖`,
    revisionDefaultMsg:
      'เจ้าหญิงขอเพิ่มชานมไข่มุกและขนมอร่อยๆ ก่อนจะกดอนุมัติแพลนน้า! 😤🧋',
    revisionMsgTemplate: (name: string, msg: string) =>
      `😤 ${name} ขอแก้ไขแพลน: "${msg}"`,
    noteModalTitle: '💌 ส่งกระดาษโน้ต & ข้อความเตือนความจำ',
    noteModalSubtitle: 'แนบสติกเกอร์แสดงอารมณ์สุดคิวท์หรือกวนๆ ลงในตารางเดท!',
    noteStep1: '1. เลือกสติกเกอร์แสดงอารมณ์:',
    noteStep2: '2. แปะไว้ที่ช่วงเวลาไหน:',
    noteAllDayOption: '📋 บอร์ดข้อความรวมทั้งวัน',
    noteStep3: '3. ป้ายกำกับโน้ต:',
    noteStep4: '4. สีกระดาษโน้ตพาสเทล:',
    noteQuickSuggestLabel: '✨ ข้อความน่ารักสำเร็จรูป (แตะเพื่อเลือกใช้ได้เลย):',
    noteStep5: '5. ข้อความถึงหวานใจ',
    noteTextareaPlaceholder:
      'ตัวอย่าง: ตอนมารับอย่าลืมซื้อชานมไข่มุกหวานน้อยมาฝากด้วยน้า ไม่งั้นงอนจริงๆ ด้วย! 💕',
    cancelBtn: 'ยกเลิก',
    submitNoteBtn: 'แปะกระดาษโน้ตลงแพลน!',
    revisionModalTitle: '😤 เจ้าหญิงขอเปลี่ยนเมนู / เพิ่มตารางเที่ยว!',
    revisionModalSubtitle: 'เขียนประกาศิตเพื่อให้เจ้าชายรีบอัปเดตตารางเดทด่วนๆ!',
    revisionQuote:
      '"ชิ! แพลนนี้ต้องเพิ่มของอร่อยหรือของขวัญน่ารักๆ ก่อน เจ้าหญิงถึงจะยอมกดอนุมัตินะคะ!" 👑🧋',
    revisionInputLabel: 'สิ่งที่เจ้าหญิงอยากให้เปลี่ยนหรือเพิ่มเติม:',
    revisionInputPlaceholder:
      'ตัวอย่าง: เปลี่ยนมื้อเที่ยงเป็นชาบูหม้อไฟ + เพิ่มถ่ายรูป Photobooth ตอนบ่ายด้วยน้า!',
    revisionCancelBtn: 'ยกโทษให้ก็ได้',
    revisionSubmitBtn: '😤 ออกประกาศิตเจ้าหญิง!',
    settingsModalTitle: '⚙️ ตั้งค่าคู่รัก & ซิงค์ข้อมูลข้ามอุปกรณ์',
    settingsModalSubtitle: 'เปลี่ยนชื่อเรียก รหัสห้อง (PIN) และเชื่อมต่อ Firebase Realtime',
    princeNicknameLabel: 'ชื่อเรียกเจ้าชาย:',
    princessNicknameLabel: 'ชื่อเรียกเจ้าหญิง:',
    roomPinInputLabel: '🔑 รหัสห้องคู่รัก (Room PIN):',
    roomPinHelpText:
      'เพียงใส่รหัสห้องเดียวกัน (หรือกดปุ่ม "แชร์ให้หวานใจ" ด้านบน) ทั้งสองคนก็จะดูและจัดแพลนเดทบอร์ดเดียวกันได้ทันที!',
    firebaseConfigLabel: '☁️ ตั้งค่า Firebase Firestore Realtime (ตัวเลือกเสริม):',
    firebaseConfigHelp:
      'โดยปกติแอปสามารถแชร์ผ่านลิงก์และบันทึกในเครื่องได้ทันที หากต้องการซิงค์แบบเรียลไทม์ระหว่างคอมและมือถือของทั้งคู่ สามารถวาง JSON firebaseConfig ที่นี่ได้เลย:',
    closeBtn: 'ปิด',
    saveSettingsBtn: 'บันทึก & ซิงค์ทันที',
    newPlanModalTitle: '🗓️ สร้างแพลนออกเดทใหม่',
    newPlanModalSubtitle: 'วางแผนทริปต่อไปสำหรับเจ้าชายและเจ้าหญิง',
    newPlanNameLabel: 'ชื่อทริปเดท / โอกาสพิเศษ:',
    newPlanNamePlaceholder: 'ตัวอย่าง: ครบรอบ 1 ปี 💖 / ตะลุยกินวันหยุด 🍜',
    createPlanSubmitBtn: '✨ สร้างแพลนเลย',
    slotModalTitle: '⏰ เพิ่มช่วงเวลาใหม่',
    slotModalSubtitle: 'เพิ่มรอบดึก ดูดาว หรือปาร์ตี้ขนมหวาน',
    slotNameLabel: 'ชื่อช่วงเวลา:',
    slotNamePlaceholder: 'ตัวอย่าง: รอบดึกเดินเล่นดูดาว',
    slotIconLabel: 'ไอคอน:',
    slotTimeLabel: 'ช่วงเวลา:',
    slotTimePlaceholder: 'ตัวอย่าง: 22:00 - 23:30',
    pwaModalTitle: '📱 วิธีติดตั้งแอป My Princess Plan (PWA)',
    pwaModalSubtitle: 'ใช้งานได้เต็มจอเหมือนแอปจริงทั้งบน iPhone, Android และ PC!',
    pwaIosTitle: '🍎 สำหรับ iPhone / iPad (Safari):',
    pwaIosSteps:
      '1. แตะปุ่ม แชร์ (Share) ที่แถบด้านล่างของ Safari\n2. เลื่อนลงมาแล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)',
    pwaAndroidTitle: '🤖 สำหรับ Android (Chrome):',
    pwaAndroidSteps:
      '1. แตะไอคอนจุด 3 จุดที่มุมขวาบนของ Chrome\n2. เลือก "ติดตั้งแอป" (Install App) หรือ "เพิ่มลงในหน้าจอหลัก"',
    pwaPcTitle: '💻 สำหรับคอมพิวเตอร์ PC / โน้ตบุ๊ก (Chrome / Edge):',
    pwaPcSteps:
      'คลิกไอคอนติดตั้งแอป (รูปหน้าจอมีลูกศรชี้ลง) ที่ด้านขวาของแถบ URL เพื่อปักหมุดแอปไว้บนหน้าจอ Desktop!',
  },
};
