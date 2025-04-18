document.addEventListener('DOMContentLoaded', () => {
    // === Image dimensions ===
    const container = document.querySelector('.image-container');
    const imageWrappers = document.querySelectorAll('.image-wrapper');
    const baseContainerWidth = 1366 * 2;

    const addHoverListeners = (wrapper) => {
        if (wrapper.classList.contains('no-hover')) return;

        const handleMouseEnter = () => {
            wrapper.dataset.hovered = 'true';
            calculateSizes(); // Пересчет при наведении
        };

        const handleMouseLeave = () => {
            wrapper.dataset.hovered = 'false';
            calculateSizes(); // Пересчет при уходе
        };

        wrapper.addEventListener('mouseenter', handleMouseEnter);
        wrapper.addEventListener('mouseleave', handleMouseLeave);
    };
    // Size calculation function
    const calculateSizes = () => {
        const currentWidth = container.clientWidth;
        const scaleFactor = currentWidth / baseContainerWidth;

        imageWrappers.forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (!img?.dataset.originalWidth) return;

            let width = img.dataset.originalWidth * scaleFactor;
            let height = img.dataset.originalHeight * scaleFactor;

            if (wrapper.dataset.hovered === 'true') {
                width *= 1.05;
                height *= 1.05;
            }

            wrapper.style.width = `${width}px`;
            wrapper.style.height = `${height}px`;
        });
    };

    // Image initialization
    imageWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

        addHoverListeners(wrapper);

        const initImage = () => {
            img.dataset.originalWidth = img.naturalWidth;
            img.dataset.originalHeight = img.naturalHeight;
            calculateSizes();
        };

        img.complete ? initImage() : img.addEventListener('load', initImage);
    });

    // Resize
    window.addEventListener('resize', () => requestAnimationFrame(calculateSizes));

    // === Tint effect ===
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    const tintConfig = {
        target: [0, 72, 255],
        intensity: 1
    };

    // Function to create tinted version
    const createTintedVersion = (img) => {
        try {
            if (!img.complete || img.naturalWidth === 0) return;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 10) continue;

                data[i] = data[i] * (1 - tintConfig.intensity) + tintConfig.target[0] * tintConfig.intensity;
                data[i + 1] = data[i + 1] * (1 - tintConfig.intensity) + tintConfig.target[1] * tintConfig.intensity;
                data[i + 2] = data[i + 2] * (1 - tintConfig.intensity) + tintConfig.target[2] * tintConfig.intensity;
            }

            ctx.putImageData(imageData, 0, 0);
            img.dataset.tintedSrc = canvas.toDataURL();

            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
            }

        } catch (error) {
            console.error('Tint error:', error);
        }
    };

    // Hover handlers
    imageWrappers.forEach(wrapper => {
        if (wrapper.classList.contains('no-hover')) return;

        const img = wrapper.querySelector('img');
        if (!img) return;

        // Tint initialization
        const initTint = () => {
            if (!img.complete) {
                img.addEventListener('load', () => {
                    createTintedVersion(img);
                    addHoverHandlers(wrapper, img);
                });
                return;
            }
            createTintedVersion(img);
            addHoverHandlers(wrapper, img);
        };

        // Adding event handlers
        const addHoverHandlers = (wrapper, img) => {
            const handleEnter = () => {
                if (img.dataset.tintedSrc) {
                    img.src = img.dataset.tintedSrc;
                }
            };

            const handleLeave = () => {
                if (img.dataset.originalSrc) {
                    img.src = img.dataset.originalSrc;
                }
            };

            // Remove old handlers
            wrapper.removeEventListener('mouseenter', handleEnter);
            wrapper.removeEventListener('mouseleave', handleLeave);
            wrapper.removeEventListener('touchstart', handleEnter);
            wrapper.removeEventListener('touchend', handleLeave);

            // Check for touch support
            if ('ontouchstart' in window) {
                // Touch devices
                wrapper.addEventListener('touchstart', handleEnter);
                wrapper.addEventListener('touchend', handleLeave);
            } else {
                // Non-touch devices
                wrapper.addEventListener('mouseenter', handleEnter);
                wrapper.addEventListener('mouseleave', handleLeave);
            }
        };

        initTint();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.image-container');
    const textWrappers = document.querySelectorAll('.text-wrapper');
    const baseContainerWidth = 1366 * 2;

    const addHoverListeners = (wrapper) => {
        const handleMouseEnter = () => {
            wrapper.dataset.hovered = 'true';
            calculateSizes();
        };

        const handleMouseLeave = () => {
            wrapper.dataset.hovered = 'false';
            calculateSizes();
        };

        wrapper.addEventListener('mouseenter', handleMouseEnter);
        wrapper.addEventListener('mouseleave', handleMouseLeave);
    };

    const calculateSizes = () => {
        const currentWidth = container.clientWidth;
        const scaleFactor = currentWidth / baseContainerWidth;

        textWrappers.forEach(wrapper => {
            const baseSize = parseFloat(wrapper.dataset.originalFontSize);
            let fontSize = baseSize * scaleFactor;

            const baseMaxWidth = parseFloat(wrapper.dataset.originalMaxWidth);
            let maxWidth = baseMaxWidth * scaleFactor;

            // if (wrapper.dataset.hovered === 'true') {
            //     fontSize *= 1.01;
            //     maxWidth *= 1.01;
            // }

            wrapper.style.fontSize = `${fontSize}px`;

            if (!isNaN(baseMaxWidth)) {
                wrapper.style.maxWidth = `${maxWidth}px`;
            }
        });
    };

    textWrappers.forEach(wrapper => {
        if (!wrapper.dataset.originalFontSize) {
            const style = window.getComputedStyle(wrapper);

            wrapper.dataset.originalFontSize = parseFloat(style.fontSize);

            const computedMaxWidth = parseFloat(style.maxWidth);
            if (!isNaN(computedMaxWidth)) {
                wrapper.dataset.originalMaxWidth = computedMaxWidth;
            }
        }

        addHoverListeners(wrapper);
    });

    calculateSizes();
    window.addEventListener('resize', () => requestAnimationFrame(calculateSizes));
});