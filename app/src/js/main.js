import Reveal from 'reveal.js';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import '../css/theme.css';
import '../css/components.css';

import { createColorStore } from './state.js';
import { shouldUseHash } from './util.js';

import { createCup } from './cup.js';
import { createBulb } from './bulb.js';
import { createLightMix } from './lightmix.js';
import { createStrip1D, createGrid2D } from './grid2d.js';
import { createCubeIllustration } from './cube.js';
import { animateCount } from './counter.js';
import { createChallenge } from './challenges.js';
import { createLightSwitch } from './lightswitch.js';

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
    const tag = activeEl ? activeEl.tagName : '';
    if (activeEl && activeEl.classList.contains('light-switch')) {
      // The switch is a native button (Enter/Space), but Reveal.js also uses
      // Space and arrows for navigation — capture them while it is focused.
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        // Native button activation was blocked above, so activate here.
        activeEl.click();
      }
      if (e.key === 'Escape') activeEl.blur();
      return;
    }
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

  // Slide 3: On/off switch (0 ↔ 255)
  const switchBtn = slide.querySelector('[data-light-switch]');
  if (switchBtn) {
    const store = createColorStore({ r: 0, g: 0, b: 0 });
    activeComponents.push(createBulb({ mountEl: slide.querySelector('[data-bulb-switch]'), store }));
    activeComponents.push(createLightSwitch({
      mountEl: switchBtn,
      store,
      stepsEl: slide.querySelector('[data-steps-scale]'),
      valueEl: slide.querySelector('[data-switch-value]'),
      captionEl: slide.querySelector('[data-switch-caption]'),
    }));
  }

  // Slide 4: Playground
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
    // Build the challenge UI first; it owns the markup of the slide.
    activeComponents.push(createChallenge({ mountEl: challengeEl, store: challengeStore }));

    // The child mixes light with the same cups as the playground, so mount a
    // fresh set of cups into the challenge layout after the UI exists.
    const cupsDiv = challengeEl.querySelector('.challenge-cups');
    ['r', 'g', 'b'].forEach(chan => {
      const cupWrapper = document.createElement('div');
      activeComponents.push(createCup({ channel: chan, mountEl: cupWrapper, store: challengeStore }));
      cupsDiv.appendChild(cupWrapper);
    });
  }
}

// reveal.js hash:true calls history.replaceState(location.pathname) on the first
// write, which throws SecurityError when the deck is opened from disk (file://).
// Keep hash URLs for dev/hosted use, disable them for local files.
const useHash = shouldUseHash(window.location.protocol);

// Initialize Reveal.js
Reveal.initialize({
  hash: useHash,
  history: false,
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

// reveal.js centers a section by writing an inline `top` from its scrollHeight.
// Any DOM mutation after that pass leaves the top stale → the slide is pushed
// down and clipped. Re-run the layout whenever we change the DOM.
let layoutQueued = false;
const scheduleLayout = () => {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => {
    layoutQueued = false;
    Reveal.layout();
  });
};
// Any later height change (a bulb readout, a resizing canvas, a future
// widget) is self-healing. Reveal.layout() only writes `top`, never `height`,
// so the observer cannot loop.
const sectionObserver = new ResizeObserver(scheduleLayout);
function observePresentSlide(slide) {
  sectionObserver.disconnect();
  if (slide) sectionObserver.observe(slide);
}

// Wiring lifecycle
Reveal.on('ready', event => {
  const currentSlide = event.currentSlide;
  initSlide(currentSlide);
  scheduleLayout();
  observePresentSlide(currentSlide);
});

Reveal.on('slidechanged', event => {
  cleanupComponents();
  initSlide(event.currentSlide);
  scheduleLayout();
  observePresentSlide(event.currentSlide);
});

// Fonts change text metrics (and therefore section heights) after first paint.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => Reveal.layout());
}

// Global setups
setupKeyboardCapture();
setupFocusListeners();
