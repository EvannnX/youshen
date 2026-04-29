/* ========================================
   Youshen — English Digital Temple
   ======================================== */

(function () {
    'use strict';

    const nav = document.getElementById('siteNav');
    const hero = document.getElementById('templeHero');
    const kicker = document.getElementById('templeKicker');
    const titleMain = document.getElementById('templeTitleMain');
    const titleSub = document.getElementById('templeTitleSub');
    const desc = document.getElementById('templeDesc');
    const enter = document.getElementById('templeEnter');
    const yearEl = document.getElementById('footerYear');
    const modelCount = document.getElementById('modelCount');
    const deityIndex = document.getElementById('deityIndex');
    const corridorGrid = document.getElementById('corridorGrid');
    const mainModel = document.getElementById('mainModel');
    const fallbackImage = document.getElementById('fallbackImage');
    const modelFallback = document.getElementById('modelFallback');
    const altarFrame = document.querySelector('.altar-frame');
    const activeRole = document.getElementById('activeRole');
    const activeName = document.getElementById('activeName');
    const activeDesc = document.getElementById('activeDesc');

    const deities = [
        {
            name: 'Horse Handler',
            role: 'Procession Attendant · Horse Handler',
            image: '../assets/神明图谱/马夫.jpg',
            model: '../assets/神殿模型/马夫.glb',
            desc: 'The horse handler moves with the procession, holding rhythm, direction, and ritual order together.'
        },
        {
            name: 'Prince Zhao',
            role: 'Prince Figure · Contemporary Icon',
            image: '../assets/神明图谱/赵世子.jpg',
            model: '',
            desc: 'Side-parted hair and black-and-gold robes give Prince Zhao one of the most recognizable contemporary Youshen silhouettes.'
        },
        {
            name: 'Prince Zhang',
            role: 'Prince Figure · Zhang Lineage',
            image: '../assets/神明图谱/张世子.jpg',
            model: '',
            desc: 'Prince Zhang carries a more composed and traditional presence within the expanding prince-figure lineage.'
        },
        {
            name: 'Second Prince Zhang',
            role: 'Prince Figure · Younger Presence',
            image: '../assets/神明图谱/张二世子.jpg',
            model: '',
            desc: 'A youthful figure whose styling shows how Youshen continues to absorb new visual language.'
        },
        {
            name: 'Seventh Lord',
            role: 'Underworld Messenger · General Xie',
            image: '../assets/神明图谱/七爷.jpg',
            model: '',
            desc: 'Tall, pale, and elongated, the Seventh Lord forms one half of a powerful underworld pair.'
        },
        {
            name: 'Eighth Lord',
            role: 'Underworld Messenger · General Fan',
            image: '../assets/神明图谱/八爷.jpg',
            model: '',
            desc: 'Dark-faced and heavy in bearing, the Eighth Lord completes the visual contrast of the pair.'
        },
        {
            name: 'White Horse Lord',
            role: 'Local Guardian · Territorial Deity',
            image: '../assets/神明图谱/白马尊王.jpg',
            model: '',
            desc: 'A local guardian figure linking neighborhood, temple, and protected territory.'
        },
        {
            name: 'Nezha',
            role: 'Youthful Deity · Child-God Presence',
            image: '../assets/神明图谱/哪吒.jpg',
            model: '',
            desc: 'A quick, youthful divine image that brings speed and bright energy into the procession.'
        },
        {
            name: 'Fuzhou City God',
            role: 'City God · Patrol and Protection',
            image: '../assets/神明图谱/福州城隍.jpg',
            model: '',
            desc: 'The city-god tradition connects Youshen to older forms of urban protection and public authority.'
        },
        {
            name: 'Five Emperors',
            role: 'Plague-Expelling Deities · Five Spirits',
            image: '../assets/神明图谱/五福大帝台湾.png',
            model: '',
            desc: 'The Five Emperors form a central ritual system of protection, epidemic control, and blessing.'
        },
        {
            name: 'Guan Di',
            role: 'Martial God · Loyalty and Authority',
            image: '../assets/神明图谱/关帝.png',
            model: '',
            desc: 'Red face, long beard, armor, and weaponry turn Guan Di into a solemn center of martial virtue.'
        },
        {
            name: 'Marshal Ma',
            role: 'Protector Marshal · Ritual Guardian',
            image: '../assets/神明图谱/马元帅.JPG',
            model: '',
            desc: 'Marshal figures bring armor, weapons, and talismanic force into the visual language of protection.'
        },
        {
            name: 'Baozhang Gong',
            role: 'Opening Officer · Procession Order',
            image: '../assets/神明图谱/保长公.jpg',
            model: '../assets/神殿模型/保长公.glb',
            desc: 'Baozhang Gong moves near the front of the route, opening the way and carrying the memory of local order into the procession.'
        }
    ];

    if (yearEl) yearEl.textContent = new Date().getFullYear();
    if (modelCount) modelCount.textContent = String(deities.length).padStart(2, '0');

    const heroEls = [kicker, titleMain, titleSub, desc, enter];
    const delays = [0.25, 0.55, 0.95, 1.35, 1.7];

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

    renderTempleItems();
    setActiveDeity(0);

    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const parent = entry.target.parentElement;
                    const siblings = parent.querySelectorAll('.reveal');
                    const idx = Array.from(siblings).indexOf(entry.target);
                    const delay = Math.max(idx, 0) * 120;

                    setTimeout(() => {
                        entry.target.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delay);

                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));
    }

    function renderTempleItems() {
        if (!deityIndex || !corridorGrid) return;

        deityIndex.innerHTML = '';
        corridorGrid.innerHTML = '';

        deities.forEach((deity, index) => {
            const button = document.createElement('button');
            button.className = 'index-button';
            button.type = 'button';
            button.dataset.index = String(index);
            button.innerHTML = `
                <span class="index-number">${String(index + 1).padStart(2, '0')}</span>
                <span>
                    <span class="index-name">${deity.name}</span>
                    <span class="index-role">${deity.role}</span>
                </span>
            `;
            deityIndex.appendChild(button);

            const card = document.createElement('article');
            card.className = 'model-card reveal';
            card.dataset.index = String(index);
            card.innerHTML = `
                <div class="model-card-figure">
                    <img src="${deity.image}" alt="${deity.name}" loading="lazy" />
                </div>
                <div class="model-card-info">
                    <h3>${deity.name}</h3>
                    <span>${deity.role}</span>
                    <p>${deity.desc}</p>
                </div>
            `;
            corridorGrid.appendChild(card);
        });
    }

    function setActiveDeity(index) {
        const deity = deities[index] || deities[0];
        if (!deity) return;

        document.querySelectorAll('.index-button, .model-card').forEach((el) => {
            el.classList.toggle('is-active', el.dataset.index === String(index));
        });

        if (activeRole) activeRole.textContent = deity.role;
        if (activeName) activeName.textContent = deity.name;
        if (activeDesc) activeDesc.textContent = deity.desc;
        if (fallbackImage) {
            fallbackImage.src = deity.image;
            fallbackImage.alt = deity.name;
        }

        if (mainModel && altarFrame) {
            altarFrame.classList.remove('has-model');
            if (deity.model) {
                mainModel.setAttribute('src', deity.model);
                mainModel.setAttribute('alt', deity.name);
            } else {
                mainModel.removeAttribute('src');
                mainModel.removeAttribute('alt');
            }
        }
    }

    if (mainModel && altarFrame) {
        mainModel.addEventListener('load', () => {
            if (mainModel.getAttribute('src')) {
                altarFrame.classList.add('has-model');
            }
        });
        mainModel.addEventListener('error', () => {
            altarFrame.classList.remove('has-model');
        });
    }

    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-index]');
        if (!target) return;
        const index = Number(target.dataset.index);
        if (!Number.isFinite(index)) return;
        setActiveDeity(index);
        if (target.classList.contains('model-card') && modelFallback) {
            modelFallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const heroH = hero ? hero.offsetHeight : 0;
            if (scrollY < heroH) {
                const content = document.querySelector('.temple-hero-content');
                const hall = document.querySelector('.temple-hall');
                const ratio = heroH ? scrollY / heroH : 0;
                if (content) {
                    content.style.transform = `translateY(${scrollY * 0.16}px)`;
                    content.style.opacity = 1 - ratio * 0.85;
                }
                if (hall) {
                    hall.style.transform = `scale(${1 + ratio * 0.04})`;
                }
            }
            ticking = false;
        });
    }, { passive: true });

})();
