# -*- coding: utf-8 -*-
"""
DEK-DRIVSIM CyberCafe - Android APK Master Entry Point (main.py)
Ce fichier est le point d'entrée officiel pour la compilation Buildozer.
Il démarre le serveur Flask en arrière-plan et enveloppe l'interface d'administration
dans un composant Webview natif Android stable.
Utilise Clock.schedule_once pour éviter tout conflit de thread et écran noir au démarrage.
"""

import threading
import time
import os
import sys
import urllib.request

# Configure l'accès aux modules locaux du projet
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'cybercafe_manager'))

from kivy.app import App
from kivy.utils import platform
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.clock import Clock

# --- CONSTANTES ---
FLASK_HOST = '127.0.0.1'
FLASK_PORT = 5000
FLASK_URL = f"http://{FLASK_HOST}:{FLASK_PORT}"
MAX_RETRIES = 40
RETRY_DELAY = 0.5

def start_flask_server():
    """Démarre Flask en HTTP standard sur localhost."""
    try:
        import app as flask_backend
        print(f"[FLASK] Démarrage HTTP sur {FLASK_HOST}:{FLASK_PORT}")
        flask_backend.app.run(
            host=FLASK_HOST,
            port=FLASK_PORT,
            debug=False,
            threaded=True,
            use_reloader=False
        )
    except Exception as e:
        print(f"[FLASK ERROR] {e}")
        # Enregistre l'erreur de lancement dans un fichier pour diagnostic
        with open("flask_error_crash.txt", "w") as f:
            f.write(str(e))

def wait_for_server(url, max_retries=MAX_RETRIES, delay=RETRY_DELAY):
    """Attend que le serveur HTTP réponde."""
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, method='HEAD')
            urllib.request.urlopen(req, timeout=1)
            print(f"[FLASK] Serveur HTTP prêt ({attempt + 1} tentatives)")
            return True
        except Exception:
            time.sleep(delay)
            
    print("[FLASK ERROR] Serveur HTTP injoignable")
    return False

def load_url_on_ui_thread(webview, url):
    """Charge l'URL depuis le UI Thread natif Android."""
    from android.runnable import run_on_ui_thread
    @run_on_ui_thread
    def _load():
        try:
            webview.loadUrl(url)
            print(f"[WEBVIEW] Chargé : {url}")
        except Exception as e:
            print(f"[WEBVIEW LOAD ERROR] {e}")
    _load()

class DEKDRIVSIMApp(App):
    def build(self):
        # Layout d'attente Kivy initial
        self.layout = BoxLayout(orientation='vertical', padding=20)
        self.lbl_status = Label(
            text="INITIALISATION DE DEK-DRIVSIM...\n\nCalibrage des simulateurs en cours...",
            font_size='14sp',
            halign='center'
        )
        self.layout.add_widget(self.lbl_status)

        # 1. Lancement de Flask dans un thread d'arrière-plan détaché
        self.server_thread = threading.Thread(
            target=start_flask_server,
            daemon=True
        )
        self.server_thread.start()

        # 2. Planifie le chargement de la WebView après l'affichage de la fenêtre Kivy
        Clock.schedule_once(self.init_app_interface, 1.2)

        return self.layout

    def update_error_ui(self, message):
        """Met à jour l'écran de chargement avec le message d'erreur d'audit."""
        self.lbl_status.text = f"⚠️ ERREUR CRITIQUE DE CHARGEMENT :\n\n{message}"
        self.lbl_status.color = [1, 0.2, 0.2, 1]

    def init_app_interface(self, dt):
        """Initialise la WebView ou le navigateur système."""
        if platform == 'android':
            self._init_android()
        else:
            self._init_desktop()

    def _init_desktop(self):
        """Démarre le navigateur système sur PC."""
        self.lbl_status.text = "DEK-DRIVSIM HTTP actif\nOuverture de votre navigateur..."
        def open_browser():
            if wait_for_server(FLASK_URL):
                import webbrowser
                webbrowser.open(FLASK_URL)
            else:
                self.update_error_ui("Le serveur HTTP local est injoignable.")
        threading.Thread(target=open_browser, daemon=True).start()

    def _init_android(self):
        """Mode Android natif : WebView standard avec toutes les permissions."""
        from android.permissions import request_permissions, Permission
        from jnius import autoclass
        from android.runnable import run_on_ui_thread

        # 1. Demande de permissions
        try:
            request_permissions([
                Permission.INTERNET,
                Permission.WRITE_EXTERNAL_STORAGE,
                Permission.READ_EXTERNAL_STORAGE,
                Permission.ACCESS_NETWORK_STATE,
            ])
        except Exception as e:
            print(f"[PERMISSIONS ERROR] {e}")

        # 2. Création WebView sur le UI Thread natif d'Android
        @run_on_ui_thread
        def create_webview():
            try:
                PythonActivity = autoclass('org.kivy.android.PythonActivity')
                Activity = PythonActivity.mActivity
                WebView = autoclass('android.webkit.WebView')
                WebViewClient = autoclass('android.webkit.WebViewClient')
                
                webview = WebView(Activity)
                settings = webview.getSettings()
                
                settings.setJavaScriptEnabled(True)
                settings.setDomStorageEnabled(True)
                settings.setDatabaseEnabled(True)
                settings.setAllowFileAccess(True)
                settings.setAllowContentAccess(True)
                settings.setMediaPlaybackRequiresUserGesture(False)
                settings.setSupportZoom(True)
                settings.setBuiltInZoomControls(True)
                settings.setDisplayZoomControls(False)
                
                settings.setMixedContentMode(0)  # MIXED_CONTENT_ALWAYS_ALLOW
                
                webview.setWebViewClient(WebViewClient())
                Activity.setContentView(webview)
                print("[WEBVIEW] Instance native HTTP créée")

                # 3. Attente asynchrone de Flask et chargement de l'URL
                def wait_and_load():
                    if wait_for_server(FLASK_URL):
                        load_url_on_ui_thread(webview, FLASK_URL)
                    else:
                        flask_err = "Le serveur n'a pas répondu."
                        if os.path.exists("flask_error_crash.txt"):
                            with open("flask_error_crash.txt", "r") as f:
                                flask_err = f.read()
                        
                        html = f"""
                        <html><body style='background:#04050a;color:#ef4444;font-family:sans-serif;text-align:center;padding:15px;padding-top:30%'>
                            <h1>ERREUR SERVEUR DEK-DRIVSIM</h1>
                            <p style='color:#94a3b8;font-size:14px;line-height:1.6'>{flask_err}</p>
                        </body></html>
                        """
                        load_url_on_ui_thread(webview, f"data:text/html,{html}")
                
                threading.Thread(target=wait_and_load, daemon=True).start()
            except Exception as e:
                print(f"[WEBVIEW INIT ERROR] {e}")
                self.update_error_ui(str(e))

        create_webview()

if __name__ == '__main__':
    DEKDRIVSIMApp().run()
