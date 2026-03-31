/* ========================================
   游神 YÓUSHÉN — Deities Page Interactions
   ======================================== */

(function () {
    'use strict';

    const nav = document.getElementById('siteNav');
    const hero = document.getElementById('historyHero');
    const kicker = document.getElementById('historyKicker');
    const titleMain = document.getElementById('historyTitleMain');
    const titleSub = document.getElementById('historyTitleSub');
    const desc = document.getElementById('historyDesc');
    const scrollH = document.getElementById('scrollHint');
    const yearEl = document.getElementById('footerYear');

    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const heroEls = [kicker, titleMain, titleSub, desc, scrollH];
    const delays = [0.3, 0.6, 1.0, 1.4, 1.8];

    heroEls.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => {
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, delays[i] * 1000);
    });

    if (hero && nav) {
        const navObserver = new IntersectionObserver(([entry]) => {
            nav.classList.toggle('scrolled', !entry.isIntersecting);
        }, { threshold: 0.05 });
        navObserver.observe(hero);
    }

    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
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

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const heroH = hero ? hero.offsetHeight : 0;
            if (scrollY < heroH) {
                const heroContent = document.querySelector('.history-hero-content');
                if (heroContent) {
                    const ratio = scrollY / heroH;
                    heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
                    heroContent.style.opacity = 1 - ratio * 0.9;
                }
            }
            ticking = false;
        });
    }, { passive: true });

})();
