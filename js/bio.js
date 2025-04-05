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