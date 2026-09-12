# CampusEats — Flask + SQLite/MySQL + Bootstrap 5 + JavaScript Web Application

Complete implementation of the Campus Smart Canteen Pre-Order & Real-Time Token System built with the requested tech stack:
- **Backend**: Python Flask 3.x
- **Database**: SQLite (built-in, zero-config) / MySQL compatible
- **Frontend**: HTML5, CSS3, Bootstrap 5.3, Vanilla JavaScript (ES6)
- **Audio & Accessibility**: Web Speech API for automated token calling

---

## Project Structure

```
flask_canteen_app/
├── app.py                  # Main Flask application & REST API routes
├── models.py               # SQLite schema definition, relations, & auto-seeder
├── requirements.txt        # Python package dependencies
├── templates/              # Jinja2 HTML5 Bootstrap templates
│   ├── base.html           # Core layout, top live ticker, navigation & modals
│   ├── index.html          # Student ordering view, category filters & token queue
│   ├── kitchen.html        # Kitchen Display System (KDS) ticket management
│   ├── counter.html        # Counter dispatch & speech token calling
│   └── admin.html          # Admin catalog manager & revenue metrics
└── static/
    ├── css/
    │   └── custom.css      # Typography & custom badge styling
    └── js/
        └── main.js         # Cart state, API fetch calls & speech announcement
```

---

## Quickstart Guide

### 1. Prerequisites
Ensure you have Python 3.8+ installed on your system:
```bash
python3 --version
```

### 2. Install Dependencies
Navigate to the directory and install dependencies:
```bash
cd flask_canteen_app
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
The server will automatically initialize `canteen.db` with default campus canteens, menu items, and seed data.
Open your browser and visit:
```
http://127.0.0.1:5000
```

---

## Switching to MySQL (Optional)
If you wish to use MySQL instead of SQLite:
1. Install MySQL driver: `pip install mysql-connector-python`
2. In `models.py`, replace `sqlite3.connect('canteen.db')` with:
```python
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="your_username",
        password="your_password",
        database="canteen_db"
    )
```
3. Run `python app.py` to auto-create tables and seed data.
