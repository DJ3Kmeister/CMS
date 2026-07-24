import React, { useEffect, useState } from "react";
import { User, Computer, Session, Product, Order, Reservation, Transaction, DashboardStats, ThemeId, Voucher } from "./types";
import { THEMES } from "./theme";
import {
  fetchStats,
  fetchComputers,
  fetchSessions,
  fetchProducts,
  fetchOrders,
  fetchReservations,
  fetchTransactions,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  startSession,
  stopSession,
  updatePcStatus,
  lockComputer,
  unlockComputer,
  topUpWallet,
  placeOrder,
  createReservation,
  addComputer,
  fetchTheme,
  updateTheme,
  fetchVouchers,
  generateVouchers,
  redeemVoucher,
  addLoyaltyStamp,
  redeemFreeSession
} from "./api";
import { Header } from "./components/Header";
import { AdminDashboard } from "./components/AdminDashboard";
import { ComputerGrid } from "./components/ComputerGrid";
import { POSStore } from "./components/POSStore";
import { ReservationPlanner } from "./components/ReservationPlanner";
import { WalletTopupModal } from "./components/WalletTopupModal";
import { MobileSimulator } from "./components/MobileSimulator";
import { CodeExporter } from "./components/CodeExporter";
import { VouchersAndLoyalty } from "./components/VouchersAndLoyalty";
import { ReferralSystem } from "./components/ReferralSystem";
import { RemoteTaskServiceUI } from "./components/RemoteTaskService";
import { FcmPushNotificationUI } from "./components/FcmPushNotificationUI";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "u-admin",
    name: "Alex Admin",
    email: "admin@cybercafe.pro",
    role: "admin",
    balance: 250000,
    vipTier: "pro"
  });

  const [users, setUsers] = useState<User[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>("slate");

  const [stats, setStats] = useState<DashboardStats>({
    activeSessionsCount: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    totalComputers: 0,
    occupiedComputers: 0,
    occupancyRate: 0,
    totalUsersCount: 0,
    pendingOrdersCount: 0
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Initial Data Load
  const loadInitialData = async () => {
    try {
      const [uList, pcList, sessList, prodList, ordList, resvList, txList, st, th, vList] = await Promise.all([
        fetchUsers(),
        fetchComputers(),
        fetchSessions(),
        fetchProducts(),
        fetchOrders(),
        fetchReservations(),
        fetchTransactions(),
        fetchStats(),
        fetchTheme(),
        fetchVouchers()
      ]);

      setUsers(uList);
      setComputers(pcList);
      setSessions(sessList);
      setProducts(prodList);
      setOrders(ordList);
      setReservations(resvList);
      setTransactions(txList);
      setStats(st);
      if (th && th.themeId) setCurrentThemeId(th.themeId as ThemeId);
      if (vList) setVouchers(vList);

      // Keep current user updated
      const foundCurrent = uList.find((u) => u.id === currentUser.id);
      if (foundCurrent) setCurrentUser(foundCurrent);
    } catch (err) {
      console.error("Failed loading backend state:", err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to Real-time SSE Events from Express server
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "TIMER_TICK") {
          if (data.payload.sessions) setSessions(data.payload.sessions);
        } else if (data.type === "INIT") {
          setComputers(data.payload.computers);
          setSessions(data.payload.sessions);
          setProducts(data.payload.products);
          setOrders(data.payload.orders);
          setReservations(data.payload.reservations);
          setUsers(data.payload.users);
        } else {
          // Full state refresh on major mutation events
          loadInitialData();
        }
      } catch (e) {
        console.error("Error parsing SSE:", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser.id]);

  // Handlers
  const handleStartSession = async (userId: string, pcId: string, minutes: number) => {
    await startSession(userId, pcId, minutes);
    await loadInitialData();
  };

  const handleStopSession = async (sessionId: string) => {
    await stopSession(sessionId);
    await loadInitialData();
  };

  const handleUpdatePcStatus = async (pcId: string, status: string) => {
    await updatePcStatus(pcId, status);
    await loadInitialData();
  };

  const handleLockPc = async (pcId: string) => {
    await lockComputer(pcId);
    await loadInitialData();
  };

  const handleUnlockPc = async (pcId: string) => {
    await unlockComputer(pcId);
    await loadInitialData();
  };

  const handleTopup = async (userId: string, amount: number, paymentMethod: string) => {
    const res = await topUpWallet(userId, amount, paymentMethod);
    await loadInitialData();
  };

  const handlePlaceOrder = async (userId: string, computerId: string | undefined, items: { productId: string; quantity: number }[]) => {
    await placeOrder(userId, computerId, items);
    await loadInitialData();
  };

  const handleCreateReservation = async (userId: string, computerId: string, date: string, timeSlot: string, durationHours: number) => {
    await createReservation(userId, computerId, date, timeSlot, durationHours);
    await loadInitialData();
  };

  const handleAddComputer = async (pc: { name: string; ip: string; hourlyRate: number; specs: string; category: string }) => {
    await addComputer(pc);
    await loadInitialData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadInitialData();
  };

  const handleAddUser = async (userData: { name: string; email: string; role: "admin" | "staff" | "customer"; balance?: number; password?: string; pin?: string }) => {
    await createUser(userData);
    await loadInitialData();
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    await updateUser(userId, userData);
    await loadInitialData();
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    await loadInitialData();
  };

  const handleChangeTheme = async (themeId: ThemeId) => {
    setCurrentThemeId(themeId);
    await updateTheme(themeId);
  };

  const handleGenerateVouchers = async (params: {
    count: number;
    title: string;
    durationMinutes: number;
    priceFcfa: number;
    createdBy: string;
  }) => {
    await generateVouchers(params);
    await loadInitialData();
  };

  const handleRedeemVoucher = async (code: string, userId: string) => {
    await redeemVoucher(code, userId);
    await loadInitialData();
  };

  const handleAddLoyaltyStamp = async (userId: string) => {
    await addLoyaltyStamp(userId);
    await loadInitialData();
  };

  const handleRedeemFreeSession = async (userId: string) => {
    await redeemFreeSession(userId);
    await loadInitialData();
  };

  const currentThemeObj = THEMES[currentThemeId] || THEMES["slate"];

  return (
    <div className={`min-h-screen ${currentThemeObj.bgClass} font-sans antialiased flex flex-col transition-colors duration-300`}>
      {/* Top Header Navigation */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTopup={() => setShowTopupModal(true)}
        isConnected={isConnected}
        activeSessionCount={sessions.filter((s) => s.status === "active").length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "dashboard" && (
          <AdminDashboard
            stats={stats}
            sessions={sessions}
            computers={computers}
            orders={orders}
            transactions={transactions}
            users={users}
            currentUser={currentUser}
            currentThemeId={currentThemeId}
            onChangeTheme={handleChangeTheme}
            vouchers={vouchers}
            onGenerateVouchers={handleGenerateVouchers}
            onRedeemVoucher={handleRedeemVoucher}
            onAddLoyaltyStamp={handleAddLoyaltyStamp}
            onRedeemFreeSession={handleRedeemFreeSession}
            onStopSession={handleStopSession}
            onOpenNewSessionModal={() => setActiveTab("computers")}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === "vouchers" && (
          <VouchersAndLoyalty
            users={users}
            vouchers={vouchers}
            currentUser={currentUser}
            onGenerateVouchers={handleGenerateVouchers}
            onRedeemVoucher={handleRedeemVoucher}
            onAddLoyaltyStamp={handleAddLoyaltyStamp}
            onRedeemFreeSession={handleRedeemFreeSession}
          />
        )}

        {activeTab === "referrals" && (
          <ReferralSystem
            users={users}
            currentUser={currentUser}
            onRefreshData={loadInitialData}
          />
        )}

        {activeTab === "remote-task" && (
          <RemoteTaskServiceUI computers={computers} />
        )}

        {activeTab === "fcm-push" && (
          <FcmPushNotificationUI />
        )}

        {activeTab === "computers" && (
          <ComputerGrid
            computers={computers}
            sessions={sessions}
            users={users}
            currentUser={currentUser}
            onUpdateStatus={handleUpdatePcStatus}
            onLockComputer={handleLockPc}
            onUnlockComputer={handleUnlockPc}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
            onAddComputer={handleAddComputer}
          />
        )}

        {activeTab === "pos" && (
          <POSStore
            products={products}
            computers={computers}
            currentUser={currentUser}
            onPlaceOrder={handlePlaceOrder}
          />
        )}

        {activeTab === "reservations" && (
          <ReservationPlanner
            reservations={reservations}
            computers={computers}
            currentUser={currentUser}
            onCreateReservation={handleCreateReservation}
          />
        )}

        {activeTab === "mobile-simulator" && (
          <MobileSimulator
            currentUser={currentUser}
            computers={computers}
            sessions={sessions}
            products={products}
            orders={orders}
            users={users}
            vouchers={vouchers}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
            onOpenTopup={() => setShowTopupModal(true)}
            onPlaceOrder={handlePlaceOrder}
            onLockComputer={handleLockPc}
            onUnlockComputer={handleUnlockPc}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onGenerateVouchers={handleGenerateVouchers}
          />
        )}

        {activeTab === "code-export" && <CodeExporter />}
      </main>

      {/* Wallet Deposit Modal */}
      {showTopupModal && (
        <WalletTopupModal
          currentUser={currentUser}
          transactions={transactions}
          onClose={() => setShowTopupModal(false)}
          onTopUp={handleTopup}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-4 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Système de Gestion CyberCafé Pro • Plateforme Fullstack Express & React</span>
          <span className="font-mono text-slate-600">Statut: 200 OK • En direct via WebSockets (SSE)</span>
        </div>
      </footer>
    </div>
  );
}
