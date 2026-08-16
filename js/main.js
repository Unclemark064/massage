document.addEventListener('DOMContentLoaded', () => {

  // ─── HEADER SCROLL EFFECT ─────────────────────────────────
  const header = document.querySelector('header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── MOBILE MENU ──────────────────────────────────────────
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu   = document.querySelector('.mobile-menu');
  const mobileLinks  = document.querySelectorAll('.mobile-menu a');

  const closeMenu = () => {
    mobileToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  mobileToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('active');
    mobileToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = isOpen ? 'auto' : 'hidden';
  });

  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // ─── HERO SLIDER ──────────────────────────────────────────
  const slides       = document.querySelectorAll('.slide');
  const dots         = document.querySelectorAll('.dot');
  let currentSlide   = 0;
  let autoSlide;

  const showSlide = (index) => {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
  };

  const nextSlide = () => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  };

  const startAuto = () => {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 5000);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentSlide = i;
      showSlide(i);
      startAuto();
    });
  });

  startAuto();

  // ─── GSAP ANIMATIONS ──────────────────────────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero headline
    gsap.to('.hero-content h1', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3,
    });

    // Hero sub-text + buttons stagger
    gsap.from('.hero-content .sub-text', {
      opacity: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      delay: 0.9,
    });

    gsap.from('.hero-btns', {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: 'power3.out',
      delay: 1.2,
    });

    // Scroll reveal — all .reveal-up elements
    document.querySelectorAll('.reveal-up').forEach((el) => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
      });
    });

    // Stagger service cards in each row
    document.querySelectorAll('.services-grid').forEach(grid => {
      const cards = grid.querySelectorAll('.service-card.reveal-up');
      gsap.to(cards, {
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
      });
    });

    // Stagger testimonial cards
    const testCards = document.querySelectorAll('.testimonial-card.reveal-up');
    gsap.to(testCards, {
      scrollTrigger: {
        trigger: '.testimonials-grid',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
    });

    // Service card image hover (GSAP for smooth control)
    document.querySelectorAll('.service-card').forEach(card => {
      const img = card.querySelector('img');
      if (!img) return;
      card.addEventListener('mouseenter', () =>
        gsap.to(img, { scale: 1.08, duration: 0.6, ease: 'power2.out' })
      );
      card.addEventListener('mouseleave', () =>
        gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out' })
      );
    });
  }

  // ─── BOOKING MODAL OPEN/CLOSE ─────────────────────────────
  const modal       = document.getElementById('booking-modal');
  const closeBtn    = document.querySelector('.close-modal');

  window.openBooking = (serviceName = '', price = 0) => {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    resetForm();
    if (serviceName) {
      const sel = document.getElementById('service_select');
      if (sel) sel.value = serviceName;
      updateSummary();
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // ─── MULTI-STEP FORM ──────────────────────────────────────
  const TOTAL_STEPS  = 4;
  let currentStep    = 1;

  const getStep = (n) => document.querySelector(`.form-step[data-step="${n}"]`);
  const getStepDot = (n) => document.querySelector(`.step-dot[data-step="${n}"]`);

  const setStep = (n) => {
    // hide old
    const oldStep = getStep(currentStep);
    if (oldStep) oldStep.classList.remove('active');
    const oldDot  = getStepDot(currentStep);
    if (oldDot) { oldDot.classList.remove('active'); oldDot.classList.add('done'); }

    currentStep = n;

    // show new
    const newStep = getStep(n);
    if (newStep) newStep.classList.add('active');

    // update progress dots
    document.querySelectorAll('.step-dot').forEach(dot => {
      const s = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'done');
      if (s === n)    dot.classList.add('active');
      else if (s < n) dot.classList.add('done');
    });

    if (n === TOTAL_STEPS) updateSummary();
  };

  const resetForm = () => {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-dot').forEach(d => {
      d.classList.remove('active', 'done');
    });
    currentStep = 1;
    const firstStep = getStep(1);
    if (firstStep) firstStep.classList.add('active');
    const firstDot  = getStepDot(1);
    if (firstDot) firstDot.classList.add('active');
  };

  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepEl = btn.closest('.form-step');
      if (!stepEl) return;

      // Validate
      const inputs = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
      let valid = true;
      for (const inp of inputs) {
        if (!inp.checkValidity()) {
          inp.reportValidity();
          valid = false;
          break;
        }
      }
      if (!valid) return;

      const next = parseInt(stepEl.dataset.step) + 1;
      if (next <= TOTAL_STEPS) setStep(next);
    });
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepEl = btn.closest('.form-step');
      if (!stepEl) return;
      const prev = parseInt(stepEl.dataset.step) - 1;
      if (prev >= 1) setStep(prev);
    });
  });

  // ─── SUMMARY UPDATE ───────────────────────────────────────
  window.updateSummary = () => {
    const sel  = document.getElementById('service_select');
    if (!sel) return;
    const opt  = sel.options[sel.selectedIndex];
    const base = parseFloat(opt?.dataset?.price || 0);

    const typeEl = document.querySelector('input[name="type"]:checked');
    const type   = typeEl ? typeEl.value : 'outcall';
    const extra  = type === 'incall' ? 50 : 0;
    const total  = base + extra;
    const deposit = 100;

    const el = (id) => document.getElementById(id);
    if (el('summary-service')) el('summary-service').textContent = sel.value || '—';
    if (el('summary-extra'))   el('summary-extra').textContent   = type === 'incall' ? 'Incall (+$50)' : 'Outcall';
    if (el('summary-total'))   el('summary-total').textContent   = base ? `$${total.toFixed(2)}` : '—';
    if (el('summary-deposit')) el('summary-deposit').textContent = `$${deposit.toFixed(2)}`;
  };

  // ─── ADDRESS TOGGLE ───────────────────────────────────────
  window.toggleAddressFields = () => {
    const type = document.querySelector('input[name="type"]:checked')?.value;
    const incallContainer  = document.getElementById('address-container');
    const outcallContainer = document.getElementById('outcall-address-container');
    const incallAddress    = document.getElementById('incall-address');

    if (type === 'incall') {
      if (incallContainer)  incallContainer.style.display = 'block';
      if (outcallContainer) outcallContainer.style.display = 'none';
      if (incallAddress)    incallAddress.required = true;
    } else {
      if (incallContainer)  incallContainer.style.display = 'none';
      if (outcallContainer) outcallContainer.style.display = 'block';
      if (incallAddress)    incallAddress.required = false;
    }
    updateSummary();
  };

  document.querySelectorAll('input[name="type"]').forEach(el =>
    el.addEventListener('change', () => { toggleAddressFields(); updateSummary(); })
  );

  // ─── PAYMENT METHOD DETAILS ───────────────────────────────
  const paymentSelect = document.getElementById('payment_method_select');
  if (paymentSelect) {
    paymentSelect.addEventListener('change', renderPaymentDetails);
  }

  function renderPaymentDetails() {
    const sel = document.getElementById('payment_method_select');
    if (!sel) return;
    const opt          = sel.options[sel.selectedIndex];
    const box          = document.getElementById('payment-details-box');
    const container    = document.getElementById('method-details-container');

    if (!opt || !sel.value) {
      box.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const details       = opt.dataset.details || '';
    const bankName      = opt.dataset.bankName || '';
    const accountName   = opt.dataset.accountName || '';
    const accountNumber = opt.dataset.accountNumber || '';
    const routingNumber = opt.dataset.routingNumber || '';
    const swiftCode     = opt.dataset.swiftCode || '';
    const checkDetails  = opt.dataset.checkDetails || '';

    const hasBankInfo = bankName || accountName || accountNumber || routingNumber || swiftCode || checkDetails;

    if (!details && !hasBankInfo) {
      box.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    box.style.display = 'flex';
    let html = '';

    if (hasBankInfo) {
      const copyAll = [
        bankName      && `Bank: ${bankName}`,
        accountName   && `Account Name: ${accountName}`,
        accountNumber && `Account Number: ${accountNumber}`,
        routingNumber && `Routing Number: ${routingNumber}`,
        swiftCode     && `SWIFT Code: ${swiftCode}`,
        checkDetails  && `Check Info: ${checkDetails}`,
        details       && `Notes: ${details}`,
      ].filter(Boolean).join('\n');

      html += `<div style="display:flex;flex-direction:column;gap:0.4rem;width:100%;">`;
      html += makeDetailRow('Bank Name',       bankName);
      html += makeDetailRow('Account Holder',  accountName);
      html += makeDetailRow('Account Number',  accountNumber);
      html += makeDetailRow('Routing Number',  routingNumber);
      html += makeDetailRow('SWIFT / BIC',     swiftCode);
      html += makeDetailRow('Check Info',      checkDetails);
      html += makeDetailRow('Notes',           details);
      html += `${copyBtn(copyAll, 'Copy All Bank Details', true)}</div>`;
    } else {
      html += `<div class="payment-value">${esc(details)}</div>${copyBtn(details, 'Copy Value')}`;
    }

    container.innerHTML = html;
    attachCopyListeners();
  }

  function makeDetailRow(label, value) {
    if (!value) return '';
    return `
      <div class="detail-row">
        <div>
          <span class="detail-label">${esc(label)}</span>
          <strong>${esc(value)}</strong>
        </div>
        ${copyBtn(value, 'Copy', false, 'padding:0.35rem 0.8rem;font-size:0.72rem;')}
      </div>`;
  }

  function copyBtn(text, label = 'Copy', block = false, style = '') {
    return `<button type="button" class="btn-copy" data-copy-text="${esc(text)}"
      style="${style}${block ? 'width:100%;justify-content:center;margin-top:0.75rem;' : ''}">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
      </svg>
      ${label}</button>`;
  }

  function attachCopyListeners() {
    document.querySelectorAll('#payment-details-box .btn-copy').forEach(btn => {
      btn.onclick = async function () {
        const text = this.getAttribute('data-copy-text');
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          const orig = this.innerHTML;
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg> Copied!`;
          setTimeout(() => { this.innerHTML = orig; }, 2000);
        } catch (e) { console.error('Copy failed', e); }
      };
    });
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── BOOKING FORM SUBMIT ──────────────────────────────────
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = bookingForm.querySelector('.btn-submit');
      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled = true;

      // Simulate submission — replace with real API call
      await new Promise(res => setTimeout(res, 1500));

      // Show success state in step 4
      const step4 = getStep(4);
      if (step4) {
        step4.innerHTML = `
          <div style="text-align:center;padding:3rem 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 64 64" style="margin:0 auto 1.5rem;" aria-hidden="true">
              <circle cx="32" cy="32" r="32" fill="#121212"/>
              <path d="M20 33l9 9 16-16" stroke="#FDF5E6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3 style="font-size:1.4rem;letter-spacing:0.1em;margin-bottom:1rem;">Booking Received</h3>
            <p style="color:var(--color-gray);font-size:0.9rem;line-height:1.8;max-width:360px;margin:0 auto 2rem;">
              Thank you! Your booking has been submitted. We'll confirm your appointment once payment is verified.
            </p>
            <button type="button" class="btn-primary" onclick="document.getElementById('booking-modal').style.display='none';document.body.style.overflow='auto';">
              Close
            </button>
          </div>`;
      }
    });
  }

});
