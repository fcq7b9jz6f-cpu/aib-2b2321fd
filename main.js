import { onScroll } from './scene.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
    });

    lenis.on('scroll', (e) => {
        ScrollTrigger.update(e.time);
        onScroll(e.animatedScroll); // Pass scroll position to scene.js
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // --- GSAP HORIZONTAL SCROLL ---
    gsap.registerPlugin(ScrollTrigger);

    const workSection = document.querySelector('.work');
    const scroller = document.querySelector('.work__scroller');
    const items = gsap.utils.toArray('.work__item');

    // Calculate the width the scroller needs to move
    let scrollAmount = scroller.offsetWidth - window.innerWidth;
    if (items.length > 0) {
        // A more robust calculation considering margins
        const lastItem = items[items.length - 1];
        scrollAmount = lastItem.offsetLeft + lastItem.offsetWidth - window.innerWidth + parseFloat(getComputedStyle(scroller).paddingRight);
    }

    gsap.to(scroller, {
        x: () => -scrollAmount,
        ease: 'none',
        scrollTrigger: {
            trigger: workSection,
            start: 'top top',
            end: () => `+=${scrollAmount}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true, // Recalculate on resize
        }
    });

    // --- GSAP FADE-INS & PARALLAX ---
    gsap.utils.toArray('section:not(.hero)').forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: 50,
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 80%',
                toggleActions: 'play none none reverse',
            }
        });
    });

    // Parallax hero text
    gsap.to('.hero__title', {
        y: -100,
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

});
