// Centralized content / media references.
// Hozircha rasm va videolar internetdan (Unsplash / namuna videolar) olingan.

export const NAV_LINKS = [
  { id: "hero", label: "Bosh sahifa" },
  { id: "process", label: "Jarayon" },
  { id: "garage", label: "Virtual garaj" },
  { id: "parts", label: "Zapchastlar" },
  { id: "contact", label: "Aloqa" },
];

export const STATS = [
  { value: 1200, suffix: "+", label: "Yakunlangan loyiha" },
  { value: 14, suffix: " yil", label: "Tajriba" },
  { value: 98, suffix: "%", label: "Mijoz mamnunligi" },
  { value: 45, suffix: "+", label: "Mutaxassis" },
];

export const PROCESS_STEPS = [
  {
    id: 1,
    tag: "Diagnostika",
    title: "Chuqur tahlil",
    desc: "Avtomobilingiz holatini lazerli skanerlash va kompyuter diagnostikasi orqali to\u2019liq baholaymiz.",
    video:
      "https://cdn.coverr.co/videos/coverr-a-mechanic-working-on-a-car-engine-4858/1080p.mp4",
    poster:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    tag: "Dizayn",
    title: "Konsept va vizualizatsiya",
    desc: "3D vizualizatsiya orqali yakuniy ko\u2019rinishni ish boshlanishidan oldin ko\u2019rasiz.",
    video:
      "https://cdn.coverr.co/videos/coverr-the-dashboard-of-a-car-2633/1080p.mp4",
    poster:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    tag: "Ishlov",
    title: "Premium tuning",
    desc: "Tonirovka, body-kit, diskalar va dvigatel chiplovkasi \u2014 barchasi yuqori aniqlikda.",
    video:
      "https://cdn.coverr.co/videos/coverr-spray-painting-a-car-5663/1080p.mp4",
    poster:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  },
];

export const BEFORE_AFTER = [
  {
    id: 1,
    title: "BMW M4 — To\u2019liq qayta tug\u2019ilish",
    before:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80",
    after:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 2,
    title: "Mercedes AMG — Stels paket",
    before:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=80",
    after:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80",
  },
];

// Virtual garaj uchun konfigurator variantlari
export const CAR_MODELS = [
  { id: "coupe", name: "Sport Coupe", basePrice: 42000 },
  { id: "sedan", name: "Lyuks Sedan", basePrice: 38000 },
  { id: "suv", name: "Premium SUV", basePrice: 51000 },
];

export const BODY_COLORS = [
  { id: "midnight", name: "Yarim tun qora", hex: "#0c0c12", price: 0 },
  { id: "crimson", name: "Crimson qizil", hex: "#c1121f", price: 1200 },
  { id: "arctic", name: "Arktik oq", hex: "#e8e8ec", price: 800 },
  { id: "cyber", name: "Cyber ko\u2019k", hex: "#1338be", price: 1500 },
  { id: "lime", name: "Toxic lime", hex: "#b6ff00", price: 1800 },
];

export const TINT_LEVELS = [
  { id: "none", name: "Tonirovkasiz", opacity: 0, price: 0 },
  { id: "light", name: "Yengil (35%)", opacity: 0.35, price: 350 },
  { id: "medium", name: "O\u2019rta (50%)", opacity: 0.5, price: 500 },
  { id: "dark", name: "Qorong\u2019u (80%)", opacity: 0.8, price: 750 },
];

export const WHEEL_OPTIONS = [
  { id: "stock", name: "Standart", color: "#2a2a32", price: 0 },
  { id: "sport", name: "Sport quyma", color: "#d4af37", price: 2400 },
  { id: "carbon", name: "Karbon", color: "#1a1a1f", price: 3800 },
  { id: "chrome", name: "Xrom", color: "#c0c0c8", price: 3200 },
];

export const TUNING_ADDONS = [
  { id: "bodykit", name: "Aero body-kit", price: 4200 },
  { id: "spoiler", name: "Karbon spoyler", price: 1600 },
  { id: "exhaust", name: "Sport vyxlop", price: 2100 },
  { id: "suspension", name: "Sport podveska", price: 2800 },
];

export const PARTS = [
  {
    id: "p1",
    name: 'Forged Sport disklar 20"',
    category: "G\u2019ildiraklar",
    price: 3800,
    image:
      "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=900&q=80",
    color: "#d4af37",
  },
  {
    id: "p2",
    name: "Karbon-fiber kapot",
    category: "Tana",
    price: 2600,
    image:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
    color: "#1a1a1f",
  },
  {
    id: "p3",
    name: "Titan vyxlop tizimi",
    category: "Dvigatel",
    price: 2100,
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80",
    color: "#c0c0c8",
  },
  {
    id: "p4",
    name: "Brembo tormoz to\u2019plami",
    category: "Tormoz",
    price: 3400,
    image:
      "https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=900&q=80",
    color: "#c1121f",
  },
  {
    id: "p5",
    name: "LED matrix faralar",
    category: "Optika",
    price: 1900,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
    color: "#1338be",
  },
  {
    id: "p6",
    name: "Sport podveska coilover",
    category: "Xodovoy",
    price: 2800,
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
    color: "#ff8a3d",
  },
];

export const formatPrice = (n) => "$" + n.toLocaleString("en-US");
