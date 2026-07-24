export type Role = "admin" | "staff" | "customer";

export type ThemeId = "slate" | "cyberpunk" | "gold" | "emerald" | "indigo";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  vipTier: "standard" | "vip" | "pro";
  avatar?: string;
  pin?: string;
  password?: string;
  loyaltyStamps?: number; // 0 à 10
  freeSessionsCount?: number; // Nombre de sessions gratuites débloquées
  referralCode?: string; // Code unique de parrainage (ex: REF-JEAN-12)
  referredById?: string; // ID du parrain (client ou caissier)
  referralsCount?: number; // Nombre de parrainés
  staffBonusBalanceFcfa?: number; // Primes cumulées pour les caissiers (FCFA)
  createdAt?: string;
}

export interface ReferralSettings {
  customerThreshold: number; // ex: 3 parrainés pour 1 récompense
  customerRewardType: "free_session" | "discount_fcfa";
  customerRewardValue: number; // ex: 1 session gratuite OU 2000 FCFA de réduction
  staffBonusPerReferralFcfa: number; // Prime salaire caissier par client (ex: 500 FCFA)
  minSpentForQualifiedReferralFcfa: number; // Dépense min du filleul pour valider (ex: 1000 FCFA)
  isSystemActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerRole: Role;
  referredUserId: string;
  referredUserName: string;
  totalSpentFcfa: number;
  status: "pending" | "qualified" | "rewarded";
  staffBonusEarnedFcfa: number;
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  durationMinutes: number;
  priceFcfa: number;
  title: string;
  isUsed: boolean;
  usedByUserName?: string;
  usedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface FcmToken {
  id: string;
  userId?: string;
  userName?: string;
  token: string;
  deviceType: "android" | "web" | "desktop_python";
  lastActiveAt: string;
}

export interface FcmNotificationLog {
  id: string;
  targetToken?: string;
  targetTopic?: string;
  title: string;
  body: string;
  type: "session_expiration" | "promotion" | "system_alert" | "custom";
  deliveryChannel: "fcm_cloud" | "lan_websocket_fallback";
  status: "sent" | "delivered" | "failed";
  sentAt: string;
  metadata?: Record<string, any>;
}

export interface RemoteTask {
  id: string;
  computerId: string;
  computerName: string;
  commandType: "taskkill" | "lock_screen" | "reboot" | "message" | "custom_shell";
  command: string;
  targetProcess?: string;
  status: "pending" | "dispatched" | "executed" | "failed";
  output?: string;
  triggeredBy: "auto_timer_expiration" | "admin_manual" | "staff_action";
  createdAt: string;
  executedAt?: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  bgClass: string;
  cardClass: string;
  textClass: string;
  primaryBtnClass: string;
  accentBadgeClass: string;
  headerClass: string;
  borderClass: string;
}

export interface Computer {
  id: string;
  name: string;
  ip: string;
  hourlyRate: number;
  status: "available" | "in_use" | "maintenance" | "locked";
  specs: string;
  category: "VIP Gaming PC" | "Standard Rig" | "Streaming Station" | "Console Booth";
  currentSessionId?: string;
  lastUser?: string;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  computerId: string;
  computerName: string;
  startTime: string;
  allocatedMinutes: number;
  elapsedSeconds: number;
  totalCost: number;
  status: "active" | "completed" | "terminated";
}

export interface Product {
  id: string;
  name: string;
  category: "Snacks" | "Drinks" | "Gaming Passes" | "Gear";
  price: number;
  stock: number;
  icon: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  computerId?: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalPrice: number;
  status: "pending" | "preparing" | "delivered";
  createdAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  computerId: string;
  computerName: string;
  date: string;
  timeSlot: string;
  durationHours: number;
  totalPrice: number;
  status: "confirmed" | "completed" | "cancelled";
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "top_up" | "session_fee" | "pos_purchase";
  amount: number;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  activeSessionsCount: number;
  todayRevenue: number;
  totalRevenue: number;
  totalComputers: number;
  occupiedComputers: number;
  occupancyRate: number;
  totalUsersCount: number;
  pendingOrdersCount: number;
}
