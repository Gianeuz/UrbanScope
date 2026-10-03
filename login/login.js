// ==========================================
// 1. CAROUSEL & SLIDESHOW LOGIC
// ==========================================

// Add your own image filenames here
const slides = [
    {
        image: "Urban.jpg",
        title: "Your Next Home is<br>Just a Click away",
        desc: "Access property details, submit inquiries, upload your requirements, and track your journey."
    },
    {
        image: "your-house-image-2.jpg", // Add a second photo if available
        title: "Modern Living,<br>Elevated Comfort",
        desc: "Discover curated properties built with precision and timeless elegance."
    },
    {
        image: "your-house-image-3.jpg", // Add a third photo if available
        title: "Seamless Real Estate<br>Experience",
        desc: "Dedicated realty support from consultation to your key turnover."
    }
];

let currentSlide = 0;
let slideTimer = null;

function setSlide(index) {
    currentSlide = index;

    const imgEl = document.getElementById("slideImage");
    const titleEl = document.getElementById("slideTitle");
    const descEl = document.getElementById("slideDesc");
    const dots = document.querySelectorAll(".dots-container .dot");

    // Smooth transition
    if (imgEl) {
        imgEl.style.opacity = "0.4";
        setTimeout(() => {
            imgEl.src = slides[currentSlide].image;
            imgEl.style.opacity = "1";
        }, 150);
    }

    if (titleEl) titleEl.innerHTML = slides[currentSlide].title;
    if (descEl) descEl.textContent = slides[currentSlide].desc;

    // Update active dot indicator
    dots.forEach((dot, idx) => {
        if (idx === currentSlide) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });

    // Reset autoplay timer when clicked manually
    resetAutoSlide();
}

function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    setSlide(next);
}

function resetAutoSlide() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 5000); // changes slide every 5 seconds
}

// Start auto slide on page load
resetAutoSlide();


// ==========================================
// 2. PASSWORD TOGGLE (SHOW / HIDE)
// ==========================================

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    // Toggle icon visual
    const eyeSvg = isPassword 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

    btn.innerHTML = eyeSvg;
}


// ==========================================
// 3. REGISTRATION PASSWORD MATCH VALIDATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector("form[action='register.php']");
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
});

// ==========================================
// 4. REGISTRATION: STRENGTH METER, MATCH HINT & GOOGLE SIGN-UP
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const pwd = document.getElementById("password");
    const confirmPwd = document.getElementById("confirm_password");
    const meter = document.getElementById("strengthMeter");
    const label = document.getElementById("strengthLabel");
    const hint = document.getElementById("matchHint");
    const googleBtn = document.getElementById("googleSignup");

    if (!pwd || !meter) return; // Not on the registration page

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
        label.textContent = labels[level];
        updateMatch();
    });

    confirmPwd.addEventListener("input", updateMatch);

    if (googleBtn) {
        googleBtn.addEventListener("click", () => {
            // TODO: Hook up to Google OAuth endpoint
            window.location.href = "google_auth.php?mode=register";
        });
    }
});
