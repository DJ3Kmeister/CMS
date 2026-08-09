# -*- coding: utf-8 -*-
"""
DEK-DRIVSIM CyberCafe - Agent Client Windows Kiosk Invincible
Version 100% Autonome (Auto-Discovery), Fonctionnelle et Synchrone
"""

import json
import os
import sys
import threading
import urllib.request
import urllib.error
import ctypes
from ctypes import wintypes
import socket
import concurrent.futures

try:
    import winreg
    HAS_WINREG = True
except ImportError:
    HAS_WINREG = False

# =============================================================================
# CONSTANTES ET CONFIGURATION WIN32
# =============================================================================
POLL_INTERVAL_MS = 2000  # Intervalle de vérification du statut (2 secondes)

HC_ACTION = 0
WH_KEYBOARD_LL = 13
PM_REMOVE = 0x0001
VK_LWIN = 0x5B
VK_RWIN = 0x5C
VK_TAB = 0x09
VK_ESCAPE = 0x1B
VK_LCONTROL = 0xA2
VK_RCONTROL = 0xA3
LLKHF_ALTDOWN = 0x20
WM_CLOSE = 0x0010
WM_DESTROY = 0x0002
WM_RBUTTONUP = 0x0205
WS_POPUP = 0x80000000
WS_VISIBLE = 0x10000000
HWND_TOPMOST = -1
SWP_NOSIZE = 0x0001
SWP_NOMOVE = 0x0002
SW_HIDE = 0
SW_SHOW = 1
SW_SHOWNORMAL = 1

SCANCODE_MAP_BINARY = bytes([
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x03, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x5B, 0xE0, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x5C, 0xE0, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
])

# =============================================================================
# TYPES CTYPES
# =============================================================================
class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", wintypes.DWORD),
        ("scanCode", wintypes.DWORD),
        ("flags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_void_p),
    ]

WNDPROC = ctypes.WINFUNCTYPE(wintypes.LPARAM, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)
HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

class WNDCLASSEXW(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.UINT), ("style", wintypes.UINT), ("lpfnWndProc", WNDPROC),
        ("cbClsExtra", ctypes.c_int), ("cbWndExtra", ctypes.c_int), ("hInstance", wintypes.HINSTANCE),
        ("hIcon", wintypes.HICON), ("hCursor", wintypes.HCURSOR), ("hbrBackground", wintypes.HBRUSH),
        ("lpszMenuName", wintypes.LPCWSTR), ("lpszClassName", wintypes.LPCWSTR), ("hIconSm", wintypes.HICON),
    ]

class POINT(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

class MSG(ctypes.Structure):
    _fields_ = [("hwnd", wintypes.HWND), ("message", wintypes.UINT), ("wParam", wintypes.WPARAM),
                ("lParam", wintypes.LPARAM), ("time", wintypes.DWORD), ("pt", POINT)]

agent_instance = None
global_wndproc = None
global_hookproc = None

def window_proc(hwnd, msg, wParam, lParam):
    if agent_instance is not None:
        return agent_instance.window_proc(hwnd, msg, wParam, lParam)
    return ctypes.windll.user32.DefWindowProcW(hwnd, msg, wParam, lParam)

def keyboard_hook(nCode, wParam, lParam):
    if agent_instance is not None:
        return agent_instance.keyboard_hook(nCode, wParam, lParam)
    return ctypes.windll.user32.CallNextHookEx(None, nCode, wParam, lParam)

def ensure_admin():
    if ctypes.windll.shell32.IsUserAnAdmin():
        return True
    params = " ".join([f'"{a}"' for a in sys.argv[1:]])
    executable = sys.executable
    ctypes.windll.shell32.ShellExecuteW(None, "runas", executable, f'"{sys.argv[0]}" {params}' if not getattr(sys, 'frozen', False) else params, None, SW_SHOWNORMAL)
    sys.exit(0)

# =============================================================================
# AUTO-DETECTION DU SERVEUR SUR LE SOUS-RÉSEAU LOCAL (PORT 5000)
# =============================================================================
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def check_ip_for_server(ip, pc_name):
    url = f"http://{ip}:5000/api/client/status/{pc_name}"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=0.8) as response:
            if response.status == 200:
                return ip
    except Exception:
        pass
    return None

def discover_server(pc_name):
    """Scan rapide du sous-réseau en parallèle sur 50 threads."""
    local_ip = get_local_ip()
    if local_ip == '127.0.0.1':
        return '127.0.0.1'

    parts = local_ip.split('.')
    if len(parts) != 4:
        return '127.0.0.1'

    subnet_prefix = '.'.join(parts[:3])
    ips_to_scan = [f"{subnet_prefix}.{i}" for i in range(1, 255)]
    ips_to_scan.insert(0, '127.0.0.1')  # Tester d'abord en local

    print(f"[AUTO-DISCOVERY] Scan de la plage d'IP {subnet_prefix}.X ...")

    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(check_ip_for_server, ip, pc_name): ip for ip in ips_to_scan}
        for future in concurrent.futures.as_completed(futures):
            found_ip = future.result()
            if found_ip:
                print(f"[AUTO-DISCOVERY] Serveur local identifié sur : {found_ip}")
                return found_ip

    return '127.0.0.1'

# =============================================================================
# DEK CLIENT AGENT CLASS
# =============================================================================
class DEKClientAgent:
    REG_PATH = r"SYSTEM\CurrentControlSet\Control\Keyboard Layout"
    REG_VALUE = "Scancode Map"
    WNDCLASS_NAME = "DEKDRIVSIM_KioskClass"

    def __init__(self):
        self.running = False
        self.hwnd = None
        self.hwnd_taskbar = None
        self.hhook = None
        self.hinst = ctypes.windll.kernel32.GetModuleHandleW(None)
        self._status_thread = None
        self._registry_modified = False
        self.is_unlocked = False
        self.is_kiosk_hidden = False

        # Récupération automatique du nom du poste PC Windows
        self.pc_name = socket.gethostname()
        self.server_ip = "127.0.0.1"
        self.client_url = ""
        self.status_api_url = ""

    def setup_registry(self):
        if not HAS_WINREG:
            return
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, self.REG_PATH, 0, winreg.KEY_ALL_ACCESS)
        except FileNotFoundError:
            key = winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, self.REG_PATH)
        try:
            winreg.SetValueEx(key, self.REG_VALUE, 0, winreg.REG_BINARY, SCANCODE_MAP_BINARY)
            self._registry_modified = True
        finally:
            winreg.CloseKey(key)

    def restore_registry(self):
        if not HAS_WINREG or not self._registry_modified:
            return
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, self.REG_PATH, 0, winreg.KEY_ALL_ACCESS)
            try:
                winreg.DeleteValue(key, self.REG_VALUE)
            except FileNotFoundError:
                pass
            finally:
                winreg.CloseKey(key)
        except Exception:
            pass

    def hide_taskbar(self):
        self.hwnd_taskbar = ctypes.windll.user32.FindWindowW("Shell_TrayWnd", None)
        if self.hwnd_taskbar:
            ctypes.windll.user32.ShowWindow(self.hwnd_taskbar, SW_HIDE)
            ctypes.windll.user32.EnableWindow(self.hwnd_taskbar, False)

    def show_taskbar(self):
        if self.hwnd_taskbar:
            ctypes.windll.user32.ShowWindow(self.hwnd_taskbar, SW_SHOW)
            ctypes.windll.user32.EnableWindow(self.hwnd_taskbar, True)

    def install_hook(self):
        global global_hookproc
        global_hookproc = HOOKPROC(keyboard_hook)
        self.hhook = ctypes.windll.user32.SetWindowsHookExW(WH_KEYBOARD_LL, global_hookproc, self.hinst, 0)

    def uninstall_hook(self):
        if self.hhook:
            ctypes.windll.user32.UnhookWindowsHookEx(self.hhook)
            self.hhook = None

    def keyboard_hook(self, nCode, wParam, lParam):
        if nCode != HC_ACTION:
            return ctypes.windll.user32.CallNextHookEx(None, nCode, wParam, lParam)

        # Si la session est entièrement active et déverrouillée (occupied), on laisse l'accès complet au clavier
        if self.is_unlocked:
            return ctypes.windll.user32.CallNextHookEx(None, nCode, wParam, lParam)

        kb = ctypes.cast(lParam, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
        vk = kb.vkCode

        # Blocage de la touche Windows, d'Alt+Tab, Alt+Esc, Ctrl+Esc et du menu démarrer
        if vk in (VK_LWIN, VK_RWIN):
            return 1
        if kb.flags & LLKHF_ALTDOWN and vk in (VK_TAB, VK_ESCAPE):
            return 1
        if vk == VK_ESCAPE and (ctypes.windll.user32.GetAsyncKeyState(VK_LCONTROL) & 0x8000 or ctypes.windll.user32.GetAsyncKeyState(VK_RCONTROL) & 0x8000):
            return 1
        return ctypes.windll.user32.CallNextHookEx(None, nCode, wParam, lParam)

    def create_kiosk_window(self):
        global global_wndproc
        global_wndproc = WNDPROC(window_proc)
        wndclass = WNDCLASSEXW()
        wndclass.cbSize = ctypes.sizeof(WNDCLASSEXW)
        wndclass.lpfnWndProc = global_wndproc
        wndclass.hInstance = self.hinst
        wndclass.hbrBackground = ctypes.windll.gdi32.GetStockObject(4) # Pinceau noir
        wndclass.lpszClassName = self.WNDCLASS_NAME
        ctypes.windll.user32.RegisterClassExW(ctypes.byref(wndclass))
        
        screen_w = ctypes.windll.user32.GetSystemMetrics(0)
        screen_h = ctypes.windll.user32.GetSystemMetrics(1)
        self.hwnd = ctypes.windll.user32.CreateWindowExW(
            0, self.WNDCLASS_NAME, "DEK-DRIVSIM Client Kiosk",
            WS_POPUP | WS_VISIBLE, 0, 0, screen_w, screen_h, None, None, self.hinst, None
        )
        if self.hwnd:
            ctypes.windll.user32.SetWindowPos(self.hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE)

    def destroy_kiosk_window(self):
        if self.hwnd:
            ctypes.windll.user32.DestroyWindow(self.hwnd)
            self.hwnd = None
            ctypes.windll.user32.UnregisterClassW(self.WNDCLASS_NAME, self.hinst)

    def window_proc(self, hwnd, msg, wParam, lParam):
        if msg == WM_CLOSE:
            self.shutdown()
            return 0
        if msg == WM_DESTROY:
            ctypes.windll.user32.PostQuitMessage(0)
            return 0
        if msg == WM_RBUTTONUP:
            return 0
        return ctypes.windll.user32.DefWindowProcW(hwnd, msg, wParam, lParam)

    def status_poll_thread(self):
        """Vérification en continu du statut de ce PC sur le serveur local."""
        while self.running:
            try:
                req = urllib.request.Request(self.status_api_url, method="GET")
                with urllib.request.urlopen(req, timeout=3) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    status = data.get('status', 'free')
                    
                    if status == 'occupied':
                        # Session active de jeu: déverrouiller clavier et masquer le Kiosk noir
                        if self.hwnd and not self.is_kiosk_hidden:
                            ctypes.windll.user32.ShowWindow(self.hwnd, SW_HIDE)
                            self.show_taskbar()
                            self.is_kiosk_hidden = True
                        self.is_unlocked = True
                    elif status == 'paused':
                        # Session en pause: masquer le Kiosk noir (pour voir le navigateur de pause) mais bloquer le clavier
                        if self.hwnd and not self.is_kiosk_hidden:
                            ctypes.windll.user32.ShowWindow(self.hwnd, SW_HIDE)
                            self.hide_taskbar()
                            self.is_kiosk_hidden = True
                        self.is_unlocked = False
                    else:
                        # Session libre ou verrouillée: afficher le Kiosk noir et bloquer le clavier et la barre des tâches
                        if self.hwnd and self.is_kiosk_hidden:
                            ctypes.windll.user32.ShowWindow(self.hwnd, SW_SHOW)
                            ctypes.windll.user32.SetWindowPos(self.hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE)
                            self.hide_taskbar()
                            self.is_kiosk_hidden = False
                        self.is_unlocked = False
            except Exception:
                pass
            ctypes.windll.kernel32.Sleep(POLL_INTERVAL_MS)

    def open_client_browser(self):
        def _open():
            ctypes.windll.kernel32.Sleep(1000)
            try:
                import webbrowser
                webbrowser.open(self.client_url)
            except Exception:
                pass
        threading.Thread(target=_open, daemon=True).start()

    def run_message_pump(self):
        msg = MSG()
        while self.running:
            if ctypes.windll.user32.PeekMessageW(ctypes.byref(msg), None, 0, 0, PM_REMOVE):
                if msg.message == 0x0012:
                    self.running = False
                    break
                ctypes.windll.user32.TranslateMessage(ctypes.byref(msg))
                ctypes.windll.user32.DispatchMessageW(ctypes.byref(msg))
            else:
                ctypes.windll.kernel32.Sleep(10)

    def start(self):
        global agent_instance
        agent_instance = self

        # 1. Étape d'auto-détection intelligente du serveur local
        self.server_ip = discover_server(self.pc_name)

        # 2. Construction dynamique des URLs du client
        self.client_url = f"http://{self.server_ip}:5000/client/{self.pc_name}"
        self.status_api_url = f"http://{self.server_ip}:5000/api/client/status/{self.pc_name}"

        # 3. Initialisation et Kiosk
        self.setup_registry()
        self.hide_taskbar()
        self.create_kiosk_window()
        self.install_hook()
        self.running = True
        
        # Lancement de la surveillance synchrone
        self._status_thread = threading.Thread(target=self.status_poll_thread, daemon=True)
        self._status_thread.start()
        
        # Ouverture du navigateur client
        self.open_client_browser()
        self.run_message_pump()

    def shutdown(self):
        if not self.running:
            return
        self.running = False
        self.restore_registry()
        self.uninstall_hook()
        self.show_taskbar()
        self.destroy_kiosk_window()
        ctypes.windll.user32.PostQuitMessage(0)

    def emergency_cleanup(self):
        self.restore_registry()
        self.uninstall_hook()
        self.show_taskbar()
        self.destroy_kiosk_window()

if __name__ == '__main__':
    ensure_admin()
    agent = DEKClientAgent()
    try:
        agent.start()
    except Exception:
        pass
    finally:
        agent.emergency_cleanup()
