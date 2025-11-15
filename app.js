import { addItem, deleteItem, getItems, updateItem } from './db.js';

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

// Install prompt handling
let deferredPrompt;
const installBtn = document.getElementById('install-btn');
const installHelp = document.getElementById('install-help');
const installHelpClose = document.getElementById('install-help-close');

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
  installBtn.classList.add('hidden');
});

function updateInstallVisibility() {
  if (isStandalone()) {
    installBtn.classList.add('hidden');
  } else {
    installBtn.classList.remove('hidden');
  }
}

installBtn?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  } else {
    // Fallback: show help modal with instructions
    installHelp?.classList.remove('hidden');
  }
});

installHelpClose?.addEventListener('click', () => {
  installHelp?.classList.add('hidden');
});

updateInstallVisibility();

// Connection status
const conn = document.getElementById('connection-status');
function updateOnlineStatus() {
  const online = navigator.onLine;
  conn.textContent = online ? 'online' : 'offline';
  conn.style.background = online ? '#052e2b' : '#3f1d1d';
  conn.style.color = online ? '#34d399' : '#fca5a5';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// UI wiring
const form = document.getElementById('item-form');
const idInput = document.getElementById('item-id');
const titleInput = document.getElementById('title');
const detailsInput = document.getElementById('details');
const cancelEditBtn = document.getElementById('cancel-edit');
const list = document.getElementById('items');

function toLi(item) {
  const li = document.createElement('li');
  li.className = 'item';
  li.dataset.id = item.id;
  li.innerHTML = `
    <div class="meta">
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="details">${escapeHtml(item.details || '')}</div>
    </div>
    <div class="controls">
      <button class="btn" data-action="edit">Editar</button>
      <button class="btn" data-action="delete">Excluir</button>
    </div>
  `;
  return li;
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
}

function upsertLi(item) {
  const existing = list.querySelector(`li.item[data-id="${item.id}"]`);
  if (existing) {
    existing.querySelector('.title').textContent = item.title;
    existing.querySelector('.details').textContent = item.details || '';
    return existing;
  }
  const li = toLi(item);
  list.prepend(li);
  return li;
}

async function render() {
  const items = await getItems();
  list.innerHTML = '';
  items.forEach((it) => list.appendChild(toLi(it)));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const details = detailsInput.value.trim();
  if (!title) return;
  const id = idInput.value ? Number(idInput.value) : null;
  try {
    if (id) {
      const updated = await updateItem(id, { title, details });
      upsertLi(updated);
    } else {
      const created = await addItem({ title, details });
      upsertLi(created);
    }
  } catch (err) {
    console.error(err);
    // fallback to full render if something unexpected happens
    await render();
  }
  form.reset();
  idInput.value = '';
  cancelEditBtn.hidden = true;
});

cancelEditBtn.addEventListener('click', () => {
  form.reset();
  idInput.value = '';
  cancelEditBtn.hidden = true;
});

list.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('.item');
  const id = Number(li.dataset.id);
  const action = btn.dataset.action;
  if (action === 'delete') {
    await deleteItem(id);
    li.remove();
  } else if (action === 'edit') {
    // Simple fetch from DOM to prefill; could fetch from DB if needed
    const title = li.querySelector('.title').textContent;
    const details = li.querySelector('.details').textContent;
    idInput.value = String(id);
    titleInput.value = title;
    detailsInput.value = details;
    cancelEditBtn.hidden = false;
    titleInput.focus();
  }
});

render();
