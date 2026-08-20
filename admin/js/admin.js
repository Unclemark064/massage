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
      if (targetId === 'payments-view') loadPayments();
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
        const proofLink = b.screenshot 
          ? `<a href="../api/uploads/${b.screenshot}" target="_blank" style="color:var(--color-gray); text-decoration:underline;">View Proof</a>` 
          : 'None';
          
        const statusBadge = `<span class="badge ${b.status}">${b.status}</span>`;
        
        let actionButtons = '';
        if (b.status === 'pending') {
          actionButtons = `
            <button class="btn btn-sm btn-outline" style="color:#047857; border-color:#047857;" onclick="updateBookingStatus(${b.id}, 'confirmed')">Approve</button>
            <button class="btn btn-sm btn-outline" style="color:#be123c; border-color:#be123c; margin-left:4px;" onclick="updateBookingStatus(${b.id}, 'cancelled')">Decline</button>
          `;
        } else {
          actionButtons = `<button class="btn btn-sm btn-outline" onclick="deleteBooking(${b.id})">Delete</button>`;
        }
          
        tr.innerHTML = `
          <td style="color:var(--color-gray); font-size:0.8rem;">#${b.id}</td>
          <td style="font-weight:500;">${b.name}</td>
          <td>${b.service}</td>
          <td>${b.date} ${b.time}</td>
          <td>${proofLink}</td>
          <td>${statusBadge}</td>
          <td>${actionButtons}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch(e) { console.error(e); }
  }

  window.updateBookingStatus = async function(id, newStatus) {
    const action = newStatus === 'confirmed' ? 'Approve' : 'Decline';
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;
    
    try {
      await apiFetch('bookings.php', { method: 'PUT', body: JSON.stringify({id, status: newStatus}) });
      alert(`Booking has been ${newStatus}. ${newStatus === 'confirmed' ? 'A confirmation email was sent to the client.' : ''}`);
      loadBookings();
      loadStats();
    } catch(e) { alert(e.message); }
  };

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
            <button class="btn btn-sm btn-outline" onclick='openServiceModal(${JSON.stringify(s).replace(/'/g, "&apos;")})'>Edit</button>
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

  // --- PAYMENTS VIEW ---
  async function loadPayments() {
    try {
      const data = await apiFetch('payment_methods.php?admin=1');
      const tbody = document.getElementById('payments-table-body');
      tbody.innerHTML = '';
      data.forEach(p => {
        const statusBadge = p.active ? '<span class="badge confirmed">Active</span>' : '<span class="badge cancelled">Inactive</span>';
        const hasBank = p.bank_name || p.account_number ? `Bank: ${p.bank_name} <br> Acc: ${p.account_number}` : 'N/A';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:500;">${p.name}</td>
          <td>${p.details || 'N/A'}</td>
          <td style="font-size:0.8rem; color:var(--color-gray);">${hasBank}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="togglePayment(${p.id}, ${p.active})">Toggle</button>
            <button class="btn btn-sm btn-outline" onclick='openPaymentModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Edit</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch(e) { console.error(e); }
  }

  window.togglePayment = async function(id, currentActive) {
    try {
      await apiFetch('payment_methods.php', {
        method: 'PUT',
        body: JSON.stringify({id, active: currentActive ? 0 : 1})
      });
      loadPayments();
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

  // --- MODALS LOGIC ---
  window.closeModals = () => {
    document.getElementById('service-modal').classList.remove('active');
    document.getElementById('payment-modal').classList.remove('active');
  };

  window.openServiceModal = (s = null) => {
    document.getElementById('service-modal-title').textContent = s ? 'Edit Service' : 'Add Service';
    document.getElementById('service-id').value = s ? s.id : '';
    document.getElementById('service-name').value = s ? s.name : '';
    document.getElementById('service-desc').value = s ? s.description : '';
    document.getElementById('service-price').value = s ? s.price : '';
    document.getElementById('service-duration').value = s ? s.duration : '60';
    document.getElementById('service-modal').classList.add('active');
  };

  window.openPaymentModal = (p = null) => {
    document.getElementById('payment-modal-title').textContent = p ? 'Edit Payment Method' : 'Add Payment Method';
    document.getElementById('payment-id').value = p ? p.id : '';
    document.getElementById('payment-name').value = p ? p.name : '';
    document.getElementById('payment-details').value = p ? p.details : '';
    document.getElementById('payment-bank').value = p ? p.bank_name : '';
    document.getElementById('payment-acc-name').value = p ? p.account_name : '';
    document.getElementById('payment-acc-num').value = p ? p.account_number : '';
    document.getElementById('payment-routing').value = p ? p.routing_number : '';
    document.getElementById('payment-modal').classList.add('active');
  };

  document.getElementById('service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-id').value;
    const body = {
      name: document.getElementById('service-name').value,
      description: document.getElementById('service-desc').value,
      price: document.getElementById('service-price').value,
      duration: document.getElementById('service-duration').value
    };
    if (id) body.id = id;

    try {
      await apiFetch('services.php', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      closeModals();
      loadServices();
    } catch(err) { alert(err.message); }
  });

  document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('payment-id').value;
    const body = {
      name: document.getElementById('payment-name').value,
      details: document.getElementById('payment-details').value,
      bank_name: document.getElementById('payment-bank').value,
      account_name: document.getElementById('payment-acc-name').value,
      account_number: document.getElementById('payment-acc-num').value,
      routing_number: document.getElementById('payment-routing').value
    };
    if (id) body.id = id;

    try {
      await apiFetch('payment_methods.php', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      closeModals();
      loadPayments();
    } catch(err) { alert(err.message); }
  });

});
