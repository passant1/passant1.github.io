(function() {
  var colors = ['#ff0000', '#eb4d4b', '#00ff00', '#7bed9f', '#0000ff', '#70a1ff', '#ffff00', '#ffa801'];
  
  function createParticle(x, y, color) {
    var particle = document.createElement('particle');
    document.body.appendChild(particle);
    
    var width = Math.floor(Math.random() * 30 + 8);
    var height = width;
    var destinationX = (Math.random() - 0.5) * 300;
    var destinationY = (Math.random() - 0.5) * 300;
    var rotation = Math.random() * 520;
    var delay = Math.random() * 200;
    
    particle.style.cssText = `
      position: fixed;
      left: ${x - width/2}px;
      top: ${y - height/2}px;
      width: ${width}px;
      height: ${height}px;
      background-color: ${color};
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
    `;
    
    var animation = particle.animate([
      {
        transform: `translate(0, 0) rotate(0deg)`,
        opacity: 1
      },
      {
        transform: `translate(${destinationX}px, ${destinationY}px) rotate(${rotation}deg)`,
        opacity: 0
      }
    ], {
      duration: Math.random() * 1000 + 1000,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      delay: delay
    });
    
    animation.onfinish = () => {
      particle.remove();
    };
  }
  
  function pop(e) {
    for (let i = 0; i < 8; i++) {
      createParticle(e.clientX, e.clientY, colors[Math.floor(Math.random() * colors.length)]);
    }
  }
  
  document.addEventListener('click', pop);
})();
