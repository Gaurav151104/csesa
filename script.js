// ==================== THREE.JS SETUP ====================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;

// ==================== BINARY DIGIT TEXTURE GENERATION ====================
function createBinaryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 64, 64);
    
    // Random 0 or 1
    const digit = Math.random() > 0.5 ? '0' : '1';
    
    // Draw binary digit
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 50px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(digit, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
}

// ==================== PARTICLES SYSTEM WITH BINARY TEXTURE ====================
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);
const originalPosArray = new Float32Array(particlesCount * 3);
const targetPosArray = new Float32Array(particlesCount * 3);

// Define cube vertices for final configuration
const cubeSize = 2;
const cubeVertices = [
    [-cubeSize, -cubeSize, -cubeSize],
    [cubeSize, -cubeSize, -cubeSize],
    [cubeSize, cubeSize, -cubeSize],
    [-cubeSize, cubeSize, -cubeSize],
    [-cubeSize, -cubeSize, cubeSize],
    [cubeSize, -cubeSize, cubeSize],
    [cubeSize, cubeSize, cubeSize],
    [-cubeSize, cubeSize, cubeSize]
];

// Distribute particles: initial random, target on cube+edges
for(let i = 0; i < particlesCount; i++) {
    // Initial random scattered positions
    originalPosArray[i * 3] = (Math.random() - 0.5) * 15;
    originalPosArray[i * 3 + 1] = (Math.random() - 0.5) * 15;
    originalPosArray[i * 3 + 2] = (Math.random() - 0.5) * 15;
    
    // Copy to current position
    posArray[i * 3] = originalPosArray[i * 3];
    posArray[i * 3 + 1] = originalPosArray[i * 3 + 1];
    posArray[i * 3 + 2] = originalPosArray[i * 3 + 2];
    
    // Target: distribute particles along cube edges and vertices
    const particleIndex = i % (cubeVertices.length * 4); // Repeat pattern for edges
    const vertexA = cubeVertices[Math.floor(i / ((particlesCount / cubeVertices.length)))];
    const vertexB = cubeVertices[(Math.floor(i / ((particlesCount / cubeVertices.length))) + 1) % cubeVertices.length];
    const t = (i % Math.ceil(particlesCount / cubeVertices.length)) / Math.ceil(particlesCount / cubeVertices.length);
    
    targetPosArray[i * 3] = vertexA[0] * (1 - t) + vertexB[0] * t;
    targetPosArray[i * 3 + 1] = vertexA[1] * (1 - t) + vertexB[1] * t;
    targetPosArray[i * 3 + 2] = vertexA[2] * (1 - t) + vertexB[2] * t;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    map: createBinaryTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    color: 0x3b82f6
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// ==================== WIREFRAME CUBE ====================
const cubeGeometry = new THREE.BoxGeometry(cubeSize * 2, cubeSize * 2, cubeSize * 2);
const cubeMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00f2ff, 
    linewidth: 2,
    transparent: true,
    opacity: 0
});
const cubeWireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeGeometry),
    cubeMaterial
);
scene.add(cubeWireframe);

// ==================== HEARTBEAT PULSE ANIMATION ====================
function createHeartbeatTimeline() {
    return gsap.timeline({ repeat: -1 })
        .to(cubeWireframe.material, { opacity: 0.3, duration: 0.3 }, 0)
        .to(cubeWireframe.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.15 }, 0)
        .to(cubeWireframe.material, { opacity: 0, duration: 0.2 }, 0.35)
        .to(cubeWireframe.scale, { x: 1, y: 1, z: 1, duration: 0.2 }, 0.35)
        .to(cubeWireframe.material, { opacity: 0.4, duration: 0.3 }, 0.55)
        .to(cubeWireframe.material, { opacity: 0, duration: 0.4 }, 0.85);
}

let heartbeatTL = createHeartbeatTimeline();
let convergenceActive = false;

// ==================== SCROLL TRIGGER FOR CONVERGENCE ====================
gsap.registerPlugin(ScrollTrigger);

const committeeSection = document.getElementById('committee');
let scrollTriggerCreated = false;

function createScrollTrigger() {
    if (scrollTriggerCreated) return;
    scrollTriggerCreated = true;
    
    ScrollTrigger.create({
        trigger: committeeSection,
        start: 'top 50%',
        end: 'top 20%',
        scrub: true,
        onEnter: () => {
            if (!convergenceActive) {
                convergenceActive = true;
                // Update texture with fresh binary digits
                particlesMaterial.map = createBinaryTexture();
                particlesMaterial.map.needsUpdate = true;
            }
        },
        onUpdate: (self) => {
            const progress = self.progress;
            
            // Move particles towards cube positions
            for (let i = 0; i < particlesCount; i++) {
                const x = originalPosArray[i * 3] + (targetPosArray[i * 3] - originalPosArray[i * 3]) * progress;
                const y = originalPosArray[i * 3 + 1] + (targetPosArray[i * 3 + 1] - originalPosArray[i * 3 + 1]) * progress;
                const z = originalPosArray[i * 3 + 2] + (targetPosArray[i * 3 + 2] - originalPosArray[i * 3 + 2]) * progress;
                
                posArray[i * 3] = x;
                posArray[i * 3 + 1] = y;
                posArray[i * 3 + 2] = z;
            }
            
            particlesGeometry.attributes.position.needsUpdate = true;
            
            // Show cube and fade in
            cubeWireframe.material.opacity = Math.min(progress * 2, 1);
            
            // Change particle color as they converge
            const hue = 0x3b82f6 + (0x00f2ff - 0x3b82f6) * progress;
            particlesMaterial.color.setHex(Math.round(hue));
            
            // Scale particles up as they converge
            particlesMaterial.size = 0.15 + progress * 0.1;
        }
    });
}

// Create scroll trigger once page is ready
window.addEventListener('load', createScrollTrigger);

// ==================== ANIMATION LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    
    // Continuous rotation
    particlesMesh.rotation.x += 0.0005;
    particlesMesh.rotation.y += 0.0008;
    cubeWireframe.rotation.x += 0.003;
    cubeWireframe.rotation.y += 0.005;
    
    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== DOM INTERACTIONS ====================
document.addEventListener('DOMContentLoaded', function() {
    const codeWindow = document.querySelector('.code-window');
    const codeLines = codeWindow ? codeWindow.querySelectorAll('.fade-in-line') : [];
    
    // IntersectionObserver to trigger animation on viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger animation
                codeLines.forEach(line => {
                    line.style.opacity = '1';
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    if (codeWindow) {
        observer.observe(codeWindow);
    }
    
    // Copy button functionality
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const codeText = codeWindow.innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                // Show tooltip
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Copied!';
                tooltip.className = 'copy-tooltip absolute -bottom-10 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded whitespace-nowrap';
                copyBtn.appendChild(tooltip);
                
                // Change button color
                copyBtn.classList.add('text-green-400');
                copyBtn.classList.remove('hover:text-blue-400');
                
                setTimeout(() => {
                    tooltip.remove();
                    copyBtn.classList.remove('text-green-400');
                    copyBtn.classList.add('text-gray-400', 'hover:text-blue-400');
                }, 2000);
            }).catch(() => {
                console.error('Failed to copy');
            });
        });
    }
    
    // Mouse-following glow effect
    const mouseGlow = document.getElementById('mouseGlow');
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (mouseGlow) {
            mouseGlow.style.left = mouseX + 'px';
            mouseGlow.style.top = mouseY + 'px';
        }
    });
    
    // Hide glow when mouse leaves window
    document.addEventListener('mouseleave', () => {
        if (mouseGlow) {
            mouseGlow.style.opacity = '0';
        }
    });
    
    document.addEventListener('mouseenter', () => {
        if (mouseGlow) {
            mouseGlow.style.opacity = '1';
        }
    });
    
    // Card Tilt Effect
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const rotateX = (e.clientY - centerY) / 10;
            const rotateY = (centerX - e.clientX) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
    
    // Modal Functionality
    const modal = document.getElementById('eventModal');
    const closeModalBtn = document.getElementById('closeModal');
    const closeModalBtnFooter = document.getElementById('closeModalBtn');
    const detailsButtons = document.querySelectorAll('.view-details-btn');
    const modalTitle = document.getElementById('modalTitle');
    const modalRules = document.getElementById('modalRules');
    const googleFormLink = document.getElementById('googleFormLink');
    
    detailsButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;
            const card = this.closest('[data-event-id]');
            
            if (card) {
                const title = card.dataset.eventTitle;
                const rules = card.dataset.eventRules;
                const formLink = card.dataset.eventForm;
                
                modalTitle.textContent = title;
                modalRules.textContent = rules;
                googleFormLink.href = formLink;
                
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    closeModalBtnFooter.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
