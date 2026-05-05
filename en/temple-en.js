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
            role: 'Procession Role · Horse Handler',
            image: '../assets/神明图谱/马夫.jpg',
            model: '../assets/神殿模型/马夫.glb',
            desc: 'The horse handler travels with the procession, helping set its pace, direction, and ritual order.'
        },
        {
            name: 'Prince Zhao',
            role: 'Prince Squad · Contemporary Icon',
            image: '../assets/神明图谱/赵世子.jpg',
            model: '../assets/神殿模型/赵世子.glb',
            desc: 'With side-parted hair and a black-and-gold dragon robe, Prince Zhao has become one of the most recognizable prince figures in contemporary Youshen culture.'
        },
        {
            name: 'Elder Prince Zhang',
            role: 'Prince Squad · Zhang Lineage',
            image: '../assets/神明图谱/张世子.jpg',
            model: '../assets/神殿模型/张大世子.glb',
            desc: 'The eldest son of Zhang Yuanbo, Xianling Gong, he keeps a steadier and more traditional bearing within the Prince Squad.'
        },
        {
            name: 'Second Prince Zhang',
            role: 'Prince Squad · Younger Presence',
            image: '../assets/神明图谱/张二世子.jpg',
            model: '../assets/神殿模型/张二世子.glb',
            desc: 'His younger styling gives the Prince Squad a more contemporary look, showing how Youshen keeps absorbing new visual language.'
        },
        {
            name: 'Seventh Lord',
            role: 'Underworld Messenger · General Xie',
            image: '../assets/神明图谱/七爷.jpg',
            model: '',
            desc: 'Tall, pale, and long-bodied, the Seventh Lord forms one half of the underworld pair with the Eighth Lord.'
        },
        {
            name: 'Eighth Lord',
            role: 'Underworld Messenger · General Fan',
            image: '../assets/神明图谱/八爷.jpg',
            model: '',
            desc: 'Dark-faced, shorter, and weightier in presence, the Eighth Lord completes the pair through strong ritual contrast.'
        },
        {
            name: 'Baima Zunwang',
            role: 'Territorial Guardian · Local Protector',
            image: '../assets/神明图谱/白马尊王.jpg',
            model: '',
            desc: 'A representative territorial guardian, Baima Zunwang links neighborhood, temple, and the protected ritual boundary.'
        },
        {
            name: 'Nezha',
            role: 'Child Deity · Nezha',
            image: '../assets/神明图谱/哪吒.jpg',
            model: '',
            desc: 'A lively child deity whose image brings speed, brightness, and youthful force into the procession.'
        },
        {
            name: 'Fuzhou City God',
            role: 'City God Procession · Urban Guardian',
            image: '../assets/神明图谱/福州城隍.jpg',
            model: '',
            desc: 'The City God procession carries an older logic of urban protection, linking Youshen with civic order and local memory.'
        },
        {
            name: 'Five Blessing Emperors',
            role: 'Plague-Expelling Deities · Five Linggong',
            image: '../assets/神明图谱/五福大帝台湾.png',
            model: '',
            desc: 'The Five Linggong system is one of the foundations of Fuzhou Youshen, turning plague-expelling power into protection and blessing for the community.'
        },
        {
            name: 'Guan Di',
            role: 'Martial God · Loyalty and Authority',
            image: '../assets/神明图谱/关帝.png',
            model: '',
            desc: 'Guan Di gathers loyalty and martial courage into one solemn image, marked by red face, long beard, armor, and weapon.'
        },
        {
            name: 'Marshal Ma',
            role: 'Protector Marshal · Ritual Power',
            image: '../assets/神明图谱/马元帅.JPG',
            model: '',
            desc: 'Marshal figures often carry a protector role; armor, weapons, and ritual implements all heighten their commanding presence.'
        },
        {
            name: 'Baozhang Gong',
            role: 'Path Opener · Procession Order',
            image: '../assets/神明图谱/保长公.jpg',
            model: '../assets/神殿模型/保长公.glb',
            desc: 'Baozhang Gong moves near the front, clearing the way, holding the line, and bringing memories of local order into the deity procession.'
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
        if (modelFallback) {
            modelFallback.classList.toggle('is-loading', Boolean(deity.model));
            modelFallback.classList.remove('is-error');
            modelFallback.dataset.message = deity.model ? 'Loading model' : '';
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
                if (modelFallback) modelFallback.classList.remove('is-loading', 'is-error');
            }
        });
        mainModel.addEventListener('error', () => {
            altarFrame.classList.remove('has-model');
            if (modelFallback) {
                modelFallback.classList.remove('is-loading');
                modelFallback.classList.add('is-error');
                modelFallback.dataset.message = 'Model failed to load';
            }
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
