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

    if (leadModal && leadForm) {
        // Universal modal trigger logic
        document.querySelectorAll('.open-lead-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                leadModal.classList.add('active');
            });
        });

        if (postBookingBtn) {
            postBookingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                leadModal.classList.add('active');
            });
        }

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
                window.location.href = 'schedule.html'; // Silently redirect to simulate success
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
            const formData = new FormData(leadForm);
            
            // Clean up name field if the script expects 'doctorName'
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            formData.append('doctorName', `${firstName} ${lastName}`);
            
            // Collect checked procedures
            const procedures = Array.from(leadForm.querySelectorAll('input[name="procedures"]:checked'))
                .map(cb => cb.value)
                .join(', ');
            formData.delete('procedures'); // Remove individual entries
            formData.append('procedures', procedures);

            // Remove honeypot from the actual submission
            formData.delete('website_url');

            // Google Apps Script expects `application/x-www-form-urlencoded`
            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            // The Google Apps Script Web App URL
            const scriptURL = 'https://script.google.com/macros/s/AKfycbzGOj2Vm1OWXUSvtQEC1Hq1UN5zkXMXMTAIZWFnYAQZ-StbYxQyvCwmpYcmBMf8GweN2Q/exec';

            // Send data. 'no-cors' is required
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: data
            })
                .then(() => {
                    // Trigger Lead event for Meta Pixel
                    if (typeof fbq === 'function') {
                        fbq('track', 'Lead', {
                            content_name: 'Strategy Call Request',
                            content_category: 'Lead Capture'
                        });
                    }

                    // Delay redirect slightly to ensure Meta Pixel has time to fire
                    setTimeout(() => {
                        window.location.href = 'schedule.html';
                    }, 400);
                })
                .catch(error => {
                    console.error('Network error:', error.message);
                    formError.textContent = "Network error. Please check your connection and try again.";
                    formError.style.display = 'block';
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});

// Play Video function with Lightbox Expansion
function playVideo(container) {
    const vslLightbox = document.getElementById('vslLightbox');
    const vslExpandedContent = document.getElementById('vslExpandedContent');
    const originalIframe = container.querySelector('iframe');
    const closeVsl = document.getElementById('closeVsl');

    if (!vslLightbox || !vslExpandedContent || !originalIframe) return;

    // Clone the iframe to move it to the lightbox
    const newIframe = originalIframe.cloneNode(true);
    let src = newIframe.getAttribute('src');
    
    // Set autoplay
    if (src && !src.includes('autoplay=1')) {
        if (src.includes('?')) {
            src = src.replace('autoplay=0', 'autoplay=1');
            if (!src.includes('autoplay=1')) src += '&autoplay=1';
        } else {
            src += '?autoplay=1';
        }
        newIframe.setAttribute('src', src);
    }

    // Clear previous and add new
    vslExpandedContent.innerHTML = '';
    vslExpandedContent.appendChild(newIframe);

    // Show Lightbox
    vslLightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // Close logic
    const closeHandler = () => {
        vslLightbox.classList.remove('active');
        document.body.style.overflow = '';
        vslExpandedContent.innerHTML = ''; // Stop video
        closeVsl.removeEventListener('click', closeHandler);
        vslLightbox.removeEventListener('click', backdropHandler);
    };

    const backdropHandler = (e) => {
        if (e.target === vslLightbox) closeHandler();
    };

    closeVsl.addEventListener('click', closeHandler);
    vslLightbox.addEventListener('click', backdropHandler);

    // escape key close... (no changes needed to the logic, just confirming it doesn't hide the original)
    // Escape key to close
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escHandler);
        }
    });
}


