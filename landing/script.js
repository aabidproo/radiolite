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
    if (userAgent.indexOf('mac') !== -1) {
        macBtn.className = 'btn btn-primary-white dropdown-toggle';
        winBtn.className = 'btn btn-secondary-outline';
    } else if (userAgent.indexOf('win') !== -1) {
        winBtn.className = 'btn btn-primary-white';
        macBtn.className = 'btn btn-secondary-outline dropdown-toggle';
    }

    // --- Dynamic GitHub Release Fetching ---
    // Update this to your production backend URL (e.g., "https://radiolite-api.onrender.com/api/v1")
    const BACKEND_URL = "https://radiolite-api.onrender.com/api/v1"; 

    async function updateDownloadLinks() {
        if (!BACKEND_URL || BACKEND_URL.includes("PLACEHOLDER")) return;

        try {
            const response = await fetch(`${BACKEND_URL}/releases/latest`);
            
            if (response.status !== 200) {
                console.error("Release not found or Backend Proxy Error.");
                macBtn.innerHTML = `Download for Mac <span class="arrow">▼</span> <small style="display:block; font-size: 0.6rem; opacity: 0.6;">(Proxy Error?)</small>`;
                return;
            }

            const release = await response.json();
            if (!release.assets || release.assets.length === 0) return;

            const version = release.tag_name;
            const dropdownItems = document.querySelectorAll('.dropdown-item');

            function formatSize(bytes) {
                if (!bytes) return '';
                const mb = bytes / (1024 * 1024);
                return `(${mb.toFixed(1)} MB)`;
            }

            release.assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                const url = asset.browser_download_url;
                const sizeStr = formatSize(asset.size);

                // Mac Silicon (aarch64)
                if (name.includes('aarch64') && (name.includes('.dmg') || name.includes('.app'))) {
                    dropdownItems[0].href = url;
                    dropdownItems[0].querySelector('strong').textContent = `Apple Silicon - ${version}`;
                    dropdownItems[0].querySelector('span').textContent = `M1, M2, M3 Native ${sizeStr}`;
                }
                // Mac Intel (x64)
                else if (name.includes('x64') && !name.includes('windows') && (name.includes('.dmg') || name.includes('.app'))) {
                    dropdownItems[1].href = url;
                    dropdownItems[1].querySelector('strong').textContent = `Intel Chip - ${version}`;
                    dropdownItems[1].querySelector('span').textContent = `Legacy Macs ${sizeStr}`;
                }
                // Mac Universal (fallback)
                else if (name.includes('universal') && (name.includes('.dmg'))) {
                    dropdownItems[0].href = url;
                    dropdownItems[0].querySelector('strong').textContent = `Universal Mac - ${version}`;
                    dropdownItems[0].querySelector('span').textContent = `Silicon & Intel ${sizeStr}`;
                    dropdownItems[1].style.display = 'none';
                }
                // Windows (.msi or .exe)
                else if (name.includes('windows') || name.includes('.msi') || name.includes('.exe')) {
                    winBtn.href = url;
                    winBtn.innerHTML = `<span class="btn-icon">🌐</span> Windows ${version} ${sizeStr}`;
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
