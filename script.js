// ===== CONSOLIDATED THREE.JS BINARY PARTICLE SYSTEM =====
// Unified script combining all Three.js, animations, and interactions
// Cleaned up - removed all redundancy and duplicate code

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== 1. INITIALIZE THREE.JS SCENE =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('three-canvas'), 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 8;

    // ===== 2. CREATE PLAIN DOT TEXTURE GENERATOR =====
    function createDotTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 64, 64);
        
        // Draw plain blue dot with glow
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Soft glow
        const gradient = ctx.createRadialGradient(32, 32, 15, 32, 32, 25);
        gradient.addColorStop(0, 'rgba(96, 165, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 25, 0, Math.PI * 2);
        ctx.fill();
        
        return new THREE.CanvasTexture(canvas);
    }

    // Pre-create texture for performance
    const dotTexture = createDotTexture();

    // ===== 3. CREATE PARTICLE SYSTEM =====
    // Calculate particle count dynamically: 120 particles per 1000px
    const screenArea = (window.innerWidth * window.innerHeight) / (1000 * 1000);
    const particleCount = Math.max(800, Math.floor(screenArea * 120));
    const particles = [];
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    class BinaryParticle {
        constructor() {
            const material = new THREE.SpriteMaterial({
                map: dotTexture,
                color: 0x3b82f6,  // Blue
                transparent: true,
                sizeAttenuation: true,
                opacity: 0.8
            });

            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(0.08, 0.08, 1);  // Very small dots
            
            // Random initial position (spread across viewport)
            this.sprite.position.x = (Math.random() - 0.5) * 25;
            this.sprite.position.y = (Math.random() - 0.5) * 25;
            this.sprite.position.z = (Math.random() - 0.5) * 15;
            
            // Store for reference
            this.initialPos = {
                x: this.sprite.position.x,
                y: this.sprite.position.y,
                z: this.sprite.position.z
            };
            
            // Base velocity - continuous movement (randomized for independence)
            this.baseVelocity = {
                x: (Math.random() - 0.5) * 0.08,  // Increased randomization
                y: (Math.random() - 0.5) * 0.06,
                z: (Math.random() - 0.5) * 0.05
            };
            
            // Current velocity (affected by scroll speed)
            this.velocity = { ...this.baseVelocity };
            
            this.isHovered = false;
            this.speedMultiplier = 1;  // Will be modified by scroll speed and hover
            
            particleGroup.add(this.sprite);
        }

        update() {
            // Continuous animated movement with speed multiplier
            this.sprite.position.x += this.velocity.x * this.speedMultiplier;
            this.sprite.position.y += this.velocity.y * this.speedMultiplier;
            this.sprite.position.z += this.velocity.z * this.speedMultiplier;
            
            // Large wraparound boundary (out_mode: 'out')
            // Particles reappear on the opposite side of the screen, creating seamless continuous animation
            const wrapX = 120;
            const wrapY = 120;
            const wrapZ = 80;
            
            // Smooth wraparound - particles teleport to opposite side when they leave viewport
            if (this.sprite.position.x > wrapX) {
                this.sprite.position.x = -wrapX;
            } else if (this.sprite.position.x < -wrapX) {
                this.sprite.position.x = wrapX;
            }
            
            if (this.sprite.position.y > wrapY) {
                this.sprite.position.y = -wrapY;
            } else if (this.sprite.position.y < -wrapY) {
                this.sprite.position.y = wrapY;
            }
            
            if (this.sprite.position.z > wrapZ) {
                this.sprite.position.z = -wrapZ;
            } else if (this.sprite.position.z < -wrapZ) {
                this.sprite.position.z = wrapZ;
            }
            
            // Gentle rotation (using rotationZ instead of read-only rotation)
            this.sprite.rotationZ += 0.01;
        }

        toHaloPosition(target, progress) {
            this.sprite.position.x = this.initialPos.x + (target.x - this.initialPos.x) * progress;
            this.sprite.position.y = this.initialPos.y + (target.y - this.initialPos.y) * progress;
            this.sprite.position.z = this.initialPos.z + (target.z - this.initialPos.z) * progress;
        }
    }

    // Create all particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new BinaryParticle());
    }

    // ===== 4. LIGHTING =====
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x60a5fa, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // ===== 5. COMMITTEE SECTION HALO EFFECT WITH SCROLLTRIGGER =====
    const committeeSection = document.getElementById('committee');
    const memberCards = document.querySelectorAll('#committee .group');
    
    let isInCommitteeSection = false;
    let inHaloMode = false;
    let hoveredCardIndex = -1;

    // Use GSAP ScrollTrigger to detect when scrolling to committee section
    if (committeeSection && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        ScrollTrigger.create({
            trigger: committeeSection,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => {
                if (!isInCommitteeSection) {
                    isInCommitteeSection = true;
                    enterHaloMode();
                }
            },
            onLeave: () => {
                if (isInCommitteeSection) {
                    isInCommitteeSection = false;
                    exitHaloMode();
                }
            },
            onEnterBack: () => {
                if (!isInCommitteeSection) {
                    isInCommitteeSection = true;
                    enterHaloMode();
                }
            },
            onLeaveBack: () => {
                if (isInCommitteeSection) {
                    isInCommitteeSection = false;
                    exitHaloMode();
                }
            }
        });
    }

    function enterHaloMode() {
        inHaloMode = true;
        console.log('✨ Entering halo mode - particles forming glowing halos around member cards');
        
        // Animate particles to form halo around each card
        memberCards.forEach((card, cardIndex) => {
            const rect = card.getBoundingClientRect();
            const cardX = (rect.left + rect.width / 2) / window.innerWidth * 16 - 8;
            const cardY = -(rect.top + rect.height / 2) / window.innerHeight * 9 + 4.5;
            
            // Assign particles to card positions (halo formation)
            for (let i = 0; i < particleCount / memberCards.length; i++) {
                const particleIndex = cardIndex * (particleCount / memberCards.length) + i;
                if (particles[particleIndex]) {
                    const angle = (i / (particleCount / memberCards.length)) * Math.PI * 2;
                    const radius = 2.2;
                    
                    particles[particleIndex].haloTarget = {
                        x: cardX + Math.cos(angle) * radius,
                        y: cardY + Math.sin(angle) * radius,
                        z: 0.5
                    };
                }
            }
        });

        // Animate convergence to halo positions with glow effect
        gsap.to({progress: 0}, {
            progress: 1,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: function() {
                particles.forEach((particle) => {
                    if (particle.haloTarget) {
                        particle.toHaloPosition(particle.haloTarget, this.progress());
                        // Increase glow as particles approach halo
                        particle.sprite.material.opacity = 0.8 + (this.progress() * 0.4);
                    }
                });
            }
        });
    }

    function exitHaloMode() {
        inHaloMode = false;
        console.log('↩️ Exiting halo mode - particles returning to background');
        
        // Animate particles back to initial positions
        gsap.to({progress: 0}, {
            progress: 1,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: function() {
                particles.forEach((particle) => {
                    if (particle.haloTarget) {
                        particle.toHaloPosition(particle.initialPos, 1 - this.progress());
                        // Fade back to normal opacity
                        particle.sprite.material.opacity = 0.8 + ((1 - this.progress()) * 0.4);
                    }
                });
            }
        });
    }

    // ===== 6. SCROLL SPEED TRACKING =====
    let currentScrollSpeed = 1;
    let lastScrollY = 0;
    let scrollSpeedTimeout;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = Math.abs(currentScrollY - lastScrollY);
        
        // Map scroll delta to speed multiplier (1 to 3x)
        currentScrollSpeed = Math.min(3, 1 + (delta / 100));
        
        // Update all particles' speed multiplier
        particles.forEach(particle => {
            if (!particle.isHovered) {
                particle.speedMultiplier = currentScrollSpeed;
            }
        });
        
        lastScrollY = currentScrollY;
        
        // Gradually slow down to normal when scroll stops
        clearTimeout(scrollSpeedTimeout);
        scrollSpeedTimeout = setTimeout(() => {
            gsap.to({ speed: currentScrollSpeed }, {
                speed: 1,
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: function() {
                    particles.forEach(particle => {
                        if (!particle.isHovered) {
                            particle.speedMultiplier = this.targets()[0].speed;
                        }
                    });
                }
            });
        }, 150);
    });

    // ===== 7. MEMBER CARD HOVER EFFECT (DURING HALO MODE) =====
    memberCards.forEach((card, cardIndex) => {
        card.addEventListener('mouseenter', () => {
            if (inHaloMode) {
                hoveredCardIndex = cardIndex;
                activateCardHalo(cardIndex);
            }
        });

        card.addEventListener('mouseleave', () => {
            hoveredCardIndex = -1;
            deactivateCardHalo(cardIndex);
        });
    });

    function activateCardHalo(cardIndex) {
        const particlesPerCard = particleCount / memberCards.length;
        const startIdx = cardIndex * particlesPerCard;
        
        for (let i = 0; i < particlesPerCard; i++) {
            if (particles[startIdx + i]) {
                const particle = particles[startIdx + i];
                particle.isHovered = true;
                
                // Boost opacity and glow
                gsap.to(particle.sprite.material, {
                    opacity: 1,
                    duration: 0.3
                });
                
                // Change color to cyan for highlighting
                particle.sprite.material.color.setHex(0x00f2ff);
            }
        }
    }

    function deactivateCardHalo(cardIndex) {
        const particlesPerCard = particleCount / memberCards.length;
        const startIdx = cardIndex * particlesPerCard;
        
        for (let i = 0; i < particlesPerCard; i++) {
            if (particles[startIdx + i]) {
                const particle = particles[startIdx + i];
                particle.isHovered = false;
                
                // Reset glow
                gsap.to(particle.sprite.material, {
                    opacity: 0.8,
                    duration: 0.3
                });
                
                // Restore original blue color
                particle.sprite.material.color.setHex(0x3b82f6);
            }
        }
    }

    // ===== 8. ANIMATION LOOP =====
    let animationFrameId;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        
        // Update all particles continuously
        particles.forEach(particle => {
            particle.update();
        });
        
        // Subtle rotation for dynamic effect
        particleGroup.rotation.z += 0.0002;
        
        renderer.render(scene, camera);
    }

    animate();

    // ===== 9. RESPONSIVE RESIZING =====
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    // ===== 10. CLEANUP ON PAGE LEAVE =====
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
    });

    // ===== 11. CODE WINDOW & MODAL INTERACTIONS =====
    const codeWindow = document.querySelector('.code-window');
    const codeLines = codeWindow ? codeWindow.querySelectorAll('.fade-in-line') : [];
    
    // Typewriter effect with viewport detection
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
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
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Copied!';
                tooltip.className = 'copy-tooltip absolute -bottom-10 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded whitespace-nowrap';
                copyBtn.appendChild(tooltip);
                
                copyBtn.classList.add('text-green-400');
                copyBtn.classList.remove('hover:text-blue-400');
                
                setTimeout(() => {
                    tooltip.remove();
                    copyBtn.classList.remove('text-green-400');
                    copyBtn.classList.add('text-gray-400', 'hover:text-blue-400');
                }, 2000);
            });
        });
    }
    
    // Mouse-following glow effect
    const mouseGlow = document.getElementById('mouseGlow');
    document.addEventListener('mousemove', (e) => {
        if (mouseGlow) {
            mouseGlow.style.left = e.clientX + 'px';
            mouseGlow.style.top = e.clientY + 'px';
        }
    });

    document.addEventListener('mouseleave', () => {
        if (mouseGlow) mouseGlow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        if (mouseGlow) mouseGlow.style.opacity = '1';
    });
    
    // ===== 12. CARD TILT EFFECT =====
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
    
    // ===== 13. MODAL UTILITIES & TEXT SCRAMBLE EFFECT =====
    
    console.log('✅ Defining scrambleText function...');
    /**
     * Scramble text animation: Characters decode from random to actual text over duration
     * @param {HTMLElement} element - Target element containing text to scramble
     * @param {number} duration - Animation duration in milliseconds
     */
    function scrambleText(element, duration = 1000) {
        const originalText = element.textContent;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        const startTime = Date.now();

        function generateRandomText(length) {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            return result;
        }

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            let displayText = '';
            for (let i = 0; i < originalText.length; i++) {
                if (Math.random() < progress) {
                    displayText += originalText[i];
                } else {
                    displayText += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            element.textContent = displayText;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = originalText;
            }
        }

        animate();
    }

    /**
     * Create a 3D rotating wireframe icon for modal header
     * @param {HTMLElement} container - Container to render the icon
     */
    function create3DModalIcon(container) {
        const width = container.clientWidth || 64;
        const height = container.clientHeight || 64;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Create a wireframe octahedron
        const geometry = new THREE.OctahedronGeometry(1, 0);
        const material = new THREE.LineBasicMaterial({
            color: 0x60a5fa,
            linewidth: 2
        });
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, material);
        scene.add(wireframe);

        // Add point vertices for glow effect
        const pointMaterial = new THREE.PointsMaterial({
            color: 0x3b82f6,
            size: 0.15,
            sizeAttenuation: true
        });
        const points = new THREE.Points(geometry, pointMaterial);
        scene.add(points);

        // Lighting
        const light = new THREE.PointLight(0x60a5fa, 0.8);
        light.position.set(2, 2, 2);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

        camera.position.z = 3;

        // Animation loop
        const animationId = setInterval(() => {
            if (!container.parentElement) {
                clearInterval(animationId);
                renderer.dispose();
                return;
            }

            wireframe.rotation.x += 0.015;
            wireframe.rotation.y += 0.025;
            wireframe.rotation.z += 0.01;

            points.rotation.x += 0.015;
            points.rotation.y += 0.025;
            points.rotation.z += 0.01;

            renderer.render(scene, camera);
        }, 16);

        // Handle window resize
        const resizeHandler = () => {
            const newWidth = container.clientWidth || 64;
            const newHeight = container.clientHeight || 64;
            if (newWidth > 0 && newHeight > 0) {
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        };

        window.addEventListener('resize', resizeHandler);

        return () => {
            clearInterval(animationId);
            renderer.dispose();
            window.removeEventListener('resize', resizeHandler);
        };
    }

    // ===== 14. MODAL FUNCTIONALITY =====
    const modal = document.getElementById('eventModal');
    const closeModalBtn = document.getElementById('closeModal');
    const closeModalBtnFooter = document.getElementById('closeModalBtn');
    const detailsButtons = document.querySelectorAll('.view-details-btn');
    const modalTitle = document.getElementById('modalTitle');
    const modalRules = document.getElementById('modalRules');
    const googleFormLink = document.getElementById('googleFormLink');
    const modal3DIcon = document.getElementById('modal3DIcon');
    
    let currentIconCleanup = null;
    
    detailsButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('[data-event-id]');
            
            if (card) {
                const title = card.dataset.eventTitle;
                const rules = card.dataset.eventRules;
                const formLink = card.dataset.eventForm;
                const reward = card.dataset.eventReward || 'Prizes & Certs';
                const difficulty = card.dataset.eventDifficulty || 'Level 03';
                const teamSize = card.dataset.eventTeam || '2-4 Members';
                
                // Clean up previous icon
                if (currentIconCleanup) {
                    currentIconCleanup();
                }
                
                // Update modal content
                modalTitle.textContent = title;
                modalRules.textContent = rules;
                googleFormLink.href = formLink;
                
                // Update all dynamic fields
                const rewardElement = document.querySelector('[data-reward-value]');
                const difficultyElement = document.querySelector('[data-difficulty-value]');
                const teamElement = document.querySelector('[data-team-value]');
                if (rewardElement) rewardElement.textContent = reward;
                if (difficultyElement) difficultyElement.textContent = difficulty;
                if (teamElement) teamElement.textContent = teamSize;
                
                // Create new 3D icon
                try {
                    currentIconCleanup = create3DModalIcon(modal3DIcon);
                } catch (err) {
                    console.log('3D icon creation skipped');
                }
                
                // Show modal with animation
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                
                // Trigger scramble text effect for rules
                setTimeout(() => {
                    scrambleText(modalRules, 1000);
                }, 100);
            }
        });
    });
    
    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Clean up icon when closing
        if (currentIconCleanup) {
            currentIconCleanup();
            currentIconCleanup = null;
        }
    }
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalBtnFooter) closeModalBtnFooter.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});