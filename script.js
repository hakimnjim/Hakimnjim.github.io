document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const featuredContainer = document.getElementById('featured-container');
    const allProjectsContainer = document.getElementById('all-projects-container');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    // State
    let projects = [];

    // Initialize
    init();

    async function init() {
        try {
            await fetchProjects();
            renderProjects();
            setupEventListeners();
            setupScrollAnimations();
            logClickStats();
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    // Fetch Projects Data
    async function fetchProjects() {
        const response = await fetch('projects.json');
        projects = await response.json();
    }

    // Render Projects to DOM
    function renderProjects(filter = 'all') {
        if (!featuredContainer || !allProjectsContainer) return;

        // Clear only if rendering everything or specific filter
        if (filter === 'all') {
            featuredContainer.innerHTML = '';
        }
        allProjectsContainer.innerHTML = '';

        // Get click stats for sorting/featured logic
        const clickStats = getClickStats();

        // Only render featured if filter is 'all'
        if (filter === 'all') {
            const featuredProjects = projects
                .filter(p => p.featured)
                .sort((a, b) => (clickStats[b.id] || 0) - (clickStats[a.id] || 0))
                .slice(0, 2);

            featuredProjects.forEach(project => {
                const projectCard = createProjectCard(project, true);
                featuredContainer.appendChild(projectCard);
            });
        }

        // All Projects (Filtered)
        const filteredProjects = filter === 'all' 
            ? projects 
            : projects.filter(p => p.type === filter);

        filteredProjects.forEach(project => {
            const projectCard = createProjectCard(project, false);
            allProjectsContainer.appendChild(projectCard);
        });

        // Re-setup scroll animations for new elements
        setupScrollAnimations();
    }

    /**
     * Create Project Card Element
     * @param {Object} project - Project data
     * @param {Boolean} isFeatured - Whether this is a featured card
     */
    function createProjectCard(project, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `project-card reveal ${isFeatured ? 'featured-card' : ''}`;
        card.dataset.id = project.id;
        card.dataset.type = project.type;
        
        const mediaItems = project.media || [];
        const firstMedia = mediaItems[0] || { type: 'image', src: 'placeholder.jpg' };
        
        // Generate platform links
        let linksHTML = '';
        if (project.links) {
            if (project.links.steam && project.links.steam !== '#') {
                linksHTML += `<a href="${project.links.steam}" class="project-link" aria-label="Steam" target="_blank"><i class="fab fa-steam"></i></a>`;
            }
            if (project.links.playstore && project.links.playstore !== '#') {
                linksHTML += `<a href="${project.links.playstore}" class="project-link" aria-label="Play Store" target="_blank"><i class="fab fa-google-play"></i></a>`;
            }
            if (project.links.download && project.links.download !== '#') {
                linksHTML += `<a href="${project.links.download}" class="project-link" aria-label="Download" target="_blank"><i class="fas fa-download"></i></a>`;
            }
        }

        // Generate Thumbnails HTML
        const thumbnailsHTML = mediaItems.map((item, index) => `
            <div class="thumb ${index === 0 ? 'active' : ''}" data-index="${index}" data-type="${item.type}" data-src="${item.src}">
                <img src="${item.thumbnail || item.src}" alt="Thumbnail ${index + 1}">
                ${item.type === 'video' ? '<i class="fas fa-play thumb-play-icon"></i>' : ''}
            </div>
        `).join('');

        // Initial Main Display content
        let mainDisplayHTML = '';
        if (firstMedia.type === 'video') {
            mainDisplayHTML = `<video src="${firstMedia.src}" autoplay muted loop playsinline class="main-media-content"></video>`;
        } else {
            mainDisplayHTML = `<img src="${firstMedia.src}" alt="${project.title}" class="main-media-content">`;
        }

        card.innerHTML = `
            <div class="project-viewer">
                <div class="main-display">
                    ${mainDisplayHTML}
                    ${isFeatured ? '<div class="featured-badge">Featured Project</div>' : ''}
                </div>
                <div class="media-strip">
                    ${thumbnailsHTML}
                </div>
            </div>
            <div class="project-content">
                <div class="type-badge type-${project.type}">${project.type}</div>
                <h3 class="project-title">${project.title}</h3>
                <span class="project-role">${project.role}</span>
                <p class="project-desc">${project.description}</p>
                
                <div class="project-info">
                    <p class="learned"><strong>Developer Insights</strong> ${project.learned}</p>
                </div>

                <div class="project-tags">
                    ${project.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                </div>
                
                <div class="project-links">
                    ${linksHTML}
                    <button class="btn-track-view" onclick="event.stopPropagation()">View Details</button>
                </div>
            </div>
        `;

        // Media Switching Logic
        const thumbs = card.querySelectorAll('.thumb');
        const display = card.querySelector('.main-display');

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (thumb.classList.contains('active')) return;

                // Update active state
                thumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');

                const type = thumb.dataset.type;
                const src = thumb.dataset.src;

                // Smooth fade transition
                const currentMedia = display.querySelector('.main-media-content');
                currentMedia.style.opacity = '0';
                currentMedia.style.transform = 'scale(0.95)';

                setTimeout(() => {
                    display.innerHTML = type === 'video' 
                        ? `<video src="${src}" autoplay muted loop playsinline class="main-media-content" style="opacity:0; transform:scale(0.95)"></video>`
                        : `<img src="${src}" alt="Project media" class="main-media-content" style="opacity:0; transform:scale(0.95)">`;
                    
                    if (isFeatured) {
                        display.innerHTML += '<div class="featured-badge">Featured Project</div>';
                    }

                    const newMedia = display.querySelector('.main-media-content');
                    // Force reflow
                    newMedia.offsetHeight;
                    newMedia.style.opacity = '1';
                    newMedia.style.transform = 'scale(1)';
                }, 300);
            });
        });

        // Click Tracking System
        card.addEventListener('click', (e) => {
            if (e.target.closest('.thumb') || e.target.closest('.project-link') || e.target.closest('.btn-track-view')) return;
            trackProjectClick(project.id, project.title);
            
            const pulse = document.createElement('div');
            pulse.className = 'click-pulse';
            pulse.style.left = `${e.clientX - card.getBoundingClientRect().left}px`;
            pulse.style.top = `${e.clientY - card.getBoundingClientRect().top}px`;
            card.appendChild(pulse);
            
            setTimeout(() => pulse.remove(), 600);
        });

        return card;
    }

    // Interactive Background (Mouse Move)
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        document.body.style.setProperty('--mouse-x', `${x}%`);
        document.body.style.setProperty('--mouse-y', `${y}%`);
    });

    // Click Tracking Logic
    function trackProjectClick(projectId, projectTitle) {
        const stats = getClickStats();
        stats[projectId] = (stats[projectId] || 0) + 1;
        localStorage.setItem('game_dev_portfolio_clicks', JSON.stringify(stats));
        
        console.log(`%c 🎮 Project Clicked: ${projectTitle} | Total Views: ${stats[projectId]}`, 'color: #22d3ee; font-weight: bold;');
    }

    function getClickStats() {
        return JSON.parse(localStorage.getItem('game_dev_portfolio_clicks') || '{}');
    }

    function logClickStats() {
        const stats = getClickStats();
        if (Object.keys(stats).length > 0) {
            console.log('%c 📊 Current Interaction Stats:', 'color: #a855f7; font-weight: bold;', stats);
        }
    }

    // Event Listeners
    function setupEventListeners() {
        // Filter System
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add to current
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                
                // Add fade-out effect to container before re-rendering
                allProjectsContainer.style.opacity = '0';
                allProjectsContainer.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    renderProjects(filter);
                    allProjectsContainer.style.opacity = '1';
                    allProjectsContainer.style.transform = 'translateY(0)';
                }, 300);
            });
        });

        // Mobile Menu Toggle
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                });
            });
        }

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.padding = '1rem 0';
                navbar.style.background = 'rgba(15, 23, 42, 0.95)';
                navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            } else {
                navbar.style.padding = '1.5rem 0';
                navbar.style.background = 'rgba(15, 23, 42, 0.8)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Scroll Animations (Intersection Observer)
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Add a slight stagger effect for multiple elements entering at once
                    if (entry.target.classList.contains('projects-grid')) {
                        const cards = entry.target.querySelectorAll('.project-card');
                        cards.forEach((card, index) => {
                            setTimeout(() => card.classList.add('active'), index * 100);
                        });
                    }
                }
            });
        }, observerOptions);

        // Targeted reveal types
        document.querySelectorAll('section').forEach(el => {
            el.classList.add('reveal', 'reveal-up');
            observer.observe(el);
        });

        document.querySelectorAll('.skill-item, .contact-card, .stat-item').forEach((el, index) => {
            el.classList.add('reveal', 'reveal-up');
            el.style.transitionDelay = `${(index % 3) * 0.1}s`;
            observer.observe(el);
        });
        
        // Special reveal for grids
        document.querySelectorAll('.projects-grid').forEach(el => {
            observer.observe(el);
        });
    }
});
