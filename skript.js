/* ============================================================

   skript.js - Auto na Uver

   ============================================================ */


'use strict';


/* ============================================================

   0. MATH CAPTCHA

   ============================================================ */

let captchaAnswer = 0;


function generujCaptchu() {

  let textEl = document.getElementById('captcha-text');

  if (!textEl) return;

  let a = Math.floor(Math.random() * 12) + 1;

  let b = Math.floor(Math.random() * 12) + 1;

  let plus = Math.random() > 0.5;

  captchaAnswer = plus ? (a + b) : (a * b);

  textEl.textContent = a + (plus ? ' + ' : ' x ') + b;

}


/* ============================================================

   1. NAVIGACE - scroll stav + aktivni odkaz

   ============================================================ */

function initNavigace() {

  let nav = document.querySelector('.navigace');

  let sekce = document.querySelectorAll('section[id], div[id]');

  let posledniScroll = 0;


  if (!nav) return;


  window.addEventListener('scroll', function () {

    let aktualniScroll = window.scrollY;

    if (aktualniScroll > 60) {

      nav.classList.add('navigace--scrollovana');

    } else {

      nav.classList.remove('navigace--scrollovana');

    }

    if (aktualniScroll > posledniScroll && aktualniScroll > 300) {

      nav.classList.add('navigace--skryta');

    } else {

      nav.classList.remove('navigace--skryta');

    }

    posledniScroll = aktualniScroll;

  }, { passive: true });


  if (!window.IntersectionObserver) return;


  let pozorovatel = new IntersectionObserver(function (zaznamy) {

    zaznamy.forEach(function (zaznam) {

      if (zaznam.isIntersecting) {

        let id = zaznam.target.getAttribute('id');

        document.querySelectorAll('.navigace-odkazy a').forEach(function (odkaz) {

          let href = odkaz.getAttribute('href');

          if (href === '#' + id) {

            odkaz.classList.add('aktivni');

          } else if (href && href.charAt(0) === '#') {

            odkaz.classList.remove('aktivni');

          }

        });

      }

    });

  }, { rootMargin: '-40% 0px -55% 0px' });


  sekce.forEach(function (s) { pozorovatel.observe(s); });

}


/* ============================================================

   2. PLYNULY SCROLL

   ============================================================ */

function initPlynulyScroll() {

  document.querySelectorAll('a[href^="#"]').forEach(function (odkaz) {

    odkaz.addEventListener('click', function (e) {

      let href = odkaz.getAttribute('href');

      if (!href || href === '#') return;

      let cil = document.querySelector(href);

      if (!cil) return;

      e.preventDefault();

      let pozice = cil.getBoundingClientRect().top + window.scrollY - 90;

      window.scrollTo({ top: pozice, behavior: 'smooth' });

    });

  });

}


/* ============================================================

   3. SCROLL ANIMACE

   ============================================================ */

function initScrollAnimace() {

  if (!window.IntersectionObserver) return;


  let prvky = document.querySelectorAll(

    '.sluzba-karta, .proc-my-polozka, .pobocka-karta, .statistika-karta, .cnb-karta, .certifikat-karta'

  );


  prvky.forEach(function (el, i) {

    el.classList.add('ceka-na-animaci');

    el.style.setProperty('--zpozdeni', ((i % 4) * 0.08) + 's');

  });


  let pozorovatel = new IntersectionObserver(function (zaznamy) {

    zaznamy.forEach(function (zaznam) {

      if (zaznam.isIntersecting) {

        zaznam.target.classList.add('animovano');

        pozorovatel.unobserve(zaznam.target);

      }

    });

  }, { threshold: 0.12 });


  prvky.forEach(function (el) { pozorovatel.observe(el); });

}


/* ============================================================

   4. CITAC CISEL

   ============================================================ */

function initCitace() {

  if (!window.IntersectionObserver) return;


  let cisla = document.querySelectorAll('.statistika-cislo');


  function animujCislo(el) {

    let text = el.textContent.trim();

    let jeDecimal = text.indexOf('.') !== -1;

    let sufiks = text.replace(/[\d.,]/g, '');

    let cil = parseFloat(text.replace(/[^0-9.]/g, ''));

    if (isNaN(cil)) return;


    let trvani = 1800;

    let zacatek = performance.now();


    function krok(cas) {

      let elapsed = cas - zacatek;

      let progress = Math.min(elapsed / trvani, 1);

      let ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      let aktualni = Math.round(cil * ease * 10) / 10;

      el.textContent = (jeDecimal ? aktualni.toFixed(1) : Math.floor(aktualni)) + sufiks;

      if (progress < 1) requestAnimationFrame(krok);

    }


    requestAnimationFrame(krok);

  }


  let pozorovatel = new IntersectionObserver(function (zaznamy) {

    zaznamy.forEach(function (zaznam) {

      if (zaznam.isIntersecting) {

        setTimeout(function () { animujCislo(zaznam.target); }, 300);

        pozorovatel.unobserve(zaznam.target);

      }

    });

  }, { threshold: 0.5 });


  cisla.forEach(function (c) { pozorovatel.observe(c); });

}


/* ============================================================

   5. FORMULAR

   ============================================================ */

function initFormular() {

  let form = document.getElementById('kontaktni-formular');

  if (!form) return;


  function zobrazitChybu(pole, zprava) {

    pole.classList.add('pole--chyba');

    pole.classList.remove('pole--ok');

    let el = document.createElement('span');

    el.className = 'chybova-zprava';

    el.textContent = zprava;

    pole.parentElement.appendChild(el);

  }


  function odstranitChybu(pole) {

    pole.classList.remove('pole--chyba', 'pole--ok');

    let chyba = pole.parentElement ? pole.parentElement.querySelector('.chybova-zprava') : null;

    if (chyba) chyba.remove();

  }


  function validujPole(pole) {

    odstranitChybu(pole);

    let zprava = '';

    let emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let telRe = /^[+\d\s\-()]{7,}$/;


    if (pole.required && !pole.value.trim()) {

      zprava = 'Toto pole je povinne.';

    } else if (pole.type === 'email' && pole.value && !emailRe.test(pole.value)) {

      zprava = 'Zadejte platnou e-mailovou adresu.';

    } else if (pole.type === 'tel' && pole.value && !telRe.test(pole.value)) {

      zprava = 'Zadejte platne telefonni cislo.';

    }


    if (zprava) { zobrazitChybu(pole, zprava); return false; }

    pole.classList.add('pole--ok');

    return true;

  }


  function otresat(el) {

    el.classList.add('otreseni');

    el.addEventListener('animationend', function () { el.classList.remove('otreseni'); }, { once: true });

  }


  form.querySelectorAll('input, textarea').forEach(function (pole) {

    pole.addEventListener('blur', function () { validujPole(pole); });

    pole.addEventListener('input', function () {

      if (pole.classList.contains('pole--chyba')) validujPole(pole);

    });

  });


  form.addEventListener('submit', function (e) {

    e.preventDefault();


    let platny = true;

    let vsechna = form.querySelectorAll('input, textarea');

    vsechna.forEach(function (pole) {

      if (pole.type === 'checkbox' || pole.id === 'captcha-odpoved' || pole.name === '_gotcha') return;

      if (!validujPole(pole)) platny = false;

    });


    let souhlas = form.querySelector('#souhlas');

    if (souhlas && !souhlas.checked) {

      platny = false;

      zobrazitChybu(souhlas, 'Pro odeslani je nutny souhlas.');

    }


    let captchaVstup = form.querySelector('#captcha-odpoved');

    if (captchaVstup) {

      let stara = captchaVstup.parentElement.querySelector('.chybova-zprava');

      if (stara) stara.remove();

      captchaVstup.classList.remove('pole--chyba', 'pole--ok');

      let hodnota = parseInt(captchaVstup.value.trim(), 10);

      if (isNaN(hodnota) || hodnota !== captchaAnswer) {

        platny = false;

        captchaVstup.classList.add('pole--chyba');

        let chybaCaptcha = document.createElement('span');

        chybaCaptcha.className = 'chybova-zprava';

        chybaCaptcha.textContent = 'Nespravna odpoved. Zkuste znovu.';

        captchaVstup.parentElement.appendChild(chybaCaptcha);

        generujCaptchu();

        captchaVstup.value = '';

      } else {

        captchaVstup.classList.add('pole--ok');

      }

    }


    if (!platny) {

      let prvniChyba = form.querySelector('.pole--chyba');

      if (prvniChyba) prvniChyba.focus();

      otresat(form);

      return;

    }


    let tlacitko = form.querySelector('.tlacitko-hlavni');

    let puvodniHTML = tlacitko ? tlacitko.innerHTML : '';

    if (tlacitko) {

      tlacitko.textContent = 'Odesilam...';

      tlacitko.disabled = true;

    }


    let data = new FormData(form);


    fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })

      .then(function (response) {

        if (response.ok) {

          let obal = form.closest('.kontakt-formular');

          if (obal) {

            obal.innerHTML =

              '<div class="formular-uspech">' +

                '<div class="uspech-ikona">' +

                  '<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">' +

                    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +

                  '</svg>' +

                '</div>' +

                '<h3>Zprava odeslana!</h3>' +

                '<p>Dekujeme za vasi poptavku. Ozveme se vam do 24 hodin.</p>' +

              '</div>';

          }

        } else {

          throw new Error('server');

        }

      })

      .catch(function () {

        if (tlacitko) { tlacitko.innerHTML = puvodniHTML; tlacitko.disabled = false; }

        let jmeno = (form.querySelector('#jmeno') || {}).value || '';

        let email = (form.querySelector('#email') || {}).value || '';

        let zprava = (form.querySelector('#zprava') || {}).value || '';

        window.location.href = 'mailto:info@auto-na-uver.cz?subject=Poptavka%20od%20' +

          encodeURIComponent(jmeno) + '&body=' + encodeURIComponent(zprava + '\nOdesil: ' + jmeno + '\nEmail: ' + email);

      });

  });

}


/* ============================================================

   6. PARALLAX

   ============================================================ */

function initParallax() {

  let pravy = document.querySelector('.uvodni-prava');

  if (!pravy) return;


  let ticking = false;

  window.addEventListener('scroll', function () {

    if (!ticking) {

      requestAnimationFrame(function () {

        let scroll = window.scrollY;

        if (scroll < window.innerHeight * 1.5) {

          pravy.style.transform = 'translateY(' + (scroll * 0.15) + 'px)';

        }

        ticking = false;

      });

      ticking = true;

    }

  }, { passive: true });

}


/* ============================================================

   9. POCITADLO ZNAKU

   ============================================================ */

function initPocitadloZnaku() {

  let textarea = document.querySelector('#zprava');

  if (!textarea) return;

  let max = 700;

  textarea.setAttribute('maxlength', max);

  let pocitadlo = document.createElement('span');

  pocitadlo.className = 'pocitadlo-znaku';

  pocitadlo.textContent = '0 / ' + max;

  textarea.parentElement.appendChild(pocitadlo);

  textarea.addEventListener('input', function () {

    let pocet = textarea.value.length;

    pocitadlo.textContent = pocet + ' / ' + max;

    pocitadlo.classList.toggle('pocitadlo-znaku--blizko', pocet > max * 0.8);

    pocitadlo.classList.toggle('pocitadlo-znaku--plno', pocet >= max);

  });

}


/* ============================================================

   10. ZPET NAHORU

   ============================================================ */

function initZpetNahoru() {

  if (window.innerWidth >= 900) return;

  let btn = document.createElement('button');

  btn.className = 'zpet-nahoru';

  btn.setAttribute('aria-label', 'Zpet na zacatek');

  btn.innerHTML =

    '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +

      '<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>' +

    '</svg>';

  document.body.appendChild(btn);

  window.addEventListener('scroll', function () {

    btn.classList.toggle('zpet-nahoru--viditelne', window.scrollY > 500);

  }, { passive: true });

  btn.addEventListener('click', function () {

    window.scrollTo({ top: 0, behavior: 'smooth' });

  });

}


/* ============================================================

   11. TMAVY REZIM

   ============================================================ */

function initTmavyRezim() {

  let ulozeno = localStorage.getItem('tema');

  let preferujeTmavy = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let tmavy = ulozeno === 'tmavy' || (!ulozeno && preferujeTmavy);

  if (tmavy) document.documentElement.classList.add('tmavy-rezim');


  let navEl = document.querySelector('.navigace');

  if (!navEl) return;


  let prepinac = document.createElement('button');

  prepinac.className = 'prepinac-tema';

  prepinac.setAttribute('aria-label', 'Prepnout schema');


  let ikonaSlunicko =

    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +

      '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14A7 7 0 0012 5z"/>' +

    '</svg>';

  let ikonaMesic =

    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +

      '<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>' +

    '</svg>';


  prepinac.innerHTML = tmavy ? ikonaSlunicko : ikonaMesic;

  navEl.appendChild(prepinac);


  prepinac.addEventListener('click', function () {

    let jeTmavy = document.documentElement.classList.toggle('tmavy-rezim');

    localStorage.setItem('tema', jeTmavy ? 'tmavy' : 'svetly');

    prepinac.innerHTML = jeTmavy ? ikonaSlunicko : ikonaMesic;

  });

}


/* ============================================================

   12. HAMBURGER

   ============================================================ */

function initHamburger() {

  let nav = document.querySelector('.navigace');

  if (!nav) return;


  let hamburger = document.createElement('button');

  hamburger.className = 'hamburger';

  hamburger.setAttribute('aria-label', 'Otevrit menu');

  hamburger.setAttribute('aria-expanded', 'false');

  hamburger.innerHTML =

    '<span class="hamburger-cara"></span>' +

    '<span class="hamburger-cara"></span>' +

    '<span class="hamburger-cara"></span>';

  nav.appendChild(hamburger);


  let menu = nav.querySelector('.navigace-odkazy');


  hamburger.addEventListener('click', function () {

    let otevreno = hamburger.classList.toggle('otevreno');

    menu.classList.toggle('navigace-odkazy--otevreno', otevreno);

    hamburger.setAttribute('aria-expanded', String(otevreno));

    document.body.style.overflow = otevreno ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      hamburger.classList.remove('otevreno');
      menu.classList.remove('navigace-odkazy--otevreno');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ============================================================
   SPUSTIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  generujCaptchu();
  initNavigace();
  initPlynulyScroll();
  initScrollAnimace();
  initCitace();
  initFormular();
  initParallax();
  initPocitadloZnaku();
  initZpetNahoru();
  initTmavyRezim();
  initHamburger();
});