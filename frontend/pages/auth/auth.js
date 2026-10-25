// ==========================================
// 1. CAROUSEL, SLIDING & SWIPE/TAP LOGIC
// ==========================================

const totalRealSlides = 3;
let trackIndex = 1; // 0 = clone 3, 1 = slide 1, 2 = slide 2, 3 = slide 3, 4 = clone 1
let currentDot = 0; // 0, 1, 2
let isAnimating = false;
let slideTimer = null;

function updateDots(dotIdx) {
    currentDot = dotIdx;
    try {
        sessionStorage.setItem("auth_slide_index", String(dotIdx));
    } catch(err) {}
    const dots = document.querySelectorAll(".dots-container .dot");
    dots.forEach((dot, idx) => {
        if (idx === dotIdx) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

function nextSlide() {
    if (isAnimating) return;
    isAnimating = true;

    const trackEl = document.getElementById("slidesTrack");
    if (!trackEl) {
        isAnimating = false;
        return;
    }

    trackIndex++;

    // Calculate dot:
    // When trackIndex = 2 -> dot 1
    // When trackIndex = 3 -> dot 2
    // When trackIndex = 4 (clone of slide 1) -> dot 0!
    let nextDot = (trackIndex - 1) % totalRealSlides;
    if (nextDot < 0) nextDot = totalRealSlides - 1;
    updateDots(nextDot);

    trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
    trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;

    setTimeout(() => {
        // Silently loop when reaching clone of slide 1
        if (trackIndex === 4) {
            trackEl.style.transition = "none";
            trackIndex = 1;
            trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;
            void trackEl.offsetHeight; // force DOM reflow
            trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
        }
        isAnimating = false;
    }, 660);

    resetAutoSlide();
}

function prevSlide() {
    if (isAnimating) return;
    isAnimating = true;

    const trackEl = document.getElementById("slidesTrack");
    if (!trackEl) {
        isAnimating = false;
        return;
    }

    trackIndex--;

    // Calculate dot:
    // When trackIndex = 0 (clone of slide 3) -> dot 2!
    // When trackIndex = 1 -> dot 0
    // When trackIndex = 2 -> dot 1
    let prevDot = (trackIndex - 1) % totalRealSlides;
    if (prevDot < 0) prevDot = totalRealSlides - 1;
    updateDots(prevDot);

    trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
    trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;

    setTimeout(() => {
        // Silently loop when reaching clone of slide 3
        if (trackIndex === 0) {
            trackEl.style.transition = "none";
            trackIndex = 3;
            trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;
            void trackEl.offsetHeight; // force DOM reflow
            trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
        }
        isAnimating = false;
    }, 660);

    resetAutoSlide();
}

function setSlide(targetDotIndex, e = null) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isAnimating) return;
    if (targetDotIndex < 0 || targetDotIndex >= totalRealSlides) return;
    if (targetDotIndex === currentDot) return;

    // Seamless forward loop when clicking dot 0 from last slide
    if (currentDot === totalRealSlides - 1 && targetDotIndex === 0) {
        nextSlide();
        return;
    }
    // Seamless backward loop when clicking last dot from first slide
    if (currentDot === 0 && targetDotIndex === totalRealSlides - 1) {
        prevSlide();
        return;
    }

    isAnimating = true;
    trackIndex = targetDotIndex + 1;
    updateDots(targetDotIndex);

    const trackEl = document.getElementById("slidesTrack");
    if (trackEl) {
        trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
        trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;
    }

    setTimeout(() => {
        isAnimating = false;
    }, 660);

    resetAutoSlide();
}

function resetAutoSlide() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 5000);
}

// Tap to swipe & Phone Touch Swipe implementation
function initSwipeAndTap() {
    const showcasePanel = document.querySelector(".showcase-panel");
    if (!showcasePanel) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isTouchSwiping = false;
    let lastTouchTime = 0;

    // Mobile / Phone touch events: swipe left/right & tap
    showcasePanel.addEventListener("touchstart", (e) => {
        if (e.target.closest(".dots-container") || e.target.closest("a") || e.target.closest("button")) return;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
        isTouchSwiping = true;
    }, { passive: true });

    showcasePanel.addEventListener("touchend", (e) => {
        if (!isTouchSwiping) return;
        isTouchSwiping = false;
        lastTouchTime = Date.now();
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const deltaTime = Date.now() - startTime;

        // Check if horizontal swipe on mobile phone
        if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 0.7) {
            if (deltaX < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && deltaTime < 450) {
            // Clean tap on phone screen: tap to advance!
            nextSlide();
        }
    }, { passive: true });

    // Desktop mouse drag & click / tap to swipe
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseStartTime = 0;
    let isMouseDown = false;

    showcasePanel.addEventListener("mousedown", (e) => {
        if (Date.now() - lastTouchTime < 600) return;
        if (e.target.closest(".dots-container") || e.target.closest("a") || e.target.closest("button")) return;
        isMouseDown = true;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        mouseStartTime = Date.now();
    });

    window.addEventListener("mouseup", (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        if (Date.now() - lastTouchTime < 600) return;
        const deltaX = e.clientX - mouseStartX;
        const deltaY = e.clientY - mouseStartY;
        const deltaTime = Date.now() - mouseStartTime;

        if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 0.7) {
            if (deltaX < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaTime < 500) {
            nextSlide();
        }
    });
}

// Initialize on DOM ready
function initCarousel() {
    let savedIndex = 0;
    try {
        const stored = sessionStorage.getItem("auth_slide_index");
        if (stored !== null && !isNaN(parseInt(stored, 10))) {
            const parsed = parseInt(stored, 10);
            if (parsed >= 0 && parsed < totalRealSlides) {
                savedIndex = parsed;
            }
        }
    } catch(err) {}

    trackIndex = savedIndex + 1;
    currentDot = savedIndex;

    const trackEl = document.getElementById("slidesTrack");
    if (trackEl) {
        trackEl.style.transition = "none";
        trackEl.style.transform = `translateX(-${trackIndex * 20}%)`;
        void trackEl.offsetHeight; // force reflow
        trackEl.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
    }

    updateDots(savedIndex);
    resetAutoSlide();
    initSwipeAndTap();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousel);
} else {
    initCarousel();
}


// ==========================================
// 2. PASSWORD TOGGLE (SHOW / HIDE)
// ==========================================

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    const eyeSvg = isPassword 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

    btn.innerHTML = eyeSvg;
}


// ==========================================
// 3. REGISTRATION VALIDATION & STRENGTH METER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector("form[action='register.php']") || document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            const pwd = document.getElementById("password");
            const confirmPwd = document.getElementById("confirm_password");

            if (pwd && confirmPwd && pwd.value !== confirmPwd.value) {
                e.preventDefault();
                alert("Passwords do not match! Please check and try again.");
                confirmPwd.focus();
            }
        });
    }

    const pwd = document.getElementById("password");
    const confirmPwd = document.getElementById("confirm_password");
    const meter = document.getElementById("strengthMeter");
    const label = document.getElementById("strengthLabel");
    const hint = document.getElementById("matchHint");
    const googleBtn = document.getElementById("googleSignup");

    if (!pwd || !meter) return;

    const labels = ["Use 8+ characters with letters, numbers & symbols", "Weak", "Fair", "Good", "Strong"];

    function scorePassword(value) {
        if (!value) return 0;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        if (value.length < 8) score = Math.min(score, 1);
        return Math.max(score, 1);
    }

    function updateMatch() {
        if (!confirmPwd || !hint) return;
        if (!confirmPwd.value) {
            hint.textContent = "";
            hint.className = "match-hint";
            return;
        }
        const ok = pwd.value === confirmPwd.value;
        hint.textContent = ok ? "Passwords match" : "Passwords do not match";
        hint.className = "match-hint " + (ok ? "ok" : "error");
    }

    pwd.addEventListener("input", () => {
        const level = scorePassword(pwd.value);
        meter.dataset.level = level;
        if (label) label.textContent = labels[level];
        updateMatch();
    });

    if (confirmPwd) {
        confirmPwd.addEventListener("input", updateMatch);
    }

    if (googleBtn) {
        googleBtn.addEventListener("click", () => {
            window.location.href = "google_auth.php?mode=register";
        });
    }
});
