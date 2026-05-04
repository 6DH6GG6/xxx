class GlobalLiquidEffect {
  constructor(sounds) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'liquid-canvas';
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:none';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.activeRipple = null;
    this.mouse = { x: 0, y: 0, down: false };
    this.dragDistance = 0;
    this.dragSoundPlayed = false;

    this.clickSound = new Audio(sounds.click);
    this.dragSound = new Audio(sounds.drag);
    this.clickSound.preload = 'auto';
    this.dragSound.preload = 'auto';
    this.clickSound.volume = 0.4;
    this.dragSound.volume = 0.5;

    this.resize();
    this.bindEvents();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  playClickSound() {
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(e => {});
  }

  playDragSound() {
    this.dragSound.currentTime = 0;
    this.dragSound.play().catch(e => {});
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * devicePixelRatio;
    this.canvas.height = this.height * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  bindEvents() {
    window.addEventListener('mousedown', e => {e.preventDefault();this.down(e);});
    window.addEventListener('mousemove', e => this.move(e));
    window.addEventListener('mouseup', () => this.up());
    window.addEventListener('touchstart', e => {e.preventDefault();this.down(e.touches[0]);},{passive:false});
    window.addEventListener('touchmove', e => {e.preventDefault();this.move(e.touches[0]);},{passive:false});
    window.addEventListener('touchend', () => this.up());
  }

  down(e) {
    this.mouse.down = true;
    this.dragDistance = 0;
    this.dragSoundPlayed = false;
    this.playClickSound();
    this.activeRipple = {
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      radius: 0,
      maxRadius: 0,
      alpha: 0.9,
      state: 'dragging'
    };
  }

  move(e) {
    if (!this.mouse.down ||!this.activeRipple) return;
    const dx = e.clientX - this.activeRipple.startX;
    const dy = e.clientY - this.activeRipple.startY;
    this.dragDistance = Math.sqrt(dx*dx + dy*dy);
    if (this.dragDistance > 2 &&!this.dragSoundPlayed) {
      this.playDragSound();
      this.dragSoundPlayed = true;
    }
    this.activeRipple.x = e.clientX;
    this.activeRipple.y = e.clientY;
    this.activeRipple.maxRadius = Math.max(this.activeRipple.maxRadius, this.dragDistance + 60);
  }

  up() {
    if (!this.activeRipple) return;
    this.mouse.down = false;
    this.activeRipple.state = 'releasing';
    this.activeRipple.releaseTime = 0;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawDistortion();
    requestAnimationFrame(() => this.animate());
  }

  drawDistortion() {
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;
    if (this.activeRipple) {
      const r = this.activeRipple;
      if (r.state === 'dragging') {
        r.radius = r.maxRadius;
      } else if (r.state === 'releasing') {
        r.releaseTime += 0.06;
        r.radius = r.maxRadius * (1 + Math.sin(r.releaseTime * 10) * Math.exp(-r.releaseTime * 2.5) * 0.6);
        r.alpha *= 0.93;
        if (r.alpha < 0.01) this.activeRipple = null;
      }
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const dist = Math.sqrt((x - r.x) ** 2 + (y - r.y) ** 2);
          let dx = 0, dy = 0;
          if (dist < r.radius && r.radius > 0) {
            const normDist = dist / r.radius;
            const wave = Math.cos(normDist * Math.PI) * 0.5 + 0.5;
            const force = wave * wave * 40 * r.alpha;
            const angle = Math.atan2(y - r.y, x - r.x);
            dx = Math.cos(angle) * force;
            dy = Math.sin(angle) * force;
          }
          const i = (y * this.width + x) * 4;
          const distortion = Math.sqrt(dx*dx + dy*dy);
          const brightness = 10 + distortion * 8;
          data[i] = brightness;
          data[i+1] = brightness + 5;
          data[i+2] = brightness + 20;
          data[i+3] = 255;
        }
      }
    } else {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 10; data[i+1] = 10; data[i+2] = 20; data[i+3] = 255;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }
}

window.LiquidEffect = GlobalLiquidEffect;
 
