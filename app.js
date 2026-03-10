// Fluid Perspectives - Working Turbulence Visualization
document.addEventListener('DOMContentLoaded', () => {
    initTurbulence();
});

function initTurbulence() {
    const canvas = document.getElementById('turbulenceCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with explicit parent check
    const container = canvas.parentElement;
    canvas.width = container.clientWidth || 400;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Particles representing flow
    const particles = [];
    const numParticles = 150;
    
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            trail: [],
            color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`
        });
    }
    
    // Vortices array
    let vortices = [];
    
    // Get flow field velocity at position
    function getFlow(x, y) {
        let vx = 0.5; // Mean flow
        let vy = 0;
        
        // Add turbulent noise
        const time = Date.now() / 1000;
        vx += Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time) * 0.5;
        vy += Math.cos(x * 0.015 - time) * Math.sin(y * 0.015 + time) * 0.3;
        
        // Add vortex influences
        vortices.forEach((v, idx) => {
            const dx = x - v.x;
            const dy = y - v.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < v.radius && dist > 1) {
                // Tangential velocity around vortex
                const strength = v.strength * (1 - dist / v.radius) / dist;
                vx += -dy * strength;
                vy += dx * strength;
            }
        });
        
        // Age and remove old vortices
        vortices = vortices.filter(v => {
            v.age++;
            v.strength *= 0.995; // Decay
            return v.age < 200 && v.strength > 0.01;
        });
        
        return { vx, vy };
    }
    
    // Click creates vortex
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create new vortex
        vortices.push({
            x: x,
            y: y,
            strength: 3,
            radius: 100,
            age: 0
        });
        
        // Visual feedback
        createClickRipple(x, y);
    });
    
    // Track mouse for wake effect
    let mouseX = width / 2;
    let mouseY = height / 2;
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    
    // Click ripple effect
    let ripples = [];
    function createClickRipple(x, y) {
        ripples.push({ x, y, radius: 0, maxRadius: 30, opacity: 1 });
    }
    
    function draw() {
        // Fade effect
        ctx.fillStyle = 'rgba(26, 26, 46, 0.08)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw vortices (visual representation)
        vortices.forEach(v => {
            const gradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.radius);
            gradient.addColorStop(0, `rgba(100, 150, 255, ${v.strength * 0.1})`);
            gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw spiral
            ctx.beginPath();
            for (let i = 0; i < 50; i++) {
                const angle = i * 0.2 + v.age * 0.05;
                const r = i * 2;
                const sx = v.x + Math.cos(angle) * r;
                const sy = v.y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.strokeStyle = `rgba(200, 220, 255, ${v.strength * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Update and draw particles
        particles.forEach(p => {
            const flow = getFlow(p.x, p.y);
            
            // Smooth velocity transition
            p.vx += (flow.vx - p.vx) * 0.1;
            p.vy += (flow.vy - p.vy) * 0.1;
            
            // Mouse wake effect
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 60 && dist > 1) {
                const strength = 0.5 * (1 - dist / 60);
                p.vx += (-dy / dist) * strength;
                p.vy += (dx / dist) * strength;
            }
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap edges
            if (p.x < 0) { p.x = width; p.trail = []; }
            if (p.x > width) { p.x = 0; p.trail = []; }
            if (p.y < 0) { p.y = height; p.trail = []; }
            if (p.y > height) { p.y = 0; p.trail = []; }
            
            // Trail management
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 20) p.trail.shift();
            
            // Draw trail
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.lineTo(p.trail[i].x, p.trail[i].y);
                }
                ctx.strokeStyle = p.color + '40';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
        
        // Draw ripples
        ripples = ripples.filter(r => {
            r.radius += 2;
            r.opacity -= 0.05;
            
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            return r.opacity > 0;
        });
        
        requestAnimationFrame(draw);
    }
    
    draw();
    console.log('Turbulence visualization initialized');
}