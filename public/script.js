// THE HOUSE OF VRINDAVAN — shared behaviour

document.addEventListener('DOMContentLoaded', () => {

  /* Keep --header-h in sync with the real height of the fixed header */
  const header = document.querySelector('.site-header');
  if (header) {
    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    window.addEventListener('orientationchange', syncHeaderHeight);
    if ('ResizeObserver' in window) {
      new ResizeObserver(syncHeaderHeight).observe(header);
    }
    window.addEventListener('load', syncHeaderHeight);
  }

  /* ---------- Header shrink + scroll progress bar (shared, injected) ---------- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  const onScrollChrome = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';

    if (header) header.classList.toggle('is-scrolled', scrollTop > 40);
  };
  onScrollChrome();
  window.addEventListener('scroll', onScrollChrome, { passive: true });

  /* ---------- Back to top button (shared, injected) ---------- */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(backToTop);
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop) > 640);
  }, { passive: true });

  /* ---------- Floating WhatsApp button (desktop, injected) ---------- */
  const waFloat = document.createElement('a');
  waFloat.className = 'wa-float';
  waFloat.href = 'https://wa.me/917760229555?text=Hi%2C%20I%27d%20like%20to%20discuss%20a%20corporate%20gifting%20requirement.';
  waFloat.target = '_blank';
  waFloat.rel = 'noopener';
  waFloat.setAttribute('aria-label', 'Chat with us on WhatsApp');
  waFloat.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5.1-1.3C8.6 21.5 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.6.6-.9 1.3-.9 2.1.1.9.4 1.8 1 2.6 1 1.5 2.2 2.7 3.7 3.5.5.3 1 .5 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>';
  document.body.appendChild(waFloat);

  /* ---------- Toast helper (shared) ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'thv-toast';
  document.body.appendChild(toastEl);
  let toastTimer = null;
  window.thvToast = (msg) => {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  /* ---------- Lightbox for images marked [data-lightbox] ---------- */
  const lightboxImgs = document.querySelectorAll('[data-lightbox]');
  if (lightboxImgs.length) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <img src="" alt="">
      <span class="lightbox-caption"></span>
    `;
    document.body.appendChild(overlay);
    const overlayImg = overlay.querySelector('img');
    const overlayCaption = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');

    const openLightbox = (src, caption) => {
      overlayImg.src = src;
      overlayImg.alt = caption || '';
      overlayCaption.textContent = caption || '';
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    };
    lightboxImgs.forEach(img => {
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.dataset.caption || img.alt));
    });
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- Scrollspy: highlight in-page badge/anchor nav on scroll ---------- */
  const spyLinks = document.querySelectorAll('.badge-list a[href^="#"]');
  if (spyLinks.length) {
    const spyTargets = Array.from(spyLinks)
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if ('IntersectionObserver' in window && spyTargets.length) {
      const spyIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const link = document.querySelector(`.badge-list a[href="#${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            spyLinks.forEach(l => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      }, { threshold: 0.01, rootMargin: '-45% 0px -50% 0px' });
      spyTargets.forEach(t => spyIO.observe(t));
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Testimonial slider ---------- */
  document.querySelectorAll('.testi-slider').forEach(slider => {
    const slides = Array.from(slider.querySelectorAll('.testi-slide'));
    const dotsWrap = slider.querySelector('.testi-dots');
    const prevBtn = slider.querySelector('.testi-prev');
    const nextBtn = slider.querySelector('.testi-next');
    if (!slides.length) return;
    let idx = 0;
    let autoTimer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap?.appendChild(dot);
    });
    const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

    function goTo(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, si) => s.classList.toggle('active', si === idx));
      dots.forEach((d, di) => d.classList.toggle('active', di === idx));
      restartAuto();
    }
    function restartAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(idx + 1), 6000);
    }
    prevBtn?.addEventListener('click', () => goTo(idx - 1));
    nextBtn?.addEventListener('click', () => goTo(idx + 1));
    goTo(0);
  });

  /* ---------- Copy-to-clipboard chips ---------- */
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const text = el.dataset.copy;
      navigator.clipboard?.writeText(text).then(() => {
        window.thvToast?.(`Copied "${text}" to clipboard`);
      }).catch(() => {
        window.thvToast?.('Could not copy — please copy manually');
      });
    });
  });

  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));

    setTimeout(() => {
      revealEls.forEach(el => el.classList.add('in'));
    }, 4000);
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* Direct WhatsApp Enquiry Submission */
  const form = document.querySelector('#enquiry-form');
  if (form) {

    /* Live inline validation */
    const validateField = (field) => {
      const wrap = field.closest('.field');
      if (!wrap || !field.hasAttribute('required')) return true;
      const isEmail = field.type === 'email';
      const isValid = isEmail
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())
        : field.value.trim().length > 0;

      wrap.classList.toggle('error', !isValid);
      wrap.classList.toggle('valid', isValid);

      if (!wrap.querySelector('.field-error-msg')) {
        const msg = document.createElement('span');
        msg.className = 'field-error-msg';
        msg.textContent = isEmail ? 'Enter a valid email address' : 'This field is required';
        wrap.appendChild(msg);
      }
      return isValid;
    };
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.field').classList.contains('error')) validateField(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const success = document.querySelector('.form-success');

      let allValid = true;
      let firstInvalid = null;
      form.querySelectorAll('input[required], textarea[required]').forEach(field => {
        const ok = validateField(field);
        if (!ok && allValid) { allValid = false; firstInvalid = field; }
      });
      if (!allValid) {
        firstInvalid?.focus();
        window.thvToast?.('Please fill in the required fields');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const waWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving enquiry...';
      }

      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      try {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Could not save enquiry.');

        const targetNumber = '917760229555';
        const waUrl = `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(result.whatsapp_message)}`;
        if (waWindow) {
          waWindow.location.href = waUrl;
        } else {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }

        if (submitBtn) submitBtn.textContent = 'Redirecting to WhatsApp...';
        form.querySelectorAll('input,textarea,select,button').forEach(f => f.disabled = true);

        setTimeout(() => {
          form.style.display = 'none';
          if (success) {
            success.textContent = 'Thank you. Your enquiry has been saved and opened in WhatsApp for sending.';
            success.classList.add('show');
          }
        }, 600);
      } catch (err) {
        waWindow?.close();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Enquiry via WhatsApp';
        }
        window.thvToast?.(err.message || 'Could not save enquiry. Please try again.');
      }
    });  }

  /* Chip checkboxes visual state */
  document.querySelectorAll('.chip-check input').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.chip-check').classList.toggle('checked', input.checked);
    });
  });

});
