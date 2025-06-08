/* ===============================
   SMOOTH SCROLLING
   =============================== */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ===============================
   NAVBAR SCROLL EFFECT
   =============================== */
function initNavbarScrollEffect() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ===============================
   FADE IN ANIMATIONS
   =============================== */
function initFadeInAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

/* ===============================
   MOUSE PARALLAX EFFECT
   =============================== */
function initParallaxEffect() {
    document.addEventListener('mousemove', (e) => {
        const floatingElements = document.querySelectorAll('.floating-element');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        floatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.02;
            const x = (mouseX - 0.5) * speed * 100;
            const y = (mouseY - 0.5) * speed * 100;

            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

/* ===============================
   CARD HOVER EFFECTS
   =============================== */
function initCardHoverEffects() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

/* ===============================
   DYNAMIC BACKGROUND ANIMATION
   =============================== */
function initDynamicBackground() {
    window.addEventListener('scroll', () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const bgAnimation = document.querySelector('.bg-animation');

        if (bgAnimation) {
            bgAnimation.style.animationDuration = (15 - scrollPercent * 10) + 's';
        }
    });
}

/* ===============================
   FLOATING ELEMENTS RANDOMIZATION
   =============================== */
function initFloatingElements() {
    document.querySelectorAll('.floating-element').forEach((element, index) => {
        element.style.animationDelay = Math.random() * 6 + 's';
        element.style.animationDuration = (6 + Math.random() * 4) + 's';
    });
}

/* ===============================
   SOCIAL LINKS ANIMATION
   =============================== */
function initSocialLinksAnimation() {
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });

        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

/* ===============================
   INITIALIZATION
   =============================== */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initSmoothScrolling();
    initNavbarScrollEffect();
    initFadeInAnimations();
    initParallaxEffect();
    initCardHoverEffects();
    initDynamicBackground();
    initFloatingElements();
    initSocialLinksAnimation();

    console.log('🚀 Kelompok 2 Website loaded successfully!');
});

/* ===============================
   UTILITY FUNCTIONS
   =============================== */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSmoothScrolling,
        initNavbarScrollEffect,
        initFadeInAnimations,
        initParallaxEffect,
        initCardHoverEffects,
        initDynamicBackground,
        initFloatingElements,
        initSocialLinksAnimation
    };
}