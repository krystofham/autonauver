'use strict';

/* ============================================================
   POMOCNÉ FUNKCE
   ============================================================ */

// Jediný RAF-throttled scroll listener pro celou stránku
const _scrollCbs = [];
let _scrollTicking = false;

function onScroll(cb) {
  _scrollCbs.push(cb);
}

window.addEventListener('scroll', function () {
  if (_scrollTicking) return;
  _scrollTicking = true;
  requestAnimationFrame(function () {
    const y = window.scrollY;
    for (let i = 0; i < _scrollCbs.length; i++) _scrollCbs[i](y);
    _scrollTicking = false;
  });
}, { passive: true });

/* ============================================================
   1. MATH CAPTCHA
   ============================================================ */
let captchaAnswer = 0;

function generujCaptchu() {
  const textEl = document.getElementById('captcha-text');
  if (!textEl) return;
  const a = (Math.random() * 12 | 0) + 1;
  const b = (Math.random() * 12 | 0) + 1;
  const plus = Math.random() > 0.5;
  captchaAnswer = plus ? a + b : a * b;
  textEl.textContent = a + (plus ? ' + ' : ' x ') + b;
}

/* ============================================================
   2. NAVIGACE — scroll stav + aktivní odkaz
   ============================================================ */
function initNavigace() {
  const nav = document.querySelector('.navigace');
  if (!nav) return;

  const sekce = document.querySelectorAll('section[id], div[id]');
  let posledniScroll = 0;

  onScroll(function (y) {
    // Pokud je menu otevřené, nav neschovávej
    if (nav.querySelector('.navigace-odkazy--otevreno')) return;

    nav.classList.toggle('navigace--scrollovana', y > 60);
    nav.classList.toggle('navigace--skryta', y > posledniScroll && y > 300);
    posledniScroll = y;
  });

  if (!window.IntersectionObserver || !sekce.length) return;

  const navOdkazy = document.querySelectorAll('.navigace-odkazy a[href^="#"]');

  sekce.forEach(function (s) {
    new IntersectionObserver(function (z) {
      if (!z[0].isIntersecting) return;
      const id = '#' + z[0].target.id;
      navOdkazy.forEach(a => a.classList.toggle('aktivni', a.getAttribute('href') === id));
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
  });
}

/* ============================================================
   3. PLYNULÝ SCROLL — event delegation
   ============================================================ */
function initPlynulyScroll() {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#') return;
    const cil = document.querySelector(href);
    if (!cil) return;
    e.preventDefault();
    window.scrollTo({
      top: cil.getBoundingClientRect().top + window.scrollY - 90,
      behavior: 'smooth'
    });
  });
}

/* ============================================================
   4. SCROLL ANIMACE
   ============================================================ */
function initScrollAnimace() {
  if (!window.IntersectionObserver) return;

  const prvky = document.querySelectorAll(
    '.sluzba-karta, .proc-my-polozka, .pobocka-karta, .statistika-karta, .cnb-karta, .certifikat-karta'
  );
  if (!prvky.length) return;

  prvky.forEach(function (el, i) {
    el.classList.add('ceka-na-animaci');
    el.style.setProperty('--zpozdeni', ((i % 4) * 0.08) + 's');
  });

  const obs = new IntersectionObserver(function (zaznamy) {
    zaznamy.forEach(function (z) {
      if (!z.isIntersecting) return;
      z.target.classList.add('animovano');
      obs.unobserve(z.target);
    });
  }, { threshold: 0.12 });

  prvky.forEach(el => obs.observe(el));
}

/* ============================================================
   5. ČÍTAČ ČÍSEL
   ============================================================ */
function initCitace() {
  if (!window.IntersectionObserver) return;

  const cisla = document.querySelectorAll('.statistika-cislo');
  if (!cisla.length) return;

  function animujCislo(el) {
    const text = el.textContent.trim();
    const jeDecimal = text.includes('.');
    const sufiks = text.replace(/[\d.,]/g, '');
    const cil = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (isNaN(cil)) return;

    const trvani = 1800;
    const zacatek = performance.now();

    (function krok(cas) {
      const p = Math.min((cas - zacatek) / trvani, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = (jeDecimal
        ? (Math.round(cil * ease * 10) / 10).toFixed(1)
        : Math.floor(cil * ease)
      ) + sufiks;
      if (p < 1) requestAnimationFrame(krok);
    })(performance.now());
  }

  const obs = new IntersectionObserver(function (zaznamy) {
    zaznamy.forEach(function (z) {
      if (!z.isIntersecting) return;
      setTimeout(() => animujCislo(z.target), 300);
      obs.unobserve(z.target);
    });
  }, { threshold: 0.5 });

  cisla.forEach(c => obs.observe(c));
}

/* ============================================================
   6. FORMULÁŘ
   ============================================================ */
function initFormular() {
  const form = document.getElementById('kontaktni-formular');
  if (!form) return;

  // Regex zkompilován jednou, ne při každé validaci
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telRe   = /^[+\d\s\-()]{7,}$/;

  function zobrazitChybu(pole, zprava) {
    pole.classList.remove('pole--ok');
    pole.classList.add('pole--chyba');
    const span = document.createElement('span');
    span.className = 'chybova-zprava';
    span.textContent = zprava;
    pole.parentElement.appendChild(span);
  }

  function odstranitChybu(pole) {
    pole.classList.remove('pole--chyba', 'pole--ok');
    pole.parentElement?.querySelector('.chybova-zprava')?.remove();
  }

  function validujPole(pole) {
    odstranitChybu(pole);
    const v = pole.value.trim();
    let zprava = '';
    if      (pole.required && !v)                           zprava = 'Toto pole je povinné.';
    else if (pole.type === 'email' && v && !emailRe.test(v)) zprava = 'Zadejte platnou e-mailovou adresu.';
    else if (pole.type === 'tel'   && v && !telRe.test(v))   zprava = 'Zadejte platné telefonní cislo.';
    if (zprava) { zobrazitChybu(pole, zprava); return false; }
    pole.classList.add('pole--ok');
    return true;
  }

  // Delegace — dva listenery místo N*2
  form.addEventListener('focusout', function (e) {
    if (e.target.matches('input:not([type=checkbox]), textarea')) validujPole(e.target);
  });

  form.addEventListener('input', function (e) {
    if (e.target.classList.contains('pole--chyba')) validujPole(e.target);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let platny = true;

    form.querySelectorAll(
      'input:not([type=checkbox]):not(#captcha-odpoved):not([name=_gotcha]), textarea'
    ).forEach(p => { if (!validujPole(p)) platny = false; });

    const souhlas = form.querySelector('#souhlas');
    if (souhlas && !souhlas.checked) {
      platny = false;
      zobrazitChybu(souhlas, 'Pro odeslaní je nutný souhlas.');
    }

    const captchaVstup = form.querySelector('#captcha-odpoved');
    if (captchaVstup) {
      captchaVstup.parentElement.querySelector('.chybova-zprava')?.remove();
      captchaVstup.classList.remove('pole--chyba', 'pole--ok');
      const hodnota = parseInt(captchaVstup.value.trim(), 10);
      if (isNaN(hodnota) || hodnota !== captchaAnswer) {
        platny = false;
        captchaVstup.classList.add('pole--chyba');
        const err = document.createElement('span');
        err.className = 'chybova-zprava';
        err.textContent = 'Nespravná odpověď. Zkuste znovu.';
        captchaVstup.parentElement.appendChild(err);
        generujCaptchu();
        captchaVstup.value = '';
      } else {
        captchaVstup.classList.add('pole--ok');
      }
    }

    if (!platny) {
      form.querySelector('.pole--chyba')?.focus();
      form.classList.add('otreseni');
      form.addEventListener('animationend', () => form.classList.remove('otreseni'), { once: true });
      return;
    }

    const tlacitko = form.querySelector('.tlacitko-hlavni');
    const puvodniHTML = tlacitko?.innerHTML ?? '';
    if (tlacitko) { tlacitko.textContent = 'Odesílám...'; tlacitko.disabled = true; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error();
        const obal = form.closest('.kontakt-formular');
        if (obal) obal.innerHTML =
          '<div class="formular-uspech">' +
            '<div class="uspech-ikona">' +
              '<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">' +
                '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
              '</svg>' +
            '</div>' +
            '<h3>Zpráva odeslána!</h3>' +
          '</div>';
      })
      .catch(function () {
        if (tlacitko) { tlacitko.innerHTML = puvodniHTML; tlacitko.disabled = false; }
        const jmeno  = form.querySelector('#jmeno')?.value  ?? '';
        const email  = form.querySelector('#email')?.value  ?? '';
        const zprava = form.querySelector('#zprava')?.value ?? '';
        location.href = 'mailto:info@auto-na-uver.cz?subject=Poptavka%20od%20' +
          encodeURIComponent(jmeno) + '&body=' +
          encodeURIComponent(zprava + '\nOdesil: ' + jmeno + '\nEmail: ' + email);
      });
  });
}


/* ============================================================
   8. POČÍTADLO ZNAKŮ
   ============================================================ */
function initPocitadloZnaku() {
  const textarea = document.querySelector('#zprava');
  if (!textarea) return;

  const max = 700;
  textarea.maxLength = max;

  const pocitadlo = document.createElement('span');
  pocitadlo.className = 'pocitadlo-znaku';
  pocitadlo.textContent = '0 / ' + max;
  textarea.parentElement.appendChild(pocitadlo);

  textarea.addEventListener('input', function () {
    const n = textarea.value.length;
    pocitadlo.textContent = n + ' / ' + max;
    pocitadlo.classList.toggle('pocitadlo-znaku--blizko', n > max * 0.8);
    pocitadlo.classList.toggle('pocitadlo-znaku--plno',   n >= max);
  });
}

/* ============================================================
   9. ZPĚT NAHORU
   ============================================================ */
function initZpetNahoru() {
  if (window.innerWidth >= 900) return;

  const btn = document.createElement('button');
  btn.className = 'zpet-nahoru';
  btn.setAttribute('aria-label', 'Zpet na zacatek');
  btn.innerHTML =
    '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>' +
    '</svg>';
  document.body.appendChild(btn);

  onScroll(y => btn.classList.toggle('zpet-nahoru--viditelne', y > 500));

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   10. TMAVÝ REŽIM
   ============================================================ */
function initTmavyRezim() {
  const ulozeno = localStorage.getItem('tema');
  const tmavy = ulozeno === 'tmavy' || (!ulozeno && matchMedia('(prefers-color-scheme: dark)').matches);
  const html = document.documentElement;
  if (tmavy) html.classList.add('tmavy-rezim');

  const navEl = document.querySelector('.navigace');
  if (!navEl) return;

  const ikonaSlunicko =
    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14A7 7 0 0012 5z"/>' +
    '</svg>';
  const ikonaMesic =
    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>' +
    '</svg>';

  const prepinac = document.createElement('button');
  prepinac.className = 'prepinac-tema';
  prepinac.setAttribute('aria-label', 'Prepnout schema');
  prepinac.innerHTML = tmavy ? ikonaSlunicko : ikonaMesic;
  navEl.appendChild(prepinac);

  prepinac.addEventListener('click', function () {
    const je = html.classList.toggle('tmavy-rezim');
    localStorage.setItem('tema', je ? 'tmavy' : 'svetly');
    prepinac.innerHTML = je ? ikonaSlunicko : ikonaMesic;
  });
}

/* ============================================================
   11. HAMBURGER
   ============================================================ */
function initHamburger() {
  const nav = document.querySelector('.navigace');
  if (!nav) return;

  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'Otevrit menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML =
    '<span class="hamburger-cara"></span>' +
    '<span class="hamburger-cara"></span>' +
    '<span class="hamburger-cara"></span>';
  nav.appendChild(hamburger);

  const menu = nav.querySelector('.navigace-odkazy');
  function zavritMenu() {
    hamburger.classList.remove('otevreno');
    menu.classList.remove('navigace-odkazy--otevreno');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
    // Zajistí, že nav bude vždy viditelná po zavření menu
    document.querySelector('.navigace')?.classList.remove('navigace--skryta');
  }
  hamburger.addEventListener('click', function () {
    const otevreno = hamburger.classList.toggle('otevreno');
    menu.classList.toggle('navigace-odkazy--otevreno', otevreno);
    hamburger.setAttribute('aria-expanded', String(otevreno));
    document.body.style.overflow = otevreno ? 'hidden' : '';
  });

  // Delegace — jeden listener pro všechny odkazy v menu
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') zavritMenu();
  });
}

/* ============================================================
   INICIALIZACE
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  generujCaptchu();
  initNavigace();
  initPlynulyScroll();
  initScrollAnimace();
  initCitace();
  initFormular();
  initPocitadloZnaku();
  initZpetNahoru();
  initTmavyRezim();
  initHamburger();
});