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
    const BACKEND_URL = "https://api-radiolite.onrender.com/api/v1"; 

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
            if (!release.assets || release.assets.length === 0) {
                console.warn("No assets found in the latest release.");
                macBtn.innerHTML = `Download for Mac <span class="arrow">▼</span> <small style="display:block; font-size: 0.6rem; opacity: 0.6;">(Building...)</small>`;
                winBtn.innerHTML = `Windows Version <small style="display:block; font-size: 0.6rem; opacity: 0.6;">(Building...)</small>`;
                return;
            }

            const version = release.tag_name;
            const dropdownItems = document.querySelectorAll('.dropdown-item');

            function formatSize(bytes) {
                if (!bytes) return '';
                const mb = bytes / (1024 * 1024);
                return `(${mb.toFixed(1)} MB)`;
            }

            console.log("Starting to map assets for version:", version);
            
            release.assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                let url = asset.browser_download_url;
                
                if (url.startsWith('/')) {
                    const baseUrl = BACKEND_URL.replace('/api/v1', '');
                    url = baseUrl + url;
                }
                
                const sizeStr = formatSize(asset.size);
                console.log(`Found asset: ${asset.name} | URL: ${url}`);

                // MAC SILICON (Strictly DMG)
                if ((name.includes('aarch64') || name.includes('arm64')) && name.endsWith('.dmg')) {
                    console.log("-> Matched Apple Silicon (DMG)");
                    if (dropdownItems[0]) {
                        dropdownItems[0].href = url;
                        dropdownItems[0].querySelector('strong').textContent = `Apple Silicon`;
                        dropdownItems[0].querySelector('span').textContent = `${version} • ${sizeStr}`;
                    }
                }
                // MAC INTEL (Strictly DMG)
                else if (name.includes('x64') && !name.includes('win') && !name.includes('setup') && name.endsWith('.dmg')) {
                    console.log("-> Matched Intel Chip (DMG)");
                    if (dropdownItems[1]) {
                        dropdownItems[1].href = url;
                        dropdownItems[1].querySelector('strong').textContent = `Intel Chip`;
                        dropdownItems[1].querySelector('span').textContent = `${version} • ${sizeStr}`;
                    }
                }
                // WINDOWS (Strictly EXE)
                else if (name.endsWith('.exe') && (name.includes('setup') || name.includes('windows'))) {
                    console.log("-> Matched Windows (EXE)");
                    if (winBtn) {
                        winBtn.href = url;
                        winBtn.innerHTML = `
                            <span class="btn-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: -2px;">
                                    <path d="M0 3.449L9.75 2.1L9.75 11.25L0 11.25zM0 12.75L9.75 12.75L9.75 21.9L0 20.5501zM11.25 1.899L24 0L24 11.25L11.25 11.25zM11.25 12.75L24 12.75L24 24L11.25 22.101z"/>
                                </svg>
                            </span> Windows ${version} • ${sizeStr}`;
                    }
                }
            });
            console.log("Asset mapping complete.");
        } catch (err) {
            console.error("CRITICAL: Failed to update download links:", err);
            alert("Could not load download links. Check Console for details.");
        }
    }

    updateDownloadLinks();
    // --- Help Modal Logic ---
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeModal = document.getElementById('close-modal');
    const copyBtn = document.getElementById('copy-btn');
    const cmdText = document.getElementById('cmd-text');

    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            helpModal.classList.add('active');
        });

        closeModal.addEventListener('click', () => {
            helpModal.classList.remove('active');
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });
    }

    if (copyBtn && cmdText) {
        copyBtn.addEventListener('click', () => {
            const text = cmdText.textContent;
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = '#1db954';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.style.background = '';
                }, 2000);
            });
        });
    }

    // --- Contact Modal Logic ---
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModal = document.getElementById('close-contact-modal');

    if (contactBtn && contactModal) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
        });

        closeContactModal.addEventListener('click', () => {
            contactModal.classList.remove('active');
        });

        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
            }
        });
    }

    // --- Hamburger Menu Logic ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
});
