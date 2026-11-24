/* Kesho — local-first personal budget. No bank links, no account, no keys. */
const KEY = 'kesho:budget:v1';
const EXPENSE_CATS = ['Groceries', 'Transport', 'Rent', 'Utilities', 'Eating out', 'Airtime', 'Health', 'Other'];
const INCOME_CATS = ['Salary', 'Freelance', 'Business', 'Gift', 'Other'];
const monthKey = d => d.slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = today().slice(0, 7);
const money = n => 'KES ' + Math.round(n).toLocaleString('en-KE');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); };

function starter() {
  const y = thisMonth;
  const d = n => `${y}-${String(n).padStart(2, '0')}`;
  return {
    type: 'expense',
    budgets: { Groceries: 12000, Transport: 5000, Rent: 25000, Utilities: 4000, 'Eating out': 6000 },
    transactions: [
      { id: 1, type: 'income', category: 'Salary', amount: 85000, date: d(1), note: 'Monthly salary' },
      { id: 2, type: 'expense', category: 'Rent', amount: 25000, date: d(2), note: 'House rent' },
      { id: 3, type: 'expense', category: 'Groceries', amount: 4350, date: d(4), note: 'Weekly shop' },
      { id: 4, type: 'expense', category: 'Transport', amount: 1200, date: d(5), note: 'Matatu + fuel' },
      { id: 5, type: 'expense', category: 'Utilities', amount: 2400, date: d(7), note: 'Electricity + water' },
      { id: 6, type: 'expense', category: 'Eating out', amount: 1850, date: d(9), note: 'Team lunch' },
      { id: 7, type: 'income', category: 'Freelance', amount: 15000, date: d(12), note: 'Side project' },
      { id: 8, type: 'expense', category: 'Groceries', amount: 5200, date: d(15), note: 'Groceries + supplies' },
    ],
  };
}
let state = load();
function load() {
  try { const raw = JSON.parse(localStorage.getItem(KEY)); if (raw && Array.isArray(raw.transactions)) return { ...starter(), ...raw }; } catch (_) {}
  return starter();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
function monthTx(m = thisMonth) { return state.transactions.filter(t => monthKey(t.date) === m); }
function sum(list, type) { return list.filter(t => t.type === type).reduce((n, t) => n + Number(t.amount), 0); }
function monthName(m) { return new Date(m + '-01').toLocaleString('en-KE', { month: 'short' }); }

function render() {
  const tx = monthTx();
  const income = sum(tx, 'income'), expense = sum(tx, 'expense'), net = income - expense;
  const rate = income ? Math.round(net / income * 100) : 0;
  document.getElementById('monthLabel').textContent = new Date(thisMonth + '-01').toLocaleString('en-KE', { month: 'long', year: 'numeric' });
  document.getElementById('stats').innerHTML = [
    ['Balance this month', money(net), net >= 0 ? 'Healthy' : 'Over budget'],
    ['Income', money(income), `${tx.filter(t => t.type === 'income').length} entries`],
    ['Spending', money(expense), `${tx.filter(t => t.type === 'expense').length} entries`],
    ['Savings rate', rate + '%', income ? 'Of income retained' : 'No income logged'],
  ].map(([l, v, h]) => `<div class="stat"><div class="label">${l}</div><div class="value">${v}</div><div class="hint">${h}</div></div>`).join('');
  renderEnvelopes(tx);
  renderTrend();
  renderTransactions();
  save();
}

function renderEnvelopes(tx) {
  const spent = {};
  tx.filter(t => t.type === 'expense').forEach(t => { spent[t.category] = (spent[t.category] || 0) + Number(t.amount); });
  const cats = [...new Set([...Object.keys(state.budgets), ...Object.keys(spent)])].filter(c => state.budgets[c] || spent[c]);
  document.getElementById('envMonth').textContent = monthName(thisMonth);
  document.getElementById('envelopes').innerHTML = cats.length ? cats.map(c => {
    const limit = Number(state.budgets[c]) || 0;
    const used = spent[c] || 0;
    const pct = limit ? Math.round(used / limit * 100) : 100;
    const cls = pct > 100 ? 'over' : pct > 80 ? 'near' : '';
    return `<div class="env"><div class="env-top"><span>${esc(c)}</span><strong>${money(used)} ${limit ? `/ ${money(limit)}` : ''}</strong></div><div class="track"><div class="fill ${cls}" style="width:${Math.min(100, pct)}%"></div></div><div class="muted">${limit ? pct + '% of envelope' : 'No limit set'}</div></div>`;
  }).join('') : '<p class="muted">No envelopes yet — add a transaction or edit limits.</p>';
}

function renderTrend() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const data = months.map(m => [m, sum(monthTx(m), 'income'), sum(monthTx(m), 'expense')]);
  const max = Math.max(1, ...data.flatMap(x => [x[1], x[2]]));
  document.getElementById('trend').innerHTML = data.map(([m, inc, exp]) => `<div class="month"><div class="bars"><div class="bar income" style="height:${Math.max(2, inc / max * 140)}px" title="Income ${money(inc)}"></div><div class="bar expense" style="height:${Math.max(2, exp / max * 140)}px" title="Spending ${money(exp)}"></div></div><span class="mlabel">${monthName(m)}</span></div>`).join('');
}

function renderTransactions() {
  const q = (document.getElementById('search').value || '').toLowerCase().trim();
  const ft = document.getElementById('filterType').value;
  const list = state.transactions.filter(t => (!q || `${t.note} ${t.category}`.toLowerCase().includes(q)) && (ft === 'all' || t.type === ft))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 100);
  document.getElementById('txInfo').textContent = `${list.length} shown · ${state.transactions.length} total`;
  document.getElementById('transactions').innerHTML = list.length ? list.map(t => `<div class="tx">
    <div class="ico">${t.type === 'income' ? '↙' : '↗'}</div>
    <div><strong>${esc(t.note || t.category)}</strong><small>${esc(t.category)} · ${esc(t.date)}</small></div>
    <div class="date muted">${esc(monthName(monthKey(t.date)))}</div>
    <div class="amount ${t.type === 'income' ? 'in' : 'out'}">${t.type === 'income' ? '+' : '−'}${money(t.amount).replace('KES ', '')}</div>
    <button class="del" data-del="${t.id}" title="Delete">×</button>
  </div>`).join('') : '<p class="muted" style="padding:16px">No transactions match.</p>';
}

function setFormType(type) {
  state.type = type;
  document.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  document.getElementById('category').innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('kesho:dark') === 'true') document.body.classList.add('dark');
  document.getElementById('date').value = today();
  setFormType(state.type || 'expense');
  render();

  document.querySelectorAll('.seg').forEach(b => b.addEventListener('click', () => setFormType(b.dataset.type)));
  document.getElementById('txForm').addEventListener('submit', e => {
    e.preventDefault();
    const amount = Number(document.getElementById('amount').value);
    if (!amount || amount <= 0) return;
    state.transactions.push({
      id: Date.now(), type: state.type, category: document.getElementById('category').value,
      amount, date: document.getElementById('date').value || today(),
      note: document.getElementById('note').value.trim(),
    });
    e.target.reset(); document.getElementById('date').value = today(); setFormType(state.type);
    render(); toast('Transaction added');
  });
  document.getElementById('transactions').addEventListener('click', e => {
    const del = e.target.closest('[data-del]'); if (!del) return;
    state.transactions = state.transactions.filter(t => t.id !== Number(del.dataset.del));
    render(); toast('Transaction removed');
  });
  ['search', 'filterType'].forEach(id => document.getElementById(id).addEventListener('input', renderTransactions));
  document.getElementById('editBudgets').addEventListener('click', () => {
    const text = Object.entries(state.budgets).map(([k, v]) => `${k}=${v}`).join('\n');
    const answer = prompt('One envelope per line: Category=monthly limit', text);
    if (answer === null) return;
    const next = {};
    answer.split('\n').forEach(line => {
      const [cat, val] = line.split('=').map(s => (s || '').trim());
      if (cat && Number(val) >= 0) next[cat] = Number(val);
    });
    state.budgets = next; render(); toast('Envelope limits updated');
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const rows = [['Date', 'Type', 'Category', 'Amount KES', 'Note'], ...state.transactions.map(t => [t.date, t.type, t.category, t.amount, t.note])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `kesho-${thisMonth}.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast('Ledger exported');
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Replace everything with the demo budget?')) return;
    state = starter(); setFormType('expense'); render(); toast('Demo budget restored');
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('kesho:dark', document.body.classList.contains('dark'));
  });
});
