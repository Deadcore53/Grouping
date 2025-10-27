// Simple local e-wallet (frontend-only)
// Data persisted in localStorage under key: 'local-ewallet-db'

const DB_KEY = 'local-ewallet-db';

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seed = { users: {}, transactions: [], sessions: { currentUser: null } };
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); }
  catch (e) { console.error('DB parse error', e); localStorage.removeItem(DB_KEY); return loadDB(); }
}

function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
let DB = loadDB();

// UI references
const authSection = document.getElementById('authSection');
const walletSection = document.getElementById('walletSection');
const usersListEl = document.getElementById('usersList');
const headerUserEl = document.getElementById('headerUser');
const userNameEl = document.getElementById('userName');
const userIdEl = document.getElementById('userId');
const balanceEl = document.getElementById('balance');
const txListEl = document.getElementById('txList');

document.getElementById('createBtn').addEventListener('click', createAccount);
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('topupBtn').addEventListener('click', topUp);
document.getElementById('sendBtn').addEventListener('click', sendFunds);
document.getElementById('exportCsv').addEventListener('click', exportCsv);

function refreshUI() {
  DB = loadDB();
  renderUsers();
  const uid = DB.sessions.currentUser;
  if (uid && DB.users[uid]) {
    // show wallet
    authSection.classList.add('hidden');
    walletSection.classList.remove('hidden');
    headerUserEl.textContent = `Signed in: ${DB.users[uid].name}`;
    userNameEl.textContent = DB.users[uid].name;
    userIdEl.textContent = uid;
    balanceEl.textContent = `₱${Number(DB.users[uid].balance).toFixed(2)}`;
    renderTxForUser(uid);
  } else {
    authSection.classList.remove('hidden');
    walletSection.classList.add('hidden');
    headerUserEl.textContent = '';
  }
}

function renderUsers() {
  usersListEl.innerHTML = '';
  const users = Object.entries(DB.users);
  if (users.length === 0) {
    usersListEl.innerHTML = `<div class="muted">No local accounts yet</div>`;
    return;
  }
  users.forEach(([id, u]) => {
    const el = document.createElement('div');
    el.className = 'user-card';
    el.innerHTML = `<div>
      <div style="font-weight:600">${u.name}</div>
      <div class="small muted">id: ${id}</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700">₱${Number(u.balance).toFixed(2)}</div>
      <div class="small muted">${u.txCount || 0} tx</div>
    </div>`;
    usersListEl.appendChild(el);
  });
}

function createAccount() {
  const name = document.getElementById('createName').value.trim();
  const id = document.getElementById('createId').value.trim();
  if (!name || !id) { alert('Fill name and user id'); return; }
  if (DB.users[id]) { alert('User id already exists'); return; }
  DB.users[id] = { name, balance: 0, txCount: 0 };
  DB.transactions = DB.transactions || [];
  saveDB(DB);
  document.getElementById('createName').value = '';
  document.getElementById('createId').value = '';
  refreshUI();
}

function login() {
  const id = document.getElementById('loginId').value.trim();
  if (!id) { alert('Enter user id'); return; }
  if (!DB.users[id]) { alert('User not found'); return; }
  DB.sessions.currentUser = id;
  saveDB(DB);
  document.getElementById('loginId').value = '';
  refreshUI();
}

function logout() {
  DB.sessions.currentUser = null;
  saveDB(DB);
  refreshUI();
}

function topUp() {
  const v = Number(document.getElementById('topupAmount').value);
  if (!v || v <= 0) { alert('Enter a positive amount'); return; }
  const uid = DB.sessions.currentUser;
  if (!uid) return;
  DB.users[uid].balance = Number(DB.users[uid].balance) + v;
  recordTx({ type: 'topup', user: uid, amount: v, time: new Date().toISOString() });
  saveDB(DB);
  document.getElementById('topupAmount').value = '';
  refreshUI();
}

function sendFunds() {
  const to = document.getElementById('sendToId').value.trim();
  const amt = Number(document.getElementById('sendAmount').value);
  const from = DB.sessions.currentUser;
  if (!from) return alert('Not signed in');
  if (!to || !DB.users[to]) return alert('Recipient not found');
  if (!amt || amt <= 0) return alert('Enter positive amount');
  if (DB.users[from].balance < amt) return alert('Insufficient funds');

  DB.users[from].balance = Number(DB.users[from].balance) - amt;
  DB.users[to].balance = Number(DB.users[to].balance) + amt;

  recordTx({ type: 'send', from, to, amount: amt, time: new Date().toISOString() });
  saveDB(DB);

  document.getElementById('sendToId').value = '';
  document.getElementById('sendAmount').value = '';
  refreshUI();
}

function recordTx(tx) {
  DB.transactions = DB.transactions || [];
  DB.transactions.unshift(tx); // newest first
  // increment tx counts per user if relevant
  if (tx.user) DB.users[tx.user].txCount = (DB.users[tx.user].txCount || 0) + 1;
  if (tx.from) DB.users[tx.from].txCount = (DB.users[tx.from].txCount || 0) + 1;
  if (tx.to) DB.users[tx.to].txCount = (DB.users[tx.to].txCount || 0) + 1;
}

function renderTxForUser(uid) {
  const txs = (DB.transactions || []).filter(t => {
    // include txs where user is involved
    return t.user === uid || t.from === uid || t.to === uid;
  });
  if (txs.length === 0) {
    txListEl.innerHTML = `<div class="muted">No transactions yet</div>`;
    return;
  }
  txListEl.innerHTML = '';
  txs.forEach(t => {
    const row = document.createElement('div');
    row.className = 'tx-item';
    const left = document.createElement('div');
    const right = document.createElement('div');

    const time = new Date(t.time).toLocaleString();
    if (t.type === 'topup') {
      left.innerHTML = `<div><strong>Top-up</strong></div><div class="small muted">${time}</div>`;
      right.innerHTML = `₱${Number(t.amount).toFixed(2)}`;
    } else if (t.type === 'send') {
      left.innerHTML = `<div><strong>Send</strong> to ${t.to}</div><div class="small muted">${time}</div>`;
      right.innerHTML = `-₱${Number(t.amount).toFixed(2)}`;
    } else {
      left.innerText = JSON.stringify(t);
      right.innerText = '';
    }

    row.appendChild(left);
    row.appendChild(right);
    txListEl.appendChild(row);
  });
}

function exportCsv() {
  const uid = DB.sessions.currentUser;
  if (!uid) return alert('Sign in first');
  const rows = [['type','from','to','user','amount','time']];
  (DB.transactions || []).forEach(t => {
    // export all txs but only those involving user are relevant
    rows.push([t.type || '', t.from || '', t.to || '', t.user || '', t.amount || '', t.time || '']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ewallet_transactions_${uid}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// initial render
refreshUI();
