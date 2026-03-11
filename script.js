document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // Hamburger Nav Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.classList.toggle('open', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Intersection Observer for scroll reveal animations
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            // Only trigger if intersecting and hasn't animated yet
            if (entry.isIntersecting && !entry.target.hasAttribute('data-animated')) {
                entry.target.classList.add('active');
                entry.target.setAttribute('data-animated', 'true');

                // Explicitly stop observing this element
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });

    // Premium Glass Card Mouse Glow Effect
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        let rect;
        // Cache the bounding rectangle on enter to prevent layout thrashing
        // from calling getBoundingClientRect() on every mouse move
        card.addEventListener('mouseenter', () => {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', e => {
            if (!rect) return; // Fallback should something fail
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Dynamic Scarcity Banner Logic
    const scarcityMonthSpan = document.getElementById('scarcity-month');
    const scarcityDaysSpan = document.getElementById('scarcity-days');

    if (scarcityMonthSpan && scarcityDaysSpan) {
        const today = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Get current month name
        const currentMonth = monthNames[today.getMonth()];
        scarcityMonthSpan.textContent = currentMonth;

        // Calculate days left in the current month
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = lastDayOfMonth.getDate() - today.getDate();
        scarcityDaysSpan.textContent = daysLeft > 0 ? daysLeft : 1; // Always show at least 1 to keep urgency if it's the last day
    }

    // Lead Capture Modal Logic
    const leadModal = document.getElementById('leadModal');
    const closeModal = document.getElementById('closeModal');
    const leadForm = document.getElementById('leadForm');
    const formError = document.getElementById('formError');

    // Find the "Click Here to Continue" button
    const postBookingBtn = document.getElementById('postBookingBtn');

    if (leadModal && leadForm && postBookingBtn) {
        postBookingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            leadModal.classList.add('active');
        });

        // Close modal
        closeModal.addEventListener('click', () => {
            leadModal.classList.remove('active');
        });

        leadModal.addEventListener('click', (e) => {
            if (e.target === leadModal) {
                leadModal.classList.remove('active');
            }
        });

        // Handle form submission
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            formError.style.display = 'none';

            // Honeypot check - if filled, this is a bot
            const honeypot = document.getElementById('website_url').value;
            if (honeypot) {
                console.warn("Spam detected. Discarding submission.");
                window.location.href = 'thankyou.html'; // Silently redirect to simulate success
                return;
            }

            const phone = document.getElementById('phone').value;
            const confirmPhone = document.getElementById('confirmPhone').value;

            if (phone !== confirmPhone) {
                formError.textContent = "Phone numbers do not match. Please try again.";
                formError.style.display = 'block';
                return;
            }

            // Reference submit button to show loading status
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Submitting...";
            submitBtn.disabled = true;

            // Prepare the form data to be sent
            // Remove honeypot from the actual submission
            const formData = new FormData(leadForm);
            formData.delete('website_url');

            // Google Apps Script expects `application/x-www-form-urlencoded`
            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            // The Google Apps Script Web App URL
            const scriptURL = 'https://script.google.com/macros/s/AKfycbzmmHeiB_g8u3Vyqku89RNve-Gcs3MDane5vZ4mPL8nPs5pjS1bIyHFUDjxCRw-75g6Uw/exec';

            // Send data. 'no-cors' is required because Google's redirect chain
            // doesn't return proper CORS headers. This makes the response
            // "opaque" — we can't read it, but we know the request was sent.
            // We redirect immediately after sending, regardless of opaque response.
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: data
            })
                .then(() => {
                    // Meta Pixel Lead Tracking with Advanced Matching
                    const doctorName = document.getElementById('doctorName').value;
                    const email = document.getElementById('email').value;
                    const phone = document.getElementById('phone').value;
                    
                    // Trigger Lead event. FB SDK handles hashing if configured, but passing strings is standard for web pixel.
                    if (typeof fbq === 'function') {
                        fbq('track', 'Lead', {
                            content_name: 'Strategy Call Request',
                            content_category: 'Lead Capture'
                        }, {
                            em: email.toLowerCase().trim(),
                            ph: phone.replace(/\D/g, ''),
                            fn: doctorName.split(' ')[0].toLowerCase().trim(),
                            ln: doctorName.split(' ').slice(1).join(' ').toLowerCase().trim()
                        });
                    }

                    // Delay redirect slightly to ensure Meta Pixel has time to fire the Lead event
                    setTimeout(() => {
                        window.location.href = 'thankyou.html';
                    }, 400);
                })
                .catch(error => {
                    // Only genuine network failures land here (no internet, DNS error etc.)
                    console.error('Network error:', error.message);
                    formError.textContent = "Network error. Please check your connection and try again.";
                    formError.style.display = 'block';
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});
