import Reveal from 'reveal.js';
import { createColorStore } from './state.js';
import { createCup } from './cup.js';
import { createBulb } from './bulb.js';
import { createLightMix } from './lightmix.js';
import { createStrip1D, createGrid2D } from './grid2d.js';
import { createCubeIllustration } from './cube.js';
import { animateCount } from './counter.js';
import { createChallenge } from './challenges.js';

// Global references for active components to enable cleanup
let activeComponents = [];
let playgroundStore = null;
let challengeStore = null;

const focusHint = document.getElementById('focusHint');

/**
 * Focus-scoped keyboard capture for interactive cups.
 * Prevents Reveal.js from navigating slides when a cup is focused.
 */
function setupKeyboardCapture() {
  const handleKeyDown = (e) => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.classList.contains('cup-container')) {
      // We only capture Up/Down/Left/Right for the cups.
      // Reveal.js usually uses these for navigation.
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      
      if (e.key === 'Escape') {
        activeEl.blur();
        focusHint.classList.remove('active');
      }
    }
  };

  // Use capture phase to intercept events before Reveal.js
  document.addEventListener('keydown', handleKeyDown, true);
}

function setupFocusListeners() {
  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.classList.contains('cup-container')) {
      focusHint.classList.add('active');
    }
  });

  document.addEventListener('focusout', (e) => {
    if (e.target && e.target.classList.contains('cup-container')) {
      focusHint.classList.remove('active');
    }
  });
}

function cleanupComponents() {
  activeComponents.forEach(comp => {
    if (comp && comp.destroy) comp.destroy();
  });
  activeComponents = [];
}

function initSlide(slide) {
  // Slide 0: Intro Bulb
  const introBulbEl = slide.querySelector('[data-bulb-intro]');
  if (introBulbEl) {
    const store = createColorStore({ r: 255, g: 100, b: 0 });
    activeComponents.push(createBulb({ mountEl: introBulbEl, store }));
    // Add a breathing animation for intro
    let step = 0;
    const breathe = () => {
      step += 0.05;
      const val = Math.sin(step) * 50 + 200;
      store.set('r', val);
      if (slide.contains(introBulbEl)) requestAnimationFrame(breathe);
    };
    breathe();
  }

  // Slide 1: Bulb
  const s1BulbEl = slide.querySelector('[data-bulb-s1]');
  if (s1BulbEl) {
    const store = createColorStore({ r: 255, g: 255, b: 255 });
    activeComponents.push(createBulb({ mountEl: s1BulbEl, store }));
  }

  // Slide 2: Light Mix
  const mixEl = slide.querySelector('[data-lightmix-target]');
  if (mixEl) {
    const store = createColorStore({ r: 255, g: 255, b: 255 });
    activeComponents.push(createLightMix({ mountEl: mixEl, store }));
  }

  // Slide 3: Playground
  if (slide.classList.contains('playground')) {
    playgroundStore = createColorStore({ r: 127, g: 127, b: 127 });
    
    // Setup Cups
    ['r', 'g', 'b'].forEach(chan => {
      const el = slide.querySelector(`#cup-${chan}`);
      if (el) activeComponents.push(createCup({ channel: chan, mountEl: el, store: playgroundStore }));
    });

    // Setup Bulb
    const bulbEl = slide.querySelector('#bulb-playground');
    if (bulbEl) activeComponents.push(createBulb({ mountEl: bulbEl, store: playgroundStore }));

    // Setup Presets
    slide.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const [r, g, b] = btn.dataset.preset.split(',').map(Number);
        playgroundStore.setRGB(r, g, b);
      });
    });
  }

  // Slide 4: Strip
  const stripEl = slide.querySelector('#strip-slide4');
  if (stripEl) {
    createStrip1D({ mountEl: stripEl });
  }

  // Slide 5: Grid
  const gridEl = slide.querySelector('#grid-slide5');
  if (gridEl) {
    createGrid2D({ 
      mountEl: gridEl, 
      onSelect: (r, g, b) => {
        if (playgroundStore) {
          playgroundStore.setRGB(r, g, b);
        }
      }
    });
  }

  // Slide 6: Cube & Counter
  const cubeEl = slide.querySelector('#cube-slide6');
  if (cubeEl) {
    createCubeIllustration({ mountEl: cubeEl });
  }
  const counterEl = slide.querySelector('#counter-16m');
  if (counterEl) {
    animateCount(counterEl, 16777216);
  }

  // Slide 8: Challenge
  const challengeEl = slide.querySelector('#challenge-game');
  if (challengeEl) {
    challengeStore = createColorStore({ r: 0, g: 0, b: 0 });
    // We need the challenge's own cups or a shared set of controls.
    // The plan suggests the same cups + bulb.
    // Since the challenge is on a separate slide, we'll inject a set of cups just for the challenge.
    
    // Create a layout for the challenge slide that includes cups
    const gameBox = challengeEl.querySelector('.challenge-box');
    const cupsDiv = document.createElement('div');
    cupsDiv.className = 'cups-group';
    challengeEl.insertBefore(cupsDiv, gameBox);
    
    ['r', 'g', 'b'].forEach(chan => {
      const cupWrapper = document.createElement('div');
      createCup({ channel: chan, mountEl: cupWrapper, store: challengeStore });
      cupsDiv.appendChild(cupWrapper);
    });

    activeComponents.push(createChallenge({ mountEl: challengeEl, store: challengeStore }));
  }
}

// Initialize Reveal.js
Reveal.initialize({
  hash: true,
  slideNumber: 'c/t',
  controls: true,
  progress: true,
  transition: 'slide',
  backgroundTransition: 'fade',
  width: 1280,
  height: 720,
  margin: 0.04,
  minScale: 0.2,
  maxScale: 1.6,
});

// Wiring lifecycle
Reveal.on('ready', event => {
  const currentSlide = event.currentSlide;
  initSlide(currentSlide);
});

Reveal.on('slidechanged', event => {
  cleanupComponents();
  initSlide(event.currentSlide);
});

// Global setups
setupKeyboardCapture();
setupFocusListeners();
