/**
 * Collage pages (index, bio, painting, misc): scales absolutely-positioned
 * images and text blocks proportionally to the container width, and applies
 * a blue tint to interactive images on hover/touch.
 *
 * Pages without an .image-container (e.g. graphics) only get the tint effect.
 */

// Design width the original layout coordinates were authored against.
const COLLAGE_BASE_WIDTH = 1366 * 2;

// === Proportional image scaling ===
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.image-container');
    const imageWrappers = document.querySelectorAll('.image-wrapper');

    const calculateSizes = () => {
        if (!container) return;
        const scaleFactor = container.clientWidth / COLLAGE_BASE_WIDTH;

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

    imageWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

        if (!wrapper.classList.contains('no-hover')) {
            wrapper.addEventListener('mouseenter', () => {
                wrapper.dataset.hovered = 'true';
                calculateSizes();
            });
            wrapper.addEventListener('mouseleave', () => {
                wrapper.dataset.hovered = 'false';
                calculateSizes();
            });
        }

        const initImage = () => {
            img.dataset.originalWidth = img.naturalWidth;
            img.dataset.originalHeight = img.naturalHeight;
            calculateSizes();
        };

        img.complete ? initImage() : img.addEventListener('load', initImage);
    });

    window.addEventListener('resize', () => requestAnimationFrame(calculateSizes));
});

// === Hover tint effect ===
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const tintConfig = {
        target: [0, 72, 255],
        intensity: 1
    };

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
                if (data[i + 3] < 10) continue; // skip transparent pixels

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

        if ('ontouchstart' in window) {
            wrapper.addEventListener('touchstart', handleEnter);
            wrapper.addEventListener('touchend', handleLeave);
        } else {
            wrapper.addEventListener('mouseenter', handleEnter);
            wrapper.addEventListener('mouseleave', handleLeave);
        }
    };

    document.querySelectorAll('.image-wrapper:not(.no-hover)').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

        const initTint = () => {
            createTintedVersion(img);
            addHoverHandlers(wrapper, img);
        };

        img.complete ? initTint() : img.addEventListener('load', initTint);
    });
});

// === Proportional text scaling ===
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.image-container');
    const textWrappers = document.querySelectorAll('.text-wrapper');

    if (!container || textWrappers.length === 0) return;

    const calculateSizes = () => {
        const scaleFactor = container.clientWidth / COLLAGE_BASE_WIDTH;

        textWrappers.forEach(wrapper => {
            const baseSize = parseFloat(wrapper.dataset.originalFontSize);
            wrapper.style.fontSize = `${baseSize * scaleFactor}px`;

            const baseMaxWidth = parseFloat(wrapper.dataset.originalMaxWidth);
            if (!isNaN(baseMaxWidth)) {
                wrapper.style.maxWidth = `${baseMaxWidth * scaleFactor}px`;
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
    });

    calculateSizes();
    window.addEventListener('resize', () => requestAnimationFrame(calculateSizes));
});
