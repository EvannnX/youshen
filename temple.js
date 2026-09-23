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
    const FRONT_CAMERA_ORBIT = '90deg 75deg auto';

    const deities = [
        {
            name: '保长公',
            role: '巡游前导  —  Procession Leader',
            stage: '开道与仪仗',
            image: 'assets/神明图谱/保长公.jpg',
            model: 'assets/神殿模型/保长公.glb',
            desc: '巡游中的前导角色。保长公通常位于队伍前方，与炮手、旗锣和高照等仪仗共同开路，引导神驾进入巡游路线。'
        },
        {
            name: '马夫',
            role: '开道角色  —  Path Opener',
            stage: '开道与仪仗',
            image: 'assets/神明图谱/马夫.jpg',
            model: 'assets/神殿模型/马夫.glb',
            desc: '行进在神驾前方的开道角色。马夫手持马鞭，以往返跑跳和挥鞭动作清理道路，为后方的神将与主神开出巡游通道。'
        },
        {
            name: '赵世子',
            role: '陪祀世子  —  Prince Zhao',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/赵世子.jpg',
            model: 'assets/神殿模型/赵世子.glb',
            desc: '五福大帝信仰体系中的世子之一。福州地方传说将他与振灵公赵光明联系在一起，在巡游中以陪祀神身份随神驾出行。'
        },
        {
            name: '张大世子',
            role: '陪祀世子  —  Elder Prince Zhang',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/张世子.jpg',
            model: 'assets/神殿模型/张大世子.glb',
            desc: '显灵公张元伯信仰体系中的世子，与张二世子共同构成福州游神中较为人熟知的世子形象。'
        },
        {
            name: '张二世子',
            role: '陪祀世子  —  Second Prince Zhang',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/张二世子.jpg',
            model: 'assets/神殿模型/张二世子.glb',
            desc: '显灵公张元伯信仰体系中的世子之一，经常与张大世子共同出现在福州游神的神将阵容中。'
        },
        {
            name: '华光大世子',
            role: '陪祀世子  —  Prince Huaguang',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/华光大世子.jpg',
            model: 'assets/神殿模型/华光大世子.glb',
            desc: '华光大帝信仰体系中的世子形象，常以额生神目、黑金龙甲与红袍示人，在巡游阵容中展现威仪与护卫意味。'
        },
        {
            name: '金龙太子',
            role: '陪祀太子  —  Golden Dragon Prince',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/金龙太子.jpg',
            model: 'assets/神殿模型/金龙太子.glb',
            desc: '福州游神中的太子形象之一，常以金鳞龙袍与华丽冠饰塑造俊秀而庄重的形象，作为陪祀角色随神驾巡行。'
        },
        {
            name: '长郡主',
            role: '陪祀郡主  —  Princess Zhang',
            stage: '世子与陪祀',
            image: 'assets/神明图谱/张郡主.jpg',
            model: 'assets/神殿模型/长郡主.glb',
            desc: '显灵公张元伯信仰体系中的郡主形象，也是世子阵容中具有辨识度的女性陪祀角色。'
        },
        {
            name: '孩儿弟',
            role: '童神角色  —  Child Deity',
            stage: '神将与部属',
            image: 'assets/神明图谱/孩儿弟.jpg',
            model: 'assets/神殿模型/孩儿弟.glb',
            desc: '以大头、围兜、侧辫与笑容为特征的童神角色，在巡游中以活泼亲近的形象丰富神驾阵容。'
        },
        {
            name: '哪吒',
            role: '童神将  —  Nezha',
            stage: '神将与部属',
            image: 'assets/神明图谱/哪吒.jpg',
            model: 'assets/神殿模型/哪吒.glb',
            desc: '福州游神中常见的童神形象。在不同地方的神驾阵容中，他可以作为随行神将出现，具体关系与位置因境庙而异。'
        },
        {
            name: '小太子',
            role: '童神角色  —  Little Prince',
            stage: '神将与部属',
            image: 'assets/神明图谱/小太子.jpg',
            model: 'assets/神殿模型/小太子.glb',
            desc: '为少年参与游神而塑造的较小型太子形象，体量更轻，也让年轻一代能够进入巡游与传承的现场。'
        },
        {
            name: '七爷',
            role: '随行神将  —  Seventh Lord',
            stage: '神将与部属',
            image: 'assets/神明图谱/七爷.jpg',
            model: 'assets/神殿模型/七爷.glb',
            desc: '福州游神中常见的随行神将，通常与八爷成对出现。其神像常制成可由人挺行的塔骨，随主神巡行村境。'
        },
        {
            name: '八爷',
            role: '随行神将  —  Eighth Lord',
            stage: '神将与部属',
            image: 'assets/神明图谱/八爷.jpg',
            model: 'assets/神殿模型/八爷.glb',
            desc: '与七爷共同出现的随行神将，也是福州传统游神中常见的塔骨形象之一。'
        },
        {
            name: '马元帅',
            role: '护法神将  —  Marshal Ma',
            stage: '神将与部属',
            image: 'assets/神明图谱/马元帅.JPG',
            model: 'assets/神殿模型/马元帅.glb',
            desc: '道教护法神将之一，在不同宫庙的神驾中具有镇护与威仪象征；是否随行以及具体位置会因境庙而异。'
        },
        {
            name: '关帝',
            role: '武神信仰  —  Guan Di',
            stage: '主祀与地方信仰',
            image: 'assets/神明图谱/关帝.png',
            model: 'assets/神殿模型/关帝.glb',
            desc: '广泛供奉的忠义武神，在福州部分境庙和迎神活动中也会出巡。在不同神驾中，关帝的主祀或陪祀关系需结合当地宫庙理解。'
        },
        {
            name: '白马尊王',
            role: '地方保护神  —  White Horse King',
            stage: '主祀与地方信仰',
            image: 'assets/神明图谱/白马尊王.jpg',
            model: 'assets/神殿模型/白马尊王.glb',
            desc: '福州重要的地方保护神之一。白马尊王信仰长期分布于福州及周边地区，各地境庙也形成了自己的祭祀与迎神传统。'
        },
        {
            name: '福州城隍',
            role: '城邑保护神  —  Fuzhou City God',
            stage: '主祀与地方信仰',
            image: 'assets/神明图谱/福州城隍.jpg',
            model: 'assets/神殿模型/福州城隍.glb',
            desc: '守护城邑的城隍神。福州城隍出巡将城市空间、地方秩序与巡境祈安的传统联系起来。'
        },
        {
            name: '五福大帝',
            role: '地方保护神  —  Five Emperors',
            stage: '主祀与地方信仰',
            image: 'assets/神明图谱/五福大帝台湾.png',
            model: 'assets/神殿模型/五福大帝群像.glb',
            desc: '福州重要的地方保护神信仰体系，与驱疫、祈安和保境传统关系密切。在长乐等地的游神活动中，五福大帝会与所属部将及其他神圣共同巡境。'
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

    if (mainModel && altarFrame) {
        mainModel.addEventListener('load', showLoadedModel);
        mainModel.addEventListener('error', () => {
            altarFrame.classList.remove('has-model');
            if (modelFallback) {
                modelFallback.classList.remove('is-loading');
                modelFallback.classList.add('is-error');
                modelFallback.dataset.message = '模型加载失败';
            }
        });
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
                    <span class="index-role">${deity.stage} ${deity.role}</span>
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
                    <small>${deity.stage}</small>
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
            if (deity.model) {
                const isAlreadyLoaded = mainModel.getAttribute('src') === deity.model && mainModel.loaded;
                mainModel.setAttribute('camera-orbit', FRONT_CAMERA_ORBIT);
                mainModel.setAttribute('src', deity.model);
                mainModel.setAttribute('alt', deity.name);
                if (isAlreadyLoaded) showLoadedModel();
                else altarFrame.classList.remove('has-model');
            } else {
                altarFrame.classList.remove('has-model');
                mainModel.removeAttribute('src');
                mainModel.removeAttribute('alt');
            }
        }
    }

    function showLoadedModel() {
        if (!mainModel?.getAttribute('src') || !altarFrame) return;
        mainModel.setAttribute('camera-orbit', FRONT_CAMERA_ORBIT);
        mainModel.resetTurntableRotation?.();
        mainModel.jumpCameraToGoal?.();
        altarFrame.classList.add('has-model');
        if (modelFallback) modelFallback.classList.remove('is-loading', 'is-error');
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
