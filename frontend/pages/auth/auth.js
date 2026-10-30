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
});


// ==========================================
// 4. GOOGLE IDENTITY SERVICES AUTHENTICATION
// ==========================================

(function initGoogleAuthentication() {
    // Google Identity Services rejects raw loopback IPs (127.0.0.1) in Authorized JavaScript origins
    // and requires `http://localhost:<port>`. Normalize 127.0.0.1 -> localhost automatically.
    if (window.location.hostname === "127.0.0.1") {
        window.location.replace(window.location.href.replace("//127.0.0.1", "//localhost"));
        return;
    }

    let preloadedGoogleConfig = null;

    function prefetchGoogleConfig() {
        if (typeof apiGetGoogleConfig === "function") {
            apiGetGoogleConfig()
                .then((cfg) => {
                    if (cfg && cfg.enabled && cfg.client_id) {
                        preloadedGoogleConfig = cfg;
                    }
                })
                .catch(() => {});
        }
    }

    function ensureGoogleIdentitySdk(timeoutMs = 6000) {
        return new Promise((resolve) => {
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                resolve(true);
                return;
            }

            let existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (!existingScript) {
                existingScript = document.createElement("script");
                existingScript.src = "https://accounts.google.com/gsi/client";
                existingScript.async = true;
                existingScript.defer = true;
                document.head.appendChild(existingScript);
            }

            const started = Date.now();
            const poll = setInterval(() => {
                if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                    clearInterval(poll);
                    resolve(true);
                } else if (Date.now() - started >= timeoutMs) {
                    clearInterval(poll);
                    resolve(false);
                }
            }, 120);
        });
    }

    function renderGoogleBanner(anchorBtn, message, variant) {
        let banner = document.getElementById("googleAuthBanner");
        if (!message) {
            if (banner) banner.remove();
            return;
        }
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "googleAuthBanner";
            banner.setAttribute("role", "alert");
            anchorBtn.insertAdjacentElement("afterend", banner);
        }
        banner.className = "google-auth-banner is-" + (variant || "info");
        banner.textContent = message;
    }

    function redirectAuthenticatedGoogleUser(authResult) {
        try {
            sessionStorage.removeItem("urbanscope_register_draft");
        } catch (_) {}

        const queryParams = new URLSearchParams(window.location.search);
        const rawNext = queryParams.get("redirect") || "";
        const safeNext = /^[A-Za-z0-9_\-\/]+\.html([?#][A-Za-z0-9_\-=&%.]*)?$/.test(rawNext) ? rawNext : "index.html";

        const user = (authResult && authResult.data && authResult.data.user) || {};
        const cleanEmail = (user.email || "").toLowerCase().trim();
        const role = (user.role || "user").toLowerCase();
        const isAdminUser = (
            (cleanEmail === "admin.realestate@gmail.com" || cleanEmail === "urbanscope.cvsu@gmail.com") &&
            (role === "admin" || role === "superadmin")
        );

        if (role === "superadmin" && cleanEmail === "urbanscope.cvsu@gmail.com") {
            window.location.href = "../superadmin/dashboard.html";
        } else if (isAdminUser) {
            window.location.href = "../admin/dashboard.html";
        } else if (safeNext && safeNext !== "index.html") {
            window.location.href = "../../" + safeNext;
        } else {
            window.location.href = "../../index.html";
        }
    }

    function attachGoogleButton(btn) {
        if (!btn || btn.dataset.googleBound === "true") return;
        btn.dataset.googleBound = "true";

        const labelSpan = btn.querySelector("span");
        const defaultLabel = labelSpan ? labelSpan.textContent : "Continue with Google";

        function setLoadingState(loading, text) {
            btn.disabled = loading;
            btn.classList.toggle("is-loading", loading);
            if (labelSpan) labelSpan.textContent = text || defaultLabel;
        }

        function launchGoogleTokenPopup(clientId) {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: "openid email profile",
                callback: async (tokenResponse) => {
                    if (!tokenResponse || tokenResponse.error) {
                        setLoadingState(false);
                        if (tokenResponse && tokenResponse.error &&
                            tokenResponse.error !== "popup_closed_by_user" &&
                            tokenResponse.error !== "access_denied") {
                            renderGoogleBanner(
                                btn,
                                "Google sign-in error: " + (tokenResponse.error_description || tokenResponse.error),
                                "error"
                            );
                        }
                        return;
                    }

                    if (!tokenResponse.access_token) {
                        setLoadingState(false);
                        return;
                    }

                    setLoadingState(true, "Verifying Google Account...");
                    const res = await apiSignInWithGoogle({ access_token: tokenResponse.access_token });
                    if (res && res.success) {
                        setLoadingState(true, "Signed in! Redirecting...");
                        redirectAuthenticatedGoogleUser(res);
                    } else {
                        setLoadingState(false);
                        renderGoogleBanner(
                            btn,
                            (res && res.error) || "Google authentication failed. Please try again.",
                            "error"
                        );
                    }
                },
                error_callback: (err) => {
                    setLoadingState(false);
                    if (err && err.type === "popup_failed_to_open") {
                        renderGoogleBanner(
                            btn,
                            "Google sign-in popup was blocked. Please allow popups for this site and try again.",
                            "error"
                        );
                    }
                }
            });

            tokenClient.requestAccessToken({ prompt: "select_account" });
        }

        btn.addEventListener("click", async () => {
            renderGoogleBanner(btn, "");
            setLoadingState(true, "Connecting to Google...");

            // Fast synchronous path when config & GIS SDK are already preloaded (prevents popup blockers)
            if (
                preloadedGoogleConfig &&
                preloadedGoogleConfig.enabled &&
                preloadedGoogleConfig.client_id &&
                window.google &&
                window.google.accounts &&
                window.google.accounts.oauth2
            ) {
                launchGoogleTokenPopup(preloadedGoogleConfig.client_id);
                return;
            }

            // Async fallback (re-checks .env config on the fly & waits for GIS SDK if still loading)
            const cfg = (typeof apiGetGoogleConfig === "function")
                ? await apiGetGoogleConfig()
                : { enabled: false, client_id: "" };

            if (!cfg || !cfg.enabled || !cfg.client_id) {
                setLoadingState(false);
                renderGoogleBanner(
                    btn,
                    "Google Sign-In setup required: add your GOOGLE_CLIENT_ID in the .env file (see .env.example) to enable Google authentication.",
                    "setup"
                );
                return;
            }

            preloadedGoogleConfig = cfg;
            const sdkReady = await ensureGoogleIdentitySdk();
            if (!sdkReady) {
                setLoadingState(false);
                renderGoogleBanner(
                    btn,
                    "Unable to reach Google Identity Services. Please check your internet connection or disable script blockers.",
                    "error"
                );
                return;
            }

            launchGoogleTokenPopup(cfg.client_id);
        });
    }

    function setup() {
        prefetchGoogleConfig();
        document.querySelectorAll(".btn-google").forEach(attachGoogleButton);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setup);
    } else {
        setup();
    }
})();
