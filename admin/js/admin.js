document.addEventListener('DOMContentLoaded', () => {

  // --- AUTH CHECK ---
  const token = localStorage.getItem('shelley_admin_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const API_HEADERS = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  async function apiFetch(endpoint, options = {}) {
    if (!options.headers) options.headers = API_HEADERS;
    const res = await fetch('../api/' + endpoint, options);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('shelley_admin_token');
        window.location.href = 'login.html';
      }
      throw new Error(data.error || 'API Error');
    }
    return data.data;
  }

  // --- NAVIGATION LOGIC ---
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  const views = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      views.forEach(view => view.classList.remove('active'));
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      pageTitle.textContent = item.textContent;

      // Load data based on view
      if (targetId === 'dashboard-view') loadStats();
      if (targetId === 'bookings-view') loadBookings();
      if (targetId === 'services-view') loadServices();
      if (targetId === 'settings-view') loadSettings();
    });
  });

  // --- INITIAL LOAD ---
  loadStats();
  loadBookingsRecent();

  // --- STATS VIEW ---
  async function loadStats() {
    try {
      const data = await apiFetch('stats.php');
      document.querySelector('#dashboard-view .stat-card:nth-child(1) .value').textContent = data.bookings.total;
      document.querySelector('#dashboard-view .stat-card:nth-child(2) .value').textContent = data.bookings.pending;
      document.querySelector('#dashboard-view .stat-card:nth-child(3) .value').textContent = '$' + data.revenue.this_month;
    } catch (e) { console.error(e); }
  }

  async function loadBookingsRecent() {
    try {
      const data = await apiFetch('stats.php');
      const tbody = document.querySelector('#dashboard-view table tbody');
      tbody.innerHTML = '';
      data.recent.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${b.name}</td>
          <td>${b.service}</td>
          <td>${b.date} ${b.time}</td>
          <td><span class="badge ${b.status}">${b.status}</span></td>
          <td><button class="btn btn-sm btn-outline">Review</button></td>
        `;
        tbody.appendChild(tr);
      });
    } catch(e) { console.error(e); }
  }

  // --- BOOKINGS VIEW ---
  async function loadBookings() {
    try {
      const data = await apiFetch('bookings.php');
      const tbody = document.getElementById('bookings-table-body');
      tbody.innerHTML = '';
      data.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--text-muted); font-size:0.8rem;">#${b.id}</td>
          <td style="font-weight:500;">${b.name}</td>
          <td>${b.service}</td>
          <td>${b.date} ${b.time}</td>
          <td>
            <select class="status-select" data-id="${b.id}" style="padding:4px; border-radius:4px;">
              <option value="pending" ${b.status==='pending'?'selected':''}>Pending</option>
              <option value="confirmed" ${b.status==='confirmed'?'selected':''}>Confirmed</option>
              <option value="cancelled" ${b.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="deleteBooking(${b.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const id = e.target.getAttribute('data-id');
          const newStatus = e.target.value;
          await apiFetch('bookings.php', { method: 'PUT', body: JSON.stringify({id, status: newStatus}) });
          loadStats(); // update dashboard numbers
        });
      });
    } catch(e) { console.error(e); }
  }

  window.deleteBooking = async function(id) {
    if(!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await apiFetch(`bookings.php?id=${id}`, { method: 'DELETE' });
      loadBookings();
    } catch(e) { alert(e.message); }
  };

  // --- SERVICES VIEW ---
  async function loadServices() {
    try {
      const data = await apiFetch('services.php?admin=1');
      const tbody = document.getElementById('services-table-body');
      tbody.innerHTML = '';
      data.forEach(s => {
        const statusBadge = s.active ? '<span class="badge confirmed">Active</span>' : '<span class="badge cancelled">Inactive</span>';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:500;">${s.name}</td>
          <td>$${s.price}</td>
          <td>${s.duration} min</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="toggleService(${s.id}, ${s.active})">Toggle</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch(e) { console.error(e); }
  }

  window.toggleService = async function(id, currentActive) {
    try {
      await apiFetch('services.php', {
        method: 'PUT',
        body: JSON.stringify({id, active: currentActive ? 0 : 1})
      });
      loadServices();
    } catch(e) { alert(e.message); }
  };

  // --- SETTINGS VIEW ---
  async function loadSettings() {
    try {
      const data = await apiFetch('settings.php');
      document.getElementById('set-email').value = data.contact_email || '';
      document.getElementById('set-deposit').value = data.deposit || '100';
    } catch(e) { console.error(e); }
  }

  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('set-email').value;
    const deposit = document.getElementById('set-deposit').value;
    try {
      await apiFetch('settings.php', {
        method: 'PUT',
        body: JSON.stringify({ contact_email: email, deposit: deposit })
      });
      alert('Settings saved successfully!');
    } catch(e) { alert(e.message); }
  });

  // Logout hook
  window.logout = function() {
    localStorage.removeItem('shelley_admin_token');
    window.location.href = 'login.html';
  };
});
