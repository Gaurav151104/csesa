// Typewriter effect for code window and all interactive features
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
