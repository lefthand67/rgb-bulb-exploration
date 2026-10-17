export function createLightMix({ mountEl, store }) {
  mountEl.innerHTML = `
    <div class="lightmix-container">
      <div class="lightmix-circle red" data-lchan="r"></div>
      <div class="lightmix-circle green" data-lchan="g"></div>
      <div class="lightmix-circle blue" data-lchan="b"></div>
    </div>
  `;

  const redCircle = mountEl.querySelector('.lightmix-circle.red');
  const greenCircle = mountEl.querySelector('.lightmix-circle.green');
  const blueCircle = mountEl.querySelector('.lightmix-circle.blue');

  const unsubscribe = store.subscribe(({ r, g, b }) => {
    redCircle.style.opacity = r / 255;
    greenCircle.style.opacity = g / 255;
    blueCircle.style.opacity = b / 255;
  });

  return {
    destroy() {
      unsubscribe();
    }
  };
}
