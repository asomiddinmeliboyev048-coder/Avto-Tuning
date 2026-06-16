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

// Virtual garaj — O'zbekistondagi real mashinalar (UzAuto / Chevrolet liniyasi).
// `shape` 3D model siluetini, `spec` esa proporsiyalarni boshqaradi.
// Barcha o'lchamlar taxminiy "3D birlik"da (1 birlik ~ 1 metr).
export const UZ_CARS = [
  {
    id: "spark",
    name: "Chevrolet Spark",
    brand: "Chevrolet",
    basePrice: 9500,
    shape: "hatchback",
    spec: {
      length: 3.6,
      width: 1.62,
      bodyH: 0.6,
      cabinLen: 1.9,
      roofH: 0.66,
      ground: 0.3,
      wheelR: 0.32,
      wheelbase: 2.35,
      hoodLen: 0.7,
      roofX: 0.05,
    },
  },
  {
    id: "nexia",
    name: "Chevrolet Nexia",
    brand: "Chevrolet",
    basePrice: 11500,
    shape: "sedan",
    spec: {
      length: 4.35,
      width: 1.74,
      bodyH: 0.62,
      cabinLen: 1.7,
      roofH: 0.6,
      ground: 0.31,
      wheelR: 0.33,
      wheelbase: 2.6,
      hoodLen: 1.0,
      roofX: -0.12,
    },
  },
  {
    id: "cobalt",
    name: "Chevrolet Cobalt",
    brand: "Chevrolet",
    basePrice: 12500,
    shape: "sedan",
    spec: {
      length: 4.48,
      width: 1.76,
      bodyH: 0.64,
      cabinLen: 1.78,
      roofH: 0.62,
      ground: 0.32,
      wheelR: 0.34,
      wheelbase: 2.62,
      hoodLen: 1.0,
      roofX: -0.1,
    },
  },
  {
    id: "gentra",
    name: "Chevrolet Gentra",
    brand: "Chevrolet",
    basePrice: 13800,
    shape: "sedan",
    spec: {
      length: 4.52,
      width: 1.78,
      bodyH: 0.64,
      cabinLen: 1.82,
      roofH: 0.63,
      ground: 0.32,
      wheelR: 0.34,
      wheelbase: 2.6,
      hoodLen: 1.05,
      roofX: -0.08,
    },
  },
  {
    id: "lacetti",
    name: "Chevrolet Lacetti",
    brand: "Chevrolet",
    basePrice: 14200,
    shape: "sedan",
    spec: {
      length: 4.5,
      width: 1.78,
      bodyH: 0.63,
      cabinLen: 1.8,
      roofH: 0.62,
      ground: 0.31,
      wheelR: 0.34,
      wheelbase: 2.6,
      hoodLen: 1.0,
      roofX: -0.1,
    },
  },
  {
    id: "onix",
    name: "Chevrolet Onix",
    brand: "Chevrolet",
    basePrice: 15500,
    shape: "sedan",
    spec: {
      length: 4.47,
      width: 1.77,
      bodyH: 0.6,
      cabinLen: 1.78,
      roofH: 0.58,
      ground: 0.3,
      wheelR: 0.34,
      wheelbase: 2.6,
      hoodLen: 1.0,
      roofX: -0.12,
    },
  },
  {
    id: "malibu",
    name: "Chevrolet Malibu",
    brand: "Chevrolet",
    basePrice: 28000,
    shape: "sedan",
    spec: {
      length: 4.92,
      width: 1.85,
      bodyH: 0.58,
      cabinLen: 1.95,
      roofH: 0.58,
      ground: 0.28,
      wheelR: 0.37,
      wheelbase: 2.83,
      hoodLen: 1.2,
      roofX: -0.15,
    },
  },
  {
    id: "tracker",
    name: "Chevrolet Tracker",
    brand: "Chevrolet",
    basePrice: 20500,
    shape: "suv",
    spec: {
      length: 4.27,
      width: 1.8,
      bodyH: 0.82,
      cabinLen: 2.0,
      roofH: 0.78,
      ground: 0.42,
      wheelR: 0.38,
      wheelbase: 2.57,
      hoodLen: 0.95,
      roofX: 0,
    },
  },
  {
    id: "captiva",
    name: "Chevrolet Captiva",
    brand: "Chevrolet",
    basePrice: 26000,
    shape: "suv",
    spec: {
      length: 4.7,
      width: 1.85,
      bodyH: 0.86,
      cabinLen: 2.2,
      roofH: 0.82,
      ground: 0.44,
      wheelR: 0.4,
      wheelbase: 2.75,
      hoodLen: 1.05,
      roofX: 0,
    },
  },
  {
    id: "tahoe",
    name: "Chevrolet Tahoe",
    brand: "Chevrolet",
    basePrice: 82000,
    shape: "suv",
    spec: {
      length: 5.35,
      width: 2.06,
      bodyH: 0.95,
      cabinLen: 2.6,
      roofH: 0.9,
      ground: 0.5,
      wheelR: 0.46,
      wheelbase: 3.07,
      hoodLen: 1.15,
      roofX: 0,
    },
  },
  {
    id: "damas",
    name: "Chevrolet Damas",
    brand: "Chevrolet",
    basePrice: 7500,
    shape: "van",
    spec: {
      length: 3.4,
      width: 1.4,
      bodyH: 1.05,
      cabinLen: 2.6,
      roofH: 0.95,
      ground: 0.34,
      wheelR: 0.28,
      wheelbase: 1.84,
      hoodLen: 0.25,
      roofX: 0.1,
    },
  },
  {
    id: "labo",
    name: "Chevrolet Labo",
    brand: "Chevrolet",
    basePrice: 7800,
    shape: "pickup",
    spec: {
      length: 3.6,
      width: 1.4,
      bodyH: 0.7,
      cabinLen: 1.1,
      roofH: 0.85,
      ground: 0.34,
      wheelR: 0.28,
      wheelbase: 1.84,
      hoodLen: 0.2,
      roofX: 0.85,
    },
  },
];

// Eski import nomlari uchun moslik (backward-compat).
export const CAR_MODELS = UZ_CARS;

export const BODY_COLORS = [
  { id: "white", name: "Summit oq", hex: "#eef0f2", price: 0 },
  { id: "silver", name: "Switchblade kumush", hex: "#b9bcc2", price: 300 },
  { id: "midnight", name: "Yarim tun qora", hex: "#0e0e14", price: 400 },
  { id: "graphite", name: "Grafit kulrang", hex: "#4a4d55", price: 350 },
  { id: "crimson", name: "Crimson qizil", hex: "#b81225", price: 1200 },
  { id: "ocean", name: "Okean ko\u2019k", hex: "#13386e", price: 900 },
  { id: "cyber", name: "Cyber ko\u2019k", hex: "#1f4fd6", price: 1500 },
  { id: "lime", name: "Toxic lime", hex: "#9ed40a", price: 1800 },
];

export const TINT_LEVELS = [
  { id: "none", name: "Tonirovkasiz", opacity: 0, price: 0 },
  { id: "light", name: "Yengil (35%)", opacity: 0.35, price: 350 },
  { id: "medium", name: "O\u2019rta (50%)", opacity: 0.5, price: 500 },
  { id: "dark", name: "Qorong\u2019u (80%)", opacity: 0.8, price: 750 },
];

export const WHEEL_OPTIONS = [
  {
    id: "stock",
    name: "Standart",
    color: "#3a3d44",
    price: 0,
    spokes: 5,
    style: "steel",
  },
  {
    id: "sport",
    name: "Sport quyma",
    color: "#d4af37",
    price: 2400,
    spokes: 7,
    style: "alloy",
  },
  {
    id: "carbon",
    name: "Karbon",
    color: "#1a1a1f",
    price: 3800,
    spokes: 10,
    style: "mesh",
  },
  {
    id: "chrome",
    name: "Xrom",
    color: "#c8ccd4",
    price: 3200,
    spokes: 5,
    style: "alloy",
  },
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
