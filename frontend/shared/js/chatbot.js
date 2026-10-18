/**
 * UrbanScope - AI Real Estate Chatbot (Mira)
 * Specially designed for CD Miranda Realty & Miriam Lobren
 * Provides intelligent website navigation, property recommendations,
 * consultation guidance, and real estate assistance.
 */

(function () {
    // ----------------------------------------------------------
    // 1. PATH RESOLVER
    // ----------------------------------------------------------
    // Section pages live at frontend/pages/<section>/ (two levels below index.html)
    const isSubfolder = window.location.pathname.includes('/pages/');
    const basePath = isSubfolder ? '../../' : './';

    const URLS = {
        home: basePath + 'index.html',
        properties: basePath + 'pages/properties/properties.html',
        propertyDetail: basePath + 'pages/properties/property-detail.html',
        inquiry: basePath + 'pages/inquiry/inquiry.html',
        login: basePath + 'pages/auth/login.html',
        register: basePath + 'pages/auth/register.html',
        adminLogin: basePath + 'pages/admin/login.html',
        logo: basePath + 'assets/images/logo.png',
        images: basePath + 'assets/images/'
    };

    // ----------------------------------------------------------
    // 2. KNOWLEDGE BASE & PROPERTY CATALOG
    // ----------------------------------------------------------
    const AGENT_INFO = {
        name: "Miriam Lobren",
        role: "Licensed Real Estate Agent & Specialist",
        agency: "CD Miranda Realty (UrbanScope)",
        tagline: "Better Homes, Brighter Futures",
        phone: "+63 900 000 0000",
        email: "name@sample.com",
        office: "123 Market Street, Suite 500",
        serviceAreas: "Las Piñas City, Cavite (Dasmariñas, Bacoor, Imus, Naic)"
    };

    const STATIC_PROPERTIES = [
        {
            id: 1,
            title: "Velemont Residences",
            location: "Manuyo, Las Piñas City",
            property_type: "Subdivision",
            price: 6880000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property1.jpg",
            description: "Modern suburban residence with spacious layout, 24/7 security, and convenient access to Metro Manila."
        },
        {
            id: 2,
            title: "Green Valley Villa",
            location: "Dasmariñas, Cavite",
            property_type: "Villa",
            price: 8200000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property2.jpg",
            description: "Serene, high-end villa situated in Dasmariñas with private garden view, high ceilings, and premium finishes."
        },
        {
            id: 3,
            title: "Sunset Townhouse",
            location: "Bacoor, Cavite",
            property_type: "Townhouse",
            price: 3800000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property3.jpg",
            description: "Affordable contemporary townhouse ideal for young families, located just minutes from major expressways."
        },
        {
            id: 4,
            title: "Garden Residence",
            location: "Imus, Cavite",
            property_type: "Townhouse",
            price: 6200000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property1.jpg",
            description: "Charming family home in Imus featuring lush landscaping, modern fixtures, and gated neighborhood perks."
        },
        {
            id: 5,
            title: "Greenview Estate",
            location: "Naic, Cavite",
            property_type: "Subdivision",
            price: 7500000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property2.jpg",
            description: "Expansive residential estate in Naic offering quiet rural ambiance with modern subdivision amenities."
        },
        {
            id: 6,
            title: "Sunset Homes",
            location: "Dasmariñas, Cavite",
            property_type: "Townhouse",
            price: 4300000,
            bedrooms: 3,
            bathrooms: 2,
            lot_area: 120,
            status: "Available",
            image_url: URLS.images + "property3.jpg",
            description: "Smartly priced townhouse community with club facilities and great proximity to universities and shopping centers."
        },
        {
            id: 7,
            title: "Liora Homes",
            location: "Naic, Cavite",
            property_type: "Subdivision",
            price: 2462400,
            bedrooms: 2,
            bathrooms: 1,
            lot_area: 60,
            status: "Available",
            image_url: URLS.images + "property1.jpg",
            description: "Highly budget-friendly starter house & lot in Naic, Cavite with flexible Pag-IBIG and bank financing terms."
        }
    ];

    let cachedLiveProperties = null;

    async function getPropertiesCatalog() {
        if (cachedLiveProperties) return cachedLiveProperties;
        if (typeof apiGetProperties === 'function') {
            try {
                const live = await apiGetProperties();
                if (live && live.length > 0) {
                    cachedLiveProperties = live;
                    return live;
                }
            } catch (e) {
                console.warn('Chatbot using local property data');
            }
        }
        return STATIC_PROPERTIES;
    }

    // ----------------------------------------------------------
    // 3. SOUND SYNTHESIZER (NO EXTERNAL AUDIO ASSETS NEEDED)
    // ----------------------------------------------------------
    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
            
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {
            // AudioContext muted/unsupported
        }
    }

    // ----------------------------------------------------------
    // 4. CHATBOT DOM CREATION
    // ----------------------------------------------------------
    let isOpen = false;
    let chatHistory = [];
    const STORAGE_KEY = 'urbanscope_mira_chat_v1';

    function initChatbotDOM() {
        if (document.getElementById('chatbotContainer')) return;

        // Container
        const container = document.createElement('div');
        container.id = 'chatbotContainer';
        container.className = 'chatbot-launcher-container';

        container.innerHTML = `
            <!-- Floating Greeting Bubble -->
            <div class="chatbot-callout" id="chatbotCallout">
                <div class="chatbot-callout-avatar">ML</div>
                <div class="chatbot-callout-text">
                    <strong>Hi, I'm Mira! 👋</strong>
                    Need help finding properties or navigating the site? Ask me anytime!
                </div>
                <button type="button" class="chatbot-callout-close" id="chatbotCalloutClose" aria-label="Close notification">&times;</button>
            </div>

            <!-- Floating Toggle Button -->
            <button type="button" class="chatbot-toggle-btn" id="chatbotToggleBtn" aria-label="Open AI Assistant">
                <span class="chatbot-pulse-ring"></span>
                <span class="chatbot-unread-badge is-hidden" id="chatbotUnreadBadge">1</span>
                
                <!-- Chat Icon -->
                <svg class="chatbot-btn-icon icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>

                <!-- Close Icon -->
                <svg class="chatbot-btn-icon icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Chat Window -->
            <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-label="UrbanScope AI Chatbot">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-header-profile">
                        <button type="button" class="chatbot-mobile-back-btn" id="chatbotMobileBackBtn" title="Back" aria-label="Close chat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <div class="chatbot-avatar-wrap">
                            <img src="${URLS.logo}" alt="Logo" onerror="this.outerHTML='<span style=\\'font-weight:800;color:#2d5c39;font-size:0.9rem\\'>ML</span>'">
                            <span class="chatbot-status-dot"></span>
                        </div>
                        <div class="chatbot-header-info">
                            <h3>Mira <span class="chatbot-header-badge">AI Assistant</span></h3>
                            <p>Miriam Lobren Realty &bull; Online</p>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button type="button" class="chatbot-action-btn" id="chatbotClearBtn" title="Clear conversation" aria-label="Clear chat">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <button type="button" class="chatbot-action-btn" id="chatbotCloseBtn" title="Close chat" aria-label="Close chat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <!-- Quick Navigation Bar -->
                <div class="chatbot-quick-nav">
                    <button type="button" class="chatbot-nav-chip" data-nav="${URLS.home}">🏠 Home</button>
                    <button type="button" class="chatbot-nav-chip" data-nav="${URLS.properties}">🔍 Browse Catalog</button>
                    <button type="button" class="chatbot-nav-chip" data-nav="${URLS.inquiry}">💬 Book Consultation</button>
                    <button type="button" class="chatbot-nav-chip" data-nav="${URLS.login}">🔑 Account</button>
                </div>

                <!-- Messages Stream -->
                <div class="chatbot-messages" id="chatbotMessages"></div>

                <!-- Quick Suggestion Prompts -->
                <div class="chatbot-suggestions-wrap" id="chatbotSuggestions">
                    <button type="button" class="chatbot-suggest-btn" data-query="Show available properties">🏡 Browse Homes</button>
                    <button type="button" class="chatbot-suggest-btn" data-query="Properties in Cavite">📍 Cavite Listings</button>
                    <button type="button" class="chatbot-suggest-btn" data-query="Homes under 5 Million">💰 Under ₱5M</button>
                    <button type="button" class="chatbot-suggest-btn" data-query="How do I inquire or book a consultation?">📝 How to Inquire?</button>
                    <button type="button" class="chatbot-suggest-btn" data-query="Tell me about agent Miriam Lobren">👤 About Agent</button>
                </div>

                <!-- Input Area -->
                <form class="chatbot-input-bar" id="chatbotForm">
                    <div class="chatbot-input-wrap">
                        <input type="text" class="chatbot-input-field" id="chatbotInput" placeholder="Ask about homes, locations, or navigating..." autocomplete="off">
                    </div>
                    <button type="submit" class="chatbot-send-btn" id="chatbotSendBtn" aria-label="Send message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>

                <div class="chatbot-footer-brand">
                    Powered by <strong>UrbanScope</strong> &bull; CD Miranda Realty
                </div>
            </div>
        `;

        document.body.appendChild(container);
        setupEventListeners();
        loadChatHistory();

        // Show callout bubble after a 3.5s delay if not already closed
        if (!sessionStorage.getItem('urbanscope_callout_closed')) {
            setTimeout(() => {
                const callout = document.getElementById('chatbotCallout');
                if (callout && !isOpen) {
                    callout.style.display = 'flex';
                }
            }, 3500);
        } else {
            const callout = document.getElementById('chatbotCallout');
            if (callout) callout.style.display = 'none';
        }

        // Auto-open if deep-linked via URL parameter or hash
        if (window.location.search.includes('open_chat=1') || window.location.hash === '#chat') {
            setTimeout(() => toggleChatbot(true), 150);
        }
    }

    // ----------------------------------------------------------
    // 5. EVENT LISTENERS
    // ----------------------------------------------------------
    function setupEventListeners() {
        const toggleBtn = document.getElementById('chatbotToggleBtn');
        const closeBtn = document.getElementById('chatbotCloseBtn');
        const callout = document.getElementById('chatbotCallout');
        const calloutClose = document.getElementById('chatbotCalloutClose');
        const clearBtn = document.getElementById('chatbotClearBtn');
        const form = document.getElementById('chatbotForm');
        const input = document.getElementById('chatbotInput');

        toggleBtn.addEventListener('click', toggleChatbot);
        closeBtn.addEventListener('click', () => toggleChatbot(false));

        const mobileBackBtn = document.getElementById('chatbotMobileBackBtn');
        if (mobileBackBtn) {
            mobileBackBtn.addEventListener('click', () => toggleChatbot(false));
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                toggleChatbot(false);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.body.classList.remove('chatbot-open');
            } else if (isOpen) {
                document.body.classList.add('chatbot-open');
            }
        });

        if (callout) {
            callout.addEventListener('click', (e) => {
                if (e.target.closest('#chatbotCalloutClose')) return;
                toggleChatbot(true);
            });
        }

        if (calloutClose) {
            calloutClose.addEventListener('click', (e) => {
                e.stopPropagation();
                callout.style.display = 'none';
                sessionStorage.setItem('urbanscope_callout_closed', '1');
            });
        }

        clearBtn.addEventListener('click', () => {
            if (confirm('Clear chat history?')) {
                chatHistory = [];
                sessionStorage.removeItem(STORAGE_KEY);
                const msgs = document.getElementById('chatbotMessages');
                msgs.innerHTML = '';
                greetUser();
            }
        });

        // Quick Navigation Buttons
        document.querySelectorAll('.chatbot-nav-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const url = chip.getAttribute('data-nav');
                if (url) window.location.href = url;
            });
        });

        // Suggestion Chips
        document.getElementById('chatbotSuggestions').addEventListener('click', (e) => {
            const btn = e.target.closest('.chatbot-suggest-btn');
            if (!btn) return;
            const q = btn.getAttribute('data-query');
            if (q) handleUserMessage(q);
        });

        // Form Submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            handleUserMessage(text);
        });

        // Delegate Click on Action Chips and Links inside message stream
        document.getElementById('chatbotMessages').addEventListener('click', (e) => {
            const chip = e.target.closest('[data-prompt]');
            if (chip) {
                e.preventDefault();
                const p = chip.getAttribute('data-prompt');
                handleUserMessage(p);
            }
        });
    }

    function toggleChatbot(forceState) {
        const win = document.getElementById('chatbotWindow');
        const btn = document.getElementById('chatbotToggleBtn');
        const callout = document.getElementById('chatbotCallout');
        const badge = document.getElementById('chatbotUnreadBadge');
        const container = document.getElementById('chatbotContainer');

        isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;

        if (isOpen) {
            win.classList.add('is-open');
            btn.classList.add('is-active');
            if (container) container.classList.add('is-open');
            if (callout) callout.style.display = 'none';
            if (badge) badge.classList.add('is-hidden');
            sessionStorage.setItem('urbanscope_callout_closed', '1');

            if (window.innerWidth <= 768) {
                document.body.classList.add('chatbot-open');
            }

            setTimeout(() => {
                const input = document.getElementById('chatbotInput');
                if (input && window.innerWidth > 768) input.focus();
                scrollBottom();
            }, 250);
        } else {
            win.classList.remove('is-open');
            btn.classList.remove('is-active');
            if (container) container.classList.remove('is-open');
            document.body.classList.remove('chatbot-open');
        }
    }

    // ----------------------------------------------------------
    // 6. MESSAGING & RENDERING
    // ----------------------------------------------------------
    function renderMessage(sender, htmlContent, save = true) {
        const container = document.getElementById('chatbotMessages');
        if (!container) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const group = document.createElement('div');
        group.className = `chatbot-msg-group ${sender}`;

        const avatarText = sender === 'bot' ? 'ML' : 'You';

        group.innerHTML = `
            <div class="chatbot-msg-avatar">${avatarText}</div>
            <div class="chatbot-msg-bubble">
                <div class="chatbot-msg-content">${htmlContent}</div>
                <span class="chatbot-msg-time">${timeStr}</span>
            </div>
        `;

        container.appendChild(group);
        scrollBottom();

        if (save) {
            chatHistory.push({ sender, content: htmlContent, time: timeStr });
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
            } catch (e) {}
        }

        if (sender === 'bot') playChime();
    }

    function showTypingIndicator() {
        const container = document.getElementById('chatbotMessages');
        const id = 'chatbotTypingIndicator';
        if (document.getElementById(id)) return;

        const indicator = document.createElement('div');
        indicator.id = id;
        indicator.className = 'chatbot-msg-group bot';
        indicator.innerHTML = `
            <div class="chatbot-msg-avatar">ML</div>
            <div class="chatbot-typing">
                <span></span><span></span><span></span>
            </div>
        `;
        container.appendChild(indicator);
        scrollBottom();
    }

    function removeTypingIndicator() {
        const el = document.getElementById('chatbotTypingIndicator');
        if (el) el.remove();
    }

    function scrollBottom() {
        const msgs = document.getElementById('chatbotMessages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }

    // ----------------------------------------------------------
    // 7. INTELLIGENT REAL ESTATE NLP ENGINE
    // ----------------------------------------------------------
    async function handleUserMessage(userText) {
        renderMessage('user', escapeHtml(userText));

        showTypingIndicator();

        // Simulate natural typing delay (400-800ms)
        const delay = Math.min(800, Math.max(400, userText.length * 15));
        
        setTimeout(async () => {
            removeTypingIndicator();
            const responseHtml = await generateBotResponse(userText);
            renderMessage('bot', responseHtml);
        }, delay);
    }

    async function generateBotResponse(rawText) {
        const text = rawText.toLowerCase().trim();
        const catalog = await getPropertiesCatalog();

        // ----------------------------------------------------------
        // Intent A: Navigation / Page Shortcuts
        // ----------------------------------------------------------
        if (text.includes('go to home') || text.includes('homepage') || text === 'home') {
            return `
                <p>Sure! Heading to the <strong>UrbanScope Homepage</strong>.</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.home}" class="chatbot-action-chip gold">🏠 Open Homepage</a>
                </div>
            `;
        }

        if (text.includes('properties page') || text.includes('catalog') || text.includes('browse all') || text.includes('listings page')) {
            return `
                <p>You can browse our full catalog of residential homes, villas, and townhouses with active filters.</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.properties}" class="chatbot-action-chip gold">🔍 Open Property Catalog</a>
                </div>
            `;
        }

        if (text.includes('about agent') || text.includes('about us') || text.includes('about me') || text.includes('who is miriam') || text.includes('who is mariam') || text.includes('who are you')) {
            return `
                <p><strong>Miriam Lobren</strong> is a dedicated Real Estate Agent affiliated with <strong>CD Miranda Realty</strong>.</p>
                <p>Motto: <em>"Better Homes, Brighter Futures."</em></p>
                <ul>
                    <li><strong>Service Areas:</strong> Las Piñas City, Cavite (Dasmariñas, Bacoor, Imus, Naic)</li>
                    <li><strong>Specialties:</strong> Subdivision homes, modern townhouses &amp; luxury villas</li>
                    <li><strong>Office:</strong> 123 Market Street, Suite 500</li>
                </ul>
                <div class="chatbot-btn-group">
                    <a href="${URLS.home}#about" class="chatbot-action-chip">📖 Read Agent Bio</a>
                    <a href="${URLS.inquiry}" class="chatbot-action-chip gold">💬 Book Consultation</a>
                </div>
            `;
        }

        if (text.includes('contact') || text.includes('phone') || text.includes('email') || text.includes('call') || text.includes('office address')) {
            return `
                <p>Here are the direct contact details for <strong>Miriam Lobren Realty</strong>:</p>
                <ul>
                    <li>📞 <strong>Phone:</strong> <a href="tel:+639000000000" style="color:var(--chat-green)">+63 900 000 0000</a></li>
                    <li>✉️ <strong>Email:</strong> <a href="mailto:name@sample.com" style="color:var(--chat-green)">name@sample.com</a></li>
                    <li>📍 <strong>Location:</strong> 123 Market Street, Suite 500</li>
                </ul>
                <div class="chatbot-btn-group">
                    <a href="${URLS.inquiry}" class="chatbot-action-chip gold">📝 Send Direct Message</a>
                    <a href="${URLS.home}#contact" class="chatbot-action-chip">📍 Office Details</a>
                </div>
            `;
        }

        if (text.includes('login') || text.includes('sign in') || text.includes('log in') || text.includes('account') || text.includes('register') || text.includes('sign up')) {
            let loggedUser = null;
            if (window.UrbanSession && typeof window.UrbanSession.getUser === 'function') {
                loggedUser = await window.UrbanSession.getUser();
            }

            if (loggedUser) {
                return `
                    <p>You are currently logged in as <strong>${escapeHtml(loggedUser.name)}</strong> (${escapeHtml(loggedUser.email)}).</p>
                    <p>Your details are automatically attached when you inquire about any house!</p>
                    <div class="chatbot-btn-group">
                        <a href="${URLS.properties}" class="chatbot-action-chip">🔍 Browse Properties</a>
                        <a href="${URLS.inquiry}" class="chatbot-action-chip gold">💬 Submit Inquiry</a>
                    </div>
                `;
            } else {
                return `
                    <p>You can view all properties freely! If you want to <strong>submit an inquiry</strong> or save favorites, you can log in or register:</p>
                    <div class="chatbot-btn-group">
                        <a href="${URLS.login}" class="chatbot-action-chip gold">🔑 Log In</a>
                        <a href="${URLS.register}" class="chatbot-action-chip">✨ Create Account</a>
                    </div>
                `;
            }
        }

        if (text.includes('admin') || text.includes('portal') || text.includes('dashboard')) {
            return `
                <p>The <strong>UrbanScope Administrator Suite</strong> is restricted to authorized CD Miranda Realty personnel:</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.adminLogin}" class="chatbot-action-chip">🛡️ Open Admin Portal</a>
                </div>
            `;
        }

        // ----------------------------------------------------------
        // Intent B: Inquiring / Consultation Process
        // ----------------------------------------------------------
        if (text.includes('how to inquire') || text.includes('inquire') || text.includes('consultation') || text.includes('process') || text.includes('requirements') || text.includes('schedule') || text.includes('site visit') || text.includes('viewing')) {
            return `
                <p><strong>How to Inquire with Miriam Lobren:</strong></p>
                <ol style="margin:4px 0 8px;padding-left:18px;">
                    <li>Browse our <a href="${URLS.properties}" style="color:var(--chat-green);font-weight:600">Properties Catalog</a>.</li>
                    <li>Click <strong>"Book a Free Consultation"</strong> or <strong>"Submit Inquiry"</strong>.</li>
                    <li>Sign in or create an account (takes under 1 minute).</li>
                    <li>Submit your preferred date and requirements.</li>
                </ol>
                <p>📌 <em>Standard requirements for purchase:</em> 2 Valid Government IDs, Proof of Income (COE / 3 Months Payslip), Proof of Billing, TIN ID.</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.inquiry}" class="chatbot-action-chip gold">📝 Go to Inquiry Form</a>
                    <button type="button" class="chatbot-action-chip" data-prompt="Show financing options">💳 Financing Options</button>
                </div>
            `;
        }

        // ----------------------------------------------------------
        // Intent C: Financing, Pag-IBIG, Bank Loans
        // ----------------------------------------------------------
        if (text.includes('financing') || text.includes('pag-ibig') || text.includes('pagibig') || text.includes('bank') || text.includes('loan') || text.includes('downpayment') || text.includes('dp') || text.includes('installment') || text.includes('terms')) {
            return `
                <p><strong>Financing &amp; Payment Options Available:</strong></p>
                <ul>
                    <li>🏛️ <strong>Bank Financing:</strong> Typically 10% to 20% downpayment with flexible 5 to 25 year terms.</li>
                    <li>🏠 <strong>Pag-IBIG Fund:</strong> Ideal for affordable subdivision homes (e.g., Liora Homes, Sunset Townhouses) with lower interest rates.</li>
                    <li>💵 <strong>Spot Cash / Deferred Cash:</strong> Discounts available for spot cash settlements.</li>
                </ul>
                <p>Would you like personalized payment computation? Miriam Lobren provides free sample computations!</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.inquiry}" class="chatbot-action-chip gold">💬 Request Free Computation</a>
                    <button type="button" class="chatbot-action-chip" data-prompt="Affordable properties under 4M">💰 Affordable Homes</button>
                </div>
            `;
        }

        // ----------------------------------------------------------
        // Intent D: Specific Property Queries
        // ----------------------------------------------------------
        for (const p of catalog) {
            const pTitle = p.title.toLowerCase();
            if (text.includes(pTitle) || 
               (pTitle.includes('velemont') && text.includes('velemont')) ||
               (pTitle.includes('green valley') && (text.includes('green valley') || text.includes('villa'))) ||
               (pTitle.includes('sunset') && text.includes('sunset')) ||
               (pTitle.includes('liora') && text.includes('liora')) ||
               (pTitle.includes('garden residence') && text.includes('garden'))) {
                return `
                    <p>Found <strong>${escapeHtml(p.title)}</strong> for you!</p>
                    ${formatPropertyCard(p)}
                    <div class="chatbot-btn-group">
                        <a href="${URLS.propertyDetail}?id=${p.id}" class="chatbot-action-chip gold">🔍 Full Property Details</a>
                        <a href="${URLS.inquiry}?id=${p.id}&title=${encodeURIComponent(p.title)}" class="chatbot-action-chip">📝 Inquire for This Property</a>
                    </div>
                `;
            }
        }

        // ----------------------------------------------------------
        // Intent E: Location Queries (Cavite, Las Piñas, Dasmariñas, etc.)
        // ----------------------------------------------------------
        let locKeyword = null;
        if (text.includes('las pinas') || text.includes('las piñas')) locKeyword = 'las pinas';
        else if (text.includes('dasmarinas') || text.includes('dasmariñas')) locKeyword = 'dasmarinas';
        else if (text.includes('bacoor')) locKeyword = 'bacoor';
        else if (text.includes('imus')) locKeyword = 'imus';
        else if (text.includes('naic')) locKeyword = 'naic';
        else if (text.includes('cavite')) locKeyword = 'cavite';

        if (locKeyword) {
            const matches = catalog.filter(p => {
                const loc = (p.location || '').toLowerCase();
                if (locKeyword === 'las pinas') return loc.includes('las pinas') || loc.includes('las piñas');
                if (locKeyword === 'cavite') return loc.includes('cavite') || loc.includes('dasmarinas') || loc.includes('bacoor') || loc.includes('imus') || loc.includes('naic');
                return loc.includes(locKeyword);
            });

            if (matches.length > 0) {
                const sampleCards = matches.slice(0, 2).map(formatPropertyCard).join('');
                return `
                    <p>We have <strong>${matches.length} propert${matches.length > 1 ? 'ies' : 'y'}</strong> available in <strong>${capitalize(locKeyword)}</strong>:</p>
                    ${sampleCards}
                    <div class="chatbot-btn-group">
                        <a href="${URLS.properties}?location=${locKeyword}" class="chatbot-action-chip gold">📂 View All in ${capitalize(locKeyword)}</a>
                        <a href="${URLS.inquiry}" class="chatbot-action-chip">💬 Book a Viewing</a>
                    </div>
                `;
            }
        }

        // ----------------------------------------------------------
        // Intent F: Price & Budget Queries (e.g. "under 5m", "below 4 million", "cheap")
        // ----------------------------------------------------------
        let maxBudget = null;
        if (text.includes('under 3m') || text.includes('below 3m') || text.includes('3 million')) maxBudget = 3000000;
        else if (text.includes('under 4m') || text.includes('below 4m') || text.includes('4 million') || text.includes('cheap') || text.includes('affordable')) maxBudget = 4500000;
        else if (text.includes('under 5m') || text.includes('below 5m') || text.includes('5 million')) maxBudget = 5000000;
        else if (text.includes('under 7m') || text.includes('below 7m') || text.includes('7 million')) maxBudget = 7000000;
        else if (text.includes('luxury') || text.includes('expensive') || text.includes('high end')) maxBudget = 999999999;

        if (maxBudget !== null) {
            const isAffordable = maxBudget <= 4500000;
            const matches = catalog.filter(p => {
                const price = Number(p.price) || 0;
                return isAffordable ? price <= maxBudget : (price <= maxBudget && price >= 5000000);
            });

            if (matches.length > 0) {
                const sampleCards = matches.slice(0, 2).map(formatPropertyCard).join('');
                return `
                    <p>Here are listings matching your budget criteria:</p>
                    ${sampleCards}
                    <div class="chatbot-btn-group">
                        <a href="${URLS.properties}" class="chatbot-action-chip gold">🔍 Filter by Budget on Catalog</a>
                        <a href="${URLS.inquiry}" class="chatbot-action-chip">📝 Request Financing Computation</a>
                    </div>
                `;
            }
        }

        // ----------------------------------------------------------
        // Intent G: Property Types (Villa, Townhouse, Subdivision)
        // ----------------------------------------------------------
        if (text.includes('villa') || text.includes('townhouse') || text.includes('subdivision') || text.includes('apartment')) {
            let typeKeyword = 'villa';
            if (text.includes('townhouse')) typeKeyword = 'townhouse';
            if (text.includes('subdivision')) typeKeyword = 'subdivision';
            if (text.includes('apartment')) typeKeyword = 'apartment';

            const matches = catalog.filter(p => (p.property_type || '').toLowerCase().includes(typeKeyword));
            if (matches.length > 0) {
                const sampleCards = matches.slice(0, 2).map(formatPropertyCard).join('');
                return `
                    <p>Here are our featured <strong>${capitalize(typeKeyword)}</strong> listings:</p>
                    ${sampleCards}
                    <div class="chatbot-btn-group">
                        <a href="${URLS.properties}?type=${typeKeyword}" class="chatbot-action-chip gold">📂 View All ${capitalize(typeKeyword)}s</a>
                        <a href="${URLS.inquiry}" class="chatbot-action-chip">💬 Ask Miriam</a>
                    </div>
                `;
            }
        }

        // ----------------------------------------------------------
        // Intent H: Greetings & Small Talk
        // ----------------------------------------------------------
        if (text.match(/^(hi|hello|hey|kamusta|good morning|good afternoon|good evening|sup|greetings)/)) {
            let userName = 'there';
            if (window.UrbanSession && typeof window.UrbanSession.getUser === 'function') {
                const u = await window.UrbanSession.getUser();
                if (u && u.name) userName = u.name.split(' ')[0];
            }

            return `
                <p>Hello ${escapeHtml(userName)}! 😊 Welcome to <strong>UrbanScope &amp; CD Miranda Realty</strong>.</p>
                <p>I'm <strong>Mira</strong>, your dedicated real estate concierge. How can I help you today?</p>
                <div class="chatbot-btn-group">
                    <button type="button" class="chatbot-action-chip" data-prompt="Browse available properties">🏡 Browse Properties</button>
                    <button type="button" class="chatbot-action-chip" data-prompt="Homes in Cavite">📍 Cavite Homes</button>
                    <button type="button" class="chatbot-action-chip gold" data-prompt="How do I book a consultation?">📝 Book Consultation</button>
                </div>
            `;
        }

        if (text.includes('thank') || text.includes('salamat') || text.includes('great') || text.includes('awesome')) {
            return `
                <p>You're very welcome! If you need any assistance finding a home or speaking with Miriam Lobren, I'm always right here. 🏡✨</p>
                <div class="chatbot-btn-group">
                    <a href="${URLS.properties}" class="chatbot-action-chip gold">🔍 Continue Browsing</a>
                    <a href="${URLS.inquiry}" class="chatbot-action-chip">💬 Book Consultation</a>
                </div>
            `;
        }

        // ----------------------------------------------------------
        // Fallback / General Helpful Response
        // ----------------------------------------------------------
        const randomP = catalog[Math.floor(Math.random() * catalog.length)];
        return `
            <p>I can help you explore our properties, understand financing options, or navigate anywhere on the website!</p>
            <p>Here is one of our top recommended listings today:</p>
            ${formatPropertyCard(randomP)}
            <p style="margin-top:8px">What would you like to do next?</p>
            <div class="chatbot-btn-group">
                <a href="${URLS.properties}" class="chatbot-action-chip gold">🔍 Browse All Properties</a>
                <a href="${URLS.inquiry}" class="chatbot-action-chip">📝 Book Free Consultation</a>
                <button type="button" class="chatbot-action-chip" data-prompt="Contact details of agent">📞 Contact Agent</button>
            </div>
        `;
    }

    // ----------------------------------------------------------
    // 8. HELPERS & FORMATTERS
    // ----------------------------------------------------------
    function formatPropertyCard(p) {
        if (!p) return '';
        const priceFmt = Number(p.price || 0).toLocaleString();
        const img = p.image_url || URLS.images + 'property1.jpg';
        return `
            <div class="chatbot-prop-card">
                <img src="${img}" alt="${escapeHtml(p.title)}" class="chatbot-prop-thumb" onerror="this.src='${URLS.images}property1.jpg'">
                <div class="chatbot-prop-body">
                    <h4 class="chatbot-prop-title">${escapeHtml(p.title)}</h4>
                    <p class="chatbot-prop-loc">📍 ${escapeHtml(p.location)}</p>
                    <div style="font-size:0.75rem;color:#5f7364;margin-bottom:6px;">
                        ${p.bedrooms || 3} Beds &bull; ${p.bathrooms || 2} Baths &bull; ${p.lot_area || 120} sqm
                    </div>
                    <div class="chatbot-prop-footer">
                        <strong class="chatbot-prop-price">₱${priceFmt}</strong>
                        <a href="${URLS.propertyDetail}?id=${p.id}" class="chatbot-prop-link">View Details &rarr;</a>
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    }

    // ----------------------------------------------------------
    // 9. HISTORY & GREETING RESTORATION
    // ----------------------------------------------------------
    async function loadChatHistory() {
        const msgs = document.getElementById('chatbotMessages');
        msgs.innerHTML = '';

        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                chatHistory = JSON.parse(raw);
                chatHistory.forEach(item => {
                    renderMessage(item.sender, item.content, false);
                });
                return;
            }
        } catch (e) {}

        // If no history, render initial greeting
        greetUser();
    }

    async function greetUser() {
        let greetingName = '';
        if (window.UrbanSession && typeof window.UrbanSession.getUser === 'function') {
            const user = await window.UrbanSession.getUser();
            if (user && user.name) greetingName = `, ${user.name.split(' ')[0]}`;
        }

        const initialGreeting = `
            <p>👋 Hello${escapeHtml(greetingName)}! I'm <strong>Mira</strong>, your AI Concierge for <strong>CD Miranda Realty</strong>.</p>
            <p>I can help you navigate our listings, filter homes in Las Piñas &amp; Cavite, calculate budgets, or book a consultation with <strong>Miriam Lobren</strong>.</p>
            <p>How can I assist your real estate journey today?</p>
            <div class="chatbot-btn-group">
                <button type="button" class="chatbot-action-chip" data-prompt="Show available properties">🏡 Browse Properties</button>
                <button type="button" class="chatbot-action-chip" data-prompt="Properties in Cavite">📍 Cavite Homes</button>
                <button type="button" class="chatbot-action-chip gold" data-prompt="How do I inquire or book a consultation?">📝 How to Inquire</button>
            </div>
        `;
        renderMessage('bot', initialGreeting, true);
    }

    // Initialize once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotDOM);
    } else {
        initChatbotDOM();
    }

    // Expose Global API if needed
    window.UrbanChatbot = {
        open: () => toggleChatbot(true),
        close: () => toggleChatbot(false),
        ask: (text) => handleUserMessage(text)
    };
})();
