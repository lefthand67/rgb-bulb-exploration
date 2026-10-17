export function createCubeIllustration({ mountEl }) {
  mountEl.innerHTML = `
    <div class="cube-illustration">
      <div class="cube-slice" style="transform: translateZ(-60px);"></div>
      <div class="cube-slice" style="transform: translateZ(-30px);"></div>
      <div class="cube-slice" style="transform: translateZ(0px);"></div>
      <div class="cube-slice" style="transform: translateZ(30px);"></div>
      <div class="cube-slice" style="transform: translateZ(60px);"></div>
    </div>
  `;
}
