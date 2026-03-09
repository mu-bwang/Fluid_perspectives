// Fluid Perspectives - Interactive Fluid Mechanics Blog

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Turbulence Canvas
    initTurbulenceVisualization();
});

// Proper Turbulence Visualization
function initTurbulenceVisualization() {
    const canvas = document.getElementById('turbulenceCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Flow field parameters
    const cols = 50;
    const rows = 30;
    const scale = 0.01;
    let time = 0;
    
    // Particles representing tracer particles in turbulent flow
    const particles = [];
    const numParticles = 800;
    
    // Initialize particles across the flow
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            age: Math.random() * 100,
            lifespan: 100 + Math.random() * 100,
            trail: []
        });
    }
    
    // Mouse interaction - creates disturbances like obstacles in flow
    let mouseX = width / 2;
    let mouseY = height / 2;
    let mouseActive = false;
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        mouseActive = true;
    });
    
    canvas.addEventListener('mouseleave', () => {
        mouseActive = false;
    });
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Create a strong vortex at click location
        particles.forEach(p => {
            const dx = p.x - clickX;
            const dy = p.y - clickY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 0) {
                // Vortex velocity field: tangential velocity proportional to 1/r
                const strength = 50 / (dist + 10);
                p.vx += (-dy / dist) * strength;
                p.vy += (dx / dist) * strength;
            }
        });
    });
    
    // Curl noise function for generating turbulence
    function curlNoise(x, y, t) {
        // Simplified 2D curl noise using multiple sine waves
        const scale1 = 0.003;
        const scale2 = 0.007;
        const scale3 = 0.015;
        
        // Potential function
        const p1 = Math.sin(x * scale1 + t * 0.5) * Math.cos(y * scale1 + t * 0.3);
        const p2 = Math.sin(x * scale2 - t * 0.7) * Math.sin(y * scale2 + t * 0.4);
        const p3 = Math.cos(x * scale3 + t * 0.2) * Math.sin(y * scale3 - t * 0.6);
        
        // Curl of potential (90 degree rotation of gradient)
        // u = -d(p)/dy, v = d(p)/dx
        const u = -(
            scale1 * Math.sin(x * scale1 + t * 0.5) * (-Math.sin(y * scale1 + t * 0.3)) +
            scale2 * Math.sin(x * scale2 - t * 0.7) * Math.cos(y * scale2 + t * 0.4) +
            scale3 * Math.cos(x * scale3 + t * 0.2) * Math.cos(y * scale3 - t * 0.6)
        ) * 10;
        
        const v = (
            scale1 * Math.cos(x * scale1 + t * 0.5) * Math.cos(y * scale1 + t * 0.3) +
            scale2 * Math.cos(x * scale2 - t * 0.7) * Math.sin(y * scale2 + t * 0.4) +
            scale3 * (-Math.sin(x * scale3 + t * 0.2)) * Math.sin(y * scale3 - t * 0.6)
        ) * 10;
        
        // Add large-scale mean flow (left to right)
        const meanFlow = 0.5;
        
        return { 
            u: u + meanFlow + (Math.random() - 0.5) * 0.3, // Add small random fluctuations
            v: v + (Math.random() - 0.5) * 0.3 
        };
    }
    
    function drawStreamlines() {
        // Draw faint streamlines to show flow structure
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < height; y += 40) {
            let x = 0;
            let sx = x;
            let sy = y;
            
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            
            for (let step = 0; step < 100 && x < width; step++) {
                const noise = curlNoise(x, y, time);
                x += noise.u * 2;
                y += noise.v * 2;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    function drawVorticityField() {
        // Visualize vorticity with color grid
        const gridSize = 20;
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                const noise = curlNoise(x, y, time);
                const velocity = Math.sqrt(noise.u * noise.u + noise.v * noise.v);
                const angle = Math.atan2(noise.v, noise.u);
                
                // Vorticity visualization: high velocity = brighter
                const brightness = Math.min(1, velocity / 5);
                const hue = (angle + Math.PI) / (2 * Math.PI) * 60 + 200; // Blue to purple range
                
                ctx.fillStyle = `hsla(${hue}, 70%, ${20 + brightness * 30}%, 0.3)`;
                ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
            }
        }
    }
    
    function animate() {
        // Dark background with trails
        ctx.fillStyle = 'rgba(26, 26, 46, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw vorticity field (subtle background)
        drawVorticityField();
        
        // Draw streamlines
        drawStreamlines();
        
        // Update and draw particles
        particles.forEach((p, i) => {
            // Get velocity from flow field
            const flow = curlNoise(p.x, p.y, time);
            const targetVx = flow.u * 2;
            const targetVy = flow.v * 2;
            
            // Smooth particle velocity towards flow field
            p.vx += (targetVx - p.vx) * 0.1;
            p.vy += (targetVy - p.vy) * 0.1;
            
            // Mouse disturbance (creates wake/vortex)
            if (mouseActive) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 80 && dist > 5) {
                    // Wake effect behind mouse
                    const strength = 2 * (1 - dist / 80);
                    
                    // Create vorticity - perpendicular push
                    p.vx += (-dy / dist) * strength;
                    p.vy += (dx / dist) * strength;
                }
            }
            
            // Add random turbulent fluctuations
            if (Math.random() < 0.02) {
                p.vx += (Math.random() - 0.5) * 1;
                p.vy += (Math.random() - 0.5) * 1;
            }
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.age++;
            
            // Store trail
            p.trail.push({x: p.x, y: p.y});
            if (p.trail.length > 15) p.trail.shift();
            
            // Reset particle if too old or out of bounds
            if (p.age > p.lifespan || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
                p.x = Math.random() * width * 0.2; // Respawn on left side
                p.y = Math.random() * height;
                p.vx = 0;
                p.vy = 0;
                p.age = 0;
                p.trail = [];
            }
            
            // Draw trail (showing path through turbulent flow)
            if (p.trail.length >