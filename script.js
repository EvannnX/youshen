/* ========================================
   游神 YÓUSHÉN — Interactions
   ======================================== */

(function () {
    'use strict';

    // ——— DOM ———
    const nav = document.getElementById('siteNav');
    const hero = document.getElementById('heroSection');
    const video = document.getElementById('heroVideo');
    const kicker = document.getElementById('heroKicker');
    const charYou = document.getElementById('charYou');
    const charShen = document.getElementById('charShen');
    const heroSub = document.getElementById('heroSub');
    const heritage = document.getElementById('heroHeritage');
    const scrollH = document.getElementById('scrollHint');
    const yearEl = document.getElementById('footerYear');

    // ——— Footer year ———
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ——— Hero entrance animation (staggered fade-up) ———
    const heroEls = [kicker, charYou, charShen, heroSub, heritage, scrollH];
    const delays = [0.3, 0.6, 1.1, 1.6, 2.0, 2.2];

    heroEls.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => {
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            el.style.opacity = '1';
            el.style.transform = el === heritage ? 'none' : 'translateY(0)';
        }, delays[i] * 1000);
    });

    // ——— Navigation scroll: solid background after hero ———
    if (hero && nav) {
        const navObserver = new IntersectionObserver(([entry]) => {
            nav.classList.toggle('scrolled', !entry.isIntersecting);
        }, { threshold: 0.05 });
        navObserver.observe(hero);
    }

    // ——— Scroll-triggered reveal for .reveal elements ———
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger siblings within same parent
                    const parent = entry.target.parentElement;
                    const siblings = parent.querySelectorAll('.reveal');
                    const idx = Array.from(siblings).indexOf(entry.target);
                    const delay = idx * 150;

                    setTimeout(() => {
                        entry.target.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delay);

                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));
    }

    // ——— Video pause when hero is out of view (saves resources) ———
    if (video && hero) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && e.intersectionRatio > 0.1) {
                    video.play().catch(() => { });
                } else {
                    try { video.pause(); } catch (_) { }
                }
            });
        }, { threshold: [0, 0.1, 0.5, 1] });
        videoObserver.observe(hero);
    }

    // ——— iOS: resume video on tab return ———
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && video && video.paused) {
            video.play().catch(() => { });
        }
    });

    // ——— Subtle parallax on hero content ———
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const heroH = hero ? hero.offsetHeight : 0;
            if (scrollY < heroH) {
                const ratio = scrollY / heroH;
                const content = document.querySelector('.hero-content');
                if (content) {
                    content.style.transform = `translateY(calc(-50% + ${scrollY * 0.15}px))`;
                    content.style.opacity = 1 - ratio * 0.8;
                }
            }
            ticking = false;
        });
    }, { passive: true });

})();
