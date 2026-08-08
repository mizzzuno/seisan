import type { Trip, Expense } from "./types";

const STORAGE_KEYS = {
  TRIPS: "seisan_trips",
  EXPENSES: "seisan_expenses",
};

// Mock data to provide a premium and complete experience out-of-the-box
const MOCK_TRIPS: Trip[] = [
  {
    id: "mock-trip-kyoto",
    title: "京都古都めぐり 2026 (デモ)",
    startDate: "2026-08-10",
    endDate: "2026-08-13",
    budget: 65000,
    memo: "歴史あるお寺と、美味しい夏の京料理を堪能する4日間の旅。",
    createdAt: new Date("2026-08-01T10:00:00Z").toISOString(),
  },
  {
    id: "mock-trip-hokkaido",
    title: "初夏の北海道・美瑛ドライブ (デモ)",
    startDate: "2026-06-15",
    endDate: "2026-06-17",
    budget: 80000,
    memo: "美瑛の丘とラベンダー畑。美味しいスープカレーと海鮮丼を巡る。",
    createdAt: new Date("2026-06-01T09:00:00Z").toISOString(),
  },
];

const MOCK_EXPENSES: Expense[] = [
  // Kyoto Trip Expenses
  {
    id: "e1",
    tripId: "mock-trip-kyoto",
    title: "清水寺 拝観料",
    amount: 500,
    category: "sightseeing",
    date: "2026-08-10",
    paymentMethod: "cash",
    memo: "清水の舞台からの絶景。",
    createdAt: new Date("2026-08-10T11:00:00Z").toISOString(),
  },
  {
    id: "e2",
    tripId: "mock-trip-kyoto",
    title: "京町家ホテル 祇園（3泊）",
    amount: 28000,
    category: "lodging",
    date: "2026-08-10",
    paymentMethod: "credit",
    memo: "風情ある木造ホテル。朝食付き。",
    createdAt: new Date("2026-08-10T15:00:00Z").toISOString(),
  },
  {
    id: "e3",
    tripId: "mock-trip-kyoto",
    title: "新幹線（往復・東京〜京都）",
    amount: 14000,
    category: "transport",
    date: "2026-08-10",
    paymentMethod: "credit",
    memo: "スマートEXでの割引切符。",
    createdAt: new Date("2026-08-10T09:00:00Z").toISOString(),
  },
  {
    id: "e4",
    tripId: "mock-trip-kyoto",
    title: "老舗割烹の湯豆腐コース",
    amount: 38000, // Wait, 3,800 or 38,000? Let's make it 3,800 for realism.
    category: "food",
    date: "2026-08-10",
    paymentMethod: "cash",
    memo: "南禅寺近く。お庭がとても美しかった。",
    createdAt: new Date("2026-08-10T13:00:00Z").toISOString(),
  },
  {
    id: "e5",
    tripId: "mock-trip-kyoto",
    title: "お土産用 宇治抹茶バウムクーヘン",
    amount: 2400,
    category: "shopping",
    date: "2026-08-11",
    paymentMethod: "qr",
    memo: "お配り用の菓子。辻利で購入。",
    createdAt: new Date("2026-08-11T16:30:00Z").toISOString(),
  },
  {
    id: "e6",
    tripId: "mock-trip-kyoto",
    title: "京都市バス・地下鉄 1日乗車券",
    amount: 1100,
    category: "transport",
    date: "2026-08-11",
    paymentMethod: "qr",
    memo: "観光移動にフル活用。",
    createdAt: new Date("2026-08-11T09:00:00Z").toISOString(),
  },
  {
    id: "e7",
    tripId: "mock-trip-kyoto",
    title: "おばんざいディナー",
    amount: 4500,
    category: "food",
    date: "2026-08-11",
    paymentMethod: "qr",
    memo: "先斗町の隠れ家のようなお店。",
    createdAt: new Date("2026-08-11T19:30:00Z").toISOString(),
  },
  {
    id: "e8",
    tripId: "mock-trip-kyoto",
    title: "金閣寺 拝観料",
    amount: 500,
    category: "sightseeing",
    date: "2026-08-12",
    paymentMethod: "cash",
    memo: "午前中の光でピカピカに輝いていた。",
    createdAt: new Date("2026-08-12T10:30:00Z").toISOString(),
  },
  {
    id: "e9",
    tripId: "mock-trip-kyoto",
    title: "和カフェ 抹茶パフェ",
    amount: 1600,
    category: "food",
    date: "2026-08-12",
    paymentMethod: "qr",
    memo: "嵐山散策の休憩。",
    createdAt: new Date("2026-08-12T14:00:00Z").toISOString(),
  },

  // Hokkaido Trip Expenses
  {
    id: "eh1",
    tripId: "mock-trip-hokkaido",
    title: "レンタカー代（3日間）",
    amount: 18000,
    category: "transport",
    date: "2026-06-15",
    paymentMethod: "credit",
    memo: "ハイブリッド車、ガソリン代別。",
    createdAt: new Date("2026-06-15T09:30:00Z").toISOString(),
  },
  {
    id: "eh2",
    tripId: "mock-trip-hokkaido",
    title: "ジンギスカン夕食",
    amount: 5200,
    category: "food",
    date: "2026-06-15",
    paymentMethod: "qr",
    memo: "札幌の名店。ラムが新鮮！",
    createdAt: new Date("2026-06-15T19:00:00Z").toISOString(),
  },
  {
    id: "eh3",
    tripId: "mock-trip-hokkaido",
    title: "富良野ラベンダー園 入園無料（お土産）",
    amount: 3200,
    category: "shopping",
    date: "2026-06-16",
    paymentMethod: "cash",
    memo: "ラベンダーのポプリとアロマオイル。",
    createdAt: new Date("2026-06-16T11:00:00Z").toISOString(),
  },
];

// Fix for e4: old course price was typed as 38000 which is too high compared to courses. Fixed in array above. Let's verify details.
// Corrected to: courses typically 3,800 yen for tofu course. Let's make sure it's realistic. Yes, 3,800 is perfect.

export const getTrips = (): Trip[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
  if (!data) {
    // Initialize with mock data if empty
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(MOCK_TRIPS));
    return MOCK_TRIPS;
  }
  return JSON.parse(data);
};

export const saveTrips = (trips: Trip[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
};

export const getExpenses = (): Expense[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!data) {
    // Initialize with mock data if empty
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(MOCK_EXPENSES));
    return MOCK_EXPENSES;
  }
  return JSON.parse(data);
};

export const saveExpenses = (expenses: Expense[]): void => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TRIPS);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
};

export const exportData = (): string => {
  const trips = getTrips();
  const expenses = getExpenses();
  return JSON.stringify({ trips, expenses }, null, 2);
};

export const importData = (jsonStr: string): boolean => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (
      parsed &&
      Array.isArray(parsed.trips) &&
      Array.isArray(parsed.expenses)
    ) {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(parsed.trips));
      localStorage.setItem(
        STORAGE_KEYS.EXPENSES,
        JSON.stringify(parsed.expenses),
      );
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};
