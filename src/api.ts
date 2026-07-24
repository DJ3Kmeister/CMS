import { Computer, Session, Product, Order, Reservation, Transaction, User, DashboardStats } from "./types";

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/stats");
  return res.json();
}

export async function fetchComputers(): Promise<Computer[]> {
  const res = await fetch("/api/computers");
  return res.json();
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch("/api/sessions");
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  return res.json();
}

export async function fetchReservations(): Promise<Reservation[]> {
  const res = await fetch("/api/reservations");
  return res.json();
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}

export async function createUser(userData: {
  name: string;
  email: string;
  role: "admin" | "staff" | "customer";
  balance?: number;
  vipTier?: "standard" | "vip" | "pro";
  password?: string;
}): Promise<User> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de la création de l'utilisateur");
  }
  return res.json();
}

export async function updateUser(
  userId: string,
  userData: Partial<User> & { password?: string }
): Promise<User> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de la mise à jour de l'utilisateur");
  }
  return res.json();
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de la suppression de l'utilisateur");
  }
  return res.json();
}

export async function loginUser(email: string, role: string, password?: string): Promise<{ token: string; user: User }> {
  const res = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de connexion");
  }
  return res.json();
}

export async function startSession(userId: string, computerId: string, allocatedMinutes: number): Promise<Session> {
  const res = await fetch("/api/sessions/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, computerId, allocatedMinutes })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start session");
  }
  return res.json();
}

export async function stopSession(sessionId: string): Promise<Session> {
  const res = await fetch(`/api/sessions/${sessionId}/stop`, {
    method: "POST"
  });
  return res.json();
}

export async function updatePcStatus(computerId: string, status: string): Promise<Computer> {
  const res = await fetch(`/api/computers/${computerId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function lockComputer(computerId: string): Promise<{ success: boolean; pc: Computer }> {
  const res = await fetch(`/api/computers/${computerId}/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec du verrouillage de l'ordinateur");
  }
  return res.json();
}

export async function unlockComputer(computerId: string): Promise<{ success: boolean; pc: Computer }> {
  const res = await fetch(`/api/computers/${computerId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec du déverrouillage de l'ordinateur");
  }
  return res.json();
}

export async function topUpWallet(userId: string, amount: number, paymentMethod: string): Promise<{ balance: number; transaction: Transaction }> {
  const res = await fetch("/api/wallet/topup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, paymentMethod })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to top up wallet");
  }
  return res.json();
}

export async function placeOrder(userId: string, computerId: string | undefined, items: { productId: string; quantity: number }[]): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, computerId, items })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to place POS order");
  }
  return res.json();
}

export async function createReservation(userId: string, computerId: string, date: string, timeSlot: string, durationHours: number): Promise<Reservation> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, computerId, date, timeSlot, durationHours })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create reservation");
  }
  return res.json();
}

export async function addComputer(pc: { name: string; ip: string; hourlyRate: number; specs: string; category: string }): Promise<Computer> {
  const res = await fetch("/api/computers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pc)
  });
  return res.json();
}

// Theme API
export async function fetchTheme(): Promise<{ themeId: string }> {
  const res = await fetch("/api/theme");
  return res.json();
}

export async function updateTheme(themeId: string): Promise<{ themeId: string }> {
  const res = await fetch("/api/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themeId })
  });
  return res.json();
}

// Vouchers API
export async function fetchVouchers(): Promise<any[]> {
  const res = await fetch("/api/vouchers");
  return res.json();
}

export async function generateVouchers(params: {
  count: number;
  title: string;
  durationMinutes: number;
  priceFcfa: number;
  createdBy: string;
}): Promise<any[]> {
  const res = await fetch("/api/vouchers/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de génération des vouchers");
  }
  return res.json();
}

export async function redeemVoucher(code: string, userId: string): Promise<{ success: boolean; amountCredited: number }> {
  const res = await fetch("/api/vouchers/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, userId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Code voucher invalide");
  }
  return res.json();
}

// Loyalty API
export async function addLoyaltyStamp(userId: string): Promise<{ success: boolean; rewardEarned: boolean }> {
  const res = await fetch(`/api/users/${userId}/loyalty/add-stamp`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de l'ajout du tampon");
  }
  return res.json();
}

export async function redeemFreeSession(userId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/users/${userId}/loyalty/redeem-free-session`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de l'échange de session gratuite");
  }
  return res.json();
}

// Referral & Bonus System API
export async function fetchReferralSettings(): Promise<any> {
  const res = await fetch("/api/referrals/settings");
  return res.json();
}

export async function updateReferralSettings(settings: any): Promise<{ success: boolean; settings: any }> {
  const res = await fetch("/api/referrals/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de mise à jour des règles de parrainage");
  }
  return res.json();
}

export async function fetchReferrals(): Promise<any[]> {
  const res = await fetch("/api/referrals");
  return res.json();
}

export async function linkReferral(referrerCodeOrId: string, referredUserId: string): Promise<{ success: boolean; referral: any }> {
  const res = await fetch("/api/referrals/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referrerCodeOrId, referredUserId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec du parrainage");
  }
  return res.json();
}

export async function payoutStaffBonus(staffUserId: string, amountFcfa?: number): Promise<{ success: boolean; paidAmount: number }> {
  const res = await fetch("/api/referrals/payout-staff-bonus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffUserId, amountFcfa })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec du paiement de la prime caissier");
  }
  return res.json();
}

// RemoteTaskService API
export async function fetchRemoteTasks(computerName?: string, status?: string): Promise<any[]> {
  const query = new URLSearchParams();
  if (computerName) query.set("computerName", computerName);
  if (status) query.set("status", status);
  const res = await fetch(`/api/remote-tasks?${query.toString()}`);
  return res.json();
}

export async function dispatchRemoteTask(data: {
  computerId?: string;
  computerName: string;
  commandType: "taskkill" | "lock_screen" | "reboot" | "message" | "custom_shell";
  command?: string;
  targetProcess?: string;
  triggeredBy?: "auto_timer_expiration" | "admin_manual" | "staff_action";
}): Promise<{ success: boolean; task: any }> {
  const res = await fetch("/api/remote-tasks/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de l'envoi de la commande à distance");
  }
  return res.json();
}

export async function killGamesOnPc(computerId: string, computerName: string): Promise<{ success: boolean; tasks: any[]; message: string }> {
  const res = await fetch("/api/remote-tasks/kill-games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ computerId, computerName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de la fermeture à distance des jeux");
  }
  return res.json();
}

// FCM Push Notification API
export async function registerFcmToken(data: {
  token: string;
  userId?: string;
  userName?: string;
  deviceType?: "android" | "web" | "desktop_python";
}): Promise<{ success: boolean; token: any }> {
  const res = await fetch("/api/fcm/register-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec d'enregistrement du token FCM");
  }
  return res.json();
}

export async function sendFcmPushNotification(data: {
  targetToken?: string;
  targetTopic?: string;
  title: string;
  body: string;
  type?: "session_expiration" | "promotion" | "system_alert" | "custom";
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; notification: any; message: string }> {
  const res = await fetch("/api/fcm/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Échec de l'envoi de la notification push");
  }
  return res.json();
}

export async function fetchFcmLogs(): Promise<any[]> {
  const res = await fetch("/api/fcm/logs");
  return res.json();
}

export async function fetchFcmTokens(): Promise<any[]> {
  const res = await fetch("/api/fcm/tokens");
  return res.json();
}

export async function fetchFcmStats(): Promise<any> {
  const res = await fetch("/api/fcm/stats");
  return res.json();
}

export async function redeemVoucherAndStartSession(data: {
  code: string;
  userId: string;
  computerId?: string;
}): Promise<{ success: boolean; voucher: any; user: any; session: any; message: string }> {
  const res = await fetch("/api/vouchers/redeem-and-start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Impossible de valider ce code ticket.");
  }
  return res.json();
}

