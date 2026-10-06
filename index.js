/**
 * UrbanScope - Homepage Controller
 * Handles category tabs carousel scrolling and active tab toggling.
 */

function scrollCategories(direction) {
    const tabs = document.getElementById('categoryTabs');
    if (tabs) {
        tabs.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
}

document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});
