import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Share2,
  Settings,
  Plus,
  Trash2,
  MapPin,
  Clock,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Check,
  Calendar,
  Shirt,
  Smile,
  Send,
  Smartphone,
  RefreshCw,
  Search,
  Globe,
} from 'lucide-react';
import {
  AppLanguage,
  CoupleRoomData,
  DatePlan,
  StickerCategory,
  StickerDefinition,
  ScheduledActivity,
  StickyNoteItem,
  FloatingStickerItem,
  FirebaseConfigInput,
} from './types/plan';
import {
  STICKERS,
  STICKER_CATEGORIES,
  STICKER_MAP,
  getStickerDisplay,
  createDefaultDatePlan,
} from './data/stickers';
import {
  getSavedLanguage,
  setSavedLanguage,
  UI_TEXT,
  NOTE_TAGS_BY_LANG,
  NOTE_COLOR_LABELS,
  QUICK_NOTE_TEMPLATES,
  localizeDynamicText,
} from './i18n/translations';
import { soundFX } from './utils/soundEffects';
import {
  getSavedRoomPin,
  setSavedRoomPin,
  loadLocalRoomData,
  saveRoomData,
  subscribeToRoom,
  createShareableUrl,
  getEffectiveFirebaseConfig,
  saveCustomFirebaseConfig,
} from './services/syncService';
import { LightDismissDialog } from './components/LightDismissDialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const NOTE_COLOR_STYLES: Record<
  StickyNoteItem['color'],
  { bg: string; border: string; badge: string }
> = {
  pink: {
    bg: 'bg-[#ffe8f2]',
    border: 'border-[#ff9ec7]',
    badge: 'bg-[#ff7eb3] text-white',
  },
  yellow: {
    bg: 'bg-[#fff9db]',
    border: 'border-[#ffd43b]',
    badge: 'bg-[#f59f00] text-white',
  },
  mint: {
    bg: 'bg-[#e6fcf5]',
    border: 'border-[#63e6be]',
    badge: 'bg-[#12b886] text-white',
  },
  lavender: {
    bg: 'bg-[#f3ebff]',
    border: 'border-[#b197fc]',
    badge: 'bg-[#7950f2] text-white',
  },
  peach: {
    bg: 'bg-[#fff0e6]',
    border: 'border-[#ffa94d]',
    badge: 'bg-[#fd7e14] text-white',
  },
};

function localizeRoomData(data: CoupleRoomData, targetLang: AppLanguage): CoupleRoomData {
  return {
    ...data,
    princeName: localizeDynamicText(data.princeName, targetLang),
    princessName: localizeDynamicText(data.princessName, targetLang),
    plans: data.plans.map((plan) => ({
      ...plan,
      title: localizeDynamicText(plan.title, targetLang),
      dressCode: localizeDynamicText(plan.dressCode, targetLang),
      princessMood: localizeDynamicText(plan.princessMood, targetLang),
      approvalMessage: localizeDynamicText(plan.approvalMessage, targetLang),
      slots: plan.slots.map((slot) => ({
        ...slot,
        periodName: localizeDynamicText(slot.periodName, targetLang),
        timeLabel: localizeDynamicText(slot.timeLabel, targetLang),
        activities: slot.activities.map((act) => ({
          ...act,
          title: localizeDynamicText(act.title, targetLang),
          timeRange: localizeDynamicText(act.timeRange, targetLang),
          location: localizeDynamicText(act.location, targetLang),
          note: localizeDynamicText(act.note, targetLang),
        })),
      })),
      stickyNotes: plan.stickyNotes.map((n) => ({
        ...n,
        authorName: localizeDynamicText(n.authorName, targetLang),
        content: localizeDynamicText(n.content, targetLang),
        tag: localizeDynamicText(n.tag, targetLang),
        createdAt: localizeDynamicText(n.createdAt, targetLang),
      })),
      floatingStickers: plan.floatingStickers.map((fs) => ({
        ...fs,
        caption: localizeDynamicText(fs.caption, targetLang),
      })),
    })),
  };
}

export const App: React.FC = () => {
  const [lang, setLang] = useState<AppLanguage>(() => getSavedLanguage());
  const t = UI_TEXT[lang];

  const [roomPin, setRoomPin] = useState<string>(() => getSavedRoomPin());
  const [roomData, setRoomData] = useState<CoupleRoomData>(() =>
    localizeRoomData(loadLocalRoomData(getSavedRoomPin()), getSavedLanguage())
  );
  const [currentRole, setCurrentRole] = useState<'prince' | 'princess'>('prince');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'error'>('local');

  // Audio controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmPlaying, setBgmPlaying] = useState(false);

  // Sticker Dock & Selection
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('royal');
  const [stickerSearch, setStickerSearch] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<StickerDefinition | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  // Floating sticker drag state on canvas
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [draggingFloatId, setDraggingFloatId] = useState<string | null>(null);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState<StickyNoteItem['color']>('pink');
  const [noteTag, setNoteTag] = useState(() => NOTE_TAGS_BY_LANG[getSavedLanguage()][0]);
  const [noteExpressionId, setNoteExpressionId] = useState('exp-pout-gift');
  const [noteTargetSlotId, setNoteTargetSlotId] = useState<string>('all');

  // Revision form state
  const [revisionText, setRevisionText] = useState('');

  // New plan form state
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDate, setNewPlanDate] = useState('');

  // New slot form state
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotIcon, setNewSlotIcon] = useState('✨');

  // Settings modal state
  const [pinInput, setPinInput] = useState(roomPin);
  const [princeInput, setPrinceInput] = useState(roomData.princeName);
  const [princessInput, setPrincessInput] = useState(roomData.princessName);
  const [firebaseJsonInput, setFirebaseJsonInput] = useState(() => {
    const cfg = getEffectiveFirebaseConfig();
    return cfg ? JSON.stringify(cfg, null, 2) : '';
  });

  // Share copy feedback & PWA install prompt
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Countdown state
  const [countdownText, setCountdownText] = useState<string>('');

  // Switch Language Handler (VN <-> TH)
  const handleSwitchLanguage = (nextLang: AppLanguage) => {
    if (nextLang === lang) return;
    soundFX.playPop();
    setLang(nextLang);
    setSavedLanguage(nextLang);
    setNoteTag(NOTE_TAGS_BY_LANG[nextLang][0]);

    setRoomData((prev) => {
      const localized = localizeRoomData(prev, nextLang);
      setPrinceInput(localized.princeName);
      setPrincessInput(localized.princessName);
      saveRoomData(localized, setSyncStatus);
      return localized;
    });
  };

  // Active plan helper
  const activePlan: DatePlan =
    roomData.plans.find((p) => p.id === roomData.activePlanId) || roomData.plans[0];

  // Subscribe to room updates (Firestore / BroadcastChannel / LocalStorage)
  useEffect(() => {
    const initial = localizeRoomData(loadLocalRoomData(roomPin), lang);
    setRoomData(initial);
    setPrinceInput(initial.princeName);
    setPrincessInput(initial.princessName);

    const unsubscribe = subscribeToRoom(
      roomPin,
      (incomingData) => {
        setRoomData((prev) => {
          if (incomingData.updatedAt >= prev.updatedAt) {
            return localizeRoomData(incomingData, lang);
          }
          return prev;
        });
      },
      (status) => setSyncStatus(status)
    );

    return () => unsubscribe();
  }, [roomPin, lang]);

  // PWA beforeinstallprompt listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Countdown timer update
  useEffect(() => {
    if (!activePlan) return;
    const updateTimer = () => {
      const targetStr = `${activePlan.date}T${activePlan.targetTime || '09:00'}:00`;
      const targetMs = new Date(targetStr).getTime();
      if (Number.isNaN(targetMs)) {
        setCountdownText(t.waitingDate);
        return;
      }
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setCountdownText(t.dateArrived);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdownText(
        `${t.countdownPrefix} ${days > 0 ? `${days} ${t.daysUnit} ` : ''}${String(hours).padStart(
          2,
          '0'
        )}${t.hoursUnit} : ${String(mins).padStart(2, '0')}${t.minsUnit} : ${String(secs).padStart(
          2,
          '0'
        )}${t.secsUnit}`
      );
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activePlan?.date, activePlan?.targetTime, lang, t]);

  // Helper to commit room data & sync
  const updateRoom = (updater: (prev: CoupleRoomData) => CoupleRoomData) => {
    setRoomData((prev) => {
      const next = updater(prev);
      const stamped: CoupleRoomData = {
        ...next,
        updatedAt: Date.now(),
      };
      saveRoomData(stamped, setSyncStatus);
      return stamped;
    });
  };

  // Helper to update currently active plan
  const updateActivePlan = (updater: (plan: DatePlan) => DatePlan) => {
    updateRoom((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === activePlan.id ? { ...updater(p), updatedAt: Date.now() } : p
      ),
    }));
  };

  // Add a sticker into a time slot
  const handleAddStickerToSlot = (sticker: StickerDefinition, slotId: string) => {
    soundFX.playDrop();
    const stText = getStickerDisplay(sticker, lang);
    const newActivity: ScheduledActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stickerId: sticker.id,
      title: stText.name,
      timeRange: stText.defaultDuration || (lang === 'th' ? '60 นาที' : '60 phút'),
      location: stText.subtitle,
      note:
        stText.defaultNote ||
        (lang === 'th' ? 'โน้ตกิจกรรมสุดน่ารัก 💕' : 'Ghi chú lịch trình dễ thương 💕'),
      moodStickerId: sticker.category === 'expressions' ? sticker.id : undefined,
      hearts: 1,
      addedBy: currentRole,
    };

    updateActivePlan((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) =>
        slot.id === slotId
          ? { ...slot, activities: [...slot.activities, newActivity] }
          : slot
      ),
    }));
    setSelectedSticker(null);
  };

  // Add a free-floating sticker onto the board
  const handleAddFloatingSticker = (
    sticker: StickerDefinition,
    customX?: number,
    customY?: number
  ) => {
    soundFX.playBoing();
    const stText = getStickerDisplay(sticker, lang);
    const newFloat: FloatingStickerItem = {
      id: `float-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stickerId: sticker.id,
      x: customX ?? Math.floor(15 + Math.random() * 65),
      y: customY ?? Math.floor(12 + Math.random() * 60),
      rotation: Math.floor(Math.random() * 22) - 11,
      scale: 1,
      caption: stText.name,
    };

    updateActivePlan((plan) => ({
      ...plan,
      floatingStickers: [...plan.floatingStickers, newFloat],
    }));
    setSelectedSticker(null);
  };

  // Pointer move for free-floating sticker dragging
  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingFloatId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const relX = Math.max(2, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    const relY = Math.max(2, Math.min(88, ((e.clientY - rect.top) / rect.height) * 100));

    updateActivePlan((plan) => ({
      ...plan,
      floatingStickers: plan.floatingStickers.map((fs) =>
        fs.id === draggingFloatId ? { ...fs, x: Math.round(relX), y: Math.round(relY) } : fs
      ),
    }));
  };

  const handleBoardPointerUp = () => {
    if (draggingFloatId) {
      soundFX.playPop();
      setDraggingFloatId(null);
    }
  };

  // Update activity fields inside a slot
  const handleUpdateActivity = (
    slotId: string,
    activityId: string,
    patch: Partial<ScheduledActivity>
  ) => {
    updateActivePlan((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              activities: slot.activities.map((act) =>
                act.id === activityId ? { ...act, ...patch } : act
              ),
            }
          : slot
      ),
    }));
  };

  const handleDeleteActivity = (slotId: string, activityId: string) => {
    soundFX.playPop();
    updateActivePlan((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              activities: slot.activities.filter((act) => act.id !== activityId),
            }
          : slot
      ),
    }));
  };

  // Add a sticky note
  const handleCreateStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    soundFX.playNoteChime();
    const newNote: StickyNoteItem = {
      id: `note-${Date.now()}`,
      author: currentRole,
      authorName: currentRole === 'princess' ? roomData.princessName : roomData.princeName,
      content: noteContent.trim(),
      color: noteColor,
      expressionStickerId: noteExpressionId,
      tag: noteTag,
      targetSlotId: noteTargetSlotId === 'all' ? undefined : noteTargetSlotId,
      createdAt: new Date().toLocaleTimeString(lang === 'th' ? 'th-TH' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      pinned: true,
    };

    updateActivePlan((plan) => ({
      ...plan,
      stickyNotes: [newNote, ...plan.stickyNotes],
    }));

    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  // Princess Approves Plan!
  const handlePrincessApprove = () => {
    soundFX.playRoyalFanfare();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff7eb3', '#ffd43b', '#c084fc', '#63e6be', '#ff4d88'],
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 220);

    const timeStr = new Date().toLocaleTimeString(lang === 'th' ? 'th-TH' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    updateActivePlan((plan) => ({
      ...plan,
      approvalStatus: 'approved',
      approvalMessage: t.approvedMsgTemplate(roomData.princessName, timeStr),
    }));
  };

  // Princess Requests Revision / Demands more treats
  const handlePrincessRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playPout();
    const msg = revisionText.trim() || t.revisionDefaultMsg;

    const decreeNote: StickyNoteItem = {
      id: `note-decree-${Date.now()}`,
      author: 'princess',
      authorName: roomData.princessName,
      content: msg,
      color: 'pink',
      expressionStickerId: 'exp-pout-gift',
      tag: NOTE_TAGS_BY_LANG[lang][1],
      createdAt: new Date().toLocaleTimeString(lang === 'th' ? 'th-TH' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      pinned: true,
    };

    updateActivePlan((plan) => ({
      ...plan,
      approvalStatus: 'revision_requested',
      approvalMessage: t.revisionMsgTemplate(roomData.princessName, msg),
      stickyNotes: [decreeNote, ...plan.stickyNotes],
    }));

    setRevisionText('');
    setIsRevisionModalOpen(false);
  };

  // Boba Bribe Counter
  const handleBobaBribe = () => {
    soundFX.playSparkle();
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#ff85a2', '#ffe066'],
    });
    updateActivePlan((plan) => ({
      ...plan,
      bobaBribeCount: (plan.bobaBribeCount || 0) + 1,
    }));
  };

  // Create a new Date Plan
  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playNoteChime();
    const newId = `plan-${Date.now()}`;
    const basePlan = createDefaultDatePlan(newId);
    const createdRaw: DatePlan = {
      ...basePlan,
      title:
        newPlanTitle.trim() ||
        (lang === 'th' ? 'แพลนเดทใหม่สุดน่ารัก 💕' : 'Kế Hoạch Đi Chơi Mới 💕'),
      date: newPlanDate || basePlan.date,
    };

    updateRoom((prev) => {
      const nextRoom: CoupleRoomData = {
        ...prev,
        activePlanId: createdRaw.id,
        plans: [...prev.plans, createdRaw],
      };
      return localizeRoomData(nextRoom, lang);
    });

    setNewPlanTitle('');
    setIsNewPlanModalOpen(false);
  };

  // Add custom Time Slot
  const handleCreateCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;
    soundFX.playDrop();

    updateActivePlan((plan) => ({
      ...plan,
      slots: [
        ...plan.slots,
        {
          id: `slot-${Date.now()}`,
          periodName: newSlotName.trim(),
          timeLabel:
            newSlotTime.trim() || (lang === 'th' ? 'ช่วงเวลาพิเศษ' : 'Khung giờ tự chọn'),
          icon: newSlotIcon || '✨',
          themeColor: '#fff0f6',
          activities: [],
        },
      ],
    }));

    setNewSlotName('');
    setNewSlotTime('');
    setIsSlotModalOpen(false);
  };

  // Save Room PIN & Firebase Config
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playNoteChime();

    if (firebaseJsonInput.trim()) {
      try {
        const parsed = JSON.parse(firebaseJsonInput.trim()) as FirebaseConfigInput;
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          saveCustomFirebaseConfig(parsed);
        }
      } catch {
        alert(
          lang === 'th'
            ? 'รูปแบบ JSON ของ Firebase ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง!'
            : 'JSON cấu hình Firebase chưa đúng định dạng. Vui lòng kiểm tra lại!'
        );
        return;
      }
    } else {
      saveCustomFirebaseConfig(null);
    }

    const cleanPin = pinInput.trim().toUpperCase() || 'CONGCHUA';
    setSavedRoomPin(cleanPin);
    setRoomPin(cleanPin);

    updateRoom((prev) => ({
      ...prev,
      roomPin: cleanPin,
      princeName: princeInput.trim() || (lang === 'th' ? 'เจ้าชาย 🤴' : 'Hoàng Tử 🤴'),
      princessName: princessInput.trim() || (lang === 'th' ? 'เจ้าหญิง 👸' : 'Công Chúa 👸'),
    }));

    setIsSettingsModalOpen(false);
  };

  // Copy shareable link
  const handleShareLink = async () => {
    soundFX.playSparkle();
    const shareUrl = createShareableUrl(roomData);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      prompt(
        lang === 'th'
          ? 'คัดลอกลิงก์นี้ส่งให้เจ้าหญิง / เจ้าชายได้เลย:'
          : 'Copy đường link này gửi cho Công Chúa / Hoàng Tử nha:',
        shareUrl
      );
    }
  };

  const filteredStickers = STICKERS.filter((s) => {
    const matchesCategory = s.category === activeCategory;
    const q = stickerSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nameTh.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.subtitleTh.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const expressionStickers = STICKERS.filter(
    (s) => s.category === 'expressions' || Boolean(s.imageUrl)
  );

  return (
    <div className="min-h-screen pb-24 text-[#4a2b3b]">
      {/* TOP NAVIGATION / ROYAL HEADER */}
      <header className="sticky top-0 z-30 border-b-2 border-[#ffcce0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Brand Title & Mascot */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#ff85b3] bg-[#ffe6f0] shadow-sm">
              <img
                src="/stickers/princess-prince.jpg"
                alt="My Princess Plan"
                className="h-full w-full object-cover"
              />
              <span className="animate-crown-bounce absolute -top-1 -right-1 text-sm">👑</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-[#d63384] sm:text-2xl">
                  My Princess Plan
                </h1>
                <span className="hidden rounded-full bg-[#ffe0ed] px-2.5 py-0.5 text-xs font-bold text-[#d63384] sm:inline-block">
                  {t.pwaBadge}
                </span>
              </div>
              <p className="text-xs font-medium text-[#8c5872]">
                {roomData.princeName} &amp; {roomData.princessName} • {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Language Switcher (VN / TH) + Role Toggle + Sync Pill + Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* LANGUAGE SWITCHER: VN / TH */}
            <div
              className="flex items-center rounded-full border-2 border-[#ffadd2] bg-[#fff5f9] p-0.5 text-xs font-bold shadow-2xs"
              title="Switch Language: Tiếng Việt (VN) / ภาษาไทย (TH)"
            >
              <Globe className="ml-2 mr-1 h-3.5 w-3.5 text-[#d63384]" />
              <button
                type="button"
                onClick={() => handleSwitchLanguage('vi')}
                className={`rounded-full px-2.5 py-1 transition ${
                  lang === 'vi'
                    ? 'bg-gradient-to-r from-[#ff6b9d] to-[#ff4d88] text-white shadow-xs'
                    : 'text-[#8c5872] hover:text-[#d63384]'
                }`}
              >
                🇻🇳 VN
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLanguage('th')}
                className={`rounded-full px-2.5 py-1 transition ${
                  lang === 'th'
                    ? 'bg-gradient-to-r from-[#ff6b9d] to-[#ff4d88] text-white shadow-xs'
                    : 'text-[#8c5872] hover:text-[#d63384]'
                }`}
              >
                🇹🇭 TH
              </button>
            </div>

            {/* Switch Role: Prince or Princess */}
            <div className="flex items-center rounded-full border-2 border-[#ffc2da] bg-[#fff0f6] p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setCurrentRole('prince');
                }}
                className={`rounded-full px-3 py-1.5 transition ${
                  currentRole === 'prince'
                    ? 'bg-[#ff6b9d] text-white shadow-sm'
                    : 'text-[#8c5872] hover:text-[#d63384]'
                }`}
              >
                {roomData.princeName}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setCurrentRole('princess');
                }}
                className={`rounded-full px-3 py-1.5 transition ${
                  currentRole === 'princess'
                    ? 'bg-[#ff6b9d] text-white shadow-sm'
                    : 'text-[#8c5872] hover:text-[#d63384]'
                }`}
              >
                {roomData.princessName}
              </button>
            </div>

            {/* Room PIN & Sync Status */}
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setIsSettingsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-full border-2 border-[#e9d5ff] bg-[#f8f0ff] px-3 py-1.5 text-xs font-bold text-[#7950f2] transition hover:scale-105 hover:bg-[#f3e8ff]"
              title={t.roomPinTooltip}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500'
                    : syncStatus === 'error'
                    ? 'bg-amber-500'
                    : 'bg-sky-400'
                }`}
              />
              <span>
                {t.roomPinLabel}: {roomPin}
              </span>
              <Settings className="h-3.5 w-3.5" />
            </button>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleShareLink}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff7eb3] to-[#ff65a3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{t.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{t.shareBtn}</span>
                </>
              )}
            </button>

            {/* Sound FX Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundFX.enabled = next;
                if (!next) {
                  soundFX.stopMusicBox();
                  setBgmPlaying(false);
                } else {
                  soundFX.playPop();
                }
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                soundEnabled
                  ? 'border-[#ffb6d5] bg-[#fff0f6] text-[#d63384]'
                  : 'border-gray-200 bg-gray-100 text-gray-400'
              }`}
              title={soundEnabled ? t.muteTooltip : t.unmuteTooltip}
              aria-label={soundEnabled ? t.muteTooltip : t.unmuteTooltip}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Music Box Lullaby Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!soundEnabled) {
                  setSoundEnabled(true);
                  soundFX.enabled = true;
                }
                const playing = soundFX.toggleMusicBox();
                setBgmPlaying(playing);
              }}
              className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-1.5 text-xs font-bold transition ${
                bgmPlaying
                  ? 'border-[#ff85b3] bg-[#ff6b9d] text-white shadow-sm'
                  : 'border-[#ffb6d5] bg-[#fff0f6] text-[#d63384]'
              }`}
              title={t.bgmTooltip}
            >
              <Music className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{bgmPlaying ? t.bgmOn : t.bgmOff}</span>
            </button>

            {/* Install PWA Button */}
            <button
              type="button"
              onClick={async () => {
                soundFX.playPop();
                if (deferredPrompt) {
                  await deferredPrompt.prompt();
                  setDeferredPrompt(null);
                } else {
                  setIsPwaGuideOpen(true);
                }
              }}
              className="flex items-center gap-1 rounded-full border-2 border-[#bde0fe] bg-[#eef8ff] px-2.5 py-1.5 text-xs font-bold text-[#0284c7] transition hover:bg-[#e0f2fe]"
              title={t.installAppTooltip}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t.installAppBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING QUICK-PLACEMENT BANNER WHEN A STICKER IS SELECTED */}
      {selectedSticker && (
        <div className="sticky top-[68px] z-20 mx-auto max-w-4xl px-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#ff6b9d] bg-gradient-to-r from-[#fff0f6] via-[#ffe3ee] to-[#f3e8ff] px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-2.5">
              {selectedSticker.imageUrl ? (
                <img
                  src={selectedSticker.imageUrl}
                  alt={getStickerDisplay(selectedSticker, lang).name}
                  className="h-9 w-9 rounded-xl border border-[#ff85b3] object-cover"
                />
              ) : (
                <span className="text-2xl">{selectedSticker.emoji}</span>
              )}
              <div>
                <p className="text-xs font-bold text-[#d63384]">
                  {t.holdingSticker} {getStickerDisplay(selectedSticker, lang).name}
                </p>
                <p className="text-[11px] font-medium text-[#8c5872]">{t.holdingHint}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddFloatingSticker(selectedSticker)}
                className="rounded-xl bg-[#7950f2] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6741d9]"
              >
                {t.floatActionBtn}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSticker(null)}
                className="rounded-xl border border-[#ff9ec7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#8c5872] hover:bg-[#ffeef5]"
              >
                {t.cancelSelectBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 pt-5">
        {/* MULTI-PLAN TABS & COUNTDOWN HERO CARD */}
        <section className="mb-6 rounded-3xl border-3 border-[#ffc2da] bg-white/95 p-4 shadow-md sm:p-5">
          {/* Plan Switcher Tabs */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#fff0f6] pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {roomData.plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    updateRoom((prev) => ({ ...prev, activePlanId: p.id }));
                  }}
                  className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition ${
                    p.id === activePlan.id
                      ? 'bg-gradient-to-r from-[#ff7eb3] to-[#ff65a3] text-white shadow-sm'
                      : 'bg-[#fff0f6] text-[#8c5872] hover:bg-[#ffe0ed]'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{p.title}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsNewPlanModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-2xl border-2 border-dashed border-[#ff9ec7] bg-[#fff9fb] px-3 py-1.5 text-xs font-bold text-[#d63384] transition hover:bg-[#ffeef5]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.newPlanBtn}</span>
              </button>
            </div>

            {roomData.plans.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (!confirm(`${t.confirmDeletePlan} "${activePlan.title}"?`)) return;
                  soundFX.playPop();
                  updateRoom((prev) => {
                    const remaining = prev.plans.filter((p) => p.id !== activePlan.id);
                    return {
                      ...prev,
                      activePlanId: remaining[0].id,
                      plans: remaining,
                    };
                  });
                }}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.deletePlanBtn}</span>
              </button>
            )}
          </div>

          {/* Plan Details & Countdown Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 8 cols: Editable Plan Info */}
            <div className="space-y-3 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={activePlan.title}
                  onChange={(e) =>
                    updateActivePlan((plan) => ({ ...plan, title: e.target.value }))
                  }
                  className="font-display w-full rounded-2xl border-2 border-transparent bg-[#fff5f9] px-3.5 py-1.5 text-xl font-bold text-[#d63384] focus:border-[#ff85b3] focus:bg-white focus:outline-none sm:w-auto sm:flex-1 sm:text-2xl"
                  placeholder={t.planTitlePlaceholder}
                />
                <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffe0ed] to-[#f3e8ff] px-3.5 py-2 text-xs font-bold text-[#a61e4d]">
                  <Clock className="h-4 w-4 text-[#d63384]" />
                  <span>{countdownText}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                <label className="flex flex-col rounded-2xl border border-[#ffd6e7] bg-[#fff9fb] px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#b86b8d]">
                    <Calendar className="h-3 w-3" /> {t.dateLabel}
                  </span>
                  <input
                    type="date"
                    value={activePlan.date}
                    onChange={(e) =>
                      updateActivePlan((plan) => ({ ...plan, date: e.target.value }))
                    }
                    className="mt-0.5 bg-transparent text-xs font-bold text-[#4a2b3b] focus:outline-none"
                  />
                </label>

                <label className="flex flex-col rounded-2xl border border-[#ffd6e7] bg-[#fff9fb] px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#b86b8d]">
                    <Clock className="h-3 w-3" /> {t.startTimeLabel}
                  </span>
                  <input
                    type="time"
                    value={activePlan.targetTime}
                    onChange={(e) =>
                      updateActivePlan((plan) => ({ ...plan, targetTime: e.target.value }))
                    }
                    className="mt-0.5 bg-transparent text-xs font-bold text-[#4a2b3b] focus:outline-none"
                  />
                </label>

                <label className="flex flex-col rounded-2xl border border-[#ffd6e7] bg-[#fff9fb] px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#b86b8d]">
                    <Shirt className="h-3 w-3" /> {t.dressCodeLabel}
                  </span>
                  <input
                    type="text"
                    value={activePlan.dressCode}
                    onChange={(e) =>
                      updateActivePlan((plan) => ({ ...plan, dressCode: e.target.value }))
                    }
                    className="mt-0.5 bg-transparent text-xs font-bold text-[#4a2b3b] focus:outline-none"
                    placeholder={t.dressCodePlaceholder}
                  />
                </label>

                <label className="flex flex-col rounded-2xl border border-[#ffd6e7] bg-[#fff9fb] px-3 py-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#b86b8d]">
                    <Smile className="h-3 w-3" /> {t.princessMoodLabel}
                  </span>
                  <input
                    type="text"
                    value={activePlan.princessMood}
                    onChange={(e) =>
                      updateActivePlan((plan) => ({ ...plan, princessMood: e.target.value }))
                    }
                    className="mt-0.5 bg-transparent text-xs font-bold text-[#4a2b3b] focus:outline-none"
                    placeholder={t.princessMoodPlaceholder}
                  />
                </label>
              </div>
            </div>

            {/* Right 4 cols: PRINCESS APPROVAL & BOBA BRIBE BOX */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#ffb6d5] bg-gradient-to-br from-[#fff0f6] via-[#fff8fb] to-[#f3e8ff] p-3.5 lg:col-span-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    activePlan.approvalStatus === 'approved'
                      ? '/stickers/expression-excited.jpg'
                      : activePlan.approvalStatus === 'revision_requested'
                      ? '/stickers/expression-pout.jpg'
                      : '/stickers/expression-beg.jpg'
                  }
                  alt="Princess status"
                  className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#ff85b3] object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {activePlan.approvalStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t.statusApproved}
                      </span>
                    ) : activePlan.approvalStatus === 'revision_requested' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        <AlertCircle className="h-3.5 w-3.5" /> {t.statusRevision}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <Crown className="h-3.5 w-3.5" /> {t.statusPending}
                      </span>
                    )}
                    <span className="rounded-full bg-[#ffe0ed] px-2 py-0.5 text-[11px] font-bold text-[#d63384]">
                      🧋 x{activePlan.bobaBribeCount || 0}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-[#6e3f56]">
                    {activePlan.approvalMessage}
                  </p>
                </div>
              </div>

              {/* Action buttons for Princess Approval */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrincessApprove}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff6b9d] to-[#ff4d88] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:scale-[1.02]"
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>{t.approveBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPout();
                    setIsRevisionModalOpen(true);
                  }}
                  className="rounded-xl border-2 border-[#ff9ec7] bg-white px-2.5 py-2 text-xs font-bold text-[#d63384] transition hover:bg-[#ffe8f2]"
                  title={t.revisionTooltip}
                >
                  {t.revisionBtn}
                </button>
                <button
                  type="button"
                  onClick={handleBobaBribe}
                  className="rounded-xl border-2 border-[#ffd43b] bg-[#fff9db] px-2.5 py-2 text-xs font-bold text-[#d97706] transition hover:scale-105"
                  title={t.bobaTooltip}
                >
                  +🧋
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN WORKSPACE: LEFT STICKER DOCK + RIGHT PLAN TIMELINE & CANVAS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT 4 COLS: STICKER PALETTE & NOTE CREATOR */}
          <aside className="lg:col-span-4">
            <div className="sticky top-[82px] rounded-3xl border-3 border-[#ffc2da] bg-white/95 p-4 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display flex items-center gap-1.5 text-lg font-bold text-[#d63384]">
                    <Sparkles className="h-5 w-5 text-[#ff6b9d]" />
                    <span>{t.stickerVaultTitle}</span>
                  </h2>
                  <p className="text-xs font-medium text-[#8c5872]">{t.stickerVaultSubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsNoteModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-[#ff922b] to-[#fd7e14] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:scale-105"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  <span>{t.sendNoteBtn}</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="mb-3 grid grid-cols-2 gap-1.5">
                {STICKER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setActiveCategory(cat.id);
                    }}
                    className={`rounded-2xl border-2 px-3 py-2 text-left text-xs font-bold transition ${
                      activeCategory === cat.id
                        ? 'border-[#ff6b9d] bg-[#ffe6f1] text-[#d63384] shadow-xs'
                        : 'border-[#fff0f6] bg-[#fff9fb] text-[#8c5872] hover:bg-[#fff0f6]'
                    }`}
                  >
                    {lang === 'th' ? cat.shortNameTh : cat.shortName}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-[#b86b8d]" />
                <input
                  type="text"
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                  placeholder={t.searchStickerPlaceholder}
                  className="w-full rounded-2xl border-2 border-[#ffe0ed] bg-[#fff9fb] py-2 pr-3 pl-9 text-xs font-semibold text-[#4a2b3b] focus:border-[#ff85b3] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Sticker Cards List */}
              <div className="grid max-h-[54vh] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
                {filteredStickers.map((sticker) => {
                  const isSelected = selectedSticker?.id === sticker.id;
                  const stDisplay = getStickerDisplay(sticker, lang);
                  return (
                    <div
                      key={sticker.id}
                      draggable
                      onDragStart={(e) => {
                        soundFX.playPop();
                        e.dataTransfer.setData('text/plain', sticker.id);
                        setSelectedSticker(sticker);
                      }}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedSticker(isSelected ? null : sticker);
                      }}
                      style={{
                        backgroundColor: sticker.bgColor,
                        borderColor: isSelected ? '#d63384' : sticker.borderColor,
                      }}
                      className={`group relative flex cursor-grab flex-col items-center rounded-2xl border-2 p-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
                        isSelected ? 'ring-3 ring-[#ff85b3]' : ''
                      }`}
                    >
                      {sticker.imageUrl ? (
                        <div className="mb-1.5 h-20 w-20 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xs">
                          <img
                            src={sticker.imageUrl}
                            alt={stDisplay.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                            draggable={false}
                          />
                        </div>
                      ) : (
                        <div className="mb-1.5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white bg-white/90 text-3xl shadow-xs transition group-hover:scale-110">
                          {sticker.emoji}
                        </div>
                      )}
                      <span className="line-clamp-1 text-xs font-bold text-[#4a2b3b]">
                        {stDisplay.name}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#7a4961]">
                        {stDisplay.subtitle}
                      </span>
                      {stDisplay.defaultDuration && (
                        <span className="mt-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#d63384]">
                          ⏱ {stDisplay.defaultDuration}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* RIGHT 8 COLS: INTERACTIVE TIMELINE + FLOATING STICKER CANVAS + STICKY NOTES */}
          <div className="space-y-6 lg:col-span-8">
            {/* COUPLE STICKY NOTES WALL (GENERAL NOTES & ROYAL DECREES) */}
            <section className="rounded-3xl border-3 border-[#ffd8a8] bg-gradient-to-br from-[#fff9db] via-[#fff5f8] to-[#fff0f6] p-4 shadow-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#d9480f] sm:text-lg">
                      {t.stickyWallTitle}
                    </h2>
                    <p className="text-xs font-medium text-[#8c5872]">{t.stickyWallSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setNoteTargetSlotId('all');
                    setIsNoteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#ff6b9d] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.writeNewNoteBtn}</span>
                </button>
              </div>

              {activePlan.stickyNotes.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#ffc2da] bg-white/70 p-6 text-center text-xs font-medium text-[#8c5872]">
                  {t.emptyNotesText}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activePlan.stickyNotes.map((note) => {
                    const colorStyle = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.pink;
                    const expSticker = STICKER_MAP[note.expressionStickerId];
                    const targetSlot = activePlan.slots.find((s) => s.id === note.targetSlotId);
                    return (
                      <div
                        key={note.id}
                        className={`relative flex gap-3 rounded-2xl border-2 ${colorStyle.bg} ${colorStyle.border} p-3.5 shadow-xs transition hover:-translate-y-0.5`}
                      >
                        {expSticker?.imageUrl ? (
                          <img
                            src={expSticker.imageUrl}
                            alt={getStickerDisplay(expSticker, lang).name}
                            className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white bg-white object-cover shadow-xs"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white text-2xl shadow-xs">
                            {expSticker?.emoji || '💌'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colorStyle.badge}`}
                            >
                              {localizeDynamicText(note.tag, lang)}
                            </span>
                            {targetSlot && (
                              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#d63384]">
                                {targetSlot.icon} {localizeDynamicText(targetSlot.periodName, lang)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#4a2b3b]">
                            &ldquo;{localizeDynamicText(note.content, lang)}&rdquo;
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#8c5872]">
                            <span>
                              {t.fromLabel} {localizeDynamicText(note.authorName, lang)}
                            </span>
                            <span>{localizeDynamicText(note.createdAt, lang)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            updateActivePlan((plan) => ({
                              ...plan,
                              stickyNotes: plan.stickyNotes.filter((n) => n.id !== note.id),
                            }));
                          }}
                          className="absolute top-2 right-2 rounded-full bg-white/80 p-1 text-gray-400 hover:text-rose-500"
                          title={t.deleteNoteTooltip}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* TIMELINE BOARD + FREE FLOATING STICKERS OVERLAY */}
            <section
              ref={boardRef}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={handleBoardPointerUp}
              className="relative rounded-3xl border-3 border-[#ffc2da] bg-white/90 p-4 shadow-md sm:p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display flex items-center gap-2 text-lg font-bold text-[#d63384] sm:text-xl">
                    <span>{t.timelineTitle}</span>
                  </h2>
                  <p className="text-xs font-medium text-[#8c5872]">{t.timelineSubtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsSlotModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-2xl border-2 border-[#ff9ec7] bg-[#fff0f6] px-3 py-1.5 text-xs font-bold text-[#d63384] transition hover:bg-[#ffe0ed]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.addSlotBtn}</span>
                </button>
              </div>

              {/* FREE-FLOATING SCRAPBOOK STICKERS BAR */}
              {activePlan.floatingStickers.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#f3d9fa] bg-[#fcf8ff] px-3 py-2">
                  <span className="text-xs font-bold text-[#7950f2]">
                    {t.floatingCountLabel} ({activePlan.floatingStickers.length}):
                  </span>
                  <span className="text-[11px] font-medium text-[#8c5872]">
                    {t.floatingDragHint}
                  </span>
                </div>
              )}

              {/* FLOATING STICKERS LAYER */}
              {activePlan.floatingStickers.map((fs) => {
                const st = STICKER_MAP[fs.stickerId];
                if (!st) return null;
                const stDisplay = getStickerDisplay(st, lang);
                return (
                  <div
                    key={fs.id}
                    style={{
                      left: `${fs.x}%`,
                      top: `${fs.y}%`,
                      transform: `rotate(${fs.rotation}deg)`,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingFloatId(fs.id);
                    }}
                    className="animate-float-cute group absolute z-20 hidden cursor-move select-none flex-col items-center rounded-2xl border-2 border-white bg-white/95 p-1.5 shadow-lg backdrop-blur-xs sm:flex"
                  >
                    {st.imageUrl ? (
                      <img
                        src={st.imageUrl}
                        alt={stDisplay.name}
                        className="h-16 w-16 rounded-xl object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-3xl">{st.emoji}</span>
                    )}
                    <span className="mt-0.5 max-w-[120px] truncate rounded-full bg-[#fff0f6] px-2 py-0.5 text-[10px] font-bold text-[#d63384]">
                      {localizeDynamicText(fs.caption, lang) || stDisplay.name}
                    </span>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        soundFX.playPop();
                        updateActivePlan((plan) => ({
                          ...plan,
                          floatingStickers: plan.floatingStickers.filter((item) => item.id !== fs.id),
                        }));
                      }}
                      className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white shadow-xs group-hover:flex"
                      title={t.removeFloatingTooltip}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* TIME SLOTS LIST */}
              <div className="space-y-4">
                {activePlan.slots.map((slot) => {
                  const isDragTarget = dragOverSlotId === slot.id;
                  const slotNotes = activePlan.stickyNotes.filter(
                    (n) => n.targetSlotId === slot.id
                  );

                  return (
                    <div
                      key={slot.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverSlotId !== slot.id) {
                          setDragOverSlotId(slot.id);
                        }
                      }}
                      onDragLeave={() => setDragOverSlotId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSlotId(null);
                        const stickerId = e.dataTransfer.getData('text/plain');
                        const droppedSticker = STICKER_MAP[stickerId] || selectedSticker;
                        if (droppedSticker) {
                          handleAddStickerToSlot(droppedSticker, slot.id);
                        }
                      }}
                      style={{ backgroundColor: slot.themeColor }}
                      className={`rounded-3xl border-3 p-4 transition ${
                        isDragTarget
                          ? 'scale-[1.01] border-[#ff4d88] ring-4 ring-[#ffb6d5]'
                          : 'border-[#ffd6e7]'
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl shadow-xs">
                            {slot.icon}
                          </span>
                          <div>
                            <h3 className="font-display text-base font-bold text-[#4a2b3b] sm:text-lg">
                              {localizeDynamicText(slot.periodName, lang)}
                            </h3>
                            <span className="inline-block rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-[#d63384]">
                              ⏰ {localizeDynamicText(slot.timeLabel, lang)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedSticker && (
                            <button
                              type="button"
                              onClick={() => handleAddStickerToSlot(selectedSticker, slot.id)}
                              className="animate-pulse rounded-xl bg-[#ff4d88] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#d63384]"
                            >
                              {t.dropHereBtnPrefix} &ldquo;
                              {getStickerDisplay(selectedSticker, lang).name}&rdquo;{' '}
                              {t.dropHereBtnSuffix}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setNoteTargetSlotId(slot.id);
                              setIsNoteModalOpen(true);
                            }}
                            className="rounded-xl border border-[#ffadd2] bg-white px-2.5 py-1.5 text-xs font-bold text-[#d63384] hover:bg-[#fff0f6]"
                          >
                            {t.attachSlotNoteBtn}
                          </button>
                          {activePlan.slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                updateActivePlan((plan) => ({
                                  ...plan,
                                  slots: plan.slots.filter((s) => s.id !== slot.id),
                                }));
                              }}
                              className="rounded-xl bg-white/70 p-1.5 text-gray-400 hover:text-rose-500"
                              title={t.deleteSlotTooltip}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Activities inside Slot */}
                      {slot.activities.length === 0 ? (
                        <div
                          onClick={() => {
                            if (selectedSticker) {
                              handleAddStickerToSlot(selectedSticker, slot.id);
                            }
                          }}
                          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ffb6d5] bg-white/60 py-6 text-center transition hover:bg-white/90"
                        >
                          <p className="text-xs font-bold text-[#d63384]">{t.emptySlotTitle}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-[#8c5872]">
                            {t.emptySlotSubtitle}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {slot.activities.map((act) => {
                            const st = STICKER_MAP[act.stickerId];
                            const moodSt = act.moodStickerId
                              ? STICKER_MAP[act.moodStickerId]
                              : undefined;

                            return (
                              <div
                                key={act.id}
                                className="flex flex-col gap-3 rounded-2xl border-2 border-white bg-white/95 p-3.5 shadow-sm transition hover:border-[#ffb6d5] sm:flex-row sm:items-center"
                              >
                                {/* Sticker Thumbnail */}
                                <div className="flex items-center gap-3">
                                  {st?.imageUrl ? (
                                    <img
                                      src={st.imageUrl}
                                      alt={act.title}
                                      className="h-16 w-16 shrink-0 rounded-2xl border-2 border-[#ffc2da] object-cover shadow-xs"
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        backgroundColor: st?.bgColor || '#fff0f6',
                                      }}
                                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[#ffc2da] text-3xl shadow-xs"
                                    >
                                      {st?.emoji || '💖'}
                                    </div>
                                  )}

                                  {/* Mobile Title */}
                                  <div className="sm:hidden">
                                    <span className="rounded-full bg-[#fff0f6] px-2 py-0.5 text-[10px] font-bold text-[#d63384]">
                                      {act.addedBy === 'princess'
                                        ? roomData.princessName
                                        : roomData.princeName}
                                    </span>
                                    <h4 className="font-display text-sm font-bold text-[#4a2b3b]">
                                      {act.title}
                                    </h4>
                                  </div>
                                </div>

                                {/* Editable Activity Details */}
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={act.title}
                                      onChange={(e) =>
                                        handleUpdateActivity(slot.id, act.id, {
                                          title: e.target.value,
                                        })
                                      }
                                      className="font-display hidden rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-bold text-[#4a2b3b] focus:border-[#ff85b3] focus:bg-[#fff9fb] focus:outline-none sm:inline-block"
                                    />
                                    <div className="flex items-center gap-1 rounded-full bg-[#fff0f6] px-2.5 py-0.5 text-xs font-bold text-[#d63384]">
                                      <Clock className="h-3 w-3" />
                                      <input
                                        type="text"
                                        value={act.timeRange}
                                        onChange={(e) =>
                                          handleUpdateActivity(slot.id, act.id, {
                                            timeRange: e.target.value,
                                          })
                                        }
                                        className="w-24 bg-transparent text-xs font-bold text-[#d63384] focus:outline-none"
                                        placeholder={t.timeRangePlaceholder}
                                      />
                                    </div>
                                    <span className="hidden rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-bold text-[#7950f2] sm:inline-block">
                                      {t.addedByLabel}{' '}
                                      {act.addedBy === 'princess'
                                        ? roomData.princessName
                                        : roomData.princeName}
                                    </span>
                                  </div>

                                  {/* Location Input */}
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6e3f56]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ff6b9d]" />
                                    <input
                                      type="text"
                                      value={act.location}
                                      onChange={(e) =>
                                        handleUpdateActivity(slot.id, act.id, {
                                          location: e.target.value,
                                        })
                                      }
                                      className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 focus:border-[#ffadd2] focus:bg-[#fff9fb] focus:outline-none"
                                      placeholder={t.locationPlaceholder}
                                    />
                                  </div>

                                  {/* Note Input */}
                                  <input
                                    type="text"
                                    value={act.note}
                                    onChange={(e) =>
                                      handleUpdateActivity(slot.id, act.id, {
                                        note: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-xl bg-[#fff9fb] px-2.5 py-1 text-xs font-medium text-[#8c5872] focus:bg-white focus:ring-1 focus:ring-[#ff85b3] focus:outline-none"
                                    placeholder={t.activityNotePlaceholder}
                                  />
                                </div>

                                {/* Right Actions: Mood Badge, Heart Button, Delete */}
                                <div className="flex items-center justify-end gap-2 sm:flex-col">
                                  {moodSt && (
                                    <span
                                      className="rounded-full bg-[#ffe8f2] px-2 py-0.5 text-[11px] font-bold text-[#d63384]"
                                      title={getStickerDisplay(moodSt, lang).name}
                                    >
                                      {moodSt.emoji}{' '}
                                      {getStickerDisplay(moodSt, lang).name.slice(0, 12)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundFX.playSparkle();
                                        handleUpdateActivity(slot.id, act.id, {
                                          hearts: (act.hearts || 0) + 1,
                                        });
                                      }}
                                      className="flex items-center gap-1 rounded-full border border-[#ffb6d5] bg-[#fff0f6] px-2.5 py-1 text-xs font-bold text-[#ff4d88] transition hover:scale-110"
                                      title={t.heartTooltip}
                                    >
                                      <Heart className="h-3.5 w-3.5 fill-[#ff4d88]" />
                                      <span>{act.hearts || 0}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteActivity(slot.id, act.id)}
                                      className="rounded-full p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500"
                                      title={t.deleteActivityTooltip}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Slot-specific pinned Sticky Notes */}
                      {slotNotes.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {slotNotes.map((sn) => {
                            const expSt = STICKER_MAP[sn.expressionStickerId];
                            return (
                              <div
                                key={sn.id}
                                className="flex items-center gap-2.5 rounded-2xl border-2 border-[#ffadd2] bg-[#fff9fb] p-2.5 text-xs shadow-2xs"
                              >
                                {expSt?.imageUrl ? (
                                  <img
                                    src={expSt.imageUrl}
                                    alt={getStickerDisplay(expSt, lang).name}
                                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">{expSt?.emoji || '📌'}</span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-[#d63384]">
                                    {localizeDynamicText(sn.authorName, lang)}:{' '}
                                  </span>
                                  <span className="font-medium text-[#4a2b3b]">
                                    {localizeDynamicText(sn.content, lang)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* DIALOG 1: CREATE STICKY NOTE WITH EXPRESSION STICKER */}
      <LightDismissDialog
        open={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={t.noteModalTitle}
        subtitle={t.noteModalSubtitle}
      >
        <form onSubmit={handleCreateStickyNote} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#6e3f56]">{t.noteStep1}</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {expressionStickers.map((st) => {
                const stDisplay = getStickerDisplay(st, lang);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setNoteExpressionId(st.id);
                      if (!noteContent.trim() && stDisplay.defaultNote) {
                        setNoteContent(stDisplay.defaultNote);
                      }
                    }}
                    className={`flex flex-col items-center rounded-2xl border-2 p-2 text-center transition ${
                      noteExpressionId === st.id
                        ? 'border-[#d63384] bg-[#ffe6f1] ring-2 ring-[#ff85b3]'
                        : 'border-[#ffe0ed] bg-white hover:bg-[#fff5f9]'
                    }`}
                  >
                    {st.imageUrl ? (
                      <img
                        src={st.imageUrl}
                        alt={stDisplay.name}
                        className="mb-1 h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="mb-1 text-2xl">{st.emoji}</span>
                    )}
                    <span className="line-clamp-1 text-[10px] font-bold text-[#4a2b3b]">
                      {stDisplay.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">{t.noteStep2}</label>
              <select
                value={noteTargetSlotId}
                onChange={(e) => setNoteTargetSlotId(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b] focus:border-[#ff6b9d] focus:outline-none"
              >
                <option value="all">{t.noteAllDayOption}</option>
                {activePlan.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {localizeDynamicText(s.periodName, lang)} ({s.timeLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">{t.noteStep3}</label>
              <select
                value={noteTag}
                onChange={(e) => setNoteTag(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b] focus:border-[#ff6b9d] focus:outline-none"
              >
                {NOTE_TAGS_BY_LANG[lang].map((tagItem) => (
                  <option key={tagItem} value={tagItem}>
                    {tagItem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">{t.noteStep4}</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NOTE_COLOR_STYLES) as StickyNoteItem['color'][]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setNoteColor(cKey)}
                  className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition ${
                    NOTE_COLOR_STYLES[cKey].bg
                  } ${
                    noteColor === cKey
                      ? 'border-[#d63384] ring-2 ring-[#ff85b3]'
                      : 'border-transparent'
                  }`}
                >
                  {NOTE_COLOR_LABELS[lang][cKey]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
              {t.noteQuickSuggestLabel}
            </label>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_NOTE_TEMPLATES[lang].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setNoteContent(tpl);
                  }}
                  className="rounded-xl border border-[#ffadd2] bg-[#fff5f9] px-2.5 py-1 text-left text-[11px] font-semibold text-[#d63384] transition hover:bg-[#ffe0ed]"
                >
                  {tpl}
                </button>
              ))}
            </div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
              {t.noteStep5} ({currentRole === 'princess' ? roomData.princessName : roomData.princeName}):
            </label>
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t.noteTextareaPlaceholder}
              className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white p-3 text-xs font-semibold text-[#4a2b3b] focus:border-[#ff6b9d] focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="rounded-2xl border-2 border-[#ffc2da] bg-white px-4 py-2 text-xs font-bold text-[#8c5872]"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#ff6b9d] to-[#ff4d88] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:scale-105"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{t.submitNoteBtn}</span>
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* DIALOG 2: PRINCESS REVISION / DEMAND MORE TREATS */}
      <LightDismissDialog
        open={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title={t.revisionModalTitle}
        subtitle={t.revisionModalSubtitle}
      >
        <form onSubmit={handlePrincessRequestRevision} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[#ffb6d5] bg-[#fff0f6] p-3">
            <img
              src="/stickers/expression-pout.jpg"
              alt="Princess Pouting"
              className="h-20 w-20 rounded-2xl border-2 border-white object-cover shadow-xs"
            />
            <p className="text-xs font-semibold text-[#8c5872]">{t.revisionQuote}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
              {t.revisionInputLabel}
            </label>
            <textarea
              rows={3}
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder={t.revisionInputPlaceholder}
              className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white p-3 text-xs font-semibold text-[#4a2b3b] focus:border-[#ff6b9d] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRevisionModalOpen(false)}
              className="rounded-2xl border-2 border-[#ffc2da] bg-white px-4 py-2 text-xs font-bold text-[#8c5872]"
            >
              {t.revisionCancelBtn}
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-rose-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-600"
            >
              {t.revisionSubmitBtn}
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* DIALOG 3: SETTINGS, ROOM PIN & FIREBASE REALTIME SYNC */}
      <LightDismissDialog
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={t.settingsModalTitle}
        subtitle={t.settingsModalSubtitle}
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
                {t.princeNicknameLabel}
              </label>
              <input
                type="text"
                value={princeInput}
                onChange={(e) => setPrinceInput(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
                {t.princessNicknameLabel}
              </label>
              <input
                type="text"
                value={princessInput}
                onChange={(e) => setPrincessInput(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
              />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#e9d5ff] bg-[#f8f0ff] p-3.5">
            <label className="mb-1 block text-xs font-bold text-[#6741d9]">
              {t.roomPinInputLabel}
            </label>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              placeholder="CONGCHUA2026"
              className="w-full rounded-xl border-2 border-[#d0bfff] bg-white px-3 py-2 text-sm font-bold tracking-wider text-[#5f3dc4] uppercase"
            />
            <p className="mt-1.5 text-[11px] font-medium text-[#7950f2]">{t.roomPinHelpText}</p>
          </div>

          <div className="rounded-2xl border-2 border-[#ffc2da] bg-[#fff5f9] p-3.5">
            <label className="mb-1 block text-xs font-bold text-[#d63384]">
              {t.firebaseConfigLabel}
            </label>
            <p className="mb-2 text-[11px] font-medium text-[#8c5872]">{t.firebaseConfigHelp}</p>
            <textarea
              rows={4}
              value={firebaseJsonInput}
              onChange={(e) => setFirebaseJsonInput(e.target.value)}
              placeholder='{"apiKey": "...", "projectId": "...", "appId": "..."}'
              className="w-full rounded-xl border border-[#ffadd2] bg-white p-2.5 font-mono text-[11px] text-[#4a2b3b]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="rounded-2xl border-2 border-[#ffc2da] bg-white px-4 py-2 text-xs font-bold text-[#8c5872]"
            >
              {t.closeBtn}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-2xl bg-[#7950f2] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6741d9]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t.saveSettingsBtn}</span>
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* DIALOG 4: CREATE NEW DATE PLAN */}
      <LightDismissDialog
        open={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        title={t.newPlanModalTitle}
        subtitle={t.newPlanModalSubtitle}
      >
        <form onSubmit={handleCreateNewPlan} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
              {t.newPlanNameLabel}
            </label>
            <input
              type="text"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder={t.newPlanNamePlaceholder}
              className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">{t.dateLabel}:</label>
            <input
              type="date"
              value={newPlanDate}
              onChange={(e) => setNewPlanDate(e.target.value)}
              className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewPlanModalOpen(false)}
              className="rounded-2xl border-2 border-[#ffc2da] bg-white px-4 py-2 text-xs font-bold text-[#8c5872]"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-[#ff6b9d] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#ff4d88]"
            >
              {t.createPlanSubmitBtn}
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* DIALOG 5: ADD CUSTOM TIME SLOT */}
      <LightDismissDialog
        open={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={t.slotModalTitle}
        subtitle={t.slotModalSubtitle}
      >
        <form onSubmit={handleCreateCustomSlot} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
                {t.slotNameLabel}
              </label>
              <input
                type="text"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                placeholder={t.slotNamePlaceholder}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
                {t.slotIconLabel}
              </label>
              <input
                type="text"
                value={newSlotIcon}
                onChange={(e) => setNewSlotIcon(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-center text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#6e3f56]">
              {t.slotTimeLabel}
            </label>
            <input
              type="text"
              value={newSlotTime}
              onChange={(e) => setNewSlotTime(e.target.value)}
              placeholder={t.slotTimePlaceholder}
              className="w-full rounded-2xl border-2 border-[#ffc2da] bg-white px-3 py-2 text-xs font-bold text-[#4a2b3b]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSlotModalOpen(false)}
              className="rounded-2xl border-2 border-[#ffc2da] bg-white px-4 py-2 text-xs font-bold text-[#8c5872]"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-[#ff6b9d] px-5 py-2 text-xs font-bold text-white shadow-md"
            >
              + {t.addSlotBtn}
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* DIALOG 6: PWA INSTALLATION GUIDE FOR PC & MOBILE */}
      <LightDismissDialog
        open={isPwaGuideOpen}
        onClose={() => setIsPwaGuideOpen(false)}
        title={t.pwaModalTitle}
        subtitle={t.pwaModalSubtitle}
      >
        <div className="space-y-3 text-xs font-medium text-[#4a2b3b]">
          <div className="rounded-2xl border-2 border-[#ffc2da] bg-[#fff0f6] p-3.5">
            <h4 className="font-bold text-[#d63384]">{t.pwaIosTitle}</h4>
            <p className="mt-1 whitespace-pre-line">{t.pwaIosSteps}</p>
          </div>
          <div className="rounded-2xl border-2 border-[#bde0fe] bg-[#eef8ff] p-3.5">
            <h4 className="font-bold text-[#0284c7]">{t.pwaAndroidTitle}</h4>
            <p className="mt-1 whitespace-pre-line">{t.pwaAndroidSteps}</p>
          </div>
          <div className="rounded-2xl border-2 border-[#e9d5ff] bg-[#f8f0ff] p-3.5">
            <h4 className="font-bold text-[#7950f2]">{t.pwaPcTitle}</h4>
            <p className="mt-1 whitespace-pre-line">{t.pwaPcSteps}</p>
          </div>
        </div>
      </LightDismissDialog>
    </div>
  );
};
