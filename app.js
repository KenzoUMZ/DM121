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
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  installBtn.hidden = true;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});

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
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
  if (id) {
    await updateItem(id, { title, details });
  } else {
    await addItem({ title, details });
  }
  form.reset();
  idInput.value = '';
  cancelEditBtn.hidden = true;
  await render();
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
    await render();
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
