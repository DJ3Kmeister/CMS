# -*- coding: utf-8 -*-
"""
DEK-DRIVSIM CyberCafe - Serveur Central Unifié de Niveau Entreprise
Version Corrigée et Persistante
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, Response
import sqlite3
import random
import string
from datetime import datetime, timedelta
import os
import csv
import io

app = Flask(__name__)
app.secret_key = 'senet_cybercafe_secret_key'

# --- COUCHE DE BASE DE DONNÉES ---

if 'ANDROID_ARGUMENT' in os.environ or os.environ.get('ANDROID_PRIVATE'):
    DB_PATH = os.path.join(os.environ.get('ANDROID_PRIVATE', '/data/data/org.dekdrivsim/files'), 'cybercafe.db')
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), 'cybercafe.db')

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS terminals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'free',
        current_session_id INTEGER,
        ip_address TEXT,
        last_ping TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        duration_mins INTEGER NOT NULL,
        price INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        used_at TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS driving_schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_name TEXT UNIQUE NOT NULL,
        instructor_name TEXT NOT NULL,
        special_hourly_rate INTEGER NOT NULL DEFAULT 300,
        balance INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        referral_code TEXT UNIQUE NOT NULL,
        referred_by_code TEXT,
        driving_school_id INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (driving_school_id) REFERENCES driving_schools(id) ON DELETE SET NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_type TEXT NOT NULL,
        referrer_code TEXT NOT NULL,
        referred_username TEXT NOT NULL,
        bonus_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cashier_evaluations (
        day_number INTEGER PRIMARY KEY,
        rating INTEGER NOT NULL DEFAULT 0,
        punctuality TEXT,
        cash_accuracy TEXT,
        recruits_count INTEGER DEFAULT 0,
        notes TEXT,
        evaluated_at TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS device_roles (
        ip_address TEXT PRIMARY KEY,
        role TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS connection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        terminal_name TEXT NOT NULL,
        session_type TEXT NOT NULL,
        login_time TEXT NOT NULL,
        logout_time TEXT,
        duration_mins INTEGER DEFAULT 0
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        terminal_id INTEGER NOT NULL,
        session_type TEXT NOT NULL,
        reference_id INTEGER,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_mins INTEGER,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'running',
        amount_paid INTEGER DEFAULT 0,
        FOREIGN KEY (terminal_id) REFERENCES terminals(id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        launch_path TEXT
    )
    ''')
    
    conn.commit()
    
    # Paramètres par défaut (sans écraser les modifications de l'admin)
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        default_settings = [
            ('cyber_name', 'DEK-DRIVSIM CyberCafe'),
            ('currency', 'FCFA'),
            ('hourly_rate', '500'),
            ('wifi_ssid', 'DEK-DRIVSIM_WiFi'),
            ('wifi_password', 'DEKDRIV2026'),
            ('admin_password', 'admin123'),
            ('cashier_password', 'caissier123'),
            ('cashier_referral_bonus', '200')
        ]
        cursor.executemany("INSERT INTO settings (key, value) VALUES (?, ?)", default_settings)
        conn.commit()
    else:
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', 'admin123')")
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('cashier_password', 'caissier123')")
        conn.commit()

    cursor.execute("SELECT COUNT(*) FROM players WHERE username = 'admin_dek'")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO players (username, password, balance, status, referral_code, created_at)
            VALUES ('admin_dek', 'admin123', 999999, 'active', 'REF-ADMIN-DEK', ?)
        ''', (now,))
        
    cursor.execute("SELECT COUNT(*) FROM players WHERE username = 'caissier_dek'")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO players (username, password, balance, status, referral_code, created_at)
            VALUES ('caissier_dek', 'caissier123', 60, 'active', 'REF-CAISSIER-DEK', ?)
        ''', (now,))
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM cashier_evaluations")
    if cursor.fetchone()[0] == 0:
        evals = [(d, 0, 'good', 'exact', 0, '', '') for d in range(1, 15)]
        cursor.executemany("INSERT INTO cashier_evaluations (day_number, rating, punctuality, cash_accuracy, recruits_count, notes, evaluated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", evals)
        conn.commit()

    cursor.execute("SELECT COUNT(*) FROM games")
    if cursor.fetchone()[0] == 0:
        default_games = [
            ('Assetto Corsa Competizione', 'Simulation Auto', '/static/images/logo.png', 'C:\\Games\\AssettoCorsa\\ACC.exe'),
            ('Forza Horizon 5', 'Simulation Auto', '/static/images/logo.png', 'C:\\Games\\Forza5\\ForzaHorizon5.exe'),
            ('Euro Truck Simulator 2', 'Simulation', '/static/images/logo.png', 'C:\\Games\\ETS2\\bin\\win_x64\\eurotruck2.exe'),
            ('Need for Speed Unbound', 'Course Arcade', '/static/images/logo.png', 'C:\\Games\\NFSUnbound\\NFSUnbound.exe'),
            ('Dirt Rally 2.0', 'Simulation Auto', '/static/images/logo.png', 'C:\\Games\\DirtRally2\\DirtRally2.exe'),
            ('Gran Turismo 7 (PS5)', 'Simulation Auto', '/static/images/logo.png', 'PS5_LAUNCHER_GT7'),
            ('Grand Theft Auto V', 'Action / Monde Ouvert', '/static/images/logo.png', 'C:\\Games\\GTAV\\PlayGTAV.exe'),
            ('FIFA 26', 'Sport', '/static/images/logo.png', 'C:\\Games\\FIFA26\\FIFA26.exe')
        ]
        cursor.executemany("INSERT INTO games (name, category, image_url, launch_path) VALUES (?, ?, ?, ?)", default_games)
        conn.commit()

    conn.close()

# --- HELPERS ET ROUTES FLASK ---
def get_device_role(ip_address):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM device_roles WHERE ip_address = ?", (ip_address,))
    row = cursor.fetchone()
    conn.close()
    return row['role'] if row else None

def set_device_role(ip_address, role):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO device_roles (ip_address, role) VALUES (?, ?)", (ip_address, role))
    conn.commit()
    conn.close()
    return True

def get_all_terminals():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, s.session_type, s.start_time, s.end_time, s.duration_mins, s.time_spent_seconds, s.reference_id
        FROM terminals t
        LEFT JOIN sessions s ON t.current_session_id = s.id
    ''')
    terminals = [dict(row) for row in cursor.fetchall()]
    conn.close()

    now = datetime.now()
    for term in terminals:
        if term['status'] == 'occupied' and term['start_time']:
            try:
                start_time = datetime.fromisoformat(term['start_time'])
                elapsed = int((now - start_time).total_seconds())
                term['time_spent_seconds'] = (term['time_spent_seconds'] or 0) + elapsed
            except Exception:
                pass
    return terminals

def get_terminal(terminal_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, s.session_type, s.start_time, s.end_time, s.duration_mins, s.time_spent_seconds, s.reference_id
        FROM terminals t
        LEFT JOIN sessions s ON t.current_session_id = s.id
        WHERE t.id = ?
    ''', (terminal_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    term = dict(row)
    if term['status'] == 'occupied' and term['start_time']:
        try:
            start_time = datetime.fromisoformat(term['start_time'])
            elapsed = int((datetime.now() - start_time).total_seconds())
            term['time_spent_seconds'] = (term['time_spent_seconds'] or 0) + elapsed
        except Exception:
            pass
    return term

def get_terminal_by_name(name):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, s.session_type, s.start_time, s.end_time, s.duration_mins, s.time_spent_seconds, s.reference_id
        FROM terminals t
        LEFT JOIN sessions s ON t.current_session_id = s.id
        WHERE t.name = ?
    ''', (name,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    term = dict(row)
    if term['status'] == 'occupied' and term['start_time']:
        try:
            start_time = datetime.fromisoformat(term['start_time'])
            elapsed = int((datetime.now() - start_time).total_seconds())
            term['time_spent_seconds'] = (term['time_spent_seconds'] or 0) + elapsed
        except Exception:
            pass
    return term

def ping_terminal(name, ip_address):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE terminals SET ip_address = ?, last_ping = ? WHERE name = ?", (ip_address, now, name))
    conn.commit()
    conn.close()

def generate_tickets(count, duration_mins, price):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    created_tickets = []
    for _ in range(count):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        cursor.execute("INSERT INTO tickets (code, duration_mins, price, status, created_at) VALUES (?, ?, ?, 'active', ?)",
                       (code, duration_mins, price, now))
        created_tickets.append({'code': code, 'duration_mins': duration_mins, 'price': price})
    conn.commit()
    conn.close()
    return created_tickets

def get_tickets(status=None):
    conn = get_db()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM tickets WHERE status = ? ORDER BY id DESC", (status,))
    else:
        cursor.execute("SELECT * FROM tickets ORDER BY id DESC")
    tickets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tickets

def get_ticket_by_code(code):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE code = ?", (code,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_player(username, password, initial_balance=0, referred_by_code=None, driving_school_id=None):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    ref_code = f"DEK-{username.upper()}"
    try:
        cursor.execute('''
            INSERT INTO players (username, password, balance, status, referral_code, referred_by_code, driving_school_id, created_at)
            VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
        ''', (username, password, initial_balance, ref_code, referred_by_code, driving_school_id, now))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

def recharge_player(player_id, amount):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE players SET balance = balance + ? WHERE id = ?", (amount, player_id))
    cursor.execute("SELECT username FROM players WHERE id = ?", (player_id,))
    player = cursor.fetchone()
    if player:
        now = datetime.now().isoformat()
        cursor.execute("INSERT INTO transactions (type, amount, description, created_at) VALUES (?, ?, ?, ?)",
                       ('player_recharge', amount, f"Recharge compte de {player['username']}", now))
        conn.commit()
        success = True
    else:
        success = False
    conn.close()
    return success

def get_players():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT p.*, d.school_name FROM players p LEFT JOIN driving_schools d ON p.driving_school_id = d.id ORDER BY p.username ASC')
    players = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return players

def get_player_by_username(username):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_driving_schools():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM driving_schools ORDER BY school_name ASC")
    schools = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return schools

def create_driving_school(school_name, instructor_name, hourly_rate=300, initial_balance=0):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    try:
        cursor.execute('INSERT INTO driving_schools (school_name, instructor_name, special_hourly_rate, balance, created_at) VALUES (?, ?, ?, ?, ?)',
                       (school_name, instructor_name, hourly_rate, initial_balance, now))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

def recharge_driving_school(school_id, amount):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE driving_schools SET balance = balance + ? WHERE id = ?", (amount, school_id))
    conn.commit()
    conn.close()
    return True

def delete_driving_school(school_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM driving_schools WHERE id = ?", (school_id,))
    conn.commit()
    conn.close()
    return True

def get_all_referrals():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM referrals ORDER BY id DESC")
    refs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return refs

def claim_referral_bonus(ref_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE referrals SET status = 'claimed' WHERE id = ?", (ref_id,))
    conn.commit()
    conn.close()
    return True

def get_cashier_evaluations():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cashier_evaluations ORDER BY day_number ASC")
    evals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return evals

def submit_cashier_evaluation(day_number, rating, punctuality, cash_accuracy, notes):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute('UPDATE cashier_evaluations SET rating = ?, punctuality = ?, cash_accuracy = ?, notes = ?, evaluated_at = ? WHERE day_number = ?',
                   (rating, punctuality, cash_accuracy, notes, now, day_number))
    conn.commit()
    conn.close()
    return True

def get_all_connection_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM connection_logs ORDER BY id DESC")
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs

def log_session_login(username, terminal_name, session_type):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute('INSERT INTO connection_logs (username, terminal_name, session_type, login_time) VALUES (?, ?, ?, ?)',
                   (username, terminal_name, session_type, now))
    conn.commit()
    conn.close()

def log_session_logout(terminal_name):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now()
    cursor.execute('SELECT * FROM connection_logs WHERE terminal_name = ? AND logout_time IS NULL ORDER BY id DESC LIMIT 1', (terminal_name,))
    row = cursor.fetchone()
    if row:
        login_time = datetime.fromisoformat(row['login_time'])
        duration_mins = max(1, int((now - login_time).total_seconds() / 60))
        cursor.execute('UPDATE connection_logs SET logout_time = ?, duration_mins = ? WHERE id = ?', (now.isoformat(), duration_mins, row['id']))
        conn.commit()
    conn.close()

def get_all_games():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM games ORDER BY category, name")
    games = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return games

def add_game(name, category, image_url, launch_path):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO games (name, category, image_url, launch_path) VALUES (?, ?, ?, ?)", (name, category, image_url, launch_path))
    conn.commit()
    conn.close()

def delete_game(game_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM games WHERE id = ?", (game_id,))
    conn.commit()
    conn.close()

def start_ticket_session(terminal_id, ticket_code):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE code = ? AND status = 'active'", (ticket_code,))
    ticket = cursor.fetchone()
    if not ticket:
        conn.close()
        return False, "Ticket invalide ou déjà utilisé"
    cursor.execute("SELECT * FROM terminals WHERE id = ? AND status = 'free'", (terminal_id,))
    terminal = cursor.fetchone()
    if not terminal:
        conn.close()
        return False, "Poste occupé ou introuvable"
    
    now = datetime.now()
    end_time = (now + timedelta(minutes=ticket['duration_mins'])).isoformat()
    cursor.execute('INSERT INTO sessions (terminal_id, session_type, reference_id, start_time, end_time, duration_mins, status) VALUES (?, "ticket", ?, ?, ?, ?, "running")',
                   (terminal_id, ticket['id'], now.isoformat(), end_time, ticket['duration_mins']))
    session_id = cursor.lastrowid
    cursor.execute("UPDATE terminals SET status = 'occupied', current_session_id = ? WHERE id = ?", (session_id, terminal_id))
    cursor.execute("UPDATE tickets SET status = 'used', used_at = ? WHERE id = ?", (now.isoformat(), ticket['id']))
    cursor.execute("INSERT INTO transactions (type, amount, description, created_at) VALUES ('ticket_sale', ?, ?, ?)",
                   (ticket['price'], f"Vente ticket {ticket_code}", now.isoformat()))
    conn.commit()
    conn.close()
    log_session_login(f"Ticket {ticket_code}", terminal['name'], 'ticket')
    return True, session_id

def start_player_session(terminal_id, username, password):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players WHERE username = ? AND password = ? AND status = 'active'", (username, password))
    player = cursor.fetchone()
    if not player:
        conn.close()
        return False, "Identifiants incorrects"
    cursor.execute("SELECT * FROM terminals WHERE id = ? AND status = 'free'", (terminal_id,))
    terminal = cursor.fetchone()
    if not terminal:
        conn.close()
        return False, "Poste occupé"
    
    duration_mins = 600 if username == 'admin_dek' else 60
    now = datetime.now()
    end_time = (now + timedelta(minutes=duration_mins)).isoformat()
    cursor.execute('INSERT INTO sessions (terminal_id, session_type, reference_id, start_time, end_time, duration_mins, status) VALUES (?, "player", ?, ?, ?, ?, "running")',
                   (terminal_id, player['id'], now.isoformat(), end_time, duration_mins))
    session_id = cursor.lastrowid
    cursor.execute("UPDATE terminals SET status = 'occupied', current_session_id = ? WHERE id = ?", (session_id, terminal_id))
    conn.commit()
    conn.close()
    log_session_login(username, terminal['name'], 'player')
    return True, session_id

def stop_session(terminal_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT current_session_id, name FROM terminals WHERE id = ?", (terminal_id,))
    term = cursor.fetchone()
    if not term or not term['current_session_id']:
        conn.close()
        return False, "Aucune session active"
    session_id = term['current_session_id']
    terminal_name = term['name']

    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    sess = cursor.fetchone()
    if sess:
        if sess['status'] == 'running':
            now = datetime.now()
            start_time = datetime.fromisoformat(sess['start_time'])
            elapsed_segment = int((now - start_time).total_seconds())
            new_time_spent = sess['time_spent_seconds'] + elapsed_segment
            cursor.execute("UPDATE sessions SET time_spent_seconds = ? WHERE id = ?", (new_time_spent, session_id))

    cursor.execute("UPDATE sessions SET status = 'completed' WHERE id = ?", (session_id,))
    cursor.execute("UPDATE terminals SET status = 'free', current_session_id = NULL WHERE id = ?", (terminal_id,))
    conn.commit()
    conn.close()
    log_session_logout(terminal_name)
    return True, "Session arrêtée"

def pause_session(terminal_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT current_session_id, name FROM terminals WHERE id = ?", (terminal_id,))
    term = cursor.fetchone()
    if not term or not term['current_session_id']:
        conn.close()
        return False, "Aucune session active sur ce poste"
    session_id = term['current_session_id']

    cursor.execute("SELECT * FROM sessions WHERE id = ? AND status = 'running'", (session_id,))
    sess = cursor.fetchone()
    if not sess:
        conn.close()
        return False, "Session non active ou déjà en pause"

    now = datetime.now()
    start_time = datetime.fromisoformat(sess['start_time'])
    elapsed_segment = int((now - start_time).total_seconds())
    new_time_spent = sess['time_spent_seconds'] + elapsed_segment

    cursor.execute("UPDATE sessions SET status = 'paused', time_spent_seconds = ? WHERE id = ?", (new_time_spent, session_id))
    cursor.execute("UPDATE terminals SET status = 'paused' WHERE id = ?", (terminal_id,))
    conn.commit()
    conn.close()
    return True, "Session mise en pause"

def resume_session(terminal_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT current_session_id, name FROM terminals WHERE id = ?", (terminal_id,))
    term = cursor.fetchone()
    if not term or not term['current_session_id']:
        conn.close()
        return False, "Aucune session active"
    session_id = term['current_session_id']

    cursor.execute("SELECT * FROM sessions WHERE id = ? AND status = 'paused'", (session_id,))
    sess = cursor.fetchone()
    if not sess:
        conn.close()
        return False, "Session non en pause"

    now = datetime.now()
    total_allowed_seconds = sess['duration_mins'] * 60
    remaining_seconds = total_allowed_seconds - sess['time_spent_seconds']
    if remaining_seconds < 0:
        remaining_seconds = 0

    new_end_time = (now + timedelta(seconds=remaining_seconds)).isoformat()

    cursor.execute("UPDATE sessions SET status = 'running', start_time = ?, end_time = ? WHERE id = ?", (now.isoformat(), new_end_time, session_id))
    cursor.execute("UPDATE terminals SET status = 'occupied' WHERE id = ?", (terminal_id,))
    conn.commit()
    conn.close()
    return True, "Session reprise"

def tick_all_sessions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE status = 'running'")
    running_sessions = cursor.fetchall()
    now = datetime.now()
    to_stop = []
    for s in running_sessions:
        if s['end_time'] and now >= datetime.fromisoformat(s['end_time']):
            to_stop.append(s['terminal_id'])
    conn.close()
    for tid in to_stop:
        stop_session(tid)

def get_financial_summary():
    conn = get_db()
    cursor = conn.cursor()
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    cursor.execute("SELECT SUM(amount) FROM transactions WHERE created_at >= ?", (today_start,))
    today_revenue = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE type = 'ticket_sale' AND created_at >= ?", (today_start,))
    tickets_sold_today = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM players WHERE status = 'active'")
    active_players_count = cursor.fetchone()[0]
    cursor.execute("SELECT SUM(amount) FROM transactions")
    all_time_revenue = cursor.fetchone()[0] or 0
    cursor.execute("SELECT * FROM transactions ORDER BY id DESC LIMIT 10")
    recent_transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {
        'today_revenue': today_revenue,
        'tickets_sold_today': tickets_sold_today,
        'active_players_count': active_players_count,
        'all_time_revenue': all_time_revenue,
        'recent_transactions': recent_transactions
    }

def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings")
    settings = {row['key']: row['value'] for row in cursor.fetchall()}
    conn.close()
    return settings

def update_settings(settings_dict):
    conn = get_db()
    cursor = conn.cursor()
    for key, val in settings_dict.items():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(val)))
    conn.commit()
    conn.close()

# --- ROUTES WEB ---
@app.route('/')
def index():
    client_ip = request.remote_addr
    role = get_device_role(client_ip)
    if not role:
        return redirect(url_for('role_setup'))
    if role == 'admin':
        return redirect(url_for('admin_dashboard'))
    return redirect(url_for('cashier_dashboard'))

@app.route('/role-setup')
def role_setup():
    return render_template('role_setup.html', client_ip=request.remote_addr)

@app.route('/api/setup-role', methods=['POST'])
def api_setup_role():
    data = request.json or {}
    password = data.get('password', '').strip()
    client_ip = request.remote_addr
    settings = get_settings()
    if password == settings.get('admin_password', 'admin123'):
        set_device_role(client_ip, 'admin')
        return jsonify({'success': True, 'redirect': '/admin'})
    elif password == settings.get('cashier_password', 'caissier123'):
        set_device_role(client_ip, 'cashier')
        return jsonify({'success': True, 'redirect': '/cashier'})
    return jsonify({'success': False, 'message': 'Code incorrect'})

@app.route('/admin')
def admin_dashboard():
    if get_device_role(request.remote_addr) != 'admin':
        return redirect(url_for('index'))
    return render_template('admin_dashboard.html', terminals=get_all_terminals(), tickets=get_tickets(), players=get_players(), summary=get_financial_summary(), settings=get_settings(), schools=get_driving_schools(), referrals=get_all_referrals(), evaluations=get_cashier_evaluations(), connection_logs=get_all_connection_logs())

@app.route('/cashier')
def cashier_dashboard():
    return render_template('cashier_dashboard.html', terminals=get_all_terminals(), tickets=get_tickets(), players=get_players(), summary=get_financial_summary(), settings=get_settings(), evaluations=get_cashier_evaluations())

@app.route('/client/<name>')
def client_locker(name):
    term = get_terminal_by_name(name)
    if not term:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO terminals (name, type) VALUES (?, 'PC')", (name,))
        conn.commit()
        conn.close()
        term = get_terminal_by_name(name)
    return render_template('client_locker.html', name=name, terminal=term, settings=get_settings(), games=get_all_games())

@app.route('/api/client/status/<name>', methods=['GET'])
def api_client_status(name):
    tick_all_sessions()
    ping_terminal(name, request.remote_addr)
    term = get_terminal_by_name(name)
    if not term:
        return jsonify({'status': 'free', 'name': name})
    return jsonify({
        'id': term['id'],
        'name': term['name'],
        'status': term['status'],
        'session_type': term['session_type'],
        'duration_mins': term['duration_mins'],
        'time_spent_seconds': term['time_spent_seconds']
    })

@app.route('/api/terminal/<int:terminal_id>/stop', methods=['POST'])
def api_stop_session(terminal_id):
    success, msg = stop_session(terminal_id)
    return jsonify({'success': success, 'message': msg})

def start_postpaid_session(terminal_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM terminals WHERE id = ? AND status = 'free'", (terminal_id,))
    terminal = cursor.fetchone()
    if not terminal:
        conn.close()
        return False, "Poste occupé"

    now = datetime.now()
    cursor.execute('INSERT INTO sessions (terminal_id, session_type, start_time, duration_mins, status) VALUES (?, "postpaid", ?, 99999, "running")',
                   (terminal_id, now.isoformat()))
    session_id = cursor.lastrowid
    cursor.execute("UPDATE terminals SET status = 'occupied', current_session_id = ? WHERE id = ?", (session_id, terminal_id))
    conn.commit()
    conn.close()
    log_session_login("Libre-accès", terminal['name'], 'postpaid')
    return True, session_id


@app.route('/api/terminal/<int:terminal_id>/pause', methods=['POST'])
def api_pause_session(terminal_id):
    success, msg = pause_session(terminal_id)
    return jsonify({'success': success, 'message': msg})

@app.route('/api/terminal/<int:terminal_id>/resume', methods=['POST'])
def api_resume_session(terminal_id):
    success, msg = resume_session(terminal_id)
    return jsonify({'success': success, 'message': msg})

@app.route('/api/terminal/<int:terminal_id>/start', methods=['POST'])
def api_start_session_endpoint(terminal_id):
    data = request.json or {}
    session_type = data.get('session_type')

    if session_type == 'ticket':
        code = data.get('code', '').strip().upper()
        success, msg = start_ticket_session(terminal_id, code)
        return jsonify({'success': success, 'message': msg})
    elif session_type == 'player':
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        success, msg = start_player_session(terminal_id, username, password)
        return jsonify({'success': success, 'message': msg if not success else "Connexion réussie"})
    elif session_type == 'postpaid':
        success, msg = start_postpaid_session(terminal_id)
        return jsonify({'success': success, 'message': msg if not success else "Session lancée"})

    return jsonify({'success': False, 'message': 'Type de session inconnu'})

@app.route('/api/players/<int:player_id>/recharge', methods=['POST'])
def api_recharge_player(player_id):
    data = request.json or {}
    amount = int(data.get('amount', 0))
    success = recharge_player(player_id, amount)
    return jsonify({'success': success})

@app.route('/api/players/create', methods=['POST'])
def api_create_player():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    balance = int(data.get('balance', 0))
    if not username or not password:
        return jsonify({'success': False, 'message': 'Champs requis'})
    success = create_player(username, password, balance)
    return jsonify({'success': success, 'message': 'Créé' if success else 'Pseudo existe déjà'})

@app.route('/api/tick', methods=['POST'])
def api_tick():
    tick_all_sessions()
    return jsonify({'success': True})

@app.route('/api/dashboard/stats', methods=['GET'])
def api_dashboard_stats():
    tick_all_sessions()
    summary = get_financial_summary()
    terminals = get_all_terminals()

    occupied = sum(1 for t in terminals if t['status'] == 'occupied')
    free = sum(1 for t in terminals if t['status'] == 'free')
    paused = sum(1 for t in terminals if t['status'] == 'paused')

    online = len(terminals)

    stats = {
        'today_revenue': summary['today_revenue'],
        'tickets_sold_today': summary['tickets_sold_today'],
        'active_players_count': summary['active_players_count'],
        'all_time_revenue': summary['all_time_revenue'],
        'recent_transactions': summary['recent_transactions'],
        'online_count': online,
        'occupied_count': occupied,
        'free_count': free,
        'paused_count': paused
    }
    return jsonify(stats)

@app.route('/api/terminals', methods=['GET'])
def api_terminals():
    tick_all_sessions()
    return jsonify(get_all_terminals())

@app.route('/api/players', methods=['GET'])
def api_players():
    return jsonify(get_players())

@app.route('/api/tickets', methods=['GET'])
def api_tickets():
    return jsonify(get_tickets())

@app.route('/api/tickets/generate', methods=['POST'])
def api_generate_tickets():
    data = request.json or {}
    count = int(data.get('count', 1))
    duration_mins = int(data.get('duration_mins', 60))
    price = int(data.get('price', 500))
    created = generate_tickets(count, duration_mins, price)
    return jsonify({'success': True, 'tickets': created})

@app.route('/api/schools/create', methods=['POST'])
def api_create_school():
    data = request.json or {}
    name = data.get('school_name', '').strip()
    instructor = data.get('instructor_name', '').strip()
    rate = int(data.get('hourly_rate', 300))
    balance = int(data.get('balance', 0))
    if not name or not instructor:
        return jsonify({'success': False, 'message': 'Champs requis'})
    success = create_driving_school(name, instructor, rate, balance)
    return jsonify({'success': success})

@app.route('/api/schools/<int:school_id>/recharge', methods=['POST'])
def api_recharge_school(school_id):
    data = request.json or {}
    amount = int(data.get('amount', 0))
    success = recharge_driving_school(school_id, amount)
    return jsonify({'success': success})

@app.route('/api/schools/<int:school_id>', methods=['DELETE'])
def api_delete_school(school_id):
    success = delete_driving_school(school_id)
    return jsonify({'success': success})

@app.route('/api/cashier/evaluate', methods=['POST'])
def api_evaluate_cashier():
    data = request.json or {}
    day = int(data.get('day_number', 1))
    rating = int(data.get('rating', 0))
    punctuality = data.get('punctuality', 'good')
    cash_accuracy = data.get('cash_accuracy', 'exact')
    notes = data.get('notes', '')
    success = submit_cashier_evaluation(day, rating, punctuality, cash_accuracy, notes)
    return jsonify({'success': success})

@app.route('/api/referrals/<int:ref_id>/claim', methods=['POST'])
def api_claim_referral(ref_id):
    success = claim_referral_bonus(ref_id)
    return jsonify({'success': success})

@app.route('/api/client/unlock/<name>', methods=['POST'])
def api_client_unlock(name):
    term = get_terminal_by_name(name)
    if not term:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO terminals (name, type) VALUES (?, 'PC')", (name,))
        conn.commit()
        conn.close()
        term = get_terminal_by_name(name)

    data = request.json or {}
    unlock_type = data.get('unlock_type')

    if unlock_type == 'ticket':
        code = data.get('code', '').strip().upper()
        success, msg = start_ticket_session(term['id'], code)
        return jsonify({'success': success, 'message': msg})
    elif unlock_type == 'player':
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        success, msg = start_player_session(term['id'], username, password)
        return jsonify({'success': success, 'message': msg if not success else "Connexion réussie"})

    return jsonify({'success': False, 'message': 'Type de déverrouillage inconnu'})

@app.route('/api/client/admin-login', methods=['POST'])
def api_client_admin_login():
    data = request.json or {}
    password = data.get('password', '').strip()
    settings = get_settings()
    if password == settings.get('admin_password', 'admin123'):
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Code incorrect'})

@app.route('/api/games', methods=['GET'])
def api_games():
    return jsonify(get_all_games())

@app.route('/api/games/add', methods=['POST'])
def api_add_game():
    data = request.json or {}
    name = data.get('name', '').strip()
    category = data.get('category', '').strip()
    image_url = data.get('image_url', '/static/images/logo.png').strip() or '/static/images/logo.png'
    launch_path = data.get('launch_path', '').strip()

    if not name or not category:
        return jsonify({'success': False, 'message': 'Champs requis'})

    add_game(name, category, image_url, launch_path)
    return jsonify({'success': True})

@app.route('/api/games/<int:game_id>', methods=['DELETE'])
def api_delete_game(game_id):
    delete_game(game_id)
    return jsonify({'success': True})

@app.route('/admin/tickets/print')
def admin_tickets_print():
    return render_template('tickets_print.html', tickets=get_tickets('active'), settings=get_settings())

@app.route('/admin/reports/print')
def admin_reports_print():
    period = request.args.get('period', 'daily')
    now = datetime.now()

    if period == 'daily':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        label = "Journalier"
    elif period == 'weekly':
        start_date = now - timedelta(days=7)
        label = "Hebdomadaire"
    elif period == 'monthly':
        start_date = now - timedelta(days=30)
        label = "Mensuel"
    else:
        start_date = now - timedelta(days=365)
        label = "Annuel"

    start_date_str = start_date.isoformat()
    end_date_str = now.isoformat()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transactions WHERE created_at >= ? ORDER BY id DESC", (start_date_str,))
    transactions = [dict(row) for row in cursor.fetchall()]

    ticket_count = 0
    ticket_amount = 0
    player_count = 0
    player_amount = 0
    session_count = 0
    session_amount = 0
    total_revenue = 0

    for tx in transactions:
        total_revenue += tx['amount']
        if tx['type'] == 'ticket_sale':
            ticket_count += 1
            ticket_amount += tx['amount']
        elif tx['type'] == 'player_recharge':
            player_count += 1
            player_amount += tx['amount']
        else:
            session_count += 1
            session_amount += tx['amount']

    cursor.execute("SELECT COUNT(*) FROM sessions WHERE start_time >= ?", (start_date_str,))
    total_sessions = cursor.fetchone()[0] or 0

    cursor.execute("""
        SELECT t.name, COUNT(s.id) as count, SUM(s.time_spent_seconds) as total_seconds
        FROM terminals t
        LEFT JOIN sessions s ON t.id = s.terminal_id AND s.start_time >= ?
        GROUP BY t.id
    """, (start_date_str,))
    terminals_usage = []
    for row in cursor.fetchall():
        term_dict = dict(row)
        term_dict['total_seconds'] = term_dict['total_seconds'] or 0
        terminals_usage.append(term_dict)

    conn.close()

    report = {
        'period_label': label,
        'start_date': start_date_str,
        'end_date': end_date_str,
        'total_sessions': total_sessions,
        'total_revenue': total_revenue,
        'breakdown': {
            'ticket_sale': {'count': ticket_count, 'amount': ticket_amount},
            'player_recharge': {'count': player_count, 'amount': player_amount},
            'session_payment': {'count': session_count, 'amount': session_amount}
        },
        'terminals_usage': terminals_usage,
        'recent_transactions': transactions
    }

    return render_template('reports_print.html', report=report, settings=get_settings())

if __name__ == '__main__':
    # --- CORRECTION CRITIQUE : Initialisation de la base de données au lancement ---
    init_db()
    # -----------------------------------------------------------------------------
    print("\n" + "="*60)
    print("      DEK-DRIVSIM CYBERCAFE - SERVEUR UNIFIÉ MOBILE  ")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
