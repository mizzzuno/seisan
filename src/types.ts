export type CategoryType = 'food' | 'transport' | 'lodging' | 'sightseeing' | 'shopping' | 'other';

export type PaymentMethodType = 'cash' | 'credit' | 'qr' | 'other';

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  budget: number;
  memo: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  category: CategoryType;
  date: string;
  paymentMethod: PaymentMethodType;
  memo: string;
  createdAt: string;
}

export interface CategoryInfo {
  key: CategoryType;
  label: string;
  color: string;
  iconName: string;
}

export interface PaymentMethodInfo {
  key: PaymentMethodType;
  label: string;
  color: string;
}

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
  food: { key: 'food', label: '食費', color: '#8FBC8F', iconName: 'Utensils' }, // DarkSeaGreen
  transport: { key: 'transport', label: '交通費', color: '#B0C4DE', iconName: 'Train' }, // LightSteelBlue
  lodging: { key: 'lodging', label: '宿泊費', color: '#BC8F8F', iconName: 'Home' }, // RosyBrown
  sightseeing: { key: 'sightseeing', label: '観光費', color: '#D2B48C', iconName: 'Compass' }, // Tan
  shopping: { key: 'shopping', label: '買い物', color: '#D8BFD8', iconName: 'ShoppingBag' }, // Thistle
  other: { key: 'other', label: 'その他', color: '#C0C0C0', iconName: 'MoreHorizontal' }, // Silver
};

export const PAYMENT_METHODS: Record<PaymentMethodType, PaymentMethodInfo> = {
  cash: { key: 'cash', label: '現金', color: '#8FBC8F' },
  credit: { key: 'credit', label: 'クレジットカード', color: '#B0C4DE' },
  qr: { key: 'qr', label: 'QR・電子マネー', color: '#D8BFD8' },
  other: { key: 'other', label: 'その他', color: '#C0C0C0' },
};
