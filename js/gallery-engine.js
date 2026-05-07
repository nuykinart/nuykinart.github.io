document.addEventListener('DOMContentLoaded', function() {
    const galleryGrid = document.querySelector('.gallery-grid');
    const navBottom = document.querySelector('.nav-bottom');

    const data = typeof galleryData !== 'undefined' ? galleryData : [];
    const config = typeof galleryConfig !== 'undefined' ? galleryConfig : {};
    const albums = typeof albumsData !== 'undefined' ? albumsData : [];

    if (!galleryGrid || !navBottom) return;

    let currentAlbumId = null;
    let suppressEndStateUpdate = false;

    function getAlbumId(item) {
        const slashIdx = item.file.indexOf('/');
        return slashIdx !== -1 ? item.file.substring(0, slashIdx) : 'default';
    }

    function getUniqueAlbumIds() {
        return Array.from(new Set(data.map(getAlbumId))).sort();
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
        const items = data.filter(item => getAlbumId(item) === id);
        const coverFile = (meta && meta.cover) ? meta.cover : (items.length > 0 ? items[0].file : null);
        return {
            id,
            title: meta ? meta.title : id,
            cover: coverFile ? resolveThumbPath(coverFile) : null
        };
    }

    function parseHash() {
        const hash = location.hash.slice(1);
        if (!hash) return { view: 'root' };
        const slashIdx = hash.indexOf('/');
        if (slashIdx === -1) return { view: 'album', albumId: decodeURIComponent(hash), imageIndex: null };
        const albumId = decodeURIComponent(hash.substring(0, slashIdx));
        const imageIndex = parseInt(hash.substring(slashIdx + 1));
        return { view: 'album', albumId, imageIndex: isNaN(imageIndex) ? null : imageIndex };
    }

    function openLightboxAt(imageIndex) {
        const links = document.querySelectorAll('[data-lightbox]');
        const idx = imageIndex - 1;
        if (links[idx] && typeof lightbox !== 'undefined') {
            lightbox.start(jQuery(links[idx]));
        }
    }

    // Patch lightbox.end to sync URL when lightbox closes via UI/Escape
    if (typeof lightbox !== 'undefined') {
        const originalEnd = lightbox.end.bind(lightbox);
        lightbox.end = function() {
            originalEnd();
            if (!suppressEndStateUpdate) {
                const state = parseHash();
                if (state.imageIndex != null) {
                    history.pushState(null, '', `#${encodeURIComponent(state.albumId)}`);
                }
            }
        };

        const originalChangeImage = lightbox.changeImage.bind(lightbox);
        lightbox.changeImage = function(imageIndex) {
            originalChangeImage(imageIndex);
            const state = parseHash();
            if (state.view === 'album') {
                history.replaceState(null, '', `#${encodeURIComponent(state.albumId)}/${imageIndex + 1}`);
            }
        };
    }

    window.addEventListener('popstate', () => {
        const state = parseHash();
        if (state.view === 'root') {
            suppressEndStateUpdate = true;
            if (typeof lightbox !== 'undefined') lightbox.end();
            suppressEndStateUpdate = false;
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
                suppressEndStateUpdate = true;
                if (typeof lightbox !== 'undefined') lightbox.end();
                suppressEndStateUpdate = false;
                if (currentAlbumId !== state.albumId) {
                    renderAlbumView(state.albumId);
                }
            }
        }
    });

    function renderAlbums() {
        currentAlbumId = null;
        navBottom.innerHTML = '';
        galleryGrid.innerHTML = '';

        getUniqueAlbumIds().forEach(id => {
            const meta = getAlbumMeta(id);
            const albumItems = data.filter(item => getAlbumId(item) === id);
            const previewsHtml = albumItems.slice(0, 4)
                .map(item => `<img src="${resolveThumbPath(item.file)}" alt="" loading="lazy">`)
                .join('');

            const card = document.createElement('div');
            card.className = 'gallery-item album-card';
            card.innerHTML = `
                <img class="album-cover" src="${meta.cover}" alt="${meta.title}" loading="lazy">
                <div class="album-previews">${previewsHtml}</div>
                <div class="image-info">
                    <h3>${meta.title}</h3>
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

        const albumItems = data.filter(item => getAlbumId(item) === albumId);
        const filtered = filterTag === 'all'
            ? albumItems
            : albumItems.filter(item => item.tags.includes(filterTag));

        if (filtered.length === 0) {
            galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">Нет изображений для этого тега.</div>';
            return;
        }

        filtered.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            const filePath = resolveFullPath(item.file);
            const thumbPath = resolveThumbPath(item.file);
            galleryItem.innerHTML = `
                <a href="${filePath}" data-lightbox="gallery" data-title="${item.title}">
                    <img src="${thumbPath}" alt="${item.title}" loading="lazy">
                </a>
                <div class="image-info">
                    <h3>${item.title}</h3>
                    <p>${item.subtitle}</p>
                </div>
            `;
            galleryGrid.appendChild(galleryItem);
        });

        if (typeof lightbox !== 'undefined') lightbox.init();

        jQuery('[data-lightbox]').off('click').on('click', function(e) {
            if (typeof lightbox === 'undefined') return;
            e.preventDefault();
            const links = jQuery('[data-lightbox]').toArray();
            const imageIndex = links.indexOf(this) + 1;
            history.pushState(null, '', `#${encodeURIComponent(albumId)}/${imageIndex}`);
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
        allBtn.className = 'nav-item';
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => {
            renderGallery(albumId, 'all');
            setActiveBtn(allBtn);
        });
        navBottom.appendChild(allBtn);
        setActiveBtn(allBtn);

        const tags = new Set();
        data.filter(item => getAlbumId(item) === albumId)
            .forEach(item => item.tags.forEach(tag => tags.add(tag)));

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
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#f0f0f0';
            btn.style.color = '#666';
        });
        activeBtn.classList.add('active');
        activeBtn.style.background = '#007bff';
        activeBtn.style.color = 'white';
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
