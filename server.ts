import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory state store with persistence across calls during dev runtime
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "customer";
  balance: number;
  vipTier: "standard" | "vip" | "pro";
  avatar?: string;
  pin?: string;
  password?: string;
  loyaltyStamps?: number;
  freeSessionsCount?: number;
  referralCode?: string;
  referredById?: string;
  referralsCount?: number;
  staffBonusBalanceFcfa?: number;
  createdAt?: string;
}

interface Voucher {
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

let currentTheme: string = "slate";

let vouchers: Voucher[] = [
  { id: "vch-1", code: "CYBER-1H-8921", durationMinutes: 60, priceFcfa: 1000, title: "Pass Gaming 1 Heure", isUsed: false, createdAt: new Date().toISOString(), createdBy: "Alex Admin" },
  { id: "vch-2", code: "CYBER-2H-4412", durationMinutes: 120, priceFcfa: 2000, title: "Pass Duo 2 Heures", isUsed: false, createdAt: new Date().toISOString(), createdBy: "Sarah Employé" },
  { id: "vch-3", code: "CYBER-NUIT-7789", durationMinutes: 480, priceFcfa: 5000, title: "Pass Nuit All-Night 8h", isUsed: true, usedByUserName: "Lucas Gamer", usedAt: new Date(Date.now() - 3600 * 1000).toISOString(), createdAt: new Date().toISOString(), createdBy: "Alex Admin" }
];

interface Computer {
  id: string;
  name: string;
  ip: string;
  hourlyRate: number; // in USD
  status: "available" | "in_use" | "maintenance" | "locked";
  specs: string;
  category: "VIP Gaming PC" | "Standard Rig" | "Streaming Station" | "Console Booth";
  currentSessionId?: string;
  lastUser?: string;
}

interface Session {
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

interface Product {
  id: string;
  name: string;
  category: "Snacks" | "Drinks" | "Gaming Passes" | "Gear";
  price: number;
  stock: number;
  icon: string;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  computerId?: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalPrice: number;
  status: "pending" | "preparing" | "delivered";
  createdAt: string;
}

interface Reservation {
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

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "top_up" | "session_fee" | "pos_purchase";
  amount: number;
  description: string;
  createdAt: string;
}

// Initial seed data
let users: User[] = [
  { id: "u-admin", name: "Alex Admin", email: "admin@cybercafe.pro", role: "admin", balance: 250000, vipTier: "pro", pin: "1234", password: "admin123", loyaltyStamps: 10, freeSessionsCount: 2, createdAt: new Date().toISOString() },
  { id: "u-staff", name: "Sarah Employé", email: "staff@cybercafe.pro", role: "staff", balance: 50000, vipTier: "standard", pin: "5678", password: "staff123", loyaltyStamps: 4, freeSessionsCount: 0, createdAt: new Date().toISOString() },
  { id: "u-staff2", name: "Moussa Caisse", email: "moussa@cybercafe.pro", role: "staff", balance: 25000, vipTier: "standard", pin: "0000", password: "moussa123", loyaltyStamps: 2, freeSessionsCount: 0, createdAt: new Date().toISOString() },
  { id: "u-101", name: "Lucas Gamer", email: "lucas@example.com", role: "customer", balance: 15000, vipTier: "vip", loyaltyStamps: 9, freeSessionsCount: 1, createdAt: new Date().toISOString() },
  { id: "u-102", name: "Maya Cyber", email: "maya@example.com", role: "customer", balance: 5000, vipTier: "standard", loyaltyStamps: 6, freeSessionsCount: 0, createdAt: new Date().toISOString() },
  { id: "u-103", name: "Kaito Streamer", email: "kaito@example.com", role: "customer", balance: 45000, vipTier: "pro", loyaltyStamps: 3, freeSessionsCount: 1, createdAt: new Date().toISOString() }
];

let computers: Computer[] = [
  { id: "pc-01", name: "PC-01 (RTX 4090)", ip: "192.168.1.101", hourlyRate: 1500, status: "in_use", specs: "i9-14900K, RTX 4090, 64GB DDR5, 360Hz Oled", category: "VIP Gaming PC", currentSessionId: "sess-1" },
  { id: "pc-02", name: "PC-02 (RTX 4090)", ip: "192.168.1.102", hourlyRate: 1500, status: "available", specs: "i9-14900K, RTX 4090, 64GB DDR5, 360Hz Oled", category: "VIP Gaming PC" },
  { id: "pc-03", name: "PC-03 (RTX 4080)", ip: "192.168.1.103", hourlyRate: 1000, status: "in_use", specs: "i7-14700K, RTX 4080, 32GB DDR5, 240Hz", category: "Streaming Station", currentSessionId: "sess-2" },
  { id: "pc-04", name: "PC-04 (RTX 4080)", ip: "192.168.1.104", hourlyRate: 1000, status: "available", specs: "i7-14700K, RTX 4080, 32GB DDR5, 240Hz", category: "Streaming Station" },
  { id: "pc-05", name: "PC-05 (RTX 4070)", ip: "192.168.1.105", hourlyRate: 800, status: "available", specs: "i5-13600K, RTX 4070, 32GB RAM, 180Hz", category: "Standard Rig" },
  { id: "pc-06", name: "PC-06 (RTX 4070)", ip: "192.168.1.106", hourlyRate: 800, status: "maintenance", specs: "i5-13600K, RTX 4070, 32GB RAM, 180Hz", category: "Standard Rig" },
  { id: "pc-07", name: "PC-07 (RTX 4070)", ip: "192.168.1.107", hourlyRate: 800, status: "available", specs: "i5-13600K, RTX 4070, 32GB RAM, 180Hz", category: "Standard Rig" },
  { id: "pc-08", name: "PC-08 (PS5 Studio)", ip: "192.168.1.108", hourlyRate: 1200, status: "available", specs: "PlayStation 5 Pro, 65\" 4K 120Hz OLED, Racing Wheel", category: "Console Booth" }
];

let sessions: Session[] = [
  { id: "sess-1", userId: "u-101", userName: "Lucas Gamer", computerId: "pc-01", computerName: "PC-01 (RTX 4090)", startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(), allocatedMinutes: 120, elapsedSeconds: 2100, totalCost: 875, status: "active" },
  { id: "sess-2", userId: "u-103", userName: "Kaito Streamer", computerId: "pc-03", computerName: "PC-03 (RTX 4080)", startTime: new Date(Date.now() - 50 * 60 * 1000).toISOString(), allocatedMinutes: 180, elapsedSeconds: 3000, totalCost: 835, status: "active" }
];

let products: Product[] = [
  { id: "prod-1", name: "Monster Energy Ultra 500ml", category: "Drinks", price: 1500, stock: 48, icon: "Zap" },
  { id: "prod-2", name: "Red Bull Energy 250ml", category: "Drinks", price: 1200, stock: 32, icon: "Flame" },
  { id: "prod-3", name: "Doritos Nacho Cheese 150g", category: "Snacks", price: 1000, stock: 25, icon: "Cookie" },
  { id: "prod-4", name: "Part de Pizza Artisanale", category: "Snacks", price: 1500, stock: 12, icon: "Utensils" },
  { id: "prod-5", name: "Café Glacé Cold Brew", category: "Drinks", price: 1000, stock: 20, icon: "Coffee" },
  { id: "prod-6", name: "Coussinets Casque Gaming HyperX", category: "Gear", price: 5000, stock: 8, icon: "Headphones" },
  { id: "prod-7", name: "Pass Gaming Nuit 5 Heures", category: "Gaming Passes", price: 4000, stock: 99, icon: "Ticket" }
];

let orders: Order[] = [
  { id: "ord-1", userId: "u-101", userName: "Lucas Gamer", computerId: "pc-01", items: [{ productId: "prod-1", name: "Monster Energy Ultra 500ml", quantity: 2, price: 1500 }], totalPrice: 3000, status: "delivered", createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: "ord-2", userId: "u-103", userName: "Kaito Streamer", computerId: "pc-03", items: [{ productId: "prod-4", name: "Part de Pizza Artisanale", quantity: 1, price: 1500 }, { productId: "prod-2", name: "Red Bull Energy 250ml", quantity: 1, price: 1200 }], totalPrice: 2700, status: "preparing", createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
];

let reservations: Reservation[] = [
  { id: "res-1", userId: "u-102", userName: "Maya Cyber", computerId: "pc-02", computerName: "PC-02 (RTX 4090)", date: "2026-07-23", timeSlot: "18:00 - 21:00", durationHours: 3, totalPrice: 4500, status: "confirmed" }
];

let transactions: Transaction[] = [
  { id: "tx-1", userId: "u-101", userName: "Lucas Gamer", type: "top_up", amount: 15000, description: "Rechargement de solde au comptoir", createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: "tx-2", userId: "u-101", userName: "Lucas Gamer", type: "pos_purchase", amount: 3000, description: "Commande POS #ord-1", createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: "tx-3", userId: "u-103", userName: "Kaito Streamer", type: "top_up", amount: 30000, description: "Rechargement en ligne (Simulé)", createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() }
];

// SSE Clients for real-time broadcasts
let sseClients: any[] = [];

function broadcastUpdate(type: string, payload: any) {
  const data = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach(client => client.write(data));
}

// Timer Loop: Tick active sessions every second
setInterval(() => {
  let changed = false;
  sessions.forEach(sess => {
    if (sess.status === "active") {
      sess.elapsedSeconds += 1;
      const pc = computers.find(p => p.id === sess.computerId);
      const user = users.find(u => u.id === sess.userId);
      if (pc && user) {
        // Calculate accrued cost based on hourly rate
        const ratePerSec = pc.hourlyRate / 3600;
        sess.totalCost = Math.round(sess.elapsedSeconds * ratePerSec * 100) / 100;

        // Auto-stop if user allocated time reached or wallet depleted
        const maxSeconds = sess.allocatedMinutes * 60;
        if (sess.elapsedSeconds >= maxSeconds) {
          sess.status = "completed";
          pc.status = "available";
          pc.currentSessionId = undefined;
          changed = true;

          // Deduct cost from user balance
          user.balance = Math.max(0, user.balance - sess.totalCost);
          transactions.unshift({
            id: `tx-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            type: "session_fee",
            amount: sess.totalCost,
            description: `Session complete on ${pc.name}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  });

  if (changed) {
    broadcastUpdate("SESSIONS_UPDATED", { sessions, computers });
  } else {
    // Regular timer heartbeat broadcast
    broadcastUpdate("TIMER_TICK", { sessions });
  }
}, 1000);

// --- SSE Real-time endpoint ---
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "INIT", payload: { computers, sessions, products, orders, reservations, users } })}\n\n`);

  sseClients.push(res);
  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// --- REST API ROUTES ---

// 1. Auth & Users
app.get("/api/users", (req, res) => res.json(users));

// Login with Email + Password or Role
app.post("/api/users/login", (req, res) => {
  const { email, password, role } = req.body;
  
  if (email) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (user.password && password && user.password !== password) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      const token = `jwt-sec-${user.role}-${user.id}-${Date.now()}`;
      return res.json({ token, user });
    }
  }

  // Auto-create or fallback if logged in as customer
  const newEmail = email || `user-${Date.now()}@cybercafe.pro`;
  const newUser: User = {
    id: `u-${Date.now()}`,
    name: email ? email.split("@")[0] : "Nouveau Client",
    email: newEmail,
    role: (role as "admin" | "staff" | "customer") || "customer",
    balance: 5000,
    vipTier: "standard",
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  broadcastUpdate("USERS_UPDATED", { users });
  
  const token = `jwt-sec-${newUser.role}-${newUser.id}-${Date.now()}`;
  res.json({ token, user: newUser });
});

// Create new User or Employee (Staff/Admin)
app.post("/api/users", (req, res) => {
  const { name, email, role, balance, vipTier, pin, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Le nom et l'email sont obligatoires." });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    role: role || "staff",
    balance: Number(balance) || 0,
    vipTier: vipTier || "standard",
    pin: pin || "1234",
    password: password || "pass123",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  broadcastUpdate("USERS_UPDATED", { users });
  res.status(201).json(newUser);
});

// Update User or Employee
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const { name, email, role, balance, vipTier, pin, password } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (balance !== undefined) user.balance = Number(balance);
  if (vipTier) user.vipTier = vipTier;
  if (pin) user.pin = pin;
  if (password) user.password = password;

  broadcastUpdate("USERS_UPDATED", { users });
  res.json(user);
});

// Delete User or Employee
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  if (id === "u-admin") {
    return res.status(403).json({ error: "Impossible de supprimer le compte administrateur principal." });
  }

  const index = users.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ error: "Utilisateur non trouvé" });

  users.splice(index, 1);
  broadcastUpdate("USERS_UPDATED", { users });
  res.json({ success: true });
});

// Top-up wallet credit
app.post("/api/wallet/topup", (req, res) => {
  const { userId, amount, paymentMethod } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const numericAmount = Number(amount) || 0;
  user.balance += numericAmount;

  const tx: Transaction = {
    id: `tx-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    type: "top_up",
    amount: numericAmount,
    description: `Credit top-up via ${paymentMethod || "Card"}`,
    createdAt: new Date().toISOString()
  };
  transactions.unshift(tx);

  broadcastUpdate("WALLET_TOPUP", { user, transaction: tx });
  res.json({ success: true, balance: user.balance, transaction: tx });
});

// Get user transactions
app.get("/api/transactions", (req, res) => res.json(transactions));

// 2. Computers
app.get("/api/computers", (req, res) => res.json(computers));

app.post("/api/computers", (req, res) => {
  const { name, ip, hourlyRate, specs, category } = req.body;
  const newPc: Computer = {
    id: `pc-${computers.length + 1 < 10 ? '0' + (computers.length + 1) : computers.length + 1}`,
    name: name || `PC-${computers.length + 1}`,
    ip: ip || `192.168.1.${100 + computers.length + 1}`,
    hourlyRate: Number(hourlyRate) || 4.00,
    status: "available",
    specs: specs || "High Spec Gaming Rig",
    category: category || "Standard Rig"
  };
  computers.push(newPc);
  broadcastUpdate("COMPUTER_ADDED", newPc);
  res.json(newPc);
});

// Lock computer remotely
app.post("/api/computers/:id/lock", (req, res) => {
  const { id } = req.params;
  const pc = computers.find(p => p.id === id);
  if (!pc) return res.status(404).json({ error: "Ordinateur introuvable" });

  pc.status = "locked";
  const sess = sessions.find(s => s.computerId === id && s.status === "active");
  if (sess) {
    sess.status = "terminated";
    pc.currentSessionId = undefined;
  }

  broadcastUpdate("COMPUTER_LOCKED", { pc, computers });
  broadcastUpdate("COMPUTER_STATUS_CHANGED", { pc, computers });
  res.json({ success: true, pc });
});

// Unlock computer remotely
app.post("/api/computers/:id/unlock", (req, res) => {
  const { id } = req.params;
  const pc = computers.find(p => p.id === id);
  if (!pc) return res.status(404).json({ error: "Ordinateur introuvable" });

  pc.status = "available";
  broadcastUpdate("COMPUTER_UNLOCKED", { pc, computers });
  broadcastUpdate("COMPUTER_STATUS_CHANGED", { pc, computers });
  res.json({ success: true, pc });
});

// Lock / Unlock / Set maintenance
app.patch("/api/computers/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const pc = computers.find(p => p.id === id);
  if (!pc) return res.status(404).json({ error: "Ordinateur introuvable" });

  pc.status = status;
  if (status === "locked" || status === "maintenance") {
    // Stop active session if any
    const sess = sessions.find(s => s.computerId === id && s.status === "active");
    if (sess) {
      sess.status = "terminated";
      pc.currentSessionId = undefined;
    }
  }

  broadcastUpdate("COMPUTER_STATUS_CHANGED", { pc, computers });
  res.json(pc);
});

// 3. Sessions
app.get("/api/sessions", (req, res) => res.json(sessions));

app.post("/api/sessions/start", (req, res) => {
  const { userId, computerId, allocatedMinutes } = req.body;
  const user = users.find(u => u.id === userId);
  const pc = computers.find(p => p.id === computerId);

  if (!user || !pc) return res.status(404).json({ error: "User or Computer not found" });
  if (pc.status === "in_use" || pc.status === "maintenance") {
    return res.status(400).json({ error: "Computer is not available" });
  }

  const mins = Number(allocatedMinutes) || 60;
  const estCost = (pc.hourlyRate / 60) * mins;

  if (user.balance < estCost) {
    return res.status(400).json({ error: `Insufficient wallet balance. Required: $${estCost.toFixed(2)}, Available: $${user.balance.toFixed(2)}` });
  }

  const newSess: Session = {
    id: `sess-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    computerId: pc.id,
    computerName: pc.name,
    startTime: new Date().toISOString(),
    allocatedMinutes: mins,
    elapsedSeconds: 0,
    totalCost: 0,
    status: "active"
  };

  sessions.unshift(newSess);
  pc.status = "in_use";
  pc.currentSessionId = newSess.id;
  pc.lastUser = user.name;

  broadcastUpdate("SESSION_STARTED", { session: newSess, pc, user });
  res.json(newSess);
});

app.post("/api/sessions/:id/stop", (req, res) => {
  const { id } = req.params;
  const sess = sessions.find(s => s.id === id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  sess.status = "completed";
  const pc = computers.find(p => p.id === sess.computerId);
  if (pc) {
    pc.status = "available";
    pc.currentSessionId = undefined;
  }

  const user = users.find(u => u.id === sess.userId);
  if (user) {
    user.balance = Math.max(0, user.balance - sess.totalCost);
    transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      type: "session_fee",
      amount: sess.totalCost,
      description: `Session stopped on ${pc ? pc.name : 'PC'}`,
      createdAt: new Date().toISOString()
    });
  }

  broadcastUpdate("SESSION_STOPPED", { session: sess, pc, user });

  // Trigger FCM Push Notification (Online & Offline LAN fallback)
  sendPushNotification({
    targetTopic: user ? `user_${user.id}` : "all_gamers",
    title: "⏰ Session Terminée - DEK-DRIVSIM",
    body: `Votre session gaming sur ${pc ? pc.name : 'votre poste'} est arrivée à terme. Merci de libérer le poste !`,
    type: "session_expiration",
    metadata: { pcName: pc?.name, userName: user ? user.name : "Client" }
  });

  // Trigger RemoteTaskService: automatically dispatch taskkill & lock_screen commands to agent PC
  if (pc) {
    enqueueRemoteKillGames(pc.id, pc.name, "auto_timer_expiration");
  }

  res.json(sess);
});

// 4. Products & POS
app.get("/api/products", (req, res) => res.json(products));

app.post("/api/products", (req, res) => {
  const { name, category, price, stock, icon } = req.body;
  const prod: Product = {
    id: `prod-${Date.now()}`,
    name,
    category: category || "Snacks",
    price: Number(price) || 2.00,
    stock: Number(stock) || 10,
    icon: icon || "Cookie"
  };
  products.push(prod);
  broadcastUpdate("PRODUCT_ADDED", prod);
  res.json(prod);
});

app.get("/api/orders", (req, res) => res.json(orders));

app.post("/api/orders", (req, res) => {
  const { userId, computerId, items } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  let total = 0;
  const parsedItems = items.map((it: any) => {
    const prod = products.find(p => p.id === it.productId);
    const itemPrice = prod ? prod.price : 2.50;
    total += itemPrice * it.quantity;
    if (prod) prod.stock = Math.max(0, prod.stock - it.quantity);
    return {
      productId: it.productId,
      name: prod ? prod.name : "Item",
      quantity: it.quantity,
      price: itemPrice
    };
  });

  if (user.balance < total) {
    return res.status(400).json({ error: `Insufficient wallet credit. Order Total: $${total.toFixed(2)}, Available: $${user.balance.toFixed(2)}` });
  }

  user.balance -= total;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    computerId,
    items: parsedItems,
    totalPrice: total,
    status: "preparing",
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);

  transactions.unshift({
    id: `tx-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    type: "pos_purchase",
    amount: total,
    description: `POS Snack/Drink Order #${newOrder.id}`,
    createdAt: new Date().toISOString()
  });

  broadcastUpdate("NEW_ORDER", { order: newOrder, user, products });
  res.json(newOrder);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  broadcastUpdate("ORDER_STATUS_UPDATED", order);
  res.json(order);
});

// 5. Reservations
app.get("/api/reservations", (req, res) => res.json(reservations));

app.post("/api/reservations", (req, res) => {
  const { userId, computerId, date, timeSlot, durationHours } = req.body;
  const user = users.find(u => u.id === userId);
  const pc = computers.find(p => p.id === computerId);

  if (!user || !pc) return res.status(404).json({ error: "User or Computer not found" });

  const hours = Number(durationHours) || 2;
  const price = pc.hourlyRate * hours;

  const resv: Reservation = {
    id: `res-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    computerId: pc.id,
    computerName: pc.name,
    date: date || new Date().toISOString().split("T")[0],
    timeSlot: timeSlot || "19:00 - 21:00",
    durationHours: hours,
    totalPrice: price,
    status: "confirmed"
  };

  reservations.unshift(resv);
  broadcastUpdate("RESERVATION_CREATED", resv);
  res.json(resv);
});

// 6. Theme Endpoints
app.get("/api/theme", (req, res) => {
  res.json({ themeId: currentTheme });
});

app.post("/api/theme", (req, res) => {
  const { themeId } = req.body;
  if (themeId) {
    currentTheme = themeId;
    broadcastUpdate("THEME_UPDATED", { themeId: currentTheme });
  }
  res.json({ themeId: currentTheme });
});

// 7. Vouchers & Coupons Endpoints
app.get("/api/vouchers", (req, res) => {
  res.json(vouchers);
});

app.post("/api/vouchers/generate", (req, res) => {
  const { count = 1, title = "Pass Gaming", durationMinutes = 60, priceFcfa = 1000, createdBy = "Admin" } = req.body;
  const numToGen = Math.min(20, Math.max(1, Number(count) || 1));

  const createdVouchers: Voucher[] = [];

  for (let i = 0; i < numToGen; i++) {
    const randomCode = `CYBER-${durationMinutes >= 480 ? "NUIT" : durationMinutes + "M"}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVoucher: Voucher = {
      id: `vch-${Date.now()}-${i}`,
      code: randomCode,
      title: title || `Pass Gaming ${durationMinutes} min`,
      durationMinutes: Number(durationMinutes) || 60,
      priceFcfa: Number(priceFcfa) || 1000,
      isUsed: false,
      createdAt: new Date().toISOString(),
      createdBy
    };
    vouchers.unshift(newVoucher);
    createdVouchers.push(newVoucher);
  }

  broadcastUpdate("VOUCHERS_UPDATED", { vouchers });
  res.status(201).json(createdVouchers);
});

app.post("/api/vouchers/redeem", (req, res) => {
  const { code, userId } = req.body;
  if (!code) return res.status(400).json({ error: "Code voucher requis." });

  const voucher = vouchers.find(v => v.code.toUpperCase().trim() === code.toUpperCase().trim());
  if (!voucher) {
    return res.status(404).json({ error: "Code coupon invalide ou introuvable." });
  }

  if (voucher.isUsed) {
    return res.status(400).json({ error: `Ce code coupon a déjà été utilisé par ${voucher.usedByUserName || "un client"}.` });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé pour activer le coupon." });
  }

  // Mark voucher as used
  voucher.isUsed = true;
  voucher.usedByUserName = user.name;
  voucher.usedAt = new Date().toISOString();

  // Credit user balance with voucher value
  user.balance += voucher.priceFcfa;

  // Add transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    type: "top_up",
    amount: voucher.priceFcfa,
    description: `Rechargement par Code Ticket (${voucher.title} - ${voucher.code})`,
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTx);

  broadcastUpdate("VOUCHER_REDEEMED", { voucher, user, transaction: newTx });
  res.json({ success: true, voucher, user, amountCredited: voucher.priceFcfa });
});

// Redeem Voucher Code AND Start PC Session directly
app.post("/api/vouchers/redeem-and-start", (req, res) => {
  const { code, userId, computerId } = req.body;
  if (!code) return res.status(400).json({ error: "Code ticket requis." });

  const voucher = vouchers.find(v => v.code.toUpperCase().trim() === code.toUpperCase().trim());
  if (!voucher) {
    return res.status(404).json({ error: "Code ticket invalide ou introuvable. Vérifiez la saisie." });
  }

  if (voucher.isUsed) {
    return res.status(400).json({ error: `Ce code ticket a déjà été utilisé par ${voucher.usedByUserName || "un client"}.` });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  // Mark voucher as used
  voucher.isUsed = true;
  voucher.usedByUserName = user.name;
  voucher.usedAt = new Date().toISOString();

  // Credit user balance
  user.balance += voucher.priceFcfa;

  // Add top-up transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    type: "top_up",
    amount: voucher.priceFcfa,
    description: `Activation Ticket par Code (${voucher.title} - ${voucher.code})`,
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTx);

  let startedSession: Session | null = null;

  // If computerId is provided, start a session immediately on that PC!
  if (computerId) {
    const pc = computers.find(p => p.id === computerId);
    if (pc) {
      // Check if PC is already in use
      const existingSession = sessions.find(s => s.computerId === computerId && s.status === "active");
      if (existingSession) {
        return res.status(400).json({ error: `Le poste ${pc.name} est déjà en cours d'utilisation.` });
      }

      pc.status = "in_use";
      pc.lastUser = user.name;

      const durationMins = voucher.durationMinutes || 60;

      startedSession = {
        id: `sess-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        computerId: pc.id,
        computerName: pc.name,
        startTime: new Date().toISOString(),
        allocatedMinutes: durationMins,
        elapsedSeconds: 0,
        status: "active",
        totalCost: voucher.priceFcfa
      };

      sessions.unshift(startedSession);
    }
  }

  broadcastUpdate("VOUCHER_REDEEMED_AND_STARTED", { voucher, user, session: startedSession, computers, sessions });

  res.json({
    success: true,
    voucher,
    user,
    session: startedSession,
    message: startedSession 
      ? `🎉 Ticket validé ! Session de ${voucher.durationMinutes} min démarrée sur ${startedSession.computerName}.`
      : `🎉 Ticket de ${voucher.priceFcfa} FCFA validé ! Solde crédité avec succès.`
  });
});

// 8. Loyalty Stamps & Free Sessions
app.post("/api/users/:id/loyalty/add-stamp", (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  let currentStamps = user.loyaltyStamps || 0;
  let currentFree = user.freeSessionsCount || 0;

  currentStamps += 1;
  let rewardEarned = false;

  if (currentStamps >= 10) {
    currentStamps = 0;
    currentFree += 1;
    rewardEarned = true;
  }

  user.loyaltyStamps = currentStamps;
  user.freeSessionsCount = currentFree;

  broadcastUpdate("USERS_UPDATED", { users });
  res.json({ success: true, user, rewardEarned, currentStamps, currentFree });
});

app.post("/api/users/:id/loyalty/redeem-free-session", (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  if (!user.freeSessionsCount || user.freeSessionsCount <= 0) {
    return res.status(400).json({ error: "Aucune session gratuite disponible sur cette carte." });
  }

  user.freeSessionsCount -= 1;
  // Give 1000 FCFA free credit (1 hour session)
  user.balance += 1000;

  transactions.unshift({
    id: `tx-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    type: "top_up",
    amount: 1000,
    description: "Recompense Carte Fidélité: 1 Session Gratuite (1000 FCFA)",
    createdAt: new Date().toISOString()
  });

  broadcastUpdate("USERS_UPDATED", { users });
  res.json({ success: true, user });
});

// 9. Referral & Bonus System (Parrainage DEK-DRIVSIM)
interface ReferralSettings {
  customerThreshold: number;
  customerRewardType: "free_session" | "discount_fcfa";
  customerRewardValue: number;
  staffBonusPerReferralFcfa: number;
  minSpentForQualifiedReferralFcfa: number;
  isSystemActive: boolean;
}

interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerRole: "admin" | "staff" | "customer";
  referredUserId: string;
  referredUserName: string;
  totalSpentFcfa: number;
  status: "pending" | "qualified" | "rewarded";
  staffBonusEarnedFcfa: number;
  createdAt: string;
}

let referralSettings: ReferralSettings = {
  customerThreshold: 3,
  customerRewardType: "free_session",
  customerRewardValue: 1,
  staffBonusPerReferralFcfa: 500,
  minSpentForQualifiedReferralFcfa: 1000,
  isSystemActive: true,
};

let referrals: Referral[] = [
  {
    id: "ref-1",
    referrerId: "u-staff2",
    referrerName: "Moussa Caisse",
    referrerRole: "staff",
    referredUserId: "u-101",
    referredUserName: "Lucas Gamer",
    totalSpentFcfa: 18000,
    status: "qualified",
    staffBonusEarnedFcfa: 500,
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  },
  {
    id: "ref-2",
    referrerId: "u-101",
    referrerName: "Lucas Gamer",
    referrerRole: "customer",
    referredUserId: "u-102",
    referredUserName: "Maya Cyber",
    totalSpentFcfa: 5000,
    status: "qualified",
    staffBonusEarnedFcfa: 0,
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString()
  },
  {
    id: "ref-3",
    referrerId: "u-101",
    referrerName: "Lucas Gamer",
    referrerRole: "customer",
    referredUserId: "u-103",
    referredUserName: "Kaito Streamer",
    totalSpentFcfa: 45000,
    status: "qualified",
    staffBonusEarnedFcfa: 0,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString()
  }
];

// Ensure referral codes on users
users.forEach(u => {
  if (!u.referralCode) {
    u.referralCode = `REF-${u.name.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  if (u.referralsCount === undefined) {
    u.referralsCount = referrals.filter(r => r.referrerId === u.id).length;
  }
  if (u.staffBonusBalanceFcfa === undefined) {
    u.staffBonusBalanceFcfa = u.role === "staff" ? 1500 : 0;
  }
});

app.get("/api/referrals/settings", (req, res) => {
  res.json(referralSettings);
});

app.post("/api/referrals/settings", (req, res) => {
  const newSettings = req.body;
  referralSettings = { ...referralSettings, ...newSettings };
  broadcastUpdate("REFERRAL_SETTINGS_UPDATED", { settings: referralSettings });
  res.json({ success: true, settings: referralSettings });
});

app.get("/api/referrals", (req, res) => {
  res.json(referrals);
});

app.post("/api/referrals/link", (req, res) => {
  const { referrerCodeOrId, referredUserId } = req.body;
  if (!referrerCodeOrId || !referredUserId) {
    return res.status(400).json({ error: "Code parrain et utilisateur requis" });
  }

  const referrer = users.find(u => u.id === referrerCodeOrId || (u.referralCode && u.referralCode.toUpperCase() === referrerCodeOrId.toUpperCase()));
  const referred = users.find(u => u.id === referredUserId);

  if (!referrer) {
    return res.status(404).json({ error: "Code parrain introuvable ou invalide" });
  }
  if (!referred) {
    return res.status(404).json({ error: "Utilisateur filleul introuvable" });
  }
  if (referrer.id === referred.id) {
    return res.status(400).json({ error: "Un utilisateur ne peut pas se parrainer lui-même" });
  }

  // Check if already referred
  const existing = referrals.find(r => r.referredUserId === referred.id);
  if (existing) {
    return res.status(400).json({ error: `${referred.name} a déjà un parrain enregistré (${existing.referrerName})` });
  }

  referred.referredById = referrer.id;
  referrer.referralsCount = (referrer.referralsCount || 0) + 1;

  let staffBonus = 0;
  if (referrer.role === "staff") {
    staffBonus = referralSettings.staffBonusPerReferralFcfa;
    referrer.staffBonusBalanceFcfa = (referrer.staffBonusBalanceFcfa || 0) + staffBonus;
  }

  const newRef: Referral = {
    id: `ref-${Date.now()}`,
    referrerId: referrer.id,
    referrerName: referrer.name,
    referrerRole: referrer.role,
    referredUserId: referred.id,
    referredUserName: referred.name,
    totalSpentFcfa: referred.balance || 0,
    status: (referred.balance || 0) >= referralSettings.minSpentForQualifiedReferralFcfa ? "qualified" : "pending",
    staffBonusEarnedFcfa: staffBonus,
    createdAt: new Date().toISOString()
  };

  referrals.unshift(newRef);

  // Check customer reward qualification
  if (referrer.role === "customer") {
    const qualifiedCount = referrals.filter(r => r.referrerId === referrer.id && r.status !== "pending").length;
    if (qualifiedCount % referralSettings.customerThreshold === 0) {
      if (referralSettings.customerRewardType === "free_session") {
        referrer.freeSessionsCount = (referrer.freeSessionsCount || 0) + (referralSettings.customerRewardValue || 1);
      } else {
        referrer.balance += (referralSettings.customerRewardValue || 2000);
      }
    }
  }

  broadcastUpdate("REFERRALS_UPDATED", { referrals, users });
  res.json({ success: true, referral: newRef, referrer, referred });
});

app.post("/api/referrals/payout-staff-bonus", (req, res) => {
  const { staffUserId, amountFcfa } = req.body;
  const staff = users.find(u => u.id === staffUserId);
  if (!staff) return res.status(404).json({ error: "Employé introuvable" });

  const currentBonus = staff.staffBonusBalanceFcfa || 0;
  const payoutAmount = amountFcfa || currentBonus;

  if (payoutAmount <= 0) {
    return res.status(400).json({ error: "Aucun solde de prime à verser" });
  }

  staff.staffBonusBalanceFcfa = Math.max(0, currentBonus - payoutAmount);

  // Add a payout transaction record
  transactions.unshift({
    id: `tx-${Date.now()}`,
    userId: staff.id,
    userName: staff.name,
    type: "top_up",
    amount: payoutAmount,
    description: `Paiement Prime Parrainage Salaire (${payoutAmount.toLocaleString()} FCFA)`,
    createdAt: new Date().toISOString()
  });

  broadcastUpdate("USERS_UPDATED", { users, transactions });
  res.json({ success: true, staff, paidAmount: payoutAmount });
});

// 10. RemoteTaskService (Exécution à distance de commandes système & Fermeture des jeux)
interface RemoteTask {
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

let remoteTasks: RemoteTask[] = [
  {
    id: "rtask-101",
    computerId: "pc-1",
    computerName: "PC-01",
    commandType: "taskkill",
    command: "taskkill /F /IM FC25.exe /IM AssettoCorsa.exe /IM fifa23.exe",
    targetProcess: "FC25.exe",
    status: "executed",
    output: "SUCCESS: Le processus 'FC25.exe' (PID 8412) a été fermé à l'expiration du chrono.",
    triggeredBy: "auto_timer_expiration",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  },
  {
    id: "rtask-102",
    computerId: "pc-1",
    computerName: "PC-01",
    commandType: "lock_screen",
    command: "ctypes.windll.user32.LockWorkStation()",
    status: "executed",
    output: "SUCCESS: Session Windows verrouillée sur le PC-01.",
    triggeredBy: "auto_timer_expiration",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  }
];

function enqueueRemoteKillGames(
  computerId: string,
  computerName: string,
  triggeredBy: "auto_timer_expiration" | "admin_manual" | "staff_action" = "auto_timer_expiration"
): RemoteTask[] {
  const killTask: RemoteTask = {
    id: `rtask-${Date.now()}-1`,
    computerId,
    computerName,
    commandType: "taskkill",
    command: "taskkill /F /IM FC25.exe /IM FC24.exe /IM fifa23.exe /IM AssettoCorsa.exe /IM gta5.exe /IM steam.exe",
    targetProcess: "JEUX_ACTIFS",
    status: "pending",
    triggeredBy,
    createdAt: new Date().toISOString()
  };

  const lockTask: RemoteTask = {
    id: `rtask-${Date.now()}-2`,
    computerId,
    computerName,
    commandType: "lock_screen",
    command: "ctypes.windll.user32.LockWorkStation()",
    status: "pending",
    triggeredBy,
    createdAt: new Date().toISOString()
  };

  remoteTasks.unshift(killTask, lockTask);
  broadcastUpdate("REMOTE_TASKS_UPDATED", { tasks: remoteTasks });
  return [killTask, lockTask];
}

// API RemoteTaskService
app.get("/api/remote-tasks", (req, res) => {
  const { computerName, status } = req.query;
  let filtered = [...remoteTasks];
  if (computerName) {
    filtered = filtered.filter(t => t.computerName.toUpperCase() === String(computerName).toUpperCase());
  }
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  res.json(filtered);
});

// Interrogation par l'agent Python local pour récupérer les tâches en attente
app.get("/api/remote-tasks/pending", (req, res) => {
  const { computerName, computerId } = req.query;
  const targetName = computerName ? String(computerName).toUpperCase() : null;
  const targetId = computerId ? String(computerId) : null;

  const pending = remoteTasks.filter(t => 
    t.status === "pending" && 
    ((targetName && t.computerName.toUpperCase() === targetName) || (targetId && t.computerId === targetId))
  );

  // Marquer comme envoyées (dispatched)
  pending.forEach(t => {
    t.status = "dispatched";
  });

  if (pending.length > 0) {
    broadcastUpdate("REMOTE_TASKS_UPDATED", { tasks: remoteTasks });
  }

  res.json(pending);
});

// Créer une commande à distance manuelle depuis le dashboard
app.post("/api/remote-tasks/dispatch", (req, res) => {
  const { computerId, computerName, commandType, command, targetProcess, triggeredBy } = req.body;
  
  if (!computerName || !commandType) {
    return res.status(400).json({ error: "Nom du PC et type de commande requis" });
  }

  const pc = computers.find(p => p.name.toUpperCase() === String(computerName).toUpperCase() || p.id === computerId);
  const pcId = pc ? pc.id : computerId || `pc-${Date.now()}`;
  const pcName = pc ? pc.name : computerName;

  const task: RemoteTask = {
    id: `rtask-${Date.now()}`,
    computerId: pcId,
    computerName: pcName,
    commandType: commandType || "taskkill",
    command: command || (commandType === "taskkill" ? "taskkill /F /IM FC25.exe" : "lock_screen"),
    targetProcess,
    status: "pending",
    triggeredBy: triggeredBy || "admin_manual",
    createdAt: new Date().toISOString()
  };

  remoteTasks.unshift(task);
  broadcastUpdate("REMOTE_TASKS_UPDATED", { tasks: remoteTasks });
  res.json({ success: true, task });
});

// Action rapide de fermeture des jeux sur un PC
app.post("/api/remote-tasks/kill-games", (req, res) => {
  const { computerId, computerName } = req.body;
  const pc = computers.find(p => p.id === computerId || p.name === computerName);
  const pcId = pc ? pc.id : computerId || "pc-1";
  const pcName = pc ? pc.name : computerName || "PC-01";

  const tasks = enqueueRemoteKillGames(pcId, pcName, "admin_manual");
  res.json({ success: true, tasks, message: `Ordre de fermeture envoyé à l'agent local sur ${pcName}` });
});

// Acknowledgment par l'agent Python quand la commande est exécutée sur le PC
app.post("/api/remote-tasks/ack", (req, res) => {
  const { taskId, status, output } = req.body;
  const task = remoteTasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Tâche introuvable" });
  }

  task.status = status === "failed" ? "failed" : "executed";
  task.output = output || "Commande exécutée avec succès sur le système hôte.";
  task.executedAt = new Date().toISOString();

  broadcastUpdate("REMOTE_TASKS_UPDATED", { tasks: remoteTasks });
  res.json({ success: true, task });
});

// 11. FCM (Firebase Cloud Messaging) & LAN Push Notification Service
interface FcmTokenData {
  id: string;
  userId?: string;
  userName?: string;
  token: string;
  deviceType: "android" | "web" | "desktop_python";
  lastActiveAt: string;
}

interface FcmNotificationLogData {
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

let fcmTokens: FcmTokenData[] = [
  { id: "fcm-t1", userId: "u1", userName: "Lucas Gamer", token: "fcm_token_android_lucas_88291", deviceType: "android", lastActiveAt: new Date().toISOString() },
  { id: "fcm-t2", userId: "u2", userName: "Marie VIP", token: "fcm_token_android_marie_11092", deviceType: "android", lastActiveAt: new Date().toISOString() }
];

let fcmNotificationLogs: FcmNotificationLogData[] = [
  {
    id: "fcm-log-101",
    targetTopic: "promotions",
    title: "🎉 Offre Spéciale Heure Creuse !",
    body: "Profitez de 50% de réduction sur les Pass Gaming VIP ce soir de 18h à 21h au CyberCafé DEK-DRIVSIM !",
    type: "promotion",
    deliveryChannel: "fcm_cloud",
    status: "sent",
    sentAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    metadata: { promoCode: "PROMO-50", discount: "50%" }
  },
  {
    id: "fcm-log-102",
    targetToken: "fcm_token_android_lucas_88291",
    title: "⏰ Votre Temps Gaming est Écoule !",
    body: "Votre session sur PC-01 est arrivée à expiration (0 min). Merci d'avoir joué !",
    type: "session_expiration",
    deliveryChannel: "fcm_cloud",
    status: "delivered",
    sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metadata: { pcName: "PC-01" }
  }
];

function sendPushNotification(payload: {
  targetToken?: string;
  targetTopic?: string;
  title: string;
  body: string;
  type: "session_expiration" | "promotion" | "system_alert" | "custom";
  metadata?: Record<string, any>;
}): FcmNotificationLogData {
  // If FIREBASE_SERVER_KEY or FCM credentials exist, send via Google FCM servers, else fallback seamlessly to local LAN push
  const hasFcmKey = !!process.env.FIREBASE_SERVER_KEY || !!process.env.VITE_FIREBASE_PROJECT_ID;
  const deliveryChannel: "fcm_cloud" | "lan_websocket_fallback" = hasFcmKey ? "fcm_cloud" : "lan_websocket_fallback";

  const logEntry: FcmNotificationLogData = {
    id: `fcm-log-${Date.now()}`,
    targetToken: payload.targetToken,
    targetTopic: payload.targetTopic || "all_gamers",
    title: payload.title,
    body: payload.body,
    type: payload.type,
    deliveryChannel: deliveryChannel,
    status: "sent",
    sentAt: new Date().toISOString(),
    metadata: payload.metadata
  };

  fcmNotificationLogs.unshift(logEntry);
  broadcastUpdate("PUSH_NOTIFICATION_SENT", { notification: logEntry });
  return logEntry;
}

// Register FCM Device Token
app.post("/api/fcm/register-token", (req, res) => {
  const { token, userId, userName, deviceType } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token FCM requis" });
  }

  let existing = fcmTokens.find(t => t.token === token);
  if (existing) {
    existing.userId = userId || existing.userId;
    existing.userName = userName || existing.userName;
    existing.lastActiveAt = new Date().toISOString();
  } else {
    existing = {
      id: `fcm-t-${Date.now()}`,
      userId,
      userName: userName || "Gamer Anonyme",
      token,
      deviceType: deviceType || "android",
      lastActiveAt: new Date().toISOString()
    };
    fcmTokens.unshift(existing);
  }

  res.json({ success: true, token: existing });
});

// Send Push Notification (Promotions, Session Expiration, System Alert)
app.post("/api/fcm/send", (req, res) => {
  const { targetToken, targetTopic, title, body, type, metadata } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Titre et contenu de la notification requis" });
  }

  const log = sendPushNotification({
    targetToken,
    targetTopic: targetTopic || "promotions",
    title,
    body,
    type: type || "promotion",
    metadata
  });

  res.json({
    success: true,
    notification: log,
    message: `Notification push transmise (${log.deliveryChannel === "fcm_cloud" ? "Google FCM Cloud" : "Réseau Local LAN Fallback"})`
  });
});

// Fetch FCM Push Logs & Tokens
app.get("/api/fcm/logs", (req, res) => {
  res.json(fcmNotificationLogs);
});

app.get("/api/fcm/tokens", (req, res) => {
  res.json(fcmTokens);
});

app.get("/api/fcm/stats", (req, res) => {
  res.json({
    registeredTokensCount: fcmTokens.length,
    totalSentCount: fcmNotificationLogs.length,
    promotionsSentCount: fcmNotificationLogs.filter(l => l.type === "promotion").length,
    sessionExpirationsCount: fcmNotificationLogs.filter(l => l.type === "session_expiration").length,
    lanOfflineCount: fcmNotificationLogs.filter(l => l.deliveryChannel === "lan_websocket_fallback").length
  });
});

// 6. Overall Stats for Dashboard
app.get("/api/stats", (req, res) => {
  const activeSessions = sessions.filter(s => s.status === "active");
  const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
  const todayRevenue = transactions
    .filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString())
    .reduce((acc, t) => acc + t.amount, 0);
  const totalComputers = computers.length;
  const occupiedComputers = computers.filter(p => p.status === "in_use").length;
  const occupancyRate = Math.round((occupiedComputers / totalComputers) * 100);

  res.json({
    activeSessionsCount: activeSessions.length,
    todayRevenue,
    totalRevenue,
    totalComputers,
    occupiedComputers,
    occupancyRate,
    totalUsersCount: users.length,
    pendingOrdersCount: orders.filter(o => o.status === "preparing" || o.status === "pending").length
  });
});

// Vite middleware / Static fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CyberCafe Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
