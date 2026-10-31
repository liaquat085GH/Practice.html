"""
Horizon Institute of Technology - Flask backend
-----------------------------------------------
Serves the static site and provides two JSON APIs:
  POST /api/apply   -> validates & stores an admission application (SQLite)
  GET  /api/result  -> looks up a student's (dummy) result by roll number

Run:
    pip install -r requirements.txt
    python app.py            # development  -> http://127.0.0.1:5000
    gunicorn app:app         # production
"""
import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory, abort

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "applications.db")

# Only these files are ever served (keeps app.py, the database, etc. private)
PUBLIC_FILES = {
    "index.html", "about.html", "admissions.html", "students.html",
    "style.css", "main.js",
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024  # 16 KB request limit

PROGRAMS = {
    "IT Course": {"Web Development", "Python & AI Basics", "Graphic Design",
                  "Computer Networking (CCNA)", "Cyber Security Essentials", "Digital Marketing"},
    "DAE": {"DAE Electrical", "DAE Electronics", "DAE Computer Information Technology", "DAE Mechanical"},
    "Intermediate": {"FSc Pre-Engineering", "FSc Pre-Medical", "ICS (Computer Science)", "I.Com (Commerce)"},
}

# Dummy result data for the demo portal
RESULTS = {
    "HIT-1001": {"name": "Ayesha Khan", "program": "FSc Pre-Engineering", "percentage": 92.4, "grade": "A+", "status": "Pass"},
    "HIT-1002": {"name": "Sana Fatima", "program": "FSc Pre-Medical", "percentage": 90.8, "grade": "A+", "status": "Pass"},
    "HIT-1003": {"name": "Usman Tariq", "program": "DAE Electrical", "percentage": 88.5, "grade": "A", "status": "Pass"},
    "HIT-1004": {"name": "Bilal Hussain", "program": "DAE Computer IT", "percentage": 87.2, "grade": "A", "status": "Pass"},
    "HIT-1005": {"name": "Hamza Ali", "program": "Web Development", "percentage": 96.0, "grade": "A+", "status": "Pass"},
    "HIT-1006": {"name": "Rabia Zafar", "program": "ICS", "percentage": 89.6, "grade": "A", "status": "Pass"},
}

PHONE_RE = re.compile(r"^(\+92|0)?3\d{2}[- ]?\d{7}$")
EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as db:
        db.execute(
            """CREATE TABLE IF NOT EXISTS applications (
                   id TEXT PRIMARY KEY,
                   created_at TEXT NOT NULL,
                   full_name TEXT NOT NULL,
                   father_name TEXT NOT NULL,
                   phone TEXT NOT NULL,
                   email TEXT,
                   dob TEXT NOT NULL,
                   last_class TEXT NOT NULL,
                   program TEXT NOT NULL,
                   course TEXT NOT NULL,
                   notes TEXT
               )"""
        )


# ------------------------------ Pages ------------------------------
@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    if filename not in PUBLIC_FILES:
        abort(404)
    return send_from_directory(BASE_DIR, filename)


# ------------------------------- APIs ------------------------------
@app.post("/api/apply")
def apply():
    data = request.get_json(silent=True) or {}
    clean = lambda k, n=200: str(data.get(k, "")).strip()[:n]

    full_name, father_name = clean("fullName"), clean("fatherName")
    phone, email = clean("phone", 20), clean("email")
    dob, last_class = clean("dob", 10), clean("lastClass")
    program, course = clean("program"), clean("course")
    notes = clean("notes", 500)

    errors = []
    if len(full_name) < 3: errors.append("Full name is required.")
    if len(father_name) < 3: errors.append("Father's name is required.")
    if not PHONE_RE.match(phone): errors.append("Valid mobile number is required.")
    if email and not EMAIL_RE.match(email): errors.append("Email address is invalid.")
    if not dob: errors.append("Date of birth is required.")
    if not last_class: errors.append("Last qualification is required.")
    if program not in PROGRAMS or course not in PROGRAMS.get(program, set()):
        errors.append("Please select a valid program and course.")
    if errors:
        return jsonify(error=" ".join(errors)), 400

    app_id = "APP-" + uuid.uuid4().hex[:8].upper()
    with get_db() as db:
        db.execute(
            "INSERT INTO applications VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (app_id, datetime.now(timezone.utc).isoformat(), full_name, father_name,
             phone, email, dob, last_class, program, course, notes),
        )
    return jsonify(application_id=app_id), 201


@app.get("/api/result")
def result():
    roll = request.args.get("roll", "").strip().upper()
    record = RESULTS.get(roll)
    if not record:
        return jsonify(error="Not found"), 404
    return jsonify(record)


@app.after_request
def security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "SAMEORIGIN"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp


init_db()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", port=int(os.environ.get("PORT", 5000)))
