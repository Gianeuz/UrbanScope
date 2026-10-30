/**
 * UrbanScope - Legal Documentation Controller (Terms & Privacy)
 * Handles contextual back navigation, keyboard navigation shortcuts, and document switcher state.
 */

(function () {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    const isFromRegister = fromParam === 'register' || (document.referrer && document.referrer.includes('register.html'));

    // Global back handler
    window.handleLegalBack = function () {
        if (isFromRegister) {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../auth/register.html';
            }
        } else {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../../index.html';
            }
        }
    };

    // Update back buttons text and state
    document.addEventListener('DOMContentLoaded', function () {
        const backBtnTexts = document.querySelectorAll('.legal-back-text');
        backBtnTexts.forEach(function (el) {
            el.textContent = isFromRegister ? 'Back to Registration' : 'Go Back';
        });

        // Ensure doc switcher preserves ?from=register
        if (isFromRegister) {
            document.querySelectorAll('.doc-switcher .doc-tab').forEach(function (tab) {
                const href = tab.getAttribute('href');
                if (href && !href.includes('from=')) {
                    const sep = href.includes('?') ? '&' : '?';
                    tab.setAttribute('href', href + sep + 'from=register');
                }
            });
        }
    });

    // Keyboard back shortcut (Alt + LeftArrow or Backspace outside form inputs)
    window.addEventListener('keydown', function (e) {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);
        
        if ((e.altKey && e.key === 'ArrowLeft') || (!isInput && e.key === 'Backspace')) {
            if (isFromRegister && window.history.length <= 1) {
                e.preventDefault();
                window.location.href = '../auth/register.html';
            }
        }
    });
})();
