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
            const formData = new FormData(leadForm);

            // Note: Google Apps Script doPost generally expects `application/x-www-form-urlencoded`
            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            // The URL provided by Google Apps Script Deployment
            const scriptURL = 'https://script.google.com/macros/s/AKfycbyOTR7OROGV3-Hbf9zQxh3e3GyRihexVki-Nsa1vNPHcm3Qda9WzVuyqBPr_koTvO0JSg/exec';

            // Send POST request
            fetch(scriptURL, {
                method: 'POST',
                body: data
            })
                .then(response => {
                    // If it successfully submitted (doesn't have to be ok flag since Google often returns CORS opaque responses)
                    window.location.href = 'thankyou.html';
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    formError.textContent = "Submission failed. Please try again later or email us directly.";
                    formError.style.display = 'block';

                    // Reset button
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});
