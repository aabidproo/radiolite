document.addEventListener('DOMContentLoaded', () => {
    const macDropdown = document.getElementById('mac-dropdown');
    const macBtn = document.getElementById('mac-btn');
    const winBtn = document.getElementById('win-btn');
    const userAgent = window.navigator.userAgent.toLowerCase();

    // Toggle Dropdown for Mac
    macBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        macDropdown.classList.toggle('active');
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        macDropdown.classList.remove('active');
    });

    // OS detection for button highlighting
    // Primary Style: Solid White (btn-primary-white)
    // Secondary Style: Outline (btn-secondary-outline)
    if (userAgent.indexOf('mac') !== -1) {
        // Mac is active: Mac button is Solid White, Windows is Outline
        macBtn.className = 'btn btn-primary-white dropdown-toggle';
        winBtn.className = 'btn btn-secondary-outline';
    } else if (userAgent.indexOf('win') !== -1) {
        // Windows is active: Windows button is Solid White, Mac is Outline
        winBtn.className = 'btn btn-primary-white';
        macBtn.className = 'btn btn-secondary-outline dropdown-toggle';
    }
    // --- Dynamic GitHub Release Fetching ---
    // User needs to update this with their repo (e.g., "user/repo")
    const GITHUB_REPO = "PLACEHOLDER_GITHUB_REPO"; 

    async function updateDownloadLinks() {
        if (GITHUB_REPO === "PLACEHOLDER_GITHUB_REPO") return;

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
            const release = await response.json();
            
            if (!release.assets) return;

            const dropdownItems = document.querySelectorAll('.dropdown-item');
            const winBtn = document.getElementById('win-btn');

            release.assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                const url = asset.browser_download_url;

                // Mac Silicon (aarch64)
                if (name.includes('aarch64') && (name.includes('.dmg') || name.includes('.app'))) {
                    dropdownItems[0].href = url;
                }
                // Mac Intel (x64)
                else if (name.includes('x64') && !name.includes('windows') && (name.includes('.dmg') || name.includes('.app'))) {
                    dropdownItems[1].href = url;
                }
                // Windows (.msi or .exe)
                else if (name.includes('windows') || name.includes('.msi') || name.includes('.exe')) {
                    winBtn.href = url;
                    // Remove "Coming Soon" if we have a real link
                    const badge = document.querySelector('.badge');
                    if (badge) badge.style.display = 'none';
                }
            });
        } catch (err) {
            console.error("Failed to fetch GitHub releases", err);
        }
    }

    updateDownloadLinks();
});
