// ==================== THREE.JS SETUP ====================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;

// ==================== BINARY DIGIT TEXTURE GENERATION ====================
function createBinaryTexture(digit) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Clear background with slight transparency
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw circle background for better visibility
    ctx.fillStyle = digit === '0' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(0, 242, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw binary digit - MUCH LARGER AND BOLDER
    ctx.fillStyle = digit === '0' ? '#60a5fa' : '#00f2ff';
    ctx.font = 'bold 180px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(digit, 128, 128);
    
    // Add border glow
    ctx.strokeStyle = digit === '0' ? '#3b82f6' : '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();
    
    return new THREE.CanvasTexture(canvas);
}

// Cache textures for 0 and 1
const textureZero = createBinaryTexture('0');
const textureOne = createBinaryTexture('1');

// ==================== PARTICLES SYSTEM WITH SPRITES ====================
const particlesCount = 150;
const particleGroup = new THREE.Group();
const particles = [];
const originalPositions = [];
const targetPositions = [];

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

// Create sprites for each particle
for(let i = 0; i < particlesCount; i++) {
    const isZero = Math.random() > 0.5;
    const texture = isZero ? textureZero : textureOne;
    const material = new THREE.SpriteMaterial({ 
        map: texture,
        color: isZero ? 0x60a5fa : 0x00f2ff,
        transparent: true,
        sizeAttenuation: true
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.5, 1);
    
    // Initial random scattered positions
    const pos = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20
    };
    
    sprite.position.set(pos.x, pos.y, pos.z);
    originalPositions.push({ ...pos });
    
    // Target: distribute particles along cube edges and vertices
    const vertexA = cubeVertices[Math.floor(i / Math.ceil(particlesCount / cubeVertices.length))];
    const vertexB = cubeVertices[(Math.floor(i / Math.ceil(particlesCount / cubeVertices.length)) + 1) % cubeVertices.length];
    const t = (i % Math.ceil(particlesCount / cubeVertices.length)) / Math.ceil(particlesCount / cubeVertices.length);
    
    targetPositions.push({
        x: vertexA[0] * (1 - t) + vertexB[0] * t,
        y: vertexA[1] * (1 - t) + vertexB[1] * t,
        z: vertexA[2] * (1 - t) + vertexB[2] * t
    });
    
    particles.push(sprite);
    particleGroup.add(sprite);
}

scene.add(particleGroup);

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
            }
        },
        onUpdate: (self) => {
            const progress = self.progress;
            
            // Move particles towards cube positions
            for (let i = 0; i < particlesCount; i++) {
                const origPos = originalPositions[i];
                const targetPos = targetPositions[i];
                
                particles[i].position.x = origPos.x + (targetPos.x - origPos.x) * progress;
                particles[i].position.y = origPos.y + (targetPos.y - origPos.y) * progress;
                particles[i].position.z = origPos.z + (targetPos.z - origPos.z) * progress;
                
                // Scale up particles as they converge
                const scale = 0.5 + progress * 0.3;
                particles[i].scale.set(scale, scale, scale);
            }
            
            // Show cube and fade in
            cubeWireframe.material.opacity = Math.min(progress * 2, 1);
        }
    });
}

// Create scroll trigger once page is ready
window.addEventListener('load', createScrollTrigger);

// ==================== ANIMATION LOOP ====================
function animate() {
    requestAnimationFrame(animate);
    
    // Continuous rotation
    particleGroup.rotation.x += 0.0005;
    particleGroup.rotation.y += 0.0008;
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
