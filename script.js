document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
    const mm = gsap.matchMedia();

    // 0. Smooth Scroll Restoration Fix
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // ----------------------------------------------------------------
    // 1. Loading Screen (Geometric Flux Reveal)
    // ----------------------------------------------------------------
    
    // Force scroll to top on fresh load if no specific hash is present
    let targetHash = window.location.hash;
    if (!targetHash && !sessionStorage.getItem('savedScrollPosition')) {
        window.scrollTo(0, 0);
    }

    if (targetHash) {
        window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        window.scrollTo(0, 0); 
    }

    document.body.style.overflow = "hidden"; // Hide scrollbar while loading
    
    let isLoaderExited = false;
    const exitLoaderWithSafeGuard = () => {
        if (isLoaderExited) return;
        isLoaderExited = true;
        exitLoader();
    };

    // Fail-safe: Force exit loader if it takes too long (e.g., 4 seconds)
    const failSafeTimeout = setTimeout(exitLoaderWithSafeGuard, 4000);

    window.addEventListener('load', () => {
        clearTimeout(failSafeTimeout);
        // Add a tiny strategic delay for DOM stabilization before reveal
        setTimeout(exitLoaderWithSafeGuard, 300); 
    });

    // Hide hero content initially (insurance if CSS classes haven't loaded)
    gsap.set(["nav a", ".stagger-text", "#hero-video", ".typewriter-line"], { opacity: 0 });

    // Precise path strings enabling buttery-smooth GSAP primitive morphing
    const paths = {
        square: "M 50 10 C 90 10 90 10 90 50 C 90 90 90 90 50 90 C 10 90 10 90 10 50 C 10 10 10 10 50 10 Z",
        circle: "M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z",
        triangle: "M 50 10 C 70 50 90 90 90 90 C 70 90 50 90 50 90 C 30 90 10 90 10 90 C 30 50 50 10 50 10 Z"
    };

    // 1a. Flux Morphing Timeline
    const morphTl = gsap.timeline({ repeat: -1 });
    morphTl.to("#flux-path", { attr: { d: paths.circle }, duration: 0.8, ease: "power2.inOut" })
           .to("#flux-path", { attr: { d: paths.triangle }, duration: 0.8, ease: "power2.inOut" })
           .to("#flux-path", { attr: { d: paths.square }, duration: 0.8, ease: "power2.inOut" });

    // 1b. Pulse & Rotate Loop
    gsap.to("#flux-shape", {
        rotation: 360,
        duration: 2.4,
        ease: "linear",
        repeat: -1
    });

    gsap.to("#flux-shape", {
        scale: 1.2,
        duration: 0.4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
    });

    function exitLoader() {
        const exitTl = gsap.timeline({
            onComplete: () => {
                document.body.style.overflow = "";
                const loaderEl = document.getElementById('loader');
                if(loaderEl) loaderEl.style.display = "none";
                
                // Allow CSS reflows and body overflow resets before refreshing positions
                // Increased delay slightly to ensure absolute stability
                setTimeout(() => {
                    ScrollTrigger.refresh();
                    
                    // 1d. Execute deferred safe-scroll to previously captured target section
                    if (targetHash) {
                        const target = document.querySelector(targetHash);
                        if (target) {
                            window.history.replaceState('', document.title, window.location.pathname + targetHash);
                            gsap.to(window, { scrollTo: target.offsetTop, duration: 1.5, ease: "power4.inOut" });
                        }
                    }
                }, 400);
            }
        });

        // 1d. Shape Implodes
        exitTl.to("#flux-shape", {
            scale: 0,
            opacity: 0,
            duration: 0.6,
            ease: "back.in(1.7)"
        })
        // 1e. Cinematic Lens Opening
        .to('#loader-top', {
            yPercent: -100,
            duration: 1.2,
            ease: "power4.inOut"
        }, "-=0.2")
        .to('#loader-bottom', {
            yPercent: 100,
            duration: 1.2,
            ease: "power4.inOut"
        }, "<")
        // 1f. Fade in background video
        .to("#hero-video", {
            opacity: 1,
            duration: 1.5,
            ease: "power3.out"
        }, "-=1.0")
        // 1g. Safely fade in Hero Content exactly like before
        .fromTo("nav a", 
            { y: -30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }, 
        "-=1.2")
        .fromTo(".stagger-text", 
            { y: 60, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.5, stagger: 0.15, ease: "power4.out" }, 
        "-=1.2");

        // 1h. Post-load Scroll Restoration Check
        const savedScroll = sessionStorage.getItem('savedScrollPosition');
        if (savedScroll) {
            // Wait slightly for GSAP setup then jump
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll, 10));
                sessionStorage.removeItem('savedScrollPosition'); // Clear after use
                ScrollTrigger.refresh();
            }, 300);
        }
    }


    // ----------------------------------------------------------------
    // 2. Custom Smoke Cursor Implementation (Enhanced Smoothness & Smoke)
    // ----------------------------------------------------------------
    
    class Particle {
        constructor(x, y, isHovering, cursorSpeedX, cursorSpeedY) {
            this.x = x + (Math.random() * 20 - 10);
            this.y = y + (Math.random() * 20 - 10);
            
            // Small initial size but high density creates a flowing stream
            this.size = Math.random() * 4 + 2; 
            this.maxSize = this.size + (Math.random() * 15 + 10); 
            
            // Smoother speed logic
            this.speedX = (Math.random() * 1 - 0.5) - (cursorSpeedX * 0.05); 
            this.speedY = (Math.random() * -0.5 - 0.2) - (cursorSpeedY * 0.05); 
            
            // Slower fade for a continuous flowing tail, but lower opacity
            this.fadeRate = Math.random() * 0.01 + 0.005; 
            this.opacity = Math.random() * 0.3 + 0.1;
            
            this.isHovering = isHovering;

            // Exhaust color (White smoke texture)
            const shade = Math.floor(Math.random() * 20 + 235); // 235-255 (off-white to pure white)
            this.color = `${shade}, ${shade}, ${shade}`;

            if (this.isHovering) {
                // If hovering, simulate a revving engine (thicker, faster expansion)
                this.opacity = Math.random() * 0.4 + 0.2;
                this.size += 3;
                this.maxSize += 15;
                this.color = '255, 255, 255'; // Pure white texture
                this.speedX += (Math.random() * 4 - 2);
                this.speedY += (Math.random() * 2 - 1);
            }
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Smoke physics: slows down, rises, and spreads
            this.speedX *= 0.95; // High friction/drag in air
            this.speedY -= 0.03; // Buoyancy
            
            // Add turbulence
            this.speedX += Math.sin(Date.now() * 0.002 + this.y) * 0.05;

            // Volumetric expansion
            if (this.size < this.maxSize) {
                this.size += 1.2;
            }
            
            this.opacity -= this.fadeRate;
        }

        draw(ctx) {
            if (this.opacity <= 0) return;
            
            // Volumetric rendering
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            
            // Core is dense, edges are highly feathered
            gradient.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
            gradient.addColorStop(0.3, `rgba(${this.color}, ${this.opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(${this.color}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class SmokeCursor {
        constructor() {
            this.canvas = document.getElementById('smoke-canvas');
            if(!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.cursor = document.getElementById('cursor');
            this.particles = [];
            
            this.targetX = window.innerWidth / 2;
            this.targetY = window.innerHeight / 2;
            this.currentX = this.targetX;
            this.currentY = this.targetY;
            
            this.prevX = this.targetX;
            this.prevY = this.targetY;
            this.cursorVelocityX = 0;
            this.cursorVelocityY = 0;

            this.isHovering = false;
            
            this.lerpFactor = 0.15;
            this.density = 4; // High density + small particles = smooth flow 

            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            window.addEventListener('mousemove', (e) => {
                this.prevX = this.targetX;
                this.prevY = this.targetY;
                this.targetX = e.clientX;
                this.targetY = e.clientY;
                
                // Calculate cursor momentum
                this.cursorVelocityX = this.targetX - this.prevX;
                this.cursorVelocityY = this.targetY - this.prevY;
                
                // Spawn smooth smoke trail ONLY when moving
                const spawnCount = this.isHovering ? this.density * 2 : this.density;
                let toSpawn = 0;
                
                // Only spawn if mouse is actually moving
                if (Math.abs(this.cursorVelocityX) + Math.abs(this.cursorVelocityY) > 1) {
                    toSpawn = spawnCount;
                }
                
                for(let i = 0; i < toSpawn; i++) {
                    this.particles.push(new Particle(this.targetX, this.targetY, this.isHovering, this.cursorVelocityX, this.cursorVelocityY));
                }
            });

            const hoverTargets = 'a, button, .hover-link, .magnetic, .cursor-pointer, .hobby-item';
            document.addEventListener('mouseover', (e) => {
                if (e.target.closest(hoverTargets)) {
                    this.isHovering = true;
                    if(this.cursor) this.cursor.classList.add('link-hover');
                }
            });

            document.addEventListener('mouseout', (e) => {
                if (e.target.closest(hoverTargets)) {
                    this.isHovering = false;
                    if(this.cursor) this.cursor.classList.remove('link-hover');
                }
            });

            this.animate();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        animate() {
            this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
            this.currentY += (this.targetY - this.currentY) * this.lerpFactor;

            if(this.cursor) {
                this.cursor.style.left = `${this.currentX}px`;
                this.cursor.style.top = `${this.currentY}px`;
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // 'source-over' creates realistic occlusion for thick smoke instead of glowing overlap
            this.ctx.globalCompositeOperation = 'source-over'; 
            
            // Idle smoke generation removed per user request
            
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].update();
                this.particles[i].draw(this.ctx);
                
                if (this.particles[i].opacity <= 0 || this.particles[i].size > 200) {
                    this.particles.splice(i, 1);
                    i--;
                }
            }
            
            requestAnimationFrame(() => this.animate());
        }
    }

    // Initialize the professional smoke cursor
    new SmokeCursor();


    // ----------------------------------------------------------------
    // 3. Magnetic Buttons Logic
    // ----------------------------------------------------------------
    const magneticElements = document.querySelectorAll('.magnetic');

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            // Calculate mouse position relative to center of element
            const x = (e.clientX - rect.left - rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2);

            // Move button towards cursor slightly
            gsap.to(el, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.6,
                ease: "power3.out"
            });
        });

        // Reset on leave
        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });


    // ----------------------------------------------------------------
    // 4. Hero Section Video ScrollTrigger (Performance Fix)
    // ----------------------------------------------------------------
    const video = document.getElementById("hero-video");
    if (video) {
        // Wait for metadata to ensure we know the video duration before scrubbing
        video.addEventListener('loadedmetadata', () => {
            gsap.to(video, {
                currentTime: video.duration || 5, // fallback if duration missing
                ease: "none",
                scrollTrigger: {
                    trigger: "#hero",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.5 // Buttery smooth interpolation
                }
            });
        });
        
        // Force load for mobile
        video.load();
    }

    // ----------------------------------------------------------------
    // 4.5 Hero Typewriter Scroll Effect
    // ----------------------------------------------------------------
    const typewriterLines = document.querySelectorAll(".typewriter-line");
    if (typewriterLines.length > 0) {
        // Clear text before animating
        typewriterLines.forEach(line => {
            line.dataset.originalText = line.getAttribute("data-text");
            line.innerText = "";
            gsap.set(line, { opacity: 1 }); // Ensure visibility for typewriter effect
        });

        // Create sequential timeline tied to scroll
        const typeTl = gsap.timeline({
            scrollTrigger: {
                trigger: "#hero",
                start: "top top",
                // Finish the typewriter effect well before the hero scrolls away (300vh parent, 100vh child = 200vh of stick)
                // We'll set it to finish after ~150% of the viewport height to ensure it's done before the 200% limit.
                end: () => `+=${window.innerHeight * 1.5}`,
                scrub: 1.5, // Keep the smooth 'magnetic' scrub
                invalidateOnRefresh: true
            }
        });

        typewriterLines.forEach(line => {
            const content = line.dataset.originalText;
            typeTl.to(line, {
                text: { value: content },
                duration: content.length * 0.05,
                ease: "none"
            });
        });

        // NEW: Fade out Hero UI (Button & Scroll Indicator) as we enter About section
        if (document.querySelector("#hero .absolute.bottom-10")) {
            gsap.to(["#hero .absolute.bottom-10", "#hero .scroll-indicator"], {
                opacity: 0,
                pointerEvents: "none",
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 80%",
                    end: "top 20%",
                    scrub: true
                }
            });
        }
    }

    // ----------------------------------------------------------------
    // 4.6 About Section (Luxury Smooth Transition)
    // ----------------------------------------------------------------
    
    // Custom GSAP SplitText alternative
    function splitTextToChars(selector) {
        const el = document.querySelector(selector);
        if (!el) return [];
        const text = el.innerText;
        el.innerHTML = '';
        const chars = [];
        text.split('').forEach(char => {
            if (char === ' ') {
                el.appendChild(document.createTextNode(' '));
            } else {
                const span = document.createElement('span');
                span.style.display = 'inline-block';
                span.innerText = char;
                el.appendChild(span);
                chars.push(span);
            }
        });
        return chars;
    }

    const headingChars = splitTextToChars(".luxury-heading");
    ScrollTrigger.refresh(); // Final Polish to prevent layout shifting

    const luxuryTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#about",
            start: "top 80%", 
            end: "center center",    
            scrub: 1.5,
            invalidateOnRefresh: true
        }
    });

    // 1. Text Split Reveal (using fromTo for absolute visibility insurance)
    if (headingChars.length > 0) {
        luxuryTl.fromTo(headingChars, 
            { y: 50, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                stagger: 0.02,
                ease: "power4.out",
                duration: 1
            }, 0);
    }

    // 2. Content 'Unfolding' Effect
    luxuryTl.fromTo(".bio-fade", 
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "none" }, 
        0.2
    );

    luxuryTl.fromTo(".bio-unfold", 
        { yPercent: 100, skewY: 5, opacity: 0 },
        { yPercent: 0, skewY: 0, opacity: 1, duration: 0.8, ease: "power4.out" },
        0.4
    );

    // 3. Magnetic Grid Interaction (Smooth-Follow Parallax)
    const luxuryBentoItems = gsap.utils.toArray('.bento-item');
    luxuryBentoItems.forEach((item, index) => {
        // Varying speeds/distances for parallax depth
        const yOffset = index % 2 === 0 ? 150 : 250; 
        luxuryTl.fromTo(item, 
            { y: yOffset, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 1.5, 
                ease: "power2.out" 
            }, 
            0.2 + (index * 0.1)
        );
    });

    // 2. Magnetic 3D Tilt Effect on Hover
    const bentoItems = document.querySelectorAll('.bento-item');
    bentoItems.forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            // Calculate mouse position strictly bounded -1 to 1 relative to center
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

            // Subtle 3D rotation based on mouse pos
            gsap.to(item, {
                rotationY: x * 5, // max 5 deg tilt
                rotationX: -y * 5,
                transformPerspective: 1000,
                duration: 0.6,
                ease: "power2.out"
            });
        });

        item.addEventListener('mouseleave', () => {
            gsap.to(item, {
                rotationY: 0,
                rotationX: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 3. Hover to play video mechanic
    const hoverVideos = document.querySelectorAll('.hover-video');
    hoverVideos.forEach(container => {
        const video = container.querySelector('video');
        if (video) {
            container.addEventListener('mouseenter', () => {
                video.play().catch(e => console.log("Video autoplay prevented safely:", e));
            });
            container.addEventListener('mouseleave', () => {
                video.pause();
                // Optionally reset to start: video.currentTime = 0;
            });
        }
    });

    // (Skills Section animations handled in the global interactions block below)


    // (Education heading animations handled in the global interactions block below)

    // Animate the center line drawing down with a smoother scrub
    const timelineProgress = document.getElementById("timeline-progress");
    if (timelineProgress) {
        gsap.to(timelineProgress, {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
                trigger: "#education",
                start: "top 40%", 
                end: "bottom 90%", 
                scrub: 1.5 
            }
        });
    }

    // Milestone Reveals synced to scroll - High performance 3D unfolding
    const timelineItems = document.querySelectorAll(".timeline-item");
    timelineItems.forEach((item, index) => {
        const icon = item.querySelector('.milestone-icon');
        const card = item.querySelector('.milestone-card');
        const year = item.querySelector('.year-badge');
        const isLeft = index % 2 === 0;

        // Content pieces for staggered reveal
        const cardContent = card.querySelectorAll('span, h4, p, .skill-tag');

        // Determine starting X and 3D rotation based on side
        const startX = window.innerWidth > 768 ? (isLeft ? 80 : -80) : 40; 
        const startRotationY = isLeft ? -15 : 15; 
        const startRotationX = 10;

        // Create a scrubbed timeline for the card and its contents for ultimate smoothness
        const scrubTl = gsap.timeline({
            scrollTrigger: {
                trigger: item,
                start: "top 95%", 
                end: "center 60%", // Animation finishes when item reaches here
                scrub: 1 // 1 second lag for smooth buttery feel
            }
        });

        scrubTl.fromTo(year, 
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, ease: "none" }
        )
        .fromTo(card,
            { 
                x: startX, 
                opacity: 0, 
                rotateY: startRotationY,
                rotateX: startRotationX,
                transformPerspective: 1500,
                skewY: isLeft ? 2 : -2 
            },
            { 
                x: 0, 
                opacity: 1, 
                rotateY: 0,
                rotateX: 0,
                skewY: 0,
                ease: "power1.out" // Gentle ease even during scrub
            },
            "<" // Start at same time as year
        )
        .fromTo(cardContent,
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.05, ease: "none" },
            "-=0.2" // Slight overlap
        );

        // Icon animation can stay as a trigger for a nice "pop" effect
        gsap.to(icon, { 
            scale: 1, 
            rotate: 0, 
            duration: 0.8, 
            ease: "back.out(1.5)",
            scrollTrigger: {
                trigger: item,
                start: "center 90%",
                toggleActions: "play none none reverse"
            }
        });

        // Parallax effect that ties year badge to card focus
        if (year) {
            gsap.to(year, {
                y: -60,
                x: isLeft ? 20 : -20,
                ease: "none",
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        }
    });

    // ----------------------------------------------------------------
    // 5. Projects Horizontal Scroll
    // ----------------------------------------------------------------
    
    // Global Navigation Function to save scroll state
    window.navigateWithScrollSave = function(url) {
        sessionStorage.setItem('savedScrollPosition', window.scrollY);
        // Open the project in a new tab
        window.open(url, '_blank');
    };

    const projectsContainer = document.getElementById("projects-container");

    // Pin the #work section and translate the container horizontally
    gsap.to(projectsContainer, {
        x: () => {
            // Full scroll width of container minus the viewport width 
            // Plus some padding offset
            const scrollDistance = projectsContainer.scrollWidth - window.innerWidth + 100;
            return -scrollDistance;
        },
        ease: "none",
        scrollTrigger: {
            trigger: "#work",
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // Smooth scrub
            invalidateOnRefresh: true, // Recalculate on resize
        }
    });

    // 3. MatchMedia Integration: Wrap Desktop-Only or Responsive Animations
    mm.add("(min-width: 768px)", () => {
        
        // 5. Projects Horizontal Scroll (Only happens on Desktop/Tablet landscape)
        // Re-using the outer scope projectsContainer variable to avoid SyntaxError redeclaration
        const projectsContainerDesktop = document.getElementById("projects-container");

        // Pin the #work section and translate the container horizontally
        gsap.to(projectsContainer, {
            x: () => {
                // Full scroll width of container minus the viewport width 
                // Plus some padding offset
                const scrollDistance = projectsContainer.scrollWidth - window.innerWidth + 100;
                return -scrollDistance;
            },
            ease: "none",
            scrollTrigger: {
                trigger: "#work",
                start: "top top",
                end: "bottom bottom",
                scrub: 1, // Smooth scrub
                invalidateOnRefresh: true, // Recalculate on resize
            }
        });

        const projectCards = document.querySelectorAll("#work .glass-card");
        projectCards.forEach((card, i) => {
            gsap.from(card, {
                y: 100,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "#work",
                    start: "top center",
                    toggleActions: "play none none reverse"
                },
                delay: i * 0.2
            });
        });
        
        // Cleanup function for this breakpoint if needed
        return () => { 
            // GSAP kills these triggers automatically when crossing breakpoint
        };
    }); // End of Desktop MatchMedia

    // ----------------------------------------------------------------
    // 6. Philosophy & Methodology Animations
    // ----------------------------------------------------------------

    // Kinetic Typography for Philosophy Statement
    const kineticEl = document.getElementById('kinetic-text');
    if (kineticEl) {
        // Simple manual split text into words wrapped in spans for staggering
        const text = kineticEl.innerText;
        kineticEl.innerHTML = '';
        const words = text.split(' ');
        words.forEach(word => {
            const span = document.createElement('span');
            span.className = "inline-block mr-[0.25em] opacity-0 translate-y-8";
            span.innerText = word;
            kineticEl.appendChild(span);
        });

        const wordSpans = kineticEl.querySelectorAll('span');

        gsap.to(wordSpans, {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: "power4.out",
            scrollTrigger: {
                trigger: "#philosophy",
                start: "top 60%",
                toggleActions: "play none none reverse"
            }
        });
    }

    // Methodology Grid Reveal
    gsap.from(".stagger-phil", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#philosophy",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

    // ----------------------------------------------------------------
    // 7. Cinematic Footer Animations & Interactions
    // ----------------------------------------------------------------
    // (Animations now handled within the footer component in index.html for modular performance)

    // Magnetic "Download CV" Button using quickTo
    const magneticCV = document.getElementById('magnetic-cv');
    if (magneticCV) {
        const xTo = gsap.quickTo(magneticCV, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(magneticCV, "y", { duration: 0.6, ease: "power3.out" });

        magneticCV.addEventListener('mousemove', (e) => {
            const rect = magneticCV.getBoundingClientRect();
            const relX = (e.clientX - rect.left - rect.width / 2) * 0.4;
            const relY = (e.clientY - rect.top - rect.height / 2) * 0.4;

            xTo(relX);
            yTo(relY);
        });

        magneticCV.addEventListener('mouseleave', () => {
            // Elastic snap back to origin
            gsap.to(magneticCV, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)",
                overwrite: "auto"
            });
        });
    }

    // Staggered Social Links Reveal
    gsap.from(".stagger-social", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#contact",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });

    // Avatar Reveal in Footer
    const finaleAvatar = document.getElementById('finale-avatar');
    if (finaleAvatar) {
        gsap.to(finaleAvatar, {
            y: 0,
            opacity: 1,
            duration: 1.5,
            ease: "back.out(1.2)",
            scrollTrigger: {
                trigger: "#contact",
                start: "top 60%", // Triggers when user hits the bottom 10-20%
                toggleActions: "play none none reverse"
            }
        });
    }

    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Optional: Pulse animation on hover
        backToTopBtn.addEventListener('mouseenter', () => {
            gsap.to(backToTopBtn, { scale: 1.1, duration: 0.3, ease: "back.out(2)" });
        });
        backToTopBtn.addEventListener('mouseleave', () => {
            gsap.to(backToTopBtn, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
    }

    // Email Copy Micro-interaction (retained from previous footer logic)
    const emailLink = document.getElementById('email-copy-link');
    const emailText = document.getElementById('email-text');

    if (emailLink && emailText) {
        emailLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText("atulxalxo07@gmail.com").catch(err => console.log('Copy failed', err));
            gsap.killTweensOf(emailText);

            const tl = gsap.timeline();
            tl.to(emailText, { y: -20, opacity: 0, duration: 0.2, ease: "power2.in" })
                .call(() => emailText.innerText = "Copied!")
                .to(emailText, { y: 0, opacity: 1, duration: 0.4, ease: "bounce.out" })
                .to(emailText, { y: -20, opacity: 0, duration: 0.2, ease: "power2.in", delay: 1.5 })
                .call(() => emailText.innerText = "Email")
                .to(emailText, { y: 0, opacity: 1, duration: 0.4, ease: "bounce.out" });
        });
    }

    // ----------------------------------------------------------------
    // 7. Avatar Creation Modal Logic
    // ----------------------------------------------------------------
    const modalBtn = document.getElementById('how-created-btn');
    const avatarModal = document.getElementById('avatar-modal');
    
    if (modalBtn && avatarModal) {
        const closeBtn = avatarModal.querySelector('.close-modal');
        const modalBackdrop = avatarModal.querySelector('.modal-backdrop');
        const processCards = avatarModal.querySelectorAll('.process-card');
        const modalHeader = avatarModal.querySelector('.modal-header');

        // Setup Smooth Opening Timeline
        const modalTl = gsap.timeline({ paused: true });
        
        modalTl.to(avatarModal, { opacity: 1, pointerEvents: "auto", duration: 0.1 })
               .fromTo(modalBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 }, "<")
               .fromTo(modalHeader, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
               .fromTo(processCards, 
                   { y: 50, opacity: 0 }, 
                   { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }, 
               "-=0.3");

        // Open Handler
        modalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalTl.play();
        });

        // Close Handlers
        const closeModalFn = () => modalTl.reverse();
        closeBtn.addEventListener('click', closeModalFn);
        modalBackdrop.addEventListener('click', closeModalFn);
    }



    // 1 & 2. The Resize Listener & GSAP Global Refresh
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        // Use a 'Debounce' timer of 200ms
        resizeTimer = setTimeout(() => {
            // Force GSAP to dump cached positions and remeasure
            ScrollTrigger.refresh(true);
        }, 200);
    });


    // ----------------------------------------------------------------
    // 9. Hobbies & Passions logic (GSAP Enhanced)
    // ----------------------------------------------------------------
    const hobbyData = {
        photography: {
            title: "Capturing Moments",
            description: "Freezing time through the lens. My photography is about finding the extraordinary in the ordinary, chasing light and composition to tell a story without words.",
            focus: "01",
            color: "#007AFF"
        },
        coding: {
            title: "Architecting Logic",
            description: "Building digital worlds with precision. Coding is my craft, where I transform complex problems into elegant, scalable solutions that power the modern web.",
            focus: "02",
            color: "#60A5FA",
            snippet: `// architecting the future
const system = new Vision();
system.evolve();`
        },
        travel: {
            title: "Global Inspiration",
            description: "Exploring diverse landscapes and cultures to fuel my creativity. Every journey is a new lesson in perspective, shape, and human interaction.",
            focus: "03",
            color: "#F59E0B"
        },
        music: {
            title: "Sonic Storytelling",
            description: "Crafting emotions through sound. Music production is my outlet for rhythm and harmony, where I blend technical precision with artistic intuition.",
            focus: "04",
            color: "#EC4899"
        },
        videoediting: {
            title: "Visual Narrative",
            description: "Weaving raw footage into compelling stories. I meticulously cut, pace, and color-grade videos to create cinematic experiences that captivate and engage.",
            focus: "05",
            color: "#D946EF"
        },
        graphicdesigning: {
            title: "Digital Artistry",
            description: "Designing striking visual identities and marketing assets. I blend typography, color theory, and layout strategies to create designs that leave a lasting impact.",
            focus: "06",
            color: "#00E5FF"
        },
        cooking: {
            title: "Culinary Creations",
            description: "Experimenting with flavors and techniques in the kitchen. Cooking is my sensory playground where precision meets spontaneous creativity.",
            focus: "07",
            color: "#10B981"
        },
        football: {
            title: "Strategic Momentum",
            description: "Commanding the pitch with teamwork and agility. Playing football hones my strategic thinking, discipline, and competitive spirit.",
            focus: "08",
            color: "#22C55E"
        }
    };

    const hobbyItems = document.querySelectorAll('.hobby-item');
    const hobbyTitle = document.getElementById('hobby-title');
    const hobbyDescription = document.getElementById('hobby-description');
    const focusNumber = document.getElementById('card-content') ? document.getElementById('card-content').querySelector('p') : null;
    const hobbyVisual = document.getElementById('hobby-visual');
    const hobbySnippet = document.getElementById('hobby-snippet');
    const cardContent = document.getElementById('card-content');

    function updateHobbyCard(id) {
        const data = hobbyData[id];
        if (!data || !cardContent) return;

        // Simple, fast GSAP fade
        gsap.to(cardContent, {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
                if (hobbyTitle) hobbyTitle.textContent = data.title;
                if (hobbyDescription) hobbyDescription.textContent = data.description;
                if (focusNumber) focusNumber.textContent = `Focus / ${data.focus}`;
                
                if (hobbyVisual) {
                    gsap.set(hobbyVisual, { color: data.color });
                }

                if (hobbySnippet) {
                    if (data.snippet) {
                        hobbySnippet.textContent = data.snippet;
                        hobbySnippet.classList.remove('hidden');
                    } else {
                        hobbySnippet.classList.add('hidden');
                    }
                }

                gsap.to(cardContent, {
                    opacity: 1,
                    duration: 0.25
                });
            }
        });
    }

    // 3D Tilt Effect for Description Card (using quickTo for performance)
    const descriptionCard = document.getElementById('description-card'); // Moved declaration here
    if (descriptionCard) {
        const xTo = gsap.quickTo(descriptionCard, "rotationY", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(descriptionCard, "rotationX", { duration: 0.4, ease: "power3.out" });

        descriptionCard.addEventListener("mousemove", (e) => {
            const rect = descriptionCard.getBoundingClientRect();
            const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

            xTo(relX * 8); // max 8 deg
            yTo(-relY * 8);
        });

        descriptionCard.addEventListener("mouseleave", () => {
            xTo(0);
            yTo(0);
        });
    }

    if (hobbyItems.length > 0) {
        hobbyItems.forEach((item) => {
            const handleUpdate = () => {
                if (item.classList.contains('active')) return;
                
                const id = item.dataset.hobby;
                hobbyItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                updateHobbyCard(id);
            };

            item.addEventListener('mouseenter', handleUpdate);
            item.addEventListener('click', handleUpdate);
        });
    }

    // Explicitly set initial state
    if (hobbyItems.length > 0) {
        const firstItem = hobbyItems[0];
        firstItem.classList.add('active');
        const firstId = firstItem.dataset.hobby;
        if (hobbyData[firstId]) {
            const data = hobbyData[firstId];
            if (hobbyTitle) hobbyTitle.textContent = data.title;
            if (hobbyDescription) hobbyDescription.textContent = data.description;
            if (focusNumber) focusNumber.textContent = `Focus / ${data.focus}`;
            if (hobbyVisual) gsap.set(hobbyVisual, { color: data.color });
        }
    }

    // (Entrance animations for card/items were removed to ensure maximum visibility and reliability)

    // Interaction for the 'Let's Talk' button in hobbies section
    const talkBtn = document.querySelector("#hobbies-portfolio .flex.items-center.gap-6.group.cursor-pointer");
    if (talkBtn) {
        talkBtn.addEventListener("mouseenter", () => {
            gsap.to(talkBtn.querySelector(".w-20.h-20"), {
                scale: 1.1,
                backgroundColor: "var(--amber)",
                color: "white",
                duration: 0.4,
                ease: "power2.out"
            });
        });
        talkBtn.addEventListener("mouseleave", () => {
            gsap.to(talkBtn.querySelector(".w-20.h-20"), {
                scale: 1,
                backgroundColor: "transparent",
                color: "var(--amber)",
                duration: 0.4,
                ease: "power2.out"
            });
        });
        talkBtn.addEventListener("click", () => {
            const contactSection = document.getElementById("contact");
            if (contactSection) {
                window.scrollTo({ top: contactSection.offsetTop, behavior: "smooth" });
            }
        });
    }

    // ----------------------------------------------------------------
    // 4.10 3D Trading Card Marquee Gallery Logic
    // ----------------------------------------------------------------
    function renderTradingCards() {
        const cardData = [
            { name: "ATUL", level: 99, blurb: "Systems Architect & Visual Engineer.", type: "CREATIVITY", accent: "#FFB347" },
            { name: "DESIGN HIGH", level: 95, blurb: "Abstract digital expressionism.", type: "STYLE", accent: "#007AFF" },
            { name: "FRACTURED REALM", level: 92, blurb: "A study in high-fidelity digital decay.", type: "CONCEPT", accent: "#FFB347" },
            { name: "GOLDEN HOUR", level: 98, blurb: "Cinematic lighting & ethereal aesthetics.", type: "AMBIANCE", accent: "#FFB347" },
            { name: "KINETIC TYPE", level: 94, blurb: "Fluid motion meets structured data.", type: "MOTION", accent: "#007AFF" },
            { name: "VISUAL SYSTEMS", level: 97, blurb: "Engineering the future of web design.", type: "VISUAL", accent: "#FFB347" }
        ];

        const topRow = document.querySelector('.marquee-row-top');
        const bottomRow = document.querySelector('.marquee-row-bottom');

        if (!topRow || !bottomRow) return;

        function createCard(data) {
            return `
                <div class="trading-card glass-card relative group">
                    <div class="card-inner p-6 h-full flex flex-col justify-between">
                        <div class="card-header border-b border-white/10 pb-4 mb-4">
                            <span class="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-1 block">ARTIST NAME:</span>
                            <h4 class="text-xl font-black text-white tracking-tighter">${data.name}</h4>
                        </div>
                        <div class="card-body mb-6">
                            <p class="text-xs text-white/50 leading-relaxed font-light">${data.blurb}</p>
                        </div>
                        <div class="card-footer border-t border-white/10 pt-4 flex justify-between items-center">
                            <div>
                                <span class="text-[9px] uppercase tracking-widest opacity-40 block">${data.type} LEVEL</span>
                                <span class="text-sm font-bold text-accent">${data.level} ⚡</span>
                            </div>
                            <div class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                <svg class="w-4 h-4 text-white/20" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Populate and significantly quadruple (for seamless loop with enough width)
        const itemsToRender = [...cardData, ...cardData, ...cardData, ...cardData, ...cardData];
        topRow.innerHTML = itemsToRender.map(data => createCard(data)).join('');
        bottomRow.innerHTML = itemsToRender.map(data => createCard(data)).join('');
    }

    // ----------------------------------------------------------------
    // 5.0 Premium UI/UX Interactions (Spline / Apple / Webflow Style)
    // ----------------------------------------------------------------

    // 5.1 3D Tilt Effect for All Glass Cards
    const tiltCards = document.querySelectorAll('.glass-card, .skill-card, .bento-item, .hobby-item');
    tiltCards.forEach(card => {
        // Only apply if the card isn't explicitly participating in the 3D marquee
        if(card.classList.contains('trading-card')) return;
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit rotation to a subtle, premium 6 degrees
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;
            
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        });
    });

    // 5.2 Magnetic Attraction for Buttons
    // Re-using the earlier declared magneticElements variable or defining a new local one
    const premiumMagneticElements = document.querySelectorAll('.magnetic, button');
    premiumMagneticElements.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            
            // Subtly pull button toward cursor
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
        });
    });

    // 5.3 Global Fade-in & Slide-up Scroll Animations for Content
    // Safely target text and paragraphs that don't already have complex custom timelines
    const fadeElements = gsap.utils.toArray('section h2, section h3, section p');
    fadeElements.forEach(el => {
        // Skip elements already involved in tight scrub timelines
        if(el.classList.contains('bio-fade') || el.classList.contains('typewriter-line')) return;
        
        gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // 5.4 Staggered Skill Cards (Slide & Reveal)
    gsap.from(".skill-card", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power4.out",
        scrollTrigger: {
            trigger: "#skills",
            start: "top 75%",
            toggleActions: "play none none reverse"
        }
    });

    // Initialize the trading cards marquee
    renderTradingCards();

    // 5.5 Scroll Progress Bar Logic
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progressEl = document.getElementById("scroll-progress");
        if (progressEl) progressEl.style.width = scrolled + "%";
    });

    // Call ScrollTrigger refresh to recalculate new positions
    ScrollTrigger.refresh();
});
