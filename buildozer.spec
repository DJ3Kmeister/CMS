# =============================================================================
# DEK-DRIVSIM CyberCafe - Gabarit de Configuration Buildozer BULLETPROOF (spec)
# =============================================================================

[app]

# (str) Titre de votre application mobile
title = DEK-DRIVSIM

# (str) Nom du paquet système (sans espaces ni caractères spéciaux)
package.name = dekdrivsim

# (str) Domaine unique du paquet
package.domain = org.dekdrivsim

# (str) Dossier racine contenant le fichier "main.py"
source.dir = .

# (list) Extensions de fichiers à inclure lors du packaging
source.include_exts = py,png,jpg,html,js,css,db,crt,key

# (list) Dossiers spécifiques à inclure
source.include_patterns = cybercafe_manager/*,templates/*,static/*,static/images/*,static/css/*,static/js/*

# (str) Version de l'application
version = 2.5

# =============================================================================
# 🎨 ICONE ET ÉCRAN DE DÉMARRAGE (PRE-SPLASH) PERSONNALISÉS
# =============================================================================

icon.filename = %(source.dir)s/cybercafe_manager/static/images/logo.png
presplash.filename = %(source.dir)s/cybercafe_manager/static/images/presplash.png
android.presplash_color = #04050a

# =============================================================================
# 📦 DÉPENDANCES ET SYSTÈME
# =============================================================================

# CORRECTION : Retrait de sqlite3 (intégré à Python) et ajout de openssl, urllib3 pour HTTPS
requirements = python3, kivy, pyjnius, flask, jinja2, werkzeug, itsdangerous, blinker, openssl, urllib3
orientation = portrait
fullscreen = 1

# =============================================================================
# 🤖 PARAMÈTRES ANDROID BULLETPROOF & DEBLOCAGE HTTP
# =============================================================================

android.permissions = INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, WAKE_LOCK

android.manifest.application_attributes = android:usesCleartextTraffic="true"
android.manifest.attributes = android:usesCleartextTraffic="true"
android.network_security_config = %(source.dir)s/network_security_config.xml

android.api = 34
android.minapi = 21

android.foreground_service = true

# =============================================================================
# 🛠️ OPTIONS DE COMPILATION
# =============================================================================

[buildozer]
log_level = 2
warn_on_root = 1
