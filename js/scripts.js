document.addEventListener('DOMContentLoaded', () => {
    // === Image dimensions ===
    const container = document.querySelector('.image-container');
    const imageWrappers = document.querySelectorAll('.image-wrapper');
    const baseContainerWidth = 1366;

    // Size calculation function
    const calculateSizes = () => {
        const currentWidth = container.clientWidth;
        const scaleFactor = currentWidth / baseContainerWidth;

        imageWrappers.forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (!img?.dataset.originalWidth) return;

            wrapper.style.width = `${img.dataset.originalWidth * scaleFactor}px`;
            wrapper.style.height = `${img.dataset.originalHeight * scaleFactor}px`;
        });
    };

    // Image initialization
    imageWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

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

            // Save original src only once
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
            }

        } catch (error) {
            console.error('Tint error:', error);
        }
    };

    // Hover handlers
    imageWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

        // Tint initialization
        const initTint = () => {
            if (!img.complete) {
                img.addEventListener('load', () => {
                    createTintedVersion(img);
                    // Add handlers only after loading
                    addHoverHandlers(wrapper, img);
                });
                return;
            }
            createTintedVersion(img);
            addHoverHandlers(wrapper, img);
        };

        // Adding event handlers
        const addHoverHandlers = (wrapper, img) => {
            const handleMouseEnter = () => {
                if (img.dataset.tintedSrc) {
                    img.src = img.dataset.tintedSrc;
                }
            };

            const handleMouseLeave = () => {
                if (img.dataset.originalSrc) {
                    img.src = img.dataset.originalSrc;
                }
            };

            // Remove old handlers before adding new ones
            wrapper.removeEventListener('mouseenter', handleMouseEnter);
            wrapper.removeEventListener('mouseleave', handleMouseLeave);

            wrapper.addEventListener('mouseenter', handleMouseEnter);
            wrapper.addEventListener('mouseleave', handleMouseLeave);
        };

        initTint();
    });
});

