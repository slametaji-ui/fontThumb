document.addEventListener('DOMContentLoaded', () => {
    const fontGrid = document.getElementById('font-grid');
    const sampleTextInput = document.getElementById('sample-text-input');
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');
    const fontSizeSelect = document.getElementById('font-size-select');
    const bgStyleSelect = document.getElementById('bg-style-select');
    const loadSystemBtn = document.getElementById('load-system-btn');
    const folderUpload = document.getElementById('folder-upload');
    const loadingEl = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    const welcomeState = document.getElementById('welcome-state');
    const grantPermissionBtn = document.getElementById('grant-permission-btn');
    const fontCountDisplay = document.getElementById('font-count-display');

    let fontsData = [];
    let customText = "";

    // Generate random pleasant HSL color (bright enough for dark text)
    function getRandomColor() {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 40) + 60; // 60-100%
        const l = Math.floor(Math.random() * 20) + 30; // 30-50% for dark backgrounds to contrast with white text
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    // Determine font family name for display
    function formatFontName(name) {
        return name.replace(/([A-Z])/g, ' $1').trim();
    }

    // Render a single font card
    function createFontCard(fontFamily, fontFullName, fileInfo = "") {
        const card = document.createElement('div');
        card.className = 'font-card';
        
        const previewText = customText ? customText : fontFullName;
        const bgColor = getRandomColor();
        
        // Parse style from font name or info
        const nameToParse = (fontFullName + " " + (fileInfo || "")).toLowerCase();
        let fontWeight = "normal";
        let fontStyle = "normal";
        
        if (nameToParse.includes("italic")) fontStyle = "italic";
        else if (nameToParse.includes("oblique")) fontStyle = "oblique";
        
        if (nameToParse.includes("thin") || nameToParse.includes("hairline")) fontWeight = "100";
        else if (nameToParse.includes("extralight") || nameToParse.includes("ultra light")) fontWeight = "200";
        else if (nameToParse.includes("light")) fontWeight = "300";
        else if (nameToParse.includes("medium")) fontWeight = "500";
        else if (nameToParse.includes("semibold") || nameToParse.includes("demi")) fontWeight = "600";
        else if (nameToParse.includes("extrabold") || nameToParse.includes("ultra bold")) fontWeight = "800";
        else if (nameToParse.includes("black") || nameToParse.includes("heavy")) fontWeight = "900";
        else if (nameToParse.includes("bold")) fontWeight = "bold";
        
        let previewStyle = `background-color: ${bgColor}`;
        let textStyle = `font-family: '${fontFamily}', sans-serif; font-size: ${fontSizeSelect ? fontSizeSelect.value : 40}px; font-weight: ${fontWeight}; font-style: ${fontStyle};`;
        
        if (bgStyleSelect && bgStyleSelect.value === 'image') {
            const seed = encodeURIComponent(fontFullName.replace(/\s+/g, ''));
            previewStyle = `background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://picsum.photos/seed/${seed}/400/250'); background-color: transparent;`;
        }
        
        card.innerHTML = `
            <button class="copy-btn" title="Copy Font Name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <div class="card-preview" data-bg-color="${bgColor}" data-font-name="${fontFullName}" style="${previewStyle}">
                <span style="${textStyle}" class="preview-text">${previewText}</span>
            </div>
            <div class="card-info">
                <h3 title="${fontFullName}">${fontFullName}</h3>
                <p>${fileInfo || 'System Font'}</p>
            </div>
        `;
        
        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(fontFullName).then(() => {
                showToast(`Copied: ${fontFullName}`);
            });
        });
        
        // Save references for live text update
        const spanEl = card.querySelector('.preview-text');
        card.dataset.fontName = fontFullName;
        card.updateText = (text) => {
            spanEl.textContent = text ? text : card.dataset.fontName;
        };

        return card;
    }

    // Render all fonts
    function renderGrid() {
        fontGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        fontsData.forEach(font => {
            const card = createFontCard(font.family, font.fullName, font.info);
            font.cardElement = card;
            fragment.appendChild(card);
        });
        
        fontGrid.appendChild(fragment);
        applyFilters(); // Initial filter to set the count
    }

    // Update text across all cards when input changes
    sampleTextInput.addEventListener('input', (e) => {
        customText = e.target.value;
        fontsData.forEach(font => {
            if (font.cardElement) {
                font.cardElement.updateText(customText);
            }
        });
    });

    // Font size adjustment
    fontSizeSelect.addEventListener('change', (e) => {
        const size = e.target.value;
        const previewTexts = document.querySelectorAll('.preview-text');
        previewTexts.forEach(span => {
            span.style.fontSize = `${size}px`;
        });
    });

    // Background style toggle
    if (bgStyleSelect) {
        bgStyleSelect.addEventListener('change', (e) => {
            const style = e.target.value;
            fontsData.forEach(font => {
                if (font.cardElement) {
                    const previewDiv = font.cardElement.querySelector('.card-preview');
                    const previewText = font.cardElement.querySelector('.preview-text');
                    
                    if (style === 'image') {
                        const seed = encodeURIComponent(previewDiv.dataset.fontName.replace(/\s+/g, ''));
                        previewDiv.style.backgroundColor = 'transparent';
                        previewDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://picsum.photos/seed/${seed}/400/250')`;
                    } else {
                        previewDiv.style.backgroundImage = 'none';
                        previewDiv.style.backgroundColor = previewDiv.dataset.bgColor;
                    }
                }
            });
        });
    }

    // Dictionary for common fonts that don't have the category in their name
    const fontDictionary = {
        serif: ['times', 'georgia', 'garamond', 'cambria', 'constantia', 'baskerville', 'palatino', 'century', 'merriweather', 'playfair', 'lora', 'pt serif', 'droid serif'],
        mono: ['consolas', 'courier', 'lucida console', 'monaco', 'monospace', 'fira code', 'source code pro', 'inconsolata', 'ubuntu mono'],
        script: ['comic sans', 'brush script', 'segoe script', 'lucida handwriting', 'pacifico', 'caveat', 'dancing script', 'great vibes'],
        display: ['impact', 'bebas', 'lobster', 'righteous', 'abril fatface']
    };

    function checkCategory(nameStr, categoryList) {
        return categoryList.some(keyword => nameStr.includes(keyword));
    }

    // Search & Type filtering
    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const type = typeFilter ? typeFilter.value : 'all';
        let visibleCount = 0;
        
        fontsData.forEach(font => {
            if (font.cardElement) {
                const nameStr = (font.fullName + " " + (font.info || "")).toLowerCase();
                let matchesSearch = nameStr.includes(term);
                let matchesType = false;
                
                const isDictSerif = checkCategory(nameStr, fontDictionary.serif) || nameStr.includes('serif') && !nameStr.includes('sans');
                const isDictMono = checkCategory(nameStr, fontDictionary.mono) || nameStr.includes('mono');
                const isDictScript = checkCategory(nameStr, fontDictionary.script) || nameStr.includes('script') || nameStr.includes('hand');
                const isDictDisplay = checkCategory(nameStr, fontDictionary.display) || nameStr.includes('display') || nameStr.includes('decorative');
                
                if (type === 'all') {
                    matchesType = true;
                } else if (type === 'serif') {
                    matchesType = isDictSerif;
                } else if (type === 'mono') {
                    matchesType = isDictMono;
                } else if (type === 'script') {
                    matchesType = isDictScript;
                } else if (type === 'display') {
                    matchesType = isDictDisplay;
                } else if (type === 'sans') {
                    // If it's not explicitly classified as something else, and has 'sans' or is a regular font (like Arial, Segoe)
                    matchesType = nameStr.includes('sans') || (!isDictSerif && !isDictMono && !isDictScript && !isDictDisplay);
                }
                
                if (matchesSearch && matchesType) {
                    font.cardElement.style.display = 'flex';
                    visibleCount++;
                } else {
                    font.cardElement.style.display = 'none';
                }
            }
        });
        
        fontCountDisplay.textContent = `${visibleCount} of ${fontsData.length} fonts`;
        fontCountDisplay.classList.remove('hidden');
    }

    searchInput.addEventListener('input', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);

    // Toast notification
    function showToast(message) {
        let toast = document.getElementById('toast-msg');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-msg';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    // Load System Fonts via Local Font Access API
    async function loadSystemFonts() {
        showLoading(true);
        errorMsg.classList.add('hidden');
        
        try {
            if (!('queryLocalFonts' in window)) {
                throw new Error("Browser Anda tidak mendukung Local Font Access API. Coba gunakan browser berbasis Chromium versi terbaru atau gunakan opsi 'Load from Folder'.");
            }
            
            // Request permission and get fonts
            const fonts = await window.queryLocalFonts();
            
            if (fonts.length === 0) {
                throw new Error("Tidak ada font yang ditemukan atau izin ditolak.");
            }

            // Limit to ~300 to prevent browser freezing if user has thousands of fonts
            const fontLimit = fonts.slice(0, 300);
            
            fontsData = fontLimit.map(f => ({
                family: f.family,
                fullName: f.fullName,
                info: f.style
            }));
            
            renderGrid();
        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message;
            errorMsg.classList.remove('hidden');
        } finally {
            showLoading(false);
        }
    }

    // Load Fonts from selected Folder
    folderUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        showLoading(true);
        errorMsg.classList.add('hidden');
        
        fontsData = []; // Clear existing
        const fontFaces = [];

        try {
            for (let file of files) {
                // Check if it's a font file
                if (file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        // Create a unique family name for the custom loaded font
                        const familyName = 'CustomFont_' + file.name.replace(/[^a-zA-Z0-9]/g, '');
                        
                        const fontFace = new FontFace(familyName, arrayBuffer);
                        const loadedFace = await fontFace.load();
                        document.fonts.add(loadedFace);
                        
                        // Parse friendly name from filename
                        const friendlyName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/[-_]/g, ' ');
                        
                        fontsData.push({
                            family: familyName,
                            fullName: formatFontName(friendlyName),
                            info: file.name
                        });
                    } catch (fontErr) {
                        console.warn('Failed to load font:', file.name, fontErr);
                    }
                }
            }
            
            if (fontsData.length === 0) {
                throw new Error("Tidak ada file font (.ttf, .otf, .woff) yang valid ditemukan di folder tersebut.");
            }
            
            renderGrid();
            
        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message;
            errorMsg.classList.remove('hidden');
        } finally {
            showLoading(false);
            // Reset input so same folder can be selected again
            folderUpload.value = '';
        }
    });

    function showLoading(show) {
        if (show) {
            loadingEl.classList.remove('hidden');
            welcomeState.classList.add('hidden');
            fontGrid.innerHTML = '';
        } else {
            loadingEl.classList.add('hidden');
        }
    }

    // Bind system font button
    loadSystemBtn.addEventListener('click', loadSystemFonts);
    grantPermissionBtn.addEventListener('click', loadSystemFonts);
});
