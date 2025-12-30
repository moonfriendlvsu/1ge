/* ========================================
   1=GE - JavaScript Ultra Edition
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // Loading Screen
    // ========================================
    const loadingScreen = document.getElementById('loading-screen');

    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1800);
    }

    // ========================================
    // Utility Functions
    // ========================================
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // ========================================
    // Theme Toggle (Light/Dark)
    // ========================================
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('1ge-theme') || 'dark';

    // Apply saved theme on load
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('1ge-theme', newTheme);
        });
    }

    // ========================================
    // Language Switcher
    // ========================================
    let currentLang = localStorage.getItem('1ge-lang') || 'kk';

    const langButtons = document.querySelectorAll('.lang-btn');

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('1ge-lang', lang);
        document.documentElement.setAttribute('data-lang', lang);

        // Update button states
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Translate all elements with data-kk and data-ru attributes
        document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    // For inputs, don't change content
                } else {
                    el.innerHTML = text;
                }
            }
        });

        // Handle placeholder translations for inputs
        document.querySelectorAll('[data-placeholder-kk][data-placeholder-ru]').forEach(el => {
            const placeholder = el.getAttribute(`data-placeholder-${lang}`);
            if (placeholder) {
                el.placeholder = placeholder;
            }
        });

        // Handle select options
        document.querySelectorAll('select option[data-kk][data-ru]').forEach(option => {
            const text = option.getAttribute(`data-${lang}`);
            if (text) {
                option.textContent = text;
            }
        });

        // Update calculator impact text with current language
        updateCalculatorLanguage();
    }

    function updateCalculatorLanguage() {
        const impactText = document.getElementById('impact-text');
        if (impactText) {
            const slider = document.getElementById('people-slider');
            if (slider) {
                const people = parseInt(slider.value);
                const monthly = people * 30;
                const families = Math.floor(monthly / 50000);

                if (currentLang === 'kk') {
                    impactText.innerHTML = `Бұл ақшамен айына <strong>${formatNumber(families)}</strong> отбасына көмектесуге болады!`;
                } else {
                    impactText.innerHTML = `На эти деньги можно помочь <strong>${formatNumber(families)}</strong> семьям в месяц!`;
                }
            }
        }
    }

    // Initialize language on page load
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // Set initial language (after a short delay to allow page load)
    setTimeout(() => {
        setLanguage(currentLang);
    }, 100);

    // ========================================
    // Scroll Indicator Click
    // ========================================
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (scrollIndicator) {
        scrollIndicator.style.cursor = 'pointer';
        scrollIndicator.addEventListener('click', function () {
            const nextSection = document.getElementById('how-it-works');
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // ========================================
    // Cursor Glow Effect (Desktop only)
    // ========================================
    const cursorGlow = document.getElementById('cursor-glow');

    if (cursorGlow && window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });

        document.addEventListener('mouseenter', () => {
            cursorGlow.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            cursorGlow.style.opacity = '0';
        });
    }

    // ========================================
    // Card Mouse Tracking Effect
    // ========================================
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });
    });

    // ========================================
    // Mobile Menu Toggle
    // ========================================
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function () {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });

        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function () {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // FAQ Accordion
    // ========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', function () {
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            item.classList.toggle('active');
        });
    });

    // ========================================
    // Confetti Effect
    // ========================================
    function createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;

        const colors = ['#10B981', '#F59E0B', '#0EA5E9', '#EF4444', '#8B5CF6', '#EC4899'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // ========================================
    // Form Submission with Confetti
    // ========================================
    const form = document.getElementById('join-form');
    const modal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Form submitted:', data);

            // Show confetti
            createConfetti();

            // Show modal
            if (modal) {
                modal.classList.add('active');
            }

            form.reset();
        });
    }

    if (modalClose && modal) {
        modalClose.addEventListener('click', function () {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // ========================================
    // Share Buttons
    // ========================================
    const shareButtons = document.querySelectorAll('.share-btn');

    shareButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const platform = this.dataset.platform;
            const text = '1=GE — жаңа қайырымдылық платформасы! 1 тенге күн сайын. Бірге көмектесейік! 🤝';
            const url = window.location.href;

            let shareUrl = '';

            if (platform === 'whatsapp') {
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            } else if (platform === 'telegram') {
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            }

            if (shareUrl) {
                window.open(shareUrl, '_blank');
            }
        });
    });

    // ========================================
    // Phone Input Mask
    // ========================================
    const phoneInput = document.querySelector('input[name="phone"]');

    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 0) {
                if (value[0] === '8') {
                    value = '7' + value.slice(1);
                }

                let formatted = '+7';
                if (value.length > 1) {
                    formatted += ' (' + value.slice(1, 4);
                }
                if (value.length > 4) {
                    formatted += ') ' + value.slice(4, 7);
                }
                if (value.length > 7) {
                    formatted += '-' + value.slice(7, 9);
                }
                if (value.length > 9) {
                    formatted += '-' + value.slice(9, 11);
                }

                e.target.value = formatted;
            }
        });
    }

    // ========================================
    // Header Scroll Effect
    // ========================================
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.8)';
            header.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        }
    });

    // ========================================
    // FAB and Ticker Visibility on Scroll
    // ========================================
    const fab = document.getElementById('fab');
    const donationFeed = document.getElementById('donation-feed');

    window.addEventListener('scroll', function () {
        const scrollY = window.pageYOffset;

        if (scrollY > 500) {
            if (fab) fab.classList.add('visible');
            if (donationFeed) donationFeed.classList.add('visible');
        } else {
            if (fab) fab.classList.remove('visible');
            if (donationFeed) donationFeed.classList.remove('visible');
        }
    });

    // ========================================
    // Donation Feed Toggle (Collapse/Expand)
    // ========================================
    const feedToggle = document.getElementById('donation-feed-toggle');

    if (feedToggle && donationFeed) {
        feedToggle.addEventListener('click', function () {
            donationFeed.classList.toggle('collapsed');
        });
    }

    // ========================================
    // Live Donation Feed (Twitch-style)
    // ========================================
    const kazNames = [
        'Айгүл', 'Асқар', 'Бақыт', 'Гүлнар', 'Дана', 'Ерлан', 'Жанар',
        'Зарина', 'Ілияс', 'Қарлығаш', 'Лаура', 'Мадина', 'Нұрсұлтан',
        'Оразбек', 'Перизат', 'Руслан', 'Сәуле', 'Тимур', 'Ұлжан'
    ];

    const donationList = document.getElementById('donation-list');
    const MAX_DONATIONS = 4;

    function addDonation() {
        if (!donationList) return;

        const randomName = kazNames[Math.floor(Math.random() * kazNames.length)];
        const randomAmount = Math.random() > 0.7 ?
            (Math.floor(Math.random() * 10) + 1) * 10 + '₸' : '1₸';
        const initial = randomName.charAt(0);

        // Create donation item
        const donationItem = document.createElement('div');
        donationItem.className = 'donation-item';
        donationItem.innerHTML = `
            <div class="donation-avatar">${initial}</div>
            <div class="donation-info">
                <span class="donation-name">${randomName}</span>
            </div>
            <span class="donation-amount">${randomAmount}</span>
        `;

        // Add to bottom of list
        donationList.appendChild(donationItem);

        // Remove oldest if exceeding max
        const items = donationList.querySelectorAll('.donation-item');
        if (items.length > MAX_DONATIONS) {
            const oldest = items[0];
            oldest.classList.add('fade-out');
            setTimeout(() => oldest.remove(), 300);
        }
    }

    // Add initial donations
    setTimeout(() => {
        addDonation();
        setTimeout(() => addDonation(), 500);
        setTimeout(() => addDonation(), 1000);
    }, 2000);

    // Add new donation every 3-5 seconds
    setInterval(addDonation, 3000 + Math.random() * 2000);

    // ========================================
    // Reveal on Scroll Animation
    // ========================================
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, index * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // ========================================
    // Counter Animation
    // ========================================
    const counters = document.querySelectorAll('[data-target]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    function animateCounter(element, target) {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            element.textContent = formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ========================================
    // Impact Calculator
    // ========================================
    const slider = document.getElementById('people-slider');
    const peopleCount = document.getElementById('people-count');
    const calcDaily = document.getElementById('calc-daily');
    const calcMonthly = document.getElementById('calc-monthly');
    const calcYearly = document.getElementById('calc-yearly');
    const impactText = document.getElementById('impact-text');

    function updateCalculator() {
        if (!slider) return;

        const people = parseInt(slider.value);
        const daily = people;
        const monthly = people * 30;
        const yearly = people * 365;
        const families = Math.floor(monthly / 50000); // 50k per family per month

        if (peopleCount) peopleCount.textContent = formatNumber(people);
        if (calcDaily) calcDaily.textContent = formatNumber(daily) + '₸';
        if (calcMonthly) calcMonthly.textContent = formatNumber(monthly) + '₸';
        if (calcYearly) calcYearly.textContent = formatNumber(yearly) + '₸';
        if (impactText) {
            if (currentLang === 'ru') {
                impactText.innerHTML = `На эти деньги можно помочь <strong>${formatNumber(families)}</strong> семьям в месяц!`;
            } else {
                impactText.innerHTML = `Бұл ақшамен айына <strong>${formatNumber(families)}</strong> отбасына көмектесуге болады!`;
            }
        }
    }

    if (slider) {
        slider.addEventListener('input', updateCalculator);
        updateCalculator(); // Initial calculation
    }

    // ========================================
    // Parallax Effect for Hero Orbs
    // ========================================
    const orbs = document.querySelectorAll('.hero-orb');

    if (window.matchMedia('(min-width: 768px)').matches) {
        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset;

            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.1;
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    }

    // ========================================
    // Typing Effect for Hero Subtitle
    // ========================================
    const heroSubtitle = document.querySelector('.hero-subtitle');

    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        heroSubtitle.style.borderRight = '2px solid var(--color-accent)';

        let i = 0;
        const typeSpeed = 50;

        function typeWriter() {
            if (i < text.length) {
                heroSubtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, typeSpeed);
            } else {
                setTimeout(() => {
                    heroSubtitle.style.borderRight = 'none';
                }, 1000);
            }
        }

        // Start typing after loading screen
        setTimeout(typeWriter, 2000);
    }

    // ========================================
    // Button Ripple Effect
    // ========================================
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleEffect 0.6s ease-out;
                left: ${x}px;
                top: ${y}px;
                width: 100px;
                height: 100px;
                margin-left: -50px;
                margin-top: -50px;
                pointer-events: none;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple keyframes dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ========================================
    // Easter Egg: Konami Code
    // ========================================
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                createConfetti();
                createConfetti();
                alert('🎉 Сіз жасырын кодты таптыңыз! 1=GE командасына қосылыңыз!');
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
});
