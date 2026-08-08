[app]

title = DEK-DRIVSIM
package.name = dekdrivsim
package.domain = org.dekdrivsim
source.dir = .
source.include_exts = py,png,jpg,html,js,css,db,crt,key
source.include_patterns = cybercafe_manager/*,templates/*,static/*,static/images/*,static/css/*,static/js/*
version = 2.5

icon.filename = %(source.dir)s/cybercafe_manager/static/images/logo.png
presplash.filename = %(source.dir)s/cybercafe_manager/static/images/presplash.png
android.presplash_color = #04050a

# --- CORRECTION : Suppression de sqlite3 des requirements ---
requirements = python3, kivy, pyjnius, flask, jinja2, werkzeug, itsdangerous, blinker

orientation = portrait
fullscreen = 1

android.permissions = INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, WAKE_LOCK
android.manifest.application_attributes = android:usesCleartextTraffic="true"
android.manifest.attributes = android:usesCleartextTraffic="true"
android.network_security_config = %(source.dir)s/network_security_config.xml
android.api = 34
android.minapi = 21
android.foreground_service = true

[buildozer]
log_level = 2
warn_on_root = 1
