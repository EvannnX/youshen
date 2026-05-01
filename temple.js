/* ========================================
   游神 YÓUSHÉN — Digital Temple Interactions
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
            name: '马夫',
            role: '巡游职役 · Horse Handler',
            image: 'assets/神明图谱/马夫.jpg',
            model: 'assets/神殿模型/马夫.glb',
            desc: '马夫随队前行，牵引仪仗的节奏，也维系巡境中的秩序与方向。'
        },
        {
            name: '赵世子',
            role: '世子团 · Prince Squad',
            image: 'assets/神明图谱/赵世子.jpg',
            model: 'assets/神殿模型/赵世子.glb',
            desc: '斜分刘海与黑色鎏金龙袍构成鲜明气质，是当代游神传播中最具辨识度的世子形象之一。'
        },
        {
            name: '张大世子',
            role: '世子团 · Zhang Prince',
            image: 'assets/神明图谱/张世子.jpg',
            model: 'assets/神殿模型/张大世子.glb',
            desc: '显灵公张元伯长子，神态端正而亲近，在世子谱系中保留更传统的仪容气质。'
        },
        {
            name: '张二世子',
            role: '世子团 · Second Prince',
            image: 'assets/神明图谱/张二世子.jpg',
            model: 'assets/神殿模型/张二世子.glb',
            desc: '承接世子团的年轻化造型，在传统神格之外呈现更鲜明的当代审美。'
        },
        {
            name: '七爷',
            role: '阴司使者 · General Xie',
            image: 'assets/神明图谱/七爷.jpg',
            model: '',
            desc: '白面高冠，身形修长，与八爷共同构成阴司使者的双重形象。'
        },
        {
            name: '八爷',
            role: '阴司使者 · General Fan',
            image: 'assets/神明图谱/八爷.jpg',
            model: '',
            desc: '黑面短躯，威严沉重，与七爷一白一黑、一高一矮，形成强烈的仪式对照。'
        },
        {
            name: '白马尊王',
            role: '境主神 · Guardian Deity',
            image: 'assets/神明图谱/白马尊王.jpg',
            model: '',
            desc: '地方境主神的代表之一，连接社区、宫庙与巡境秩序。'
        },
        {
            name: '哪吒',
            role: '孩儿弟 · Nezha',
            image: 'assets/神明图谱/哪吒.jpg',
            model: '',
            desc: '童神形象灵动明快，在巡游队列中带来鲜明的速度感与少年气。'
        },
        {
            name: '福州城隍',
            role: '城隍巡游 · City God',
            image: 'assets/神明图谱/福州城隍.jpg',
            model: '',
            desc: '城隍出巡承载城市空间的守护逻辑，也让游神与地方治理记忆相互交叠。'
        },
        {
            name: '五福大帝',
            role: '瘟神驱疫 · Five Emperors',
            image: 'assets/神明图谱/五福大帝台湾.png',
            model: '',
            desc: '五灵公系统是福州游神信仰的核心之一，从瘟神驱疫到护境赐福，构成巡游的神学根基。'
        },
        {
            name: '关帝',
            role: '忠义武神 · Guan Di',
            image: 'assets/神明图谱/关帝.png',
            model: '',
            desc: '忠义与武勇凝结于关帝形象，红面长髯与甲胄兵器构成庄严的视觉中心。'
        },
        {
            name: '马元帅',
            role: '护法元帅 · Marshal Ma',
            image: 'assets/神明图谱/马元帅.JPG',
            model: '',
            desc: '元帅类神明多具护法意味，甲胄、兵器与法器共同强化威仪。'
        },
        {
            name: '保长公',
            role: '开道先锋 · Procession Officer',
            image: 'assets/神明图谱/保长公.jpg',
            model: 'assets/神殿模型/保长公.glb',
            desc: '保长公行于队列前端，开路、压阵，也把乡土秩序带入神明巡境。'
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
            modelFallback.dataset.message = deity.model ? '模型加载中' : '';
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
                modelFallback.dataset.message = '模型加载失败';
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
