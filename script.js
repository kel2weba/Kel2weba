// Smooth scrolling for navigation links
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

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Intersection Observer for fade-in animations
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

// Mouse movement parallax effect
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

// Add interactive hover effects to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Dynamic gradient animation speed based on scroll
window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const bgAnimation = document.querySelector('.bg-animation');
    if (bgAnimation) {
        bgAnimation.style.animationDuration = (15 - scrollPercent * 10) + 's';
    }
});

// Random floating animation delays
document.querySelectorAll('.floating-element').forEach((element, index) => {
    element.style.animationDelay = Math.random() * 6 + 's';
    element.style.animationDuration = (6 + Math.random() * 4) + 's';
});

// Newsletter subscription functionality
document.addEventListener('DOMContentLoaded', function() {
    const newsletterBtn = document.querySelector('.newsletter-btn');
    if (newsletterBtn) {
        newsletterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = document.querySelector('.newsletter-input');
            const email = input.value.trim();
            
            if (email && isValidEmail(email)) {
                // Simulate success
                this.innerHTML = '<span>✓ Subscribed!</span>';
                this.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                input.value = '';
                
                // Reset after 3 seconds
                setTimeout(() => {
                    this.innerHTML = '<span>Subscribe</span>';
                    this.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                }, 3000);
            } else {
                // Show error state
                input.style.borderColor = '#ef4444';
                input.style.background = 'rgba(239, 68, 68, 0.1)';
                
                setTimeout(() => {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    input.style.background = 'rgba(255, 255, 255, 0.05)';
                }, 2000);
            }
        });
    }
});

// Email validation helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Enhanced social link interactions
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Footer links hover effect
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '8px';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '0';
        });
    });
});
