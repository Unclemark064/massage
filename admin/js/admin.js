document.addEventListener('DOMContentLoaded', () => {

  // --- NAVIGATION LOGIC ---
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  const views = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active from all nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      // Add active to clicked item
      item.classList.add('active');

      // Hide all views
      views.forEach(view => view.classList.remove('active'));
      
      // Show target view
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');

      // Update Topbar Title
      pageTitle.textContent = item.textContent;
    });
  });


  // --- DUMMY DATA FOR BOOKINGS ---
  const bookingsData = [
    { id: '#1024', name: 'Michael T.', service: 'Nuru Massage (Special)', date: 'Aug 20, 2:00 PM', status: 'Pending' },
    { id: '#1023', name: 'Sarah W.', service: 'Energy Clearing Session', date: 'Aug 18, 10:30 AM', status: 'Confirmed' },
    { id: '#1022', name: 'David L.', service: 'Deep Tissue Massage', date: 'Aug 17, 4:00 PM', status: 'Confirmed' },
    { id: '#1021', name: 'Jessica R.', service: 'Couples Massage', date: 'Aug 16, 1:00 PM', status: 'Confirmed' },
    { id: '#1020', name: 'Anonymous', service: 'Ashiatsu Massage', date: 'Aug 15, 6:00 PM', status: 'Cancelled' },
  ];

  const bookingsBody = document.getElementById('bookings-table-body');
  if (bookingsBody) {
    bookingsData.forEach(b => {
      const statusClass = b.status.toLowerCase();
      bookingsBody.innerHTML += `
        <tr>
          <td style="color:var(--text-muted); font-size:0.8rem;">${b.id}</td>
          <td style="font-weight:500;">${b.name}</td>
          <td>${b.service}</td>
          <td>${b.date}</td>
          <td><span class="badge ${statusClass}">${b.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline">Edit</button>
          </td>
        </tr>
      `;
    });
  }

  // --- DUMMY DATA FOR SERVICES ---
  const servicesData = [
    { name: 'Energy Clearing Session', price: '$200.00', duration: '60 min', active: true },
    { name: 'Nuru Massage (Special)', price: '$250.00', duration: '60 min', active: true },
    { name: 'Couples Massage (Special)', price: '$350.00', duration: '60 min', active: true },
    { name: 'Aromatherapy Massage', price: '$200.00', duration: '60 min', active: true },
    { name: 'Swedish Massage', price: '$200.00', duration: '60 min', active: true },
    { name: 'Deep Tissue Massage', price: '$200.00', duration: '60 min', active: true },
  ];

  const servicesBody = document.getElementById('services-table-body');
  if (servicesBody) {
    servicesData.forEach(s => {
      const statusBadge = s.active ? '<span class="badge confirmed">Active</span>' : '<span class="badge cancelled">Inactive</span>';
      servicesBody.innerHTML += `
        <tr>
          <td style="font-weight:500;">${s.name}</td>
          <td>${s.price}</td>
          <td>${s.duration}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-outline">Edit</button>
          </td>
        </tr>
      `;
    });
  }

});
