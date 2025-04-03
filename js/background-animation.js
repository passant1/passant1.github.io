(function() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const particles = [];
  
  // 定义更深的冷色系颜色数组
  const colors = [
    '96, 177, 189',    // 深天青色
    '106, 156, 182',   // 深钢青
    '85, 156, 185',    // 深天蓝色
    '116, 164, 180',   // 深粉蓝色
    '93, 166, 180',    // 深蓝色
    '95, 188, 188',    // 深绿松石
    '87, 185, 162',    // 深碧绿色
    '76, 144, 180'     // 深青色
  ];
  
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.7;  // 提高整体不透明度
  `;
  
  document.body.prepend(canvas);
  
  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 5 + 3;  // 增大粒子尺寸范围
      this.speedX = Math.random() * 1 - 0.5;
      this.speedY = Math.random() * 1 - 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.color = `rgba(${color}, ${Math.random() * 0.3 + 0.5})`; // 提高最小不透明度
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x < 0 || this.x > canvas.width || 
          this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
  
  function init() {
    setCanvasSize();
    for (let i = 0; i < 150; i++) { // 增加粒子数量到150个
      particles.push(new Particle());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', setCanvasSize);
  init();
  animate();
})();
