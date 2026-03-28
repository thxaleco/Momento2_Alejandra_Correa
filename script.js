/* ============================================================
   ECLIPSE NIGHTCLUB — Global JavaScript
   ============================================================ */

'use strict';

/* ---------- Sticky Nav ---------- */
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ---------- Mobile Hamburger ---------- */
const hamburger = document.querySelector('.nav__hamburger');
const mobileMenu = document.querySelector('.nav__mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.style.display === 'flex';
    mobileMenu.style.display = isOpen ? 'none' : 'flex';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    // Animate spans
    const spans = hamburger.querySelectorAll('span');
    if (!isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
}

/* ---------- Scroll-reveal ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- Contact Form Validation ---------- */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const fields = contactForm.querySelectorAll('[data-required]');

  function validateField(input) {
    const errorEl = document.getElementById(`${input.id}-error`);
    let valid = true;

    if (!input.value.trim()) {
      input.classList.add('error');
      if (errorEl) { errorEl.classList.add('visible'); errorEl.textContent = 'Este campo es requerido.'; }
      valid = false;
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      input.classList.add('error');
      if (errorEl) { errorEl.classList.add('visible'); errorEl.textContent = 'Ingresa un email válido.'; }
      valid = false;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.classList.remove('visible');
    }
    return valid;
  }

  fields.forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => {
      if (f.classList.contains('error')) validateField(f);
    });
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let allValid = true;
    fields.forEach((f) => { if (!validateField(f)) allValid = false; });
    if (!allValid) return;

    const btn = contactForm.querySelector('.contact-submit-btn');
    btn.textContent = 'Enviando…';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '✓ Mensaje enviado';
      btn.style.background = 'linear-gradient(135deg, #00eefc, #00deec)';
      btn.style.color = '#000';
      contactForm.reset();
      setTimeout(() => {
        btn.textContent = 'Enviar mensaje';
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    }, 1500);
  });
}

/* ============================================================
   RESERVAS PAGE — Interactive Reservation Form
   ============================================================ */
(function initReservasPage() {
  const form = document.getElementById('reservas-form');
  if (!form) return;

  /* ---- State ---- */
  const state = {
    nombre: '',
    email: '',
    fecha: '',
    personas: '',
    experiencia: '', // 'VIP' | 'General' | 'Evento'
  };

  /* ---- Elements ---- */
  const inputs = {
    nombre:   form.querySelector('#r-nombre'),
    email:    form.querySelector('#r-email'),
    fecha:    form.querySelector('#r-fecha'),
    personas: form.querySelector('#r-personas'),
  };

  const expButtons = form.querySelectorAll('.exp-btn');
  const summary     = document.getElementById('reserva-summary');
  const vipMsg      = document.getElementById('vip-msg');
  const submitBtn   = form.querySelector('.reservas-submit-btn');
  const confirmOverlay = document.getElementById('confirmation-overlay');
  const confirmClose   = document.getElementById('confirm-close');
  const confirmCode    = document.getElementById('confirm-code');
  const confirmDetails = document.getElementById('confirm-details');

  /* ---- Helpers ---- */
  function generateCode() {
    return 'ECL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${months[parseInt(m,10)-1]} ${y}`;
  }

  /* ---- Experience selector ---- */
  expButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      expButtons.forEach((b) => b.classList.remove('active-vip','active-general','active-evento'));
      const exp = btn.dataset.exp;
      state.experiencia = exp;

      if (exp === 'VIP')     btn.classList.add('active-vip');
      if (exp === 'General') btn.classList.add('active-general');
      if (exp === 'Evento')  btn.classList.add('active-evento');

      clearFieldError('experiencia');
      updateSummary();
    });
  });

  /* ---- Real-time updates ---- */
  Object.entries(inputs).forEach(([key, el]) => {
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = el.value;
      clearFieldError(key);
      updateSummary();
    });
    el.addEventListener('blur', () => validateSingleField(key));
  });

  /* ---- Summary updater ---- */
  function updateSummary() {
    const hasAny = state.nombre || state.fecha || state.personas || state.experiencia;
    if (!hasAny) { summary.classList.remove('visible'); return; }

    summary.classList.add('visible');

    setEl('sum-nombre',   state.nombre   || '—');
    setEl('sum-email',    state.email    || '—');
    setEl('sum-fecha',    state.fecha    ? formatDate(state.fecha) : '—');
    setEl('sum-personas', state.personas ? `${state.personas} persona${state.personas>1?'s':''}` : '—');
    setEl('sum-exp',      state.experiencia || '—');

    // VIP message
    if (state.experiencia === 'VIP') {
      vipMsg.classList.add('visible');
    } else {
      vipMsg.classList.remove('visible');
    }
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---- Validation ---- */
  const errorMessages = {
    nombre:      'Ingresa tu nombre completo.',
    email:       'Ingresa un email válido.',
    fecha:       'Selecciona la fecha de tu visita.',
    personas:    'Indica el número de personas (1-20).',
    experiencia: 'Selecciona un tipo de experiencia.',
  };

  function validateSingleField(key) {
    const el = key === 'experiencia' ? null : inputs[key];
    const errorEl = document.getElementById(`r-${key}-error`);

    let valid = true;

    if (key === 'experiencia') {
      if (!state.experiencia) valid = false;
    } else if (!el) {
      return true;
    } else if (!el.value.trim()) {
      valid = false;
    } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
      valid = false;
    } else if (key === 'personas') {
      const n = parseInt(el.value, 10);
      if (isNaN(n) || n < 1 || n > 20) valid = false;
    }

    if (!valid) {
      if (el) el.classList.add('error');
      if (errorEl) { errorEl.textContent = errorMessages[key]; errorEl.classList.add('visible'); }
    } else {
      if (el) el.classList.remove('error');
      if (errorEl) errorEl.classList.remove('visible');
    }

    return valid;
  }

  function clearFieldError(key) {
    const el = inputs[key];
    const errorEl = document.getElementById(`r-${key}-error`);
    if (el) el.classList.remove('error');
    if (errorEl) errorEl.classList.remove('visible');
  }

  function validateAll() {
    const keys = ['nombre','email','fecha','personas','experiencia'];
    let valid = true;
    keys.forEach((k) => { if (!validateSingleField(k)) valid = false; });
    return valid;
  }

  /* ---- Submit ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateAll()) {
      // Shake the button
      submitBtn.style.animation = 'none';
      submitBtn.offsetHeight; // reflow
      submitBtn.style.animation = 'shake 0.4s ease';
      return;
    }

    // Loading state
    submitBtn.textContent = 'Procesando…';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      // Show confirmation
      const code = generateCode();
      if (confirmCode) confirmCode.textContent = `Código de reserva: ${code}`;
      if (confirmDetails) {
        confirmDetails.textContent =
          `${state.experiencia} · ${formatDate(state.fecha)} · ${state.personas} persona${state.personas>1?'s':''}`;
      }
      confirmOverlay.classList.add('visible');

      // Reset form
      form.reset();
      expButtons.forEach((b) => b.classList.remove('active-vip','active-general','active-evento'));
      Object.keys(state).forEach((k) => state[k] = '');
      summary.classList.remove('visible');
      vipMsg.classList.remove('visible');

      submitBtn.textContent = 'Confirmar Reserva';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
    }, 1800);
  });

  /* ---- Close confirmation ---- */
  if (confirmClose) {
    confirmClose.addEventListener('click', () => {
      confirmOverlay.classList.remove('visible');
    });
  }

  confirmOverlay?.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) confirmOverlay.classList.remove('visible');
  });
})();

/* ---------- Shake keyframe (injected once) ---------- */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{ transform: translateX(0); }
    20%    { transform: translateX(-6px); }
    40%    { transform: translateX(6px); }
    60%    { transform: translateX(-4px); }
    80%    { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);
