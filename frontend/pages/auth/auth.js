// ==========================================
// 1. CAROUSEL & SLIDING ANIMATION LOGIC
// ==========================================

const slides = [
    {
        image: "../../assets/images/auth-slide1.jpg",
        title: "Your Next Home is<br>Just a Click away",
        desc: "Access property details, submit inquiries, upload your requirements, and track your journey."
    },
    {
        image: "../../assets/images/auth-slide2.jpg",
        title: "Modern Living,<br>Elevated Comfort",
        desc: "Discover curated properties built with precision and timeless elegance."
    },
    {
        image: "../../assets/images/auth-slide3.jpg",
        title: "Prime Neighborhoods,<br>Serene Living",
        desc: "Master-planned communities located near top schools, commercial hubs, and transport."
    },
    {
        image: "../../assets/images/auth-slide4.jpg",
        title: "Seamless Real Estate<br>Experience",
        desc: "Dedicated realty support from consultation to your key turnover."
    }
];

let currentSlide = 0;
let isAnimating = false;
let slideTimer = null;

function setSlide(index, direction = null) {
    if (index === currentSlide && document.querySelector(".slides-track .slide-item.active")) return;
    if (isAnimating) return;
    if (index < 0 || index >= slides.length) return;

    isAnimating = true;
    const oldIndex = currentSlide;
    currentSlide = index;

    const isNext = direction !== null ? direction === 'next' : index > oldIndex;
    const slideItems = document.querySelectorAll(".slides-track .slide-item");
    const dots = document.querySelectorAll(".dots-container .dot");
    const titleEl = document.getElementById("slideTitle");
    const descEl = document.getElementById("slideDesc");
    const captionEl = document.querySelector(".showcase-caption");

    // 1. Sliding Track Animation
    if (slideItems.length > 0) {
        slideItems.forEach((item, idx) => {
            if (idx === oldIndex) {
                item.className = isNext ? "slide-item slide-out-left" : "slide-item slide-out-right";
            } else if (idx === currentSlide) {
                item.className = isNext ? "slide-item slide-in-right" : "slide-item slide-in-left";
                void item.offsetWidth; // Force CSS reflow for smooth animation
                item.className = "slide-item active";
            } else {
                item.className = "slide-item";
            }
        });
    } else {
        const imgEl = document.getElementById("slideImage");
        if (imgEl && slides[currentSlide]) {
            imgEl.style.opacity = "0.3";
            setTimeout(() => {
                imgEl.src = slides[currentSlide].image;
                imgEl.style.opacity = "1";
            }, 180);
        }
    }

    // 2. Caption Fade
    if (captionEl) {
        captionEl.style.opacity = "0.3";
        setTimeout(() => {
            if (titleEl && slides[currentSlide]) titleEl.innerHTML = slides[currentSlide].title;
            if (descEl && slides[currentSlide]) descEl.textContent = slides[currentSlide].desc;
            captionEl.style.opacity = "1";
        }, 220);
    } else {
        if (titleEl && slides[currentSlide]) titleEl.innerHTML = slides[currentSlide].title;
        if (descEl && slides[currentSlide]) descEl.textContent = slides[currentSlide].desc;
    }

    // 3. Update Dots
    dots.forEach((dot, idx) => {
        if (idx === currentSlide) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });

    setTimeout(() => {
        isAnimating = false;
    }, 850);

    resetAutoSlide();
}

function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    setSlide(next, 'next');
}

function prevSlide() {
    let prev = (currentSlide - 1 + slides.length) % slides.length;
    setSlide(prev, 'prev');
}

function resetAutoSlide() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 5000);
}

resetAutoSlide();


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
