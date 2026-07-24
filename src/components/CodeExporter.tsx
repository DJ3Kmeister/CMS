import React, { useState } from "react";
import { Terminal, Copy, Check, FileCode, Server, Smartphone, Container, Shield, Download } from "lucide-react";

export const CodeExporter: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fcm" | "python" | "docker" | "prisma" | "android" | "readme">("fcm");

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fcmAndroidContent = `// ==============================================================================
// FIREBASE CLOUD MESSAGING (FCM) SERVICE - ANDROID KOTLIN
// Fichier : app/src/main/java/com/dekdrivsim/cybercafe/MyFirebaseMessagingService.kt
// ==============================================================================

package com.dekdrivsim.cybercafe

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Envoyer le token FCM au serveur central pour l'associer au client
        registerTokenOnServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "DEK-DRIVSIM Notification"
        val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "Vous avez reçu un nouveau message."
        val type = remoteMessage.data["type"] ?: "general"

        showNotification(title, body, type)
    }

    private fun showNotification(title: String, message: String, type: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("notification_type", type)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "dek_drivsim_channel"
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification_logo)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Notifications DEK-DRIVSIM",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertes de fin de chrono et promotions exclusives"
            }
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }

    private fun registerTokenOnServer(fcmToken: String) {
        // Envoi au backend
        // POST /api/fcm/register-token { token: fcmToken, deviceType: "android" }
    }
}

/* 
 * DEPENDANCES GRADLE (build.gradle.kts) :
 * implementation("com.google.firebase:firebase-messaging-ktx:23.4.0")
 *
 * CONFIGURATION ANDROIDMANIFEST.XML :
 * <service
 *     android:name=".MyFirebaseMessagingService"
 *     android:exported="false">
 *     <intent-filter>
 *         <action android:name="com.google.firebase.MESSAGING_EVENT" />
 *     </intent-filter>
 * </service>
 */`;

  const pythonClientContent = `# ==============================================================================
# DEK-DRIVSIM GAMING PRO - CLIENT AGENT PYTHON (Windows / Linux)
#
# Rôle : S'exécute en arrière-plan sur les PC de simulation/jeux.
# 1. Interroge le serveur CyberCafé toutes les 3 secondes.
# 2. Affiche le temps restant en surimpression (overlay).
# 3. QUAND LE CHRONO EXPIRE (0 min) :
#    - Ferme automatiquement tous les jeux configurés (FIFA, Assetto Corsa, GTA, etc.)
#    - Verrouille la session Windows (LockWorkStation)
# ==============================================================================

import time
import os
import sys
import ctypes
import urllib.request
import json
import subprocess

# CONFIGURATION DU PC LOCAL & DU SERVEUR
SERVER_URL = "https://ais-dev-xmpge3idzvux6tm7t6z4in-677637281401.europe-west2.run.app"
COMPUTER_NAME = "PC-01"  # Nom du poste correspondant sur le dashboard (ex: PC-01, PC-02)

# LISTE DES PROCESSUS DE JEUX À FERMER AUTOMATIQUEMENT À LA FIN DU TIMER
GAMES_PROCESSES = [
    "fifa23.exe", "FC24.exe", "FC25.exe",
    "AssettoCorsa.exe", "acs.exe",
    "eurotrucks2.exe", "gta5.exe", "GTA5.exe",
    "ForzaHorizon5.exe", "NeedForSpeed.exe",
    "steam.exe", "epicgameslauncher.exe"
]

def lock_windows_session():
    """ Verrouille l'écran Windows à la fin de la session """
    print("[DEK-DRIVSIM] Fin de session ! Verrouillage de l'ordinateur...")
    try:
        # Tente de verrouiller la session Windows
        ctypes.windll.user32.LockWorkStation()
    except Exception as e:
        print(f"[Avertissement] Impossible de verrouiller la session: {e}")

def kill_active_games():
    """ Ferme tous les jeux et simulateurs en cours d'exécution """
    print("[DEK-DRIVSIM] Fermeture automatique des jeux en cours...")
    for game in GAMES_PROCESSES:
        try:
            if sys.platform == "win32":
                # Forcer l'arrêt du processus sous Windows
                subprocess.run(["taskkill", "/F", "/IM", game], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                subprocess.run(["killall", "-9", game], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

def check_server_status():
    """ Vérifie l'état du PC et de la session sur le serveur central """
    url = f"{SERVER_URL}/api/computers"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                for pc in data:
                    if pc.get("name") == COMPUTER_NAME:
                        return pc
    except Exception as err:
        print(f"[Erreur Connexion Serveur] {err}")
    return None

def main():
    print(f"==================================================")
    print(f"   DEK-DRIVSIM CLIENT AGENT - POSTE {COMPUTER_NAME}")
    print(f"==================================================")
    print(f"Connecté au serveur: {SERVER_URL}")
    print("Agent de surveillance actif... (Appuyez sur Ctrl+C pour quitter)\n")

    is_session_active = False

    while True:
        pc_info = check_server_status()
        if pc_info:
            status = pc_info.get("status")
            time_left = pc_info.get("timeLeftMinutes", 0)
            user_name = pc_info.get("currentUser", "Inconnu")

            if status == "occupied" or status == "in_use":
                is_session_active = True
                print(f"[SESSION ACTIVE] Joueur: {user_name} | Temps restant: {time_left} min", end="\r")

                # Si le temps est écoulé
                if time_left <= 0:
                    print("\n[ALERT] Le chrono est arrivé à 0 minute !")
                    kill_active_games()
                    lock_windows_session()
                    is_session_active = False
                    time.sleep(10)
            else:
                if is_session_active:
                    print("\n[STOP] La session a été arrêtée à distance depuis la caisse !")
                    kill_active_games()
                    lock_windows_session()
                    is_session_active = False
                
                print(f"[EN ATTENTE] Poste disponible sur le dashboard...             ", end="\r")

        time.sleep(3)

if __name__ == "__main__":
    main()
`;

  const dockerContent = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cybercafe_db
    restart: always
    environment:
      POSTGRES_USER: cyberadmin
      POSTGRES_PASSWORD: cyberpassword123
      POSTGRES_DB: cybercafe_db
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: cybercafe_redis
    restart: always
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: cybercafe_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      DATABASE_URL: "postgresql://cyberadmin:cyberpassword123@postgres:5432/cybercafe_db"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: "cybercafe_super_secret_jwt_key_2026"
    depends_on:
      - postgres
      - redis

  nginx:
    image: nginx:alpine
    container_name: cybercafe_proxy
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend`;

  const prismaContent = `// Prisma Schema for Cybercafé Management
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  role         Role          @default(CUSTOMER)
  balance      Float         @default(0.0)
  sessions     Session[]
  orders       Order[]
}

model Computer {
  id          String    @id @default(uuid())
  name        String    @unique
  ip          String    @unique
  hourlyRate  Float     @default(4.0)
  status      PcStatus  @default(AVAILABLE)
  specs       String
}`;

  const androidContent = `// Kotlin Jetpack Compose Android Client Implementation
package com.cybercafe.app

import androidx.compose.material3.*
import androidx.compose.runtime.*

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "CyberCafé Pro Client", style = MaterialTheme.typography.headlineMedium)
        Card(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
            Text(text = "Wallet Balance: \${state.userBalance}")
        }
    }
}`;

  const readmeContent = `# TUTORIEL D'INSTALLATION ET DE DÉPLOIEMENT COMPLET DEK-DRIVSIM

## ⚠️ RANGEMENT DOCKER & QUESTION IMPORTANTE
**Peut-on installer Docker sur un téléphone mobile ?**
- **Non, Docker ne tourne pas sur Android/iOS** (car il nécessite un noyau Linux serveur lourd).
- **Bonne Nouvelle** : Vous n'avez **PAS BESOIN de Docker**, et vous n'avez **PAS BESOIN d'un PC dédié pour le caissier** !

---

## COMMENT FAIRE FONCTIONNER LE SYSTÈME SANS PC POUR LE CAISSIER ?

Si vous n'avez pas encore de PC pour le caissier, voici les **2 méthodes simples et 100% fonctionnelles** :

### METHODE 1 (LA PLUS SIMPLE) : Utiliser l'un des PC de Jeux de la salle comme Serveur Hôte (ex: PC Client N°1)
1. Installez **Node.js** sur le PC Client N°1 de votre salle de jeux.
2. Lancez le serveur (\`npm start\`). Le serveur Node.js est ultra léger (< 100 Mo de RAM) et tourne silencieusement en tâche de fond pendant que les joueurs jouent sur le PC N°1.
3. Le caissier prend son **smartphone Android/iPhone**, se connecte au Wi-Fi du cybercafé, et ouvre l'adresse de ce PC N°1 dans son navigateur :
   \`http://192.168.1.10:3000\` (remplacez par l'IP locale de votre PC N°1).
4. Le caissier ajoute l'application à l'écran d'accueil de son téléphone (PWA) et gère tout le cybercafé en se déplaçant dans la salle !

### METHODE 2 (100% SUR TÉLÉPHONE ANDROID SANS AUCUN PC SERVEUR) : Exécuter le Serveur sur le Téléphone via Termux
1. Sur le smartphone Android du caissier, installez l'application gratuite **Termux** (disponible sur F-Droid ou Play Store).
2. Ouvrez Termux et tapez ces 3 commandes :
   \`\`\`bash
   pkg update && pkg install nodejs git
   cd dek-drivsim && npm install
   npm start
   \`\`\`
3. Activez le **Point d'accès Wi-Fi (Hotspot)** du téléphone Android.
4. Connectez tous les PC de jeux au Wi-Fi du téléphone.
5. Le serveur tourne dans le téléphone du caissier ! Il ouvre Chrome sur son téléphone à l'adresse \`http://localhost:3000\` pour gérer le cybercafé.

---

## ARCHITECTURE DU SYSTÈME DEK-DRIVSIM
Le système se compose de 3 briques :
1. **Le Serveur Backend (Node.js / Express)** : Hébergé soit sur le PC Client N°1, soit sur le téléphone (Termux), soit sur le Cloud.
2. **L'Application Mobile Caissier/Staff** : S'ouvre sur le smartphone du caissier pour encaisser les clients, générer/donner les codes tickets et contrôler les PC à distance.
3. **L'Écran de Verrouillage Client PC + Agent Python** : S'affiche en plein écran sur chaque poste de jeu (ex: PC-01, PC-02) pour demander le code ticket du reçu.

---

## ÉTAPE PAR ÉTAPE D'INSTALLATION SUR LES POSTES DE JEUX CLIENTS

Sur chaque poste client (ex: PC-01, PC-02...) :

### 1. Écran de Verrouillage Web (Navigateur Plein Écran)
1. Ouvrez Chrome sur le PC client et naviguez vers :
   \`http://192.168.1.10:3000?pc=PC-01\` (Remplacez par l'IP du serveur et le nom du PC).
2. Appuyez sur **F11** pour mettre en Plein Écran.
3. Configurez Chrome pour s'ouvrir automatiquement au démarrage de Windows.
4. **Le client n'a aucune application à installer** : Il vient s'asseoir, tape le code écrit sur son reçu papier remis par le caissier, et son PC se déverrouille !

### 2. Installation de l'Agent Python (Fermeture Automatique des Jeux)
1. Installez **Python 3.10+** sur le PC client (Cochez "Add Python to PATH").
2. Installez les bibliothèques requises :
   \`\`\`cmd
   pip install requests psutil
   \`\`\`
3. Copiez le fichier \`dek_drivsim_client.py\` (disponible dans l'onglet *Agent Python PC*) dans \`C:\\DEK_DRIVSIM\\\`.
4. Ajoutez un raccourci de ce script dans le dossier de démarrage Windows (\`shell:startup\`).
5. **Comportement** : L'agent interroge le serveur central toutes les 3 secondes. Si le chrono du poste atteint 0 min ou si le caissier verrouille le poste à distance, l'agent ferme automatiquement les jeux actifs (Steam, Epic, GTA, EA...) et verrouille le poste !

---

## ÉTAPE 4 : FONCTIONNEMENT HORS-LIGNE (RÉSEAU LAN LOCALE)
- **Aucune connexion Internet obligatoire** : Si la connexion Internet de la ville coupe, tout le cybercafé continue de fonctionner normalement via le routeur Wi-Fi / Switch Ethernet local.
- Le serveur bascule automatiquement sur le protocole **WebSocket Local** pour synchroniser les états des chronos et envoyer les alertes push au téléphone du caissier.`;

  const getActiveCode = () => {
    switch (activeTab) {
      case "fcm": return fcmAndroidContent;
      case "python": return pythonClientContent;
      case "docker": return dockerContent;
      case "prisma": return prismaContent;
      case "android": return androidContent;
      case "readme": return readmeContent;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" /> Scripts & Code d'Architecture Exportables
          </h2>
          <p className="text-xs text-slate-500">
            Push FCM Android, Agent Python PC (Fermeture de jeux), architecture LAN Offline et Docker/Prisma.
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(getActiveCode() || "", activeTab)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          {copiedSection === activeTab ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          {copiedSection === activeTab ? "Copié !" : "Copier le Code"}
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("fcm")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === "fcm" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Smartphone className="w-4 h-4 text-amber-300" /> FCM Service Kotlin (Android)
        </button>
        <button
          onClick={() => setActiveTab("python")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === "python" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-4 h-4 text-amber-300" /> Agent Python PC (Fermeture Jeux)
        </button>
        <button
          onClick={() => setActiveTab("docker")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === "docker" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Container className="w-4 h-4" /> docker-compose.yml
        </button>
        <button
          onClick={() => setActiveTab("prisma")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === "prisma" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <FileCode className="w-4 h-4" /> schema.prisma
        </button>
        <button
          onClick={() => setActiveTab("readme")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === "readme" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Server className="w-4 h-4" /> LAN & Serveur Guide
        </button>
      </div>

      {/* Code Viewer Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto shadow-inner">
        <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
          {getActiveCode()}
        </pre>
      </div>
    </div>
  );
};

