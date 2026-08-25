// Helper for safe Meta Pixel tracking
const trackPixelEvent = (event, params = {}, isCustom = false, eventId = null) => {
    if (typeof window.fbq === 'function') {
        // Check for test_event_code in URL for debugging/Events Manager testing
        const testCode = new URLSearchParams(window.location.search).get('test_event_code');
        if (testCode) {
            params.test_event_code = testCode;
        }
        const options = {};
        if (eventId) {
            options.eventID = eventId;
        }
        window.fbq(isCustom ? 'trackCustom' : 'track', event, params, options);
    } else {
        console.debug(`[Pixel Debug] ${event} - fbq not found`, { params, eventId });
    }
};

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
    
    // ViewContent tracking observer
    const trackingObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.hasAttribute('data-tracked')) {
                trackPixelEvent('ViewContent', { 
                    content_name: 'Dental Growth Hub Offer',
                    content_category: 'Landing Page'
                }, false);
                entry.target.setAttribute('data-tracked', 'true');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) trackingObserver.observe(heroContent);
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

    // --- Multi-Step Form Logic ---
    const leadModal = document.getElementById('leadModal');
    const closeModal = document.getElementById('closeModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close-btn');
    const leadForm = document.getElementById('leadForm');
    const formError = document.getElementById('formError');
    const postBookingBtn = document.getElementById('postBookingBtn');

    if (leadModal && leadForm) {
        // Universal modal trigger logic
        document.querySelectorAll('.open-lead-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                trackPixelEvent('Contact', { 
                    content_name: 'Lead Button Click',
                    button_location: btn.innerText || 'CTA Button'
                });
                leadModal.classList.add('active');
                
                // Track FormStart (only once per session)
                if (!leadModal.hasAttribute('data-form-started')) {
                    trackPixelEvent('LeadFormStart', { content_name: 'Application Funnel Started' }, true);
                    leadModal.setAttribute('data-form-started', 'true');
                }
            });
        });

        if (postBookingBtn) {
            postBookingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                leadModal.classList.add('active');
                if (!leadModal.hasAttribute('data-form-started')) {
                    trackPixelEvent('LeadFormStart', { content_name: 'Application Funnel Started' }, true);
                    leadModal.setAttribute('data-form-started', 'true');
                }
            });
        }

        const closeAll = () => {
            leadModal.classList.remove('active');
        };

        closeModal.addEventListener('click', closeAll);
        modalCloseBtns.forEach(btn => btn.addEventListener('click', closeAll));
        
        leadModal.addEventListener('click', (e) => {
            if (e.target === leadModal) {
                closeAll();
            }
        });

        // --- Step Navigation & Logic ---
        const steps = Array.from(leadForm.querySelectorAll('.form-step'));
        const nextBtns = leadForm.querySelectorAll('.btn-next');
        const prevBtns = leadForm.querySelectorAll('.btn-prev');
        const qualifyBtn = leadForm.querySelector('.btn-submit-qualify');
        const stepIndicator = document.getElementById('step-indicator');
        const progressFill = document.getElementById('progress-fill');
        const formProgress = document.getElementById('formProgress');

        let currentStep = 1;
        const totalSteps = 8;

        const updateProgress = () => {
            if (currentStep <= totalSteps) {
                stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;
                const percentage = Math.round((currentStep / totalSteps) * 100);
                progressFill.style.width = `${percentage}%`;
                formProgress.style.display = 'block';
            } else {
                formProgress.style.display = 'none'; // Hide progress on result steps
            }
        };

        const formStepsWrapper = document.getElementById('formStepsWrapper');
        const showStep = (stepNumberOrId) => {
            steps.forEach(step => step.classList.remove('active'));
            let targetStep;
            
            if (typeof stepNumberOrId === 'number') {
                targetStep = steps.find(s => parseInt(s.getAttribute('data-step')) === stepNumberOrId);
                currentStep = stepNumberOrId;
            } else {
                targetStep = steps.find(s => s.getAttribute('data-step') === stepNumberOrId);
                currentStep = totalSteps + 1; // It's a result step
            }
            
            if (targetStep) {
                targetStep.classList.add('active');
                
                if (formStepsWrapper) {
                    const targetIndex = steps.indexOf(targetStep);
                    formStepsWrapper.style.transform = `translateX(-${targetIndex * 100}%)`;
                }
                
                updateProgress();
            }
        };

        // Input change handlers to enable/disable Next buttons and conditional logic
        leadForm.addEventListener('change', (e) => {
            const activeStep = leadForm.querySelector('.form-step.active');
            if (!activeStep) return;
            
            const nextBtn = activeStep.querySelector('.btn-next') || activeStep.querySelector('.btn-submit-qualify');
            if (!nextBtn) return;

            let shouldAutoAdvance = false;

            // Specific Conditional Logic
            if (e.target.name === 'role') {
                const conditional = document.getElementById('role-other-conditional');
                if (e.target.value === 'Other') {
                    conditional.style.display = 'block';
                    nextBtn.disabled = !leadForm.querySelector('input[name="role_budget_authority"]:checked');
                } else {
                    conditional.style.display = 'none';
                    nextBtn.disabled = false;
                    shouldAutoAdvance = true;
                }
            } else if (e.target.name === 'role_budget_authority') {
                nextBtn.disabled = false;
                shouldAutoAdvance = true;
            } else if (e.target.name === 'budget') {
                const conditional = document.getElementById('budget-increase-conditional');
                if (e.target.value === 'Under KES 50,000') {
                    conditional.style.display = 'block';
                    nextBtn.disabled = !leadForm.querySelector('input[name="budget_increase"]:checked');
                } else {
                    conditional.style.display = 'none';
                    nextBtn.disabled = false;
                    shouldAutoAdvance = true;
                }
            } else if (e.target.name === 'budget_increase') {
                nextBtn.disabled = false;
                shouldAutoAdvance = true;
            }
            else {
                // Generic validation
                const requiredInputs = Array.from(activeStep.querySelectorAll('input[required], select[required]'));
                const allFilled = requiredInputs.every(input => input.value.trim() !== '');
                
                // For radio groups without 'required' attr but need selection
                const radioGroups = new Set(Array.from(activeStep.querySelectorAll('input[type="radio"]')).map(el => el.name));
                let allRadiosSelected = true;
                radioGroups.forEach(name => {
                    // Ignore conditionals if they are hidden
                    if (name === 'role_budget_authority' && document.getElementById('role-other-conditional').style.display === 'none') return;
                    if (name === 'budget_increase' && document.getElementById('budget-increase-conditional').style.display === 'none') return;
                    
                    if (!activeStep.querySelector(`input[name="${name}"]:checked`)) {
                        allRadiosSelected = false;
                    }
                });

                // Checkboxes (Step 3: High-Ticket)
                if (activeStep.getAttribute('data-step') === '3') {
                    const checkedCount = activeStep.querySelectorAll('input[type="checkbox"]:checked').length;
                    nextBtn.disabled = checkedCount === 0 || checkedCount > 3;
                    return; // exit early for step 3
                }

                nextBtn.disabled = !(allFilled && allRadiosSelected);
                
                if (!nextBtn.disabled && e.target.type === 'radio') {
                    shouldAutoAdvance = true;
                }
            }
            
            // Auto-advance if a radio button was selected and validation passed
            if (shouldAutoAdvance && !nextBtn.disabled) {
                setTimeout(() => {
                    nextBtn.click();
                }, 350); // slight delay for UX
            }
        });
        
        // Prevent typing more than 3 checkboxes
        leadForm.querySelectorAll('input[type="checkbox"][name="procedures"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checkedCount = leadForm.querySelectorAll('input[type="checkbox"][name="procedures"]:checked').length;
                if (checkedCount > 3) {
                    e.target.checked = false; // Prevent checking
                }
            });
        });

        // Prevent Enter key from submitting form during steps
        leadForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && currentStep <= totalSteps) {
                e.preventDefault();
                const activeStep = leadForm.querySelector('.form-step.active');
                const nextBtn = activeStep.querySelector('.btn-next') || activeStep.querySelector('.btn-submit-qualify');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                }
            }
        });

        // Step Navigation
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Tracking
                trackPixelEvent('LeadFormStep', { 
                    step_number: currentStep,
                    step_name: `Step ${currentStep}`
                }, true);
                
                // Hard gates are now evaluated entirely at the end when qualify is clicked to prevent premature rejection before data collection, 
                // OR we can evaluate them as they go. The requirements state "Immediately NOT_QUALIFIED if...". 
                // We'll let the user fill the form and process all logic at the 'qualifyBtn' step for a cleaner UX, 
                // since the user request doesn't demand early termination, just that they are classified as NOT_QUALIFIED based on Hard Gates.

                showStep(currentStep + 1);
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                showStep(currentStep - 1);
            });
        });

// QUALIFICATION LOGIC
        const calculateQualification = () => {
            let score = 0;
            let classification = '';
            let reason = '';
            let hardGateResult = 'PASS';
            
            // Sub-scores
            let authorityScore = 0;
            let practiceScore = 0;
            let growthIntentScore = 0;
            let treatmentScore = 0;
            let advertisingScore = 0;
            let revenueScore = 0;
            let timelineScore = 0;
            let budgetScore = 0;

            const role = leadForm.querySelector('input[name="role"]:checked')?.value || '';
            const authority = leadForm.querySelector('input[name="role_budget_authority"]:checked')?.value || '';
            const clinicName = leadForm.querySelector('input[name="clinicName"]')?.value || '';
            const clinicWebsite = leadForm.querySelector('input[name="clinicWebsite"]')?.value || '';
            const procedures = Array.from(leadForm.querySelectorAll('input[name="procedures"]:checked')).map(cb => cb.value);
            const revenue = leadForm.querySelector('input[name="revenueGoals"]:checked')?.value || '';
            const budget = leadForm.querySelector('input[name="budget"]:checked')?.value || '';
            const budgetIncrease = leadForm.querySelector('input[name="budget_increase"]:checked')?.value || '';
            const ads = leadForm.querySelector('input[name="current_advertising"]:checked')?.value || '';
            const growthIntent = leadForm.querySelector('input[name="growth_intent"]:checked')?.value || '';
            const timeline = leadForm.querySelector('input[name="timeline"]:checked')?.value || '';

            // --- LAYER 1: HARD GATES ---
            
            // GATE 1: NO REAL PRACTICE (Checking spam/invalid inputs loosely, full check requires human. If clearly missing/gibberish -> NOT_QUALIFIED, if unsure -> MANUAL_REVIEW)
            let isPracticeReal = 'UNCLEAR';
            if (clinicName.length > 2 && clinicWebsite.length > 3) {
                isPracticeReal = 'YES';
            } else if (clinicName.length === 0 || clinicWebsite.length === 0) {
                isPracticeReal = 'NO';
            }
            // (Assuming generic validation handled it, but we set unclear if suspicious)
            const spamKeywords = ['test', 'spam', 'asdf', 'none', 'n/a', 'student', 'job'];
            if (spamKeywords.some(kw => clinicName.toLowerCase().includes(kw) || clinicWebsite.toLowerCase().includes(kw))) {
                isPracticeReal = 'NO';
            }

            if (isPracticeReal === 'NO') {
                hardGateResult = 'FAIL';
                classification = 'NOT_QUALIFIED';
                reason = 'NO_IDENTIFIABLE_DENTAL_PRACTICE';
            }

            // GATE 2: NO BUYING AUTHORITY
            let hasAuthority = 'YES';
            if (role === 'Associate Dentist' || role === 'Other') {
                if (authority === 'No') hasAuthority = 'NO';
                else if (authority === 'Not sure') hasAuthority = 'NOT_SURE';
            }
            if (hardGateResult === 'PASS' && hasAuthority === 'NO') {
                hardGateResult = 'FAIL';
                classification = 'NOT_QUALIFIED';
                reason = 'NO_MARKETING_AUTHORITY';
            }

            // GATE 3: NO GROWTH INTENT
            if (hardGateResult === 'PASS' && growthIntent === 'NOT CURRENTLY FOCUSED ON GROWTH') {
                // Exceptional case? We'll default to NOT_QUALIFIED unless they have 5M+ revenue AND high budget (proxy for exceptional)
                if (revenue === 'KES 5,000,000+' && (budget === 'KES 500,000+' || budget === 'KES 250,000 – KES 500,000')) {
                    // Manual review for exceptional
                } else {
                    hardGateResult = 'FAIL';
                    classification = 'NOT_QUALIFIED';
                    reason = 'NO_CURRENT_GROWTH_INTENT';
                }
            }

            // --- LAYER 2: 100-POINT SCORING (Only fully evaluated if passing hard gates) ---
            
            // CATEGORY 1: AUTHORITY (20)
            if (role === 'Owner / Founder' || role === 'Partner') authorityScore = 20;
            else if (role === 'Practice Manager' || role === 'Marketing / Growth Manager' || role === 'Dentist with marketing decision-making authority') authorityScore = 17;
            else if (role === 'Associate Dentist' && authority === 'Yes') authorityScore = 15;
            else if (role === 'Other' && authority === 'Yes') authorityScore = 10;
            else authorityScore = 0; // Not Sure gets 0 for score, but triggers manual review later

            // CATEGORY 2: PRACTICE QUALITY (15)
            if (isPracticeReal === 'YES') practiceScore = 15;
            else if (isPracticeReal === 'UNCLEAR') practiceScore = 5;

            // CATEGORY 3: GROWTH INTENT (20)
            if (growthIntent === 'VERY SERIOUS') growthIntentScore = 20;
            else if (growthIntent === 'SERIOUS') growthIntentScore = 17;
            else if (growthIntent === 'EXPLORING') growthIntentScore = 8;
            else growthIntentScore = 0;

            // CATEGORY 4: TREATMENT OPPORTUNITY (15)
            let maxTreatmentScore = 0;
            const tScores = {
                'Dental Implants': 15,
                'Invisalign / Clear Aligners': 15,
                'Veneers / Smile Makeovers': 15,
                'Full-Mouth Restoration': 15,
                'Braces / Orthodontics': 12,
                'Teeth Whitening': 7,
                'Cosmetic Bonding': 7,
                'General Dentistry': 5,
                'Other': 3
            };
            procedures.forEach(t => {
                if (tScores[t] && tScores[t] > maxTreatmentScore) maxTreatmentScore = tScores[t];
            });
            treatmentScore = maxTreatmentScore;

            // CATEGORY 5: ADVERTISING (10)
            if (ads === 'Meta + Google') advertisingScore = 10;
            else if (ads === 'Meta' || ads === 'Google') advertisingScore = 8;
            else if (ads === 'Previously advertised') advertisingScore = 5;
            else if (ads === 'Never advertised') advertisingScore = 3;
            else advertisingScore = 2; // Not sure or missing

            // CATEGORY 6: MATURITY (10)
            if (revenue === 'KES 5,000,000+') revenueScore = 10;
            else if (revenue === 'KES 2,500,000 – KES 5,000,000') revenueScore = 8;
            else if (revenue === 'KES 1,000,000 – KES 2,500,000') revenueScore = 6;
            else if (revenue === 'KES 500,000 – KES 1,000,000') revenueScore = 4;
            else if (revenue === 'Under KES 500,000') revenueScore = 2;
            else revenueScore = 3;

            // CATEGORY 7: TIMELINE (5)
            if (timeline === 'Immediately') timelineScore = 5;
            else if (timeline === 'Within 30 days') timelineScore = 4;
            else if (timeline === 'Within 1–3 months') timelineScore = 3;
            else if (timeline === 'Not sure') timelineScore = 2;
            else if (timeline === 'Researching') timelineScore = 1;
            else timelineScore = 2;

            // CATEGORY 8: BUDGET / WILLINGNESS (5)
            if (budget === 'KES 500,000+') budgetScore = 5;
            else if (budget === 'KES 250,000 – KES 500,000') budgetScore = 4;
            else if (budget === 'KES 100,000 – KES 250,000') budgetScore = 3;
            else if (budget === 'KES 50,000 – KES 100,000') budgetScore = 2;
            else if (budget === 'Under KES 50,000') {
                budgetScore = 1;
                if (budgetIncrease === 'Yes') budgetScore += 1;
                else if (budgetIncrease === 'Not sure') budgetScore += 0.5;
            } else budgetScore = 2; // Not sure

            score = authorityScore + practiceScore + growthIntentScore + treatmentScore + advertisingScore + revenueScore + timelineScore + budgetScore;
            if (score > 100) score = 100;

            // --- CLASSIFICATION LOGIC ---
            if (hardGateResult === 'PASS') {
                if (score >= 75) {
                    classification = 'HOT_LEAD';
                    reason = 'High-scoring lead based on 100-point model.';
                } else if (score >= 60) {
                    classification = 'QUALIFIED_LEAD';
                    reason = 'Qualified lead based on 100-point model.';
                } else if (score >= 45) {
                    classification = 'MANUAL_REVIEW';
                    reason = 'Score between 45-59. Potentially valuable but requires human judgment.';
                } else {
                    classification = 'NOT_QUALIFIED';
                    reason = 'Score below 45.';
                }

                // Manual Review Overrides for Uncertainty
                if (classification === 'HOT_LEAD' || classification === 'QUALIFIED_LEAD') {
                    if (hasAuthority === 'NOT_SURE') {
                        classification = 'MANUAL_REVIEW';
                        reason = 'Marketing authority is uncertain.';
                    } else if (isPracticeReal === 'UNCLEAR') {
                        classification = 'MANUAL_REVIEW';
                        reason = 'Practice legitimacy is uncertain.';
                    } else if (growthIntent === 'NOT CURRENTLY FOCUSED ON GROWTH') {
                        classification = 'MANUAL_REVIEW';
                        reason = 'Exceptional lead but no current growth intent.';
                    } else if (procedures.length === 0) {
                        classification = 'MANUAL_REVIEW';
                        reason = 'Treatment opportunity is unclear.';
                    }
                }
            }

            return {
                score,
                classification,
                reason,
                hardGateResult,
                authorityScore,
                practiceScore,
                growthIntentScore,
                treatmentScore,
                advertisingScore,
                revenueScore,
                timelineScore,
                budgetScore
            };
        };

        if (qualifyBtn) {
            qualifyBtn.addEventListener('click', () => {
                trackPixelEvent('LeadFormStep', { 
                    step_number: currentStep,
                    step_name: `Step ${currentStep}`
                }, true);
                
                const result = calculateQualification();
                
                document.getElementById('qualificationScore').value = result.score;
                document.getElementById('leadClassification').value = result.classification;
                document.getElementById('qualification_reason').value = result.reason;
                document.getElementById('hard_gate_result').value = result.hardGateResult;
                document.getElementById('authority_score').value = result.authorityScore;
                document.getElementById('practice_score').value = result.practiceScore;
                document.getElementById('growth_intent_score').value = result.growthIntentScore;
                document.getElementById('treatment_score').value = result.treatmentScore;
                document.getElementById('advertising_score').value = result.advertisingScore;
                document.getElementById('revenue_score').value = result.revenueScore;
                document.getElementById('timeline_score').value = result.timelineScore;
                document.getElementById('budget_score').value = result.budgetScore;

                if (result.classification === 'NOT_QUALIFIED') {
                    document.getElementById('reject-message').textContent = "Based on the information provided, our current program may not be the right fit for your practice at this stage.";
                    trackPixelEvent('ApplicationRejected', { score: result.score, reason: result.reason }, true);
                    showStep('reject');
                } else if (result.classification === 'MANUAL_REVIEW') {
                    document.getElementById('result-headline').textContent = "Thanks — we've received your application.";
                    document.getElementById('result-subheadline').textContent = "We'll review your practice and contact you with the next step.";
                    leadForm.querySelector('button[type="submit"]').innerHTML = 'Submit Application';
                    showStep('contact');
                } else {
                    document.getElementById('result-headline').textContent = "You're a potential fit.";
                    document.getElementById('result-subheadline').textContent = "Check your email for the next step.";
                    leadForm.querySelector('button[type="submit"]').innerHTML = 'See Calendar <i class="ph ph-calendar-check" style="margin-left: 8px;"></i>';
                    showStep('contact');
                }
            });
        }

        // --- Final Form Submission (Contact Details) ---
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            formError.style.display = 'none';

            // Honeypot check
            if (document.getElementById('website_url').value) {
                console.warn("Spam detected.");
                showStep('calendar'); // Fake success
                return;
            }

            // Email validation
            const email = document.getElementById('email').value.toLowerCase();
            const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
            if (!emailRegex.test(email)) {
                formError.textContent = "Please enter a valid email address.";
                formError.style.display = 'block';
                return;
            }

            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = "Submitting...";
            submitBtn.disabled = true;

            const formData = new FormData(leadForm);
            
            // Format procedures
            const procedures = Array.from(leadForm.querySelectorAll('input[name="procedures"]:checked'))
                .map(cb => cb.value)
                .join(', ');
            formData.set('procedures', procedures);

            // UTM Tracking from localStorage fallback
            let storedTracking = {};
            try {
                storedTracking = JSON.parse(localStorage.getItem('dgh_tracking_params') || '{}');
            } catch(e) {}
            const urlParams = new URLSearchParams(window.location.search);
            
            formData.append('utm_source', urlParams.get('utm_source') || storedTracking.utm_source || '');
            formData.append('utm_medium', urlParams.get('utm_medium') || storedTracking.utm_medium || '');
            formData.append('utm_campaign', urlParams.get('utm_campaign') || storedTracking.utm_campaign || '');
            formData.append('utm_content', urlParams.get('utm_content') || storedTracking.utm_content || '');
            formData.append('utm_term', urlParams.get('utm_term') || storedTracking.utm_term || '');
            formData.append('fbclid', urlParams.get('fbclid') || storedTracking.fbclid || '');
            
            // Internal Tags
            formData.append('tags', 'DENTAL_LEAD, COMMERCIAL_DENTISTRY, HIGH_TICKET_DENTISTRY');

            // Dynamic Formspree Subject
            const clinicName = formData.get('clinicName') || 'Unknown Clinic';
            const classification = document.getElementById('leadClassification').value;
            let subject = 'New Dental Growth Hub Lead';
            if (classification === 'HOT_LEAD') {
                subject = `🔥 HOT Dental Growth Hub Lead — ${clinicName}`;
            } else if (classification === 'QUALIFIED_LEAD') {
                subject = `🟢 Qualified Dental Growth Hub Lead — ${clinicName}`;
            } else if (classification === 'MANUAL_REVIEW') {
                subject = `🟡 Manual Review Required — ${clinicName}`;
            } else if (classification === 'NOT_QUALIFIED') {
                subject = `🔴 Unqualified Lead — ${clinicName}`;
            }
            formData.append('_subject', subject);
            // Required for Formspree to actually show this custom subject
            formData.append('_replyto', document.getElementById('email').value);

            formData.delete('website_url');

            const formspreeURL = 'https://formspree.io/f/mrpzwyzj';
            const googleScriptURL = 'https://script.google.com/macros/s/AKfycbzLbGoD3-l4sYLrSiFFXCR-QSbpNgo6_I1XDTfLNHa4sBS9Zk1frKKWjtlk0xE3XJlWqQ/exec';

            // Google Script data format
            const urlData = new URLSearchParams();
            for (const pair of formData) {
                urlData.append(pair[0], pair[1]);
            }

            // Trigger transition animation immediately
            showStep('transition');
            
            const items = document.querySelectorAll('.transition-item');
            const almost = document.getElementById('transition-almost');
            items.forEach((item, index) => {
                setTimeout(() => { item.style.opacity = '1'; }, (index + 1) * 400);
            });
            setTimeout(() => { if (almost) almost.style.opacity = '1'; }, (items.length + 1) * 400);

            const p1 = fetch(formspreeURL, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            const p2 = fetch(googleScriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: urlData
            });

            // Trigger Email Automation Webhook
            // NOTE: Replace this URL with your deployed backend service URL in production
            const backendWebhookURL = 'http://localhost:3001/api/webhook'; 
            
            // Generate or fetch external ID for deduplication in the backend
            let externalId = localStorage.getItem('dgh_external_id');
            if (!externalId) {
                externalId = 'DH' + Date.now() + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('dgh_external_id', externalId);
            }
            
            // Build JSON payload for our webhook
            const webhookPayload = {};
            for (let [key, value] of formData.entries()) {
                webhookPayload[key] = value;
            }
            webhookPayload['dgh_external_id'] = externalId;

            const p3 = fetch(backendWebhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            }).catch(e => console.error('Webhook failed silently:', e));

            // Ensure transition takes at least 2 seconds total for UX, but process asynchronously
            const startTime = Date.now();

            Promise.allSettled([p1, p2, p3]).then(() => {
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, 2000 - elapsed);
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    
                    const classification = document.getElementById('leadClassification').value;
                    const score = document.getElementById('qualificationScore').value;
                    const email = document.getElementById('email').value;
                    
                    const displayEmailEl = document.getElementById('display-email');
                    if (displayEmailEl) {
                        displayEmailEl.textContent = email;
                    }
                    
                    let externalId = localStorage.getItem('dgh_external_id');
                    if (!externalId) {
                        externalId = 'DH' + Date.now() + Math.random().toString(36).substr(2, 9);
                        localStorage.setItem('dgh_external_id', externalId);
                    }
                    
                    // Generate deduplication ID for Conversions API / Browser Pixel
                    const baseEventId = externalId || ('DH' + Date.now());

                    // Fire standard Lead event for all successful submissions (replacing ApplicationSubmitted)
                    if (!localStorage.getItem(`dgh_lead_sent_${baseEventId}`)) {
                        trackPixelEvent('Lead', {
                            content_name: 'Dental Growth Hub Application',
                            content_category: 'Lead Capture',
                            lead_type: 'commercial_dentistry',
                            country: 'Kenya',
                            lead_classification: classification,
                            qualification_score: score
                        }, false, `lead_${baseEventId}`);
                        localStorage.setItem(`dgh_lead_sent_${baseEventId}`, 'true');
                        
                        // Fire specific qualified events based on the result
                        if (classification === 'HOT_LEAD' || classification === 'QUALIFIED_LEAD') {
                            trackPixelEvent('QualifiedLead', {
                                lead_status: classification,
                                lead_type: 'commercial_dentistry',
                                qualification_score: score,
                                treatment_count: leadForm.querySelectorAll('input[type="checkbox"][name="procedures"]:checked').length || 0,
                            }, true, `qualified_${baseEventId}`);
                        } else if (classification === 'MANUAL_REVIEW') {
                            trackPixelEvent('ManualReviewLead', {
                                lead_status: classification,
                                lead_type: 'commercial_dentistry',
                                qualification_score: score
                            }, true, `manual_${baseEventId}`);
                        }
                    }

                    // Routing based on classification
                    if (classification === 'HOT_LEAD' || classification === 'QUALIFIED_LEAD') {
                        showStep('calendar'); // This maps to the Qualified Success Message
                    } else if (classification === 'NOT_QUALIFIED') {
                        showStep('reject');
                    } else {
                        showStep('manual-review-success');
                    }
                }, remainingTime);
            });
        });
    }
});

// Play Video function with Lightbox Expansion
function playVideo(container) {
    try {
        console.log("playVideo triggered on", container);
        const vslLightbox = document.getElementById('vslLightbox');
        const vslExpandedContent = document.getElementById('vslExpandedContent');
        const closeVsl = document.getElementById('closeVsl');

        if (!vslLightbox || !vslExpandedContent) {
            console.error("VSL Lightbox elements not found!");
            return;
        }

    // Track VSL engagement as a standard ViewContent event for better visibility
    if (typeof trackPixelEvent === 'function') {
        trackPixelEvent('ViewContent', { 
            content_name: 'VSL Playback',
            content_category: 'Engagement'
        });
    }

    // Hide the play button overlay on the main page
    container.classList.add('playing');

    vslExpandedContent.innerHTML = '';

    const videoSrc = container.getAttribute('data-video-src');
    if (videoSrc) {
        const newIframe = document.createElement('iframe');
        newIframe.setAttribute('src', videoSrc);
        newIframe.setAttribute('frameborder', '0');
        newIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        newIframe.setAttribute('allowfullscreen', 'true');
        newIframe.style.position = 'absolute';
        newIframe.style.top = '0';
        newIframe.style.left = '0';
        newIframe.style.width = '100%';
        newIframe.style.height = '100%';
        newIframe.style.borderRadius = '12px';
        vslExpandedContent.appendChild(newIframe);
    } else {
        const originalIframe = container.querySelector('iframe');
        const originalVideo = container.querySelector('video');
        if (originalIframe) {
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
            vslExpandedContent.appendChild(newIframe);
        } else if (originalVideo) {
            const newVideo = originalVideo.cloneNode(true);
            newVideo.style.display = 'block';
            newVideo.autoplay = true;
            newVideo.controls = true;
            vslExpandedContent.appendChild(newVideo);
            // Ensure play
            const playPromise = newVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play was prevented", error);
                });
            }
        } else {
            return; // No video source found
        }
    }

    // Show Lightbox
    vslLightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // Close logic
    const closeHandler = () => {
        vslLightbox.classList.remove('active');
        container.classList.remove('playing');
        document.body.style.overflow = '';
        vslExpandedContent.innerHTML = ''; // Stop video
        closeVsl.removeEventListener('click', closeHandler);
        vslLightbox.removeEventListener('click', backdropHandler);
        document.removeEventListener('keydown', escHandler);
    };

    const backdropHandler = (e) => {
        if (e.target === vslLightbox) closeHandler();
    };

    const escHandler = (e) => {
        if (e.key === 'Escape') closeHandler();
    };

    closeVsl.addEventListener('click', closeHandler);
    vslLightbox.addEventListener('click', backdropHandler);
    document.addEventListener('keydown', escHandler);
    
    } catch (error) {
        console.error("Error in playVideo:", error);
    }
}



// Schedule Intent Tracking
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const cta = e.target.closest('.booking-cta');
        if (cta) {
            trackPixelEvent('ScheduleIntent', {
                content_name: 'Booking CTA Click',
                destination: cta.getAttribute('href')
            }, true);
        }
    });
});
