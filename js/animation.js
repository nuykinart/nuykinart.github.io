function animateTransition(url) {
    document.body.classList.add('fade-out');
    setTimeout(() => {
        location.href = url;
    }, 500); // Duration of the fade-out animation
}

document.addEventListener('DOMContentLoaded', () => {
    const titleWrapper = document.getElementById('title-wrapper');
    const getRandomParams = () => ({
        scale: 0.5 + Math.random() * 1.5,    // 0.5-2.0
        rotate: (Math.random() * 720) - 360, // -360° до +720°
        translateX: (Math.random() - 0.5) * 200, // -100px до +100px
        translateY: (Math.random() - 0.5) * 200
    });

    const startChaos = () => {
        document.querySelectorAll('.image-wrapper').forEach(wrapper => {
            if (wrapper === titleWrapper) return;

            const params = getRandomParams();

            wrapper.style.setProperty('--anim-scale', params.scale);
            wrapper.style.setProperty('--anim-rotate', `${params.rotate}deg`);
            wrapper.style.setProperty('--anim-translate-x', `${params.translateX}px`);
            wrapper.style.setProperty('--anim-translate-y', `${params.translateY}px`);

            wrapper.classList.remove('chaos-active');
            void wrapper.offsetWidth; // Trigger reflow
            wrapper.classList.add('chaos-active');
        });
    };

    titleWrapper?.addEventListener('click', startChaos);

    // Удаляем класс после анимации
    document.querySelectorAll('.image-wrapper').forEach(wrapper => {
        wrapper.addEventListener('animationend', () => {
            wrapper.classList.remove('chaos-active');
        });
    });
});