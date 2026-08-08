import subprocess
import time
import urllib.request
import os
import signal

def test_live_server():
    print("Démarrage du test d'intégration du serveur Flask...")
    
    # Start the flask server in a background process
    # We run it on port 5002 to avoid conflicts
    env = os.environ.copy()
    env["FLASK_APP"] = "cybercafe_manager/app.py"
    
    process = subprocess.Popen(
        ["python", "cybercafe_manager/app.py"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )
    
    # Give the server some seconds to boot up
    time.sleep(3)
    
    urls = [
        ("Accueil", "http://127.0.0.1:5000/"),
        ("Console Administration", "http://127.0.0.1:5000/admin"),
        ("Locker PC Client", "http://127.0.0.1:5000/client/PC-01"),
        ("Impression Tickets", "http://127.0.0.1:5000/admin/tickets/print"),
        ("Impression Rapport Journalier", "http://127.0.0.1:5000/admin/reports/print?period=daily"),
        ("Impression Rapport Hebdomadaire", "http://127.0.0.1:5000/admin/reports/print?period=weekly"),
        ("Impression Rapport Mensuel", "http://127.0.0.1:5000/admin/reports/print?period=monthly"),
        ("Impression Rapport Annuel", "http://127.0.0.1:5000/admin/reports/print?period=yearly"),
        ("API Terminals", "http://127.0.0.1:5000/api/terminals"),
        ("API Client Status", "http://127.0.0.1:5000/api/client/status/PC-01")
    ]
    
    all_passed = True
    
    for name, url in urls:
        try:
            response = urllib.request.urlopen(url, timeout=5)
            status = response.getcode()
            if status == 200:
                print(f"✅ URL '{name}' testée avec succès ({url}) -> HTTP 200 OK")
            else:
                print(f"❌ URL '{name}' a échoué avec le statut {status}")
                all_passed = False
        except Exception as e:
            print(f"❌ Erreur lors du test de l'URL '{name}' ({url}): {e}")
            all_passed = False
            
    # Terminate background process group
    try:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        print("Serveur de test arrêté.")
    except Exception as e:
        print(f"Erreur lors de la fermeture du serveur: {e}")
        
    if all_passed:
        print("\n🎉 TOUTES LES ROUTES DU SERVEUR SONT ENTIÈREMENT OPÉRATIONNELLES ET FONCTIONNELLES !")
        return 0
    else:
        print("\n⚠️ Certains tests d'intégration ont échoué.")
        return 1

if __name__ == "__main__":
    exit(test_live_server())
