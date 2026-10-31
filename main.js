/* ==========================================================
   Horizon Institute of Technology - Interactivity
   Vanilla JavaScript, no dependencies
   ========================================================== */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Mobile menu + header shadow + active link ---------- */
  const toggle = $('.nav-toggle'), menu = $('#menu'), header = $('.site-header');
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); toggle?.setAttribute('aria-expanded', false);
  }));
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('#menu a:not(.btn)').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---------- Scroll effects: header, back-to-top ---------- */
  const topBtn = $('.to-top');
  addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', scrollY > 10);
    topBtn?.classList.toggle('show', scrollY > 500);
  }, { passive: true });
  topBtn?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(end * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: .6 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Generic filter tabs (courses / students) ---------- */
  $$('[data-filter-group]').forEach(group => {
    const target = $(group.dataset.filterGroup);
    $$('.tab', group).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', group).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      $$('[data-cat]', target).forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.classList.toggle('hide', !show);
        if (show) { item.classList.remove('fade-in'); void item.offsetWidth; item.classList.add('fade-in'); }
      });
    }));
  });

  /* ---------- Testimonial slider ---------- */
  const slider = $('.slider');
  if (slider) {
    const slides = $$('.slide', slider), dots = $('.dots', slider);
    let i = 0, timer;
    slides.forEach((_, n) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Show testimonial ' + (n + 1));
      b.addEventListener('click', () => { go(n); restart(); });
      dots.appendChild(b);
    });
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      $$('button', dots).forEach((d, k) => d.classList.toggle('active', k === i));
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 5500); };
    go(0); restart();
  }

  /* ---------- Accordion (FAQ) ---------- */
  $$('.acc-btn').forEach(btn => btn.addEventListener('click', () => {
    const panel = btn.nextElementSibling, open = btn.getAttribute('aria-expanded') === 'true';
    $$('.acc-btn').forEach(b => { b.setAttribute('aria-expanded', false); b.nextElementSibling.style.maxHeight = null; });
    if (!open) { btn.setAttribute('aria-expanded', true); panel.style.maxHeight = panel.scrollHeight + 'px'; }
  }));

  /* ---------- Student live search ---------- */
  const search = $('#studentSearch');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    $$('#studentGrid .student').forEach(card => {
      card.classList.toggle('hide', !card.textContent.toLowerCase().includes(q));
    });
  });

  /* ---------- Admission form: program -> course options ---------- */
  const COURSES = {
    'IT Course': ['Web Development', 'Python & AI Basics', 'Graphic Design', 'Computer Networking (CCNA)', 'Cyber Security Essentials', 'Digital Marketing'],
    'DAE': ['DAE Electrical', 'DAE Electronics', 'DAE Computer Information Technology', 'DAE Mechanical'],
    'Intermediate': ['FSc Pre-Engineering', 'FSc Pre-Medical', 'ICS (Computer Science)', 'I.Com (Commerce)']
  };
  const program = $('#program'), course = $('#course');
  const fillCourses = () => {
    if (!course) return;
    course.innerHTML = '<option value="">Select course / group</option>';
    (COURSES[program.value] || []).forEach(c => course.insertAdjacentHTML('beforeend', `<option>${c}</option>`));
  };
  program?.addEventListener('change', fillCourses);
  // Pre-select from URL e.g. admissions.html?program=DAE
  if (program) {
    const p = new URLSearchParams(location.search).get('program');
    if (p && COURSES[p]) program.value = p;
    fillCourses();
  }

  /* ---------- Admission form: validation + submit to Python API ---------- */
  const form = $('#admissionForm');
  if (form) {
    const rules = {
      fullName: v => v.trim().length >= 3 || 'Please enter your full name.',
      fatherName: v => v.trim().length >= 3 || "Please enter father's name.",
      phone: v => /^(\+92|0)?3\d{2}[- ]?\d{7}$/.test(v.trim()) || 'Enter a valid mobile number, e.g. 0300-0000000.',
      email: v => v === '' || /^\S+@\S+\.\S+$/.test(v) || 'Enter a valid email address.',
      dob: v => !!v || 'Select your date of birth.',
      program: v => !!v || 'Select a program.',
      course: v => !!v || 'Select a course or group.',
      lastClass: v => !!v || 'Select your last qualification.'
    };
    const check = (el) => {
      const rule = rules[el.name]; if (!rule) return true;
      const res = rule(el.value), field = el.closest('.field');
      const ok = res === true;
      field.classList.toggle('invalid', !ok);
      $('.err', field).textContent = ok ? '' : res;
      return ok;
    };
    $$('input, select', form).forEach(el => {
      el.addEventListener('blur', () => check(el));
      el.addEventListener('input', () => el.closest('.field')?.classList.contains('invalid') && check(el));
    });
    const msg = $('#formMsg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const valid = $$('input, select', form).map(check).every(Boolean);
      if (!valid) { msg.className = 'alert bad'; msg.textContent = 'Please fix the highlighted fields.'; return; }
      const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Submitting...';
      const data = Object.fromEntries(new FormData(form));
      try {
        const r = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Submission failed');
        msg.className = 'alert ok';
        msg.textContent = `Thank you, ${data.fullName}! Your application ID is ${j.application_id}. Our admission office will contact you within 2 working days.`;
        form.reset(); fillCourses();
      } catch (err) {
        msg.className = 'alert bad';
        msg.textContent = (err.message === 'Failed to fetch')
          ? 'Server not reachable. Please call our admission office on 042-0000-1234.'
          : err.message;
      } finally { btn.disabled = false; btn.textContent = 'Submit Application'; }
    });
  }

  /* ---------- Student result lookup (Python API, with demo fallback) ---------- */
  const rform = $('#resultForm');
  if (rform) {
    const DEMO = { 'HIT-1001': { name: 'Ayesha Khan', program: 'FSc Pre-Engineering', grade: 'A+', percentage: 92.4, status: 'Pass' } };
    rform.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roll = $('#roll').value.trim().toUpperCase(), out = $('#resultOut');
      out.innerHTML = '<p class="center">Searching...</p>';
      let rec = null;
      try {
        const r = await fetch('/api/result?roll=' + encodeURIComponent(roll));
        rec = r.ok ? await r.json() : null;
      } catch { rec = DEMO[roll] || null; }
      out.innerHTML = rec ? `
        <div class="result-card">
          <h3>${rec.name}</h3>
          <div class="row"><span>Roll No.</span><b>${roll}</b></div>
          <div class="row"><span>Program</span><b>${rec.program}</b></div>
          <div class="row"><span>Percentage</span><b>${rec.percentage}%</b></div>
          <div class="row"><span>Grade</span><b>${rec.grade}</b></div>
          <div class="row"><span>Status</span><b style="color:#059669">${rec.status}</b></div>
        </div>` : '<div class="alert bad">No record found. Please check the roll number (try HIT-1001).</div>';
    });
  }

  /* ---------- Footer year ---------- */
  $$('.year').forEach(y => y.textContent = new Date().getFullYear());
})();
