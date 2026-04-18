document.addEventListener('DOMContentLoaded', function() {
    const galleryGrid = document.querySelector('.gallery-grid');
    const navBottom = document.querySelector('.nav-bottom');

    // Название переменной данных может зависеть от страницы, 
    // но по умолчанию используем galleryData.
    // Если на разных страницах разные переменные, можно сделать проверку.
    const data = typeof galleryData !== 'undefined' ? galleryData : [];
    const config = typeof galleryConfig !== 'undefined' ? galleryConfig : {};

    if (!galleryGrid || !navBottom || data.length === 0) return;

    // Рендеринг галереи
    function renderGallery(filterTag = 'all') {
        galleryGrid.innerHTML = '';
        
        const filteredData = filterTag === 'all' 
            ? data 
            : data.filter(item => item.tags.includes(filterTag));

        // Добавляем проверку на наличие данных
        if (filteredData.length === 0) {
            galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">Нет изображений для этого тега.</div>';
            return;
        }

        filteredData.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            // Если путь относительный и есть baseUrl в конфиге, добавляем его
            let filePath = item.file;
            let thumbPath = item.file;

            // Логика для превью: файлы лежат в подпапке thumbs
            // Например: "2014/image.jpg" -> "2014/thumbs/image.jpg"
            const lastSlashIndex = item.file.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
                const dir = item.file.substring(0, lastSlashIndex);
                const name = item.file.substring(lastSlashIndex + 1);
                thumbPath = `${dir}/thumbs/${name}`;
            } else {
                thumbPath = `thumbs/${item.file}`;
            }

            if (config.baseUrl && !filePath.startsWith('http') && !filePath.startsWith('/')) {
                filePath = config.baseUrl + filePath;
                thumbPath = config.baseUrl + thumbPath;
            }

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

        // Принудительно инициализируем Lightbox для новых элементов
        if (typeof lightbox !== 'undefined') {
            lightbox.init();
        } else if (window.lightbox) {
            window.lightbox.init();
        }

        // Если есть jQuery, можно попробовать еще один способ
        if (typeof jQuery !== 'undefined') {
            jQuery('[data-lightbox]').off('click').on('click', function(e) {
                if (typeof lightbox !== 'undefined') {
                    e.preventDefault();
                    lightbox.start(jQuery(this));
                    return false;
                }
            });
        }
    }

    // Рендеринг навигации (тегов)
    function renderNav() {
        navBottom.innerHTML = '';
        
        // Кнопка "Все"
        const allBtn = document.createElement('div');
        allBtn.className = 'nav-item';
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => {
            renderGallery('all');
            setActiveBtn(allBtn);
        });
        navBottom.appendChild(allBtn);
        setActiveBtn(allBtn);

        // Получаем уникальные теги
        const tags = new Set();
        data.forEach(item => {
            item.tags.forEach(tag => tags.add(tag));
        });

        // Сортируем теги
        const sortedTags = Array.from(tags).sort((a, b) => {
            // Если это года (числа), сортируем в обратном порядке
            if (!isNaN(a) && !isNaN(b)) return b - a;
            return a.localeCompare(b);
        });

        sortedTags.forEach(tag => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.textContent = tag;
            navItem.dataset.category = tag;
            navItem.addEventListener('click', () => {
                renderGallery(tag);
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

    // Инициализация
    renderNav();
    renderGallery('all');
});