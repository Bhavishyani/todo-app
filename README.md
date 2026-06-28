# ✅ To-Do List App — Flask + SQLite

A clean, full-stack To-Do List web app built with **Python Flask**, **SQLite**, **Bootstrap 5**, and vanilla JavaScript.

---

## Project Structure

```
todo-app/
├── app.py              ← Flask backend & REST API
├── requirements.txt    ← Python dependencies
├── todos.db            ← SQLite database (auto-created on first run)
├── templates/
│   └── index.html      ← Main HTML page
└── static/
    ├── style.css       ← Custom blue & white theme
    └── script.js       ← Front-end CRUD logic
```

---

## Features

| Feature | Detail |
|---|---|
| ➕ Add tasks | Type a task and press **Add** or hit **Enter** |
| ✅ Complete tasks | Click the circle checkbox to toggle done/undone |
| ✏️ Edit tasks | Click the pencil icon; update in the modal |
| 🗑️ Delete tasks | Click the trash icon; animated removal |
| 🔍 Filter | Tabs: **All · Active · Completed** |
| 🧹 Clear completed | One-click bulk delete of finished tasks |
| 💾 Persistent storage | All tasks stored in SQLite (`todos.db`) |
| 📱 Responsive | Works on desktop and mobile |

---

## Setup & Run

### 1. Clone / download the project

```bash
cd todo-app
```

### 2. Create and activate a virtual environment (recommended)

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

Open your browser at **http://localhost:5000**

The SQLite database (`todos.db`) is created automatically on first run — no setup needed.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Fetch all todos |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/<id>` | Update title / completed |
| DELETE | `/api/todos/<id>` | Delete a single todo |
| DELETE | `/api/todos/completed` | Delete all completed todos |

---

## Tech Stack

- **Backend** — Python 3 · Flask 3
- **Database** — SQLite (via Python's built-in `sqlite3`)
- **Frontend** — HTML5 · CSS3 · Vanilla JS (ES2020)
- **UI Library** — Bootstrap 5.3 · Bootstrap Icons 1.11
