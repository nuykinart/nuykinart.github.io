/**
 * Album gallery engine.
 *
 * Expects globals defined before this script:
 *   - galleryConfig, galleryData, albumsData (js/gallery-data.js + js/albums/*.js)
 *   - jQuery and lightbox (CDN)
 *
 * URL scheme (hash-based, so it works on GitHub Pages):
 *   #            → album list
 *   #<albumId>   → album view
 *   #<albumId>/N → album view with image N (1-based index in the full album) opened
 */
document.addEventListener('DOMContentLoaded', function () {
    const galleryGrid = document.querySelector('.gallery-grid');
    const navBottom = document.querySelector('.nav-bottom');

    const data = typeof galleryData !== 'undefined' ? galleryData : [];
    const config = typeof galleryConfig !== 'undefined' ? galleryConfig : {};
    const albums = typeof albumsData !== 'undefined' ? albumsData : [];

    if (!galleryGrid || !navBottom) return;

    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            resizeDuration: 200,
            wrapAround: true,
            alwaysShowNavOnTouchDevices: false,
            disableScrolling: true,
            showImageNumberLabel: false
        });
    }

    let currentAlbumId = null;
    let suppressEndStateUpdate = false;
    // Maps the position of each rendered (possibly filtered) item to its index
    // in the full album, so URLs stay valid regardless of the active tag filter.
    let renderedFullIndexes = [];

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function getAlbumId(item) {
        const slashIdx = item.file.indexOf('/');
        return slashIdx !== -1 ? item.file.substring(0, slashIdx) : 'default';
    }

    function getAlbumItems(albumId) {
        return data.filter(item => getAlbumId(item) === albumId);
    }

    function getUniqueAlbumIds() {
        return Array.from(new Set(data.map(getAlbumId))).sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });
    }

    function resolveThumbPath(file) {
        const lastSlash = file.lastIndexOf('/');
        const thumbPath = lastSlash !== -1
            ? `${file.substring(0, lastSlash)}/thumbs/${file.substring(lastSlash + 1)}`
            : `thumbs/${file}`;
        return (config.baseUrl && !thumbPath.startsWith('http') && !thumbPath.startsWith('/'))
            ? config.baseUrl + thumbPath
            : thumbPath;
    }

    function resolveFullPath(file) {
        return (config.baseUrl && !file.startsWith('http') && !file.startsWith('/'))
            ? config.baseUrl + file
            : file;
    }

    function getAlbumMeta(id) {
        const meta = albums.find(a => a.id === id);
        const items = getAlbumItems(id);
        const coverFile = (meta && meta.cover) ? meta.cover : (items.length > 0 ? items[0].file : null);
        return {
            id,
            title: meta ? meta.title : id,
            cover: coverFile ? resolveThumbPath(coverFile) : null
        };
    }

    function safeDecode(value) {
        try {
            return decodeURIComponent(value);
        } catch (e) {
            return value;
        }
    }

    function parseHash() {
        const hash = location.hash.slice(1);
        if (!hash) return { view: 'root' };
        const slashIdx = hash.indexOf('/');
        if (slashIdx === -1) return { view: 'album', albumId: safeDecode(hash), imageIndex: null };
        const albumId = safeDecode(hash.substring(0, slashIdx));
        const imageIndex = parseInt(hash.substring(slashIdx + 1), 10);
        return { view: 'album', albumId, imageIndex: isNaN(imageIndex) ? null : imageIndex };
    }

    function closeLightbox() {
        suppressEndStateUpdate = true;
        if (typeof lightbox !== 'undefined') lightbox.end();
        suppressEndStateUpdate = false;
    }

    // imageIndex is 1-based within the full album.
    function openLightboxAt(imageIndex) {
        if (typeof lightbox === 'undefined') return;
        const fullIndex = imageIndex - 1;
        let pos = renderedFullIndexes.indexOf(fullIndex);
        if (pos === -1 && currentAlbumId !== null) {
            // Image is hidden by the active tag filter — show the full album.
            renderAlbumView(currentAlbumId);
            pos = renderedFullIndexes.indexOf(fullIndex);
        }
        const links = galleryGrid.querySelectorAll('a[data-lightbox]');
        if (pos !== -1 && links[pos]) {
            lightbox.start(jQuery(links[pos]));
        }
    }

    // Patch lightbox to keep the URL in sync when the user closes it
    // (via overlay/Escape) or navigates between images inside it.
    if (typeof lightbox !== 'undefined') {
        const originalEnd = lightbox.end.bind(lightbox);
        lightbox.end = function () {
            originalEnd();
            if (!suppressEndStateUpdate) {
                const state = parseHash();
                if (state.imageIndex != null) {
                    history.pushState(null, '', `#${encodeURIComponent(state.albumId)}`);
                }
            }
        };

        const originalChangeImage = lightbox.changeImage.bind(lightbox);
        lightbox.changeImage = function (imageIndex) {
            originalChangeImage(imageIndex);
            const state = parseHash();
            if (state.view === 'album') {
                const fullIndex = renderedFullIndexes[imageIndex] ?? imageIndex;
                history.replaceState(null, '', `#${encodeURIComponent(state.albumId)}/${fullIndex + 1}`);
            }
        };
    }

    window.addEventListener('popstate', () => {
        const state = parseHash();
        if (state.view === 'root') {
            closeLightbox();
            renderAlbums();
        } else if (state.view === 'album') {
            if (state.imageIndex != null) {
                if (currentAlbumId !== state.albumId) {
                    renderAlbumView(state.albumId);
                    setTimeout(() => openLightboxAt(state.imageIndex), 150);
                } else {
                    openLightboxAt(state.imageIndex);
                }
            } else {
                closeLightbox();
                if (currentAlbumId !== state.albumId) {
                    renderAlbumView(state.albumId);
                }
            }
        }
    });

    function renderAlbums() {
        currentAlbumId = null;
        renderedFullIndexes = [];
        navBottom.innerHTML = '';
        galleryGrid.innerHTML = '';

        getUniqueAlbumIds().forEach(id => {
            const meta = getAlbumMeta(id);
            const previewsHtml = getAlbumItems(id).slice(0, 4)
                .map(item => `<img src="${escapeHtml(resolveThumbPath(item.file))}" alt="" loading="lazy">`)
                .join('');

            const card = document.createElement('div');
            card.className = 'gallery-item album-card';
            card.innerHTML = `
                ${meta.cover ? `<img class="album-cover" src="${escapeHtml(meta.cover)}" alt="${escapeHtml(meta.title)}" loading="lazy">` : ''}
                <div class="album-previews">${previewsHtml}</div>
                <div class="image-info">
                    <h3>${escapeHtml(meta.title)}</h3>
                </div>
            `;
            card.addEventListener('click', () => {
                history.pushState(null, '', `#${encodeURIComponent(id)}`);
                renderAlbumView(id);
            });
            galleryGrid.appendChild(card);
        });
    }

    function renderAlbumView(albumId) {
        currentAlbumId = albumId;
        renderAlbumNav(albumId);
        renderGallery(albumId, 'all');
    }

    function renderGallery(albumId, filterTag) {
        galleryGrid.innerHTML = '';

        const albumItems = getAlbumItems(albumId);
        const filtered = filterTag === 'all'
            ? albumItems
            : albumItems.filter(item => item.tags.includes(filterTag));
        renderedFullIndexes = filtered.map(item => albumItems.indexOf(item));

        if (filtered.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-empty">Нет изображений для этого тега.</div>';
            return;
        }

        filtered.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <a href="${escapeHtml(resolveFullPath(item.file))}" data-lightbox="gallery" data-title="${escapeHtml(item.title)}">
                    <img src="${escapeHtml(resolveThumbPath(item.file))}" alt="${escapeHtml(item.title)}" loading="lazy">
                </a>
                <div class="image-info">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${item.subtitle}</p>
                </div>
            `;
            galleryGrid.appendChild(galleryItem);
        });

        // Open the lightbox ourselves so the URL reflects the opened image.
        // `return false` stops propagation, keeping lightbox's own delegated
        // handler from starting a second time.
        jQuery(galleryGrid).find('a[data-lightbox]').on('click', function (e) {
            if (typeof lightbox === 'undefined') return;
            e.preventDefault();
            const links = jQuery(galleryGrid).find('a[data-lightbox]').toArray();
            const pos = links.indexOf(this);
            const fullIndex = renderedFullIndexes[pos] ?? pos;
            history.pushState(null, '', `#${encodeURIComponent(albumId)}/${fullIndex + 1}`);
            lightbox.start(jQuery(this));
            return false;
        });
    }

    function renderAlbumNav(albumId) {
        navBottom.innerHTML = '';

        const backBtn = document.createElement('div');
        backBtn.className = 'nav-item';
        backBtn.textContent = '← Альбомы';
        backBtn.addEventListener('click', () => {
            history.pushState(null, '', location.pathname);
            renderAlbums();
        });
        navBottom.appendChild(backBtn);

        const allBtn = document.createElement('div');
        allBtn.className = 'nav-item active';
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => {
            renderGallery(albumId, 'all');
            setActiveBtn(allBtn);
        });
        navBottom.appendChild(allBtn);

        const tags = new Set();
        getAlbumItems(albumId).forEach(item => item.tags.forEach(tag => tags.add(tag)));

        Array.from(tags).sort((a, b) => {
            if (!isNaN(a) && !isNaN(b)) return b - a;
            return a.localeCompare(b);
        }).forEach(tag => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.textContent = tag;
            navItem.addEventListener('click', () => {
                renderGallery(albumId, tag);
                setActiveBtn(navItem);
            });
            navBottom.appendChild(navItem);
        });
    }

    function setActiveBtn(activeBtn) {
        navBottom.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    // Initial render based on URL hash
    const initialState = parseHash();
    if (initialState.view === 'album') {
        renderAlbumView(initialState.albumId);
        if (initialState.imageIndex != null) {
            setTimeout(() => openLightboxAt(initialState.imageIndex), 150);
        }
    } else {
        renderAlbums();
    }
});
