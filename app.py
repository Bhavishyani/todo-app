"""
app.py - Flask backend for the To-Do List application
Handles all API endpoints and SQLite database operations
"""

from flask import Flask, request, jsonify, render_template
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "todos.db")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Open a database connection and return it with row_factory set."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Rows behave like dicts
    return conn


def init_db():
    """Create the todos table if it doesn't exist."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                title     TEXT    NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT   NOT NULL
            )
        """)
        conn.commit()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Serve the main single-page application."""
    return render_template("index.html")


# ---- GET all todos -------------------------------------------------------
@app.route("/api/todos", methods=["GET"])
def get_todos():
    """Return all todos, newest first."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM todos ORDER BY id DESC"
        ).fetchall()
    todos = [dict(row) for row in rows]
    # Convert 0/1 to bool for JSON
    for t in todos:
        t["completed"] = bool(t["completed"])
    return jsonify(todos)


# ---- POST create a todo --------------------------------------------------
@app.route("/api/todos", methods=["POST"])
def create_todo():
    """Create a new todo item."""
    data = request.get_json()
    title = (data or {}).get("title", "").strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400

    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO todos (title, completed, created_at) VALUES (?, 0, ?)",
            (title, created_at)
        )
        conn.commit()
        new_id = cursor.lastrowid

    return jsonify({
        "id": new_id,
        "title": title,
        "completed": False,
        "created_at": created_at
    }), 201


# ---- PUT update a todo ---------------------------------------------------
@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    """Update the title and/or completed status of a todo."""
    data = request.get_json() or {}

    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM todos WHERE id = ?", (todo_id,)
        ).fetchone()

        if not row:
            return jsonify({"error": "Todo not found"}), 404

        # Use existing values as fallback
        title = data.get("title", row["title"]).strip()
        completed = int(data.get("completed", bool(row["completed"])))

        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400

        conn.execute(
            "UPDATE todos SET title = ?, completed = ? WHERE id = ?",
            (title, completed, todo_id)
        )
        conn.commit()

    return jsonify({
        "id": todo_id,
        "title": title,
        "completed": bool(completed),
        "created_at": row["created_at"]
    })


# ---- DELETE a todo -------------------------------------------------------
@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    """Delete a single todo by ID."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM todos WHERE id = ?", (todo_id,)
        ).fetchone()

        if not row:
            return jsonify({"error": "Todo not found"}), 404

        conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
        conn.commit()

    return jsonify({"message": "Todo deleted successfully"})


# ---- DELETE completed todos ----------------------------------------------
@app.route("/api/todos/completed", methods=["DELETE"])
def delete_completed():
    """Bulk-delete all completed todos."""
    with get_db() as conn:
        conn.execute("DELETE FROM todos WHERE completed = 1")
        conn.commit()
    return jsonify({"message": "Completed todos cleared"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()                        # Ensure the DB is ready
    app.run(debug=True, port=5000)
