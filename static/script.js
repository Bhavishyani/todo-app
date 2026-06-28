/**
 * script.js  –  To‑Do List front‑end logic
 *
 * Responsibilities:
 *  • Fetch tasks from Flask API on load
 *  • Render task list (respecting active filter)
 *  • Add / toggle / edit / delete individual tasks
 *  • Bulk‑clear completed tasks
 *  • Update the stats strip and show toast notifications
 */

/* ── State ──────────────────────────────────────────────────────────────── */
let todos       = [];          // Master array (all tasks from the server)
let activeFilter = 'all';      // 'all' | 'active' | 'completed'

/* ── DOM refs ───────────────────────────────────────────────────────────── */
const taskList        = document.getElementById('taskList');
const newTaskInput    = document.getElementById('newTaskInput');
const addTaskBtn      = document.getElementById('addTaskBtn');
const inputError      = document.getElementById('inputError');
const taskCount       = document.getElementById('taskCount');
const clearCompleted  = document.getElementById('clearCompletedBtn');
const emptyState      = document.getElementById('emptyState');
const loadingSpinner  = document.getElementById('loadingSpinner');
const editModal       = new bootstrap.Modal(document.getElementById('editModal'));
const editTaskId      = document.getElementById('editTaskId');
const editTaskInput   = document.getElementById('editTaskInput');
const editError       = document.getElementById('editError');
const saveEditBtn     = document.getElementById('saveEditBtn');
const toastEl         = document.getElementById('appToast');
const toastMsg        = document.getElementById('toastMessage');
const appToast        = new bootstrap.Toast(toastEl, { delay: 2500 });
const filterBtns      = document.querySelectorAll('#filterTabs .nav-link');

/* ── API helpers ────────────────────────────────────────────────────────── */

/** Fetch all todos from the server and re‑render. */
async function loadTodos() {
  showLoading(true);
  try {
    const res  = await fetch('/api/todos');
    todos      = await res.json();
    render();
  } catch (err) {
    showToast('Failed to load tasks.', 'danger');
    console.error(err);
  } finally {
    showLoading(false);
  }
}

/** POST a new todo to the server. */
async function addTodo(title) {
  const res  = await fetch('/api/todos', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** PUT updated fields for a todo. */
async function updateTodo(id, fields) {
  const res = await fetch(`/api/todos/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(fields)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** DELETE a single todo. */
async function deleteTodo(id) {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

/** DELETE all completed todos. */
async function clearCompletedTodos() {
  const res = await fetch('/api/todos/completed', { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

/* ── Rendering ──────────────────────────────────────────────────────────── */

/** Re‑render the visible task list based on the active filter. */
function render() {
  const visible = todos.filter(t => {
    if (activeFilter === 'active')    return !t.completed;
    if (activeFilter === 'completed') return  t.completed;
    return true;
  });

  taskList.innerHTML = '';

  if (visible.length === 0) {
    emptyState.classList.remove('d-none');
  } else {
    emptyState.classList.add('d-none');
    visible.forEach(todo => taskList.appendChild(buildTaskEl(todo)));
  }

  updateStats();
}

/** Create a task card DOM element. */
function buildTaskEl(todo) {
  const item = document.createElement('div');
  item.className = `task-item${todo.completed ? ' completed' : ''}`;
  item.dataset.id = todo.id;

  item.innerHTML = `
    <input
      type="checkbox"
      class="task-checkbox"
      aria-label="Mark as ${todo.completed ? 'active' : 'completed'}"
      ${todo.completed ? 'checked' : ''}
    />
    <span class="task-title">${escapeHtml(todo.title)}</span>
    <div class="task-actions">
      <button class="btn-icon btn-edit" title="Edit task" aria-label="Edit task">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn-icon btn-delete" title="Delete task" aria-label="Delete task">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  /* Toggle completed on checkbox change */
  item.querySelector('.task-checkbox').addEventListener('change', () => {
    handleToggle(todo.id, !todo.completed);
  });

  /* Edit button */
  item.querySelector('.btn-edit').addEventListener('click', () => {
    openEditModal(todo);
  });

  /* Delete button */
  item.querySelector('.btn-delete').addEventListener('click', () => {
    handleDelete(todo.id);
  });

  return item;
}

/** Update the task‑count label and Clear Completed button visibility. */
function updateStats() {
  const active    = todos.filter(t => !t.completed).length;
  const completed = todos.filter(t =>  t.completed).length;
  const total     = todos.length;

  taskCount.textContent = `${total} task${total !== 1 ? 's' : ''} · ${active} active`;

  if (completed > 0) {
    clearCompleted.classList.remove('d-none');
  } else {
    clearCompleted.classList.add('d-none');
  }
}

/* ── Event handlers ─────────────────────────────────────────────────────── */

/** Handle the Add button click / Enter key press. */
async function handleAdd() {
  const title = newTaskInput.value.trim();
  if (!title) {
    inputError.classList.remove('d-none');
    newTaskInput.focus();
    return;
  }
  inputError.classList.add('d-none');

  try {
    addTaskBtn.disabled = true;
    const created = await addTodo(title);
    todos.unshift(created);   // Prepend so it appears at the top
    newTaskInput.value = '';
    render();
    showToast('Task added!', 'success');
  } catch (err) {
    showToast('Failed to add task.', 'danger');
    console.error(err);
  } finally {
    addTaskBtn.disabled = false;
    newTaskInput.focus();
  }
}

/** Toggle a task's completed state. */
async function handleToggle(id, completed) {
  try {
    const updated = await updateTodo(id, { completed });
    const idx = todos.findIndex(t => t.id === id);
    if (idx !== -1) todos[idx] = updated;
    render();
    showToast(completed ? 'Task completed ✓' : 'Task reopened', 'success');
  } catch (err) {
    showToast('Could not update task.', 'danger');
    console.error(err);
    render();  // Revert visual state
  }
}

/** Open the edit modal pre‑filled with the task's current title. */
function openEditModal(todo) {
  editTaskId.value    = todo.id;
  editTaskInput.value = todo.title;
  editError.classList.add('d-none');
  editModal.show();
  // Focus the input after the modal animation completes
  document.getElementById('editModal').addEventListener(
    'shown.bs.modal',
    () => editTaskInput.focus(),
    { once: true }
  );
}

/** Save the edited task title. */
async function handleSaveEdit() {
  const id    = parseInt(editTaskId.value, 10);
  const title = editTaskInput.value.trim();

  if (!title) {
    editError.classList.remove('d-none');
    return;
  }
  editError.classList.add('d-none');

  try {
    saveEditBtn.disabled = true;
    const updated = await updateTodo(id, { title });
    const idx = todos.findIndex(t => t.id === id);
    if (idx !== -1) todos[idx] = updated;
    editModal.hide();
    render();
    showToast('Task updated!', 'success');
  } catch (err) {
    showToast('Could not save changes.', 'danger');
    console.error(err);
  } finally {
    saveEditBtn.disabled = false;
  }
}

/** Delete a task with a brief visual fade. */
async function handleDelete(id) {
  // Find and fade the element out before removing
  const el = taskList.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(20px)';
  }

  try {
    await deleteTodo(id);
    todos = todos.filter(t => t.id !== id);
    setTimeout(render, 200);      // Wait for fade animation
    showToast('Task deleted.', 'success');
  } catch (err) {
    showToast('Could not delete task.', 'danger');
    console.error(err);
    if (el) { el.style.opacity = '1'; el.style.transform = ''; }
  }
}

/** Bulk‑clear all completed tasks. */
async function handleClearCompleted() {
  try {
    await clearCompletedTodos();
    todos = todos.filter(t => !t.completed);
    render();
    showToast('Completed tasks cleared.', 'success');
  } catch (err) {
    showToast('Could not clear tasks.', 'danger');
    console.error(err);
  }
}

/* ── Filter tabs ────────────────────────────────────────────────────────── */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

/* ── Add task wiring ────────────────────────────────────────────────────── */
addTaskBtn.addEventListener('click', handleAdd);

newTaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});

// Hide validation error while typing
newTaskInput.addEventListener('input', () => {
  if (newTaskInput.value.trim()) inputError.classList.add('d-none');
});

/* ── Clear completed wiring ─────────────────────────────────────────────── */
clearCompleted.addEventListener('click', handleClearCompleted);

/* ── Save edit wiring ───────────────────────────────────────────────────── */
saveEditBtn.addEventListener('click', handleSaveEdit);

editTaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSaveEdit();
});

/* ── Toast helper ───────────────────────────────────────────────────────── */
function showToast(message, type = 'default') {
  toastMsg.textContent = message;
  toastEl.className    = 'toast align-items-center border-0';  // reset
  if (type === 'success') toastEl.classList.add('toast-success');
  if (type === 'danger')  toastEl.classList.add('toast-danger');
  appToast.show();
}

/* ── Loading helper ─────────────────────────────────────────────────────── */
function showLoading(show) {
  loadingSpinner.style.display = show ? 'block' : 'none';
}

/* ── Escape HTML to prevent XSS ─────────────────────────────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Bootstrap modal Enter‑key support ──────────────────────────────────── */
document.getElementById('editModal').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSaveEdit();
});

/* ── Bootstrap modal "Escape clears error" ──────────────────────────────── */
document.getElementById('editModal').addEventListener('hidden.bs.modal', () => {
  editError.classList.add('d-none');
});

/* ── Initial load ───────────────────────────────────────────────────────── */
loadTodos();
