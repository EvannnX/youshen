import * as THREE from 'three';
import { hall } from './temple-layout.js?v=20261009-plaque-1';
import { narration } from './temple-narration.js';

// The doors share the hall's scene, so the camera crosses a real threshold.
export function createEntrance({ scene, camera, box, wood, gold, stone, ui, reducedMotion, readiness, onComplete }) {
  const gate = new THREE.Group(); scene.add(gate);
  gate.position.z = 11.8;
  box(gate, -(hall.wallX + 3.5) / 2, 4, 0, hall.wallX - 3.5, 8, .65, stone);
  box(gate, (hall.wallX + 3.5) / 2, 4, 0, hall.wallX - 3.5, 8, .65, stone);
  box(gate, 0, 7.25, 0, 7.5, 1.5, .8, wood);
  box(gate, 0, 6.6, .48, 7.5, .12, .14, gold);
  // A shallow forecourt gives the open doorway a real exterior to look onto.
  box(scene, 0, -.18, 22, hall.wallX * 2, .3, 20, stone);
  box(scene, 0, 1.1, 32, hall.wallX * 2, 2.2, .4, stone);
  for (const side of [-1, 1]) {
    box(scene, side * (hall.wallX - .2), 1.1, 22, .4, 2.2, 20, stone);
    box(gate, side * 3.65, 3.3, 0, .25, 6.6, .7, wood);
    box(gate, side * 3.65, 3.3, -.38, .07, 6.6, .07, gold);
  }
  const leaves = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.x = side * 3.5; gate.add(hinge);
    const center = -side * 1.75;
    box(hinge, center, 3.2, 0, 3.48, 6.4, .24, wood);
    for (let i = 0; i < 9; i++) {
      box(hinge, -side * (.2 + i * .385), 3.2, .145, .35, 6.2, .06,
        new THREE.MeshStandardMaterial({ color: i % 2 ? '#392218' : '#47291b', roughness: .85 }));
    }
    for (const y of [.35, 1.45, 4.8, 6.05]) {
      box(hinge, center, y, .21, 3.4, .13, .1, gold);
      for (let i = 0; i < 7; i++) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), gold);
        stud.position.set(-side * (.35 + i * .46), y, .3); hinge.add(stud);
      }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.22, .045, 8, 24), gold);
    ring.position.set(-side * 2.93, 2.85, .34); hinge.add(ring);
    // Rear rails and a second pull ring remain visible when looking back.
    for (const y of [.35, 1.45, 4.8, 6.05]) box(hinge, center, y, -.19, 3.4, .13, .1, gold);
    const rearRing = ring.clone(); rearRing.position.z = -.34; hinge.add(rearRing);
    leaves.push(hinge);
  }
  const light = new THREE.PointLight('#ffbb73', 65, 20, 2);
  light.position.set(0, 4.8, 3); gate.add(light);
  const overlay = document.createElement('section');
  overlay.className = 'entrance'; overlay.setAttribute('aria-label', ui('入殿序章', 'Temple prologue'));
  overlay.innerHTML = `<div class="entrance-copy"><p aria-live="polite"></p><small role="status"></small></div><div class="entrance-actions"><button class="entrance-voice"></button><button class="entrance-skip">${ui('跳过序章，直接入殿 ↗', 'Skip prologue ↗')}</button></div>`;
  document.body.append(overlay); document.body.classList.add('entering');
  const controls = [...document.querySelectorAll('.dock,.move-pad,.location,#scene')];
  controls.forEach(el => el.inert = true);
  const cues = narration[ui('zh', 'en')];
  const paragraphs = cues.map(cue => cue.text);
  const tracks = cues.map(cue => {
    const track = new Audio(cue.src); track.preload = 'auto'; track.volume = .95;
    track.className = 'entrance-track'; track.hidden = true; overlay.append(track);
    return track;
  });
  let elapsed = 0, chapterAge = 0, opening = 0, finished = false, chapter = -1, voice = true;
  let playing = null, pending = false, playToken = 0, needsGesture = false;
  const music = document.getElementById('templeAudio');
  const musicVolume = music.volume;
  const voiceButton = overlay.querySelector('.entrance-voice');
  const syncVoice = () => {
    voiceButton.textContent = voice ? ui('关闭讲解', 'Narration off') : ui('开启语音讲解', 'Narration on');
    voiceButton.setAttribute('aria-pressed', String(voice));
  };
  syncVoice();
  function stopNarration() {
    playToken++; pending = false;
    tracks.forEach(track => track.pause()); playing = null; music.volume = musicVolume;
  }
  function narrate() {
    stopNarration();
    if (!voice || finished) return;
    const token = playToken;
    playing = tracks[Math.max(0, chapter)]; playing.currentTime = 0;
    pending = true; music.volume = Math.min(musicVolume, .1);
    playing.play().then(() => { if (token === playToken) pending = false; }).catch(error => {
      if (token !== playToken || finished) return;
      if (error.name === 'NotAllowedError') {
        pending = false; needsGesture = true; music.volume = musicVolume;
        voiceButton.textContent = ui('点击开启声音', 'Tap to enable audio'); return;
      }
      voice = false; stopNarration(); syncVoice();
      voiceButton.textContent = ui('配音暂不可用，重试', 'Retry narration');
    });
  }
  tracks.forEach(track => track.addEventListener('ended', () => { music.volume = musicVolume; }));
  voiceButton.onclick = () => {
    if (needsGesture) { needsGesture = false; chapterAge = 0; narrate(); syncVoice(); return; }
    voice = !voice; chapterAge = 0; syncVoice();
    if (voice) narrate(); else stopNarration();
  };
  function visibilityChanged() {
    if (document.hidden) playing?.pause();
    else if (voice && playing && !playing.ended) playing.play().catch(() => { voice = false; stopNarration(); syncVoice(); });
  }
  function unlockNarration(e) {
    if (!needsGesture || !voice || finished || e.target.closest?.('button,a')) return;
    needsGesture = false; chapterAge = 0; narrate(); syncVoice();
  }
  document.addEventListener('pointerdown', unlockNarration);
  document.addEventListener('keydown', unlockNarration);
  document.addEventListener('visibilitychange', visibilityChanged);
  function finish() {
    if (finished) return;
    finished = true; stopNarration(); document.removeEventListener('pointerdown', unlockNarration); document.removeEventListener('keydown', unlockNarration); document.removeEventListener('visibilitychange', visibilityChanged);
    leaves[0].rotation.y = Math.PI * .48; leaves[1].rotation.y = -Math.PI * .48; overlay.remove(); document.body.classList.remove('entering');
    controls.forEach(el => el.inert = false);
    camera.position.set(0, 2.5, 3.8); onComplete();
  }
  overlay.querySelector('.entrance-skip').onclick = finish;
  camera.position.set(0, 2.8, 19.5);
  return {
    get active() { return !finished; },
    update(dt) {
      if (finished) return;
      if (needsGesture) return;
      elapsed += dt; chapterAge += dt;
      const { ready, settled, total } = readiness();
      const canOpen = ready >= 2 || settled === total || elapsed >= 28;
      const narrationDone = !voice || (!pending && (!playing || playing.ended || playing.error)) || chapterAge > cues[Math.max(0, chapter)].duration + 10;
      if (chapter >= 2 && chapterAge >= 4 && narrationDone && canOpen) opening += dt;
      // Once the door starts moving it must continue across chapter changes.
      else if (opening > 0) opening += dt;
      const next = opening > (reducedMotion ? 0 : 2) ? 3 : chapter < 0 ? 0 : chapter < 2 && chapterAge >= 4 && narrationDone ? chapter + 1 : chapter;
      if (next !== chapter) {
        chapter = next; chapterAge = 0;
        overlay.querySelector('p').textContent = paragraphs[chapter]; narrate();
      }
      overlay.querySelector('small').textContent = ready >= 2
        ? ui('门庭神像已就位，静候入殿', 'Entrance figures are ready')
        : ui(`正在迎请门庭神像 ${ready} / ${total}`, `Preparing entrance figures ${ready} / ${total}`);
      const t = Math.min(1, opening / (reducedMotion ? .5 : 6));
      const ease = t * t * (3 - 2 * t);
      leaves[0].rotation.y = ease * Math.PI * .48;
      leaves[1].rotation.y = -ease * Math.PI * .48;
      if (!reducedMotion) {
        camera.position.z = 19.5 - Math.min(elapsed / 12, 1) * 2 - ease * 13.7;
        camera.position.y = 2.8 - ease * .3;
      }
      if (t === 1 && chapter === 3 && narrationDone && chapterAge >= (voice ? .5 : 4)) finish();
    }
  };
}
