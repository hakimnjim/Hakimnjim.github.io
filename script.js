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
    function renderProjects() {
        if (!featuredContainer || !allProjectsContainer) return;

        featuredContainer.innerHTML = '';
        allProjectsContainer.innerHTML = '';

        // Get click stats for sorting/featured logic
        const clickStats = getClickStats();

        // Featured Projects Logic: 
        // 1. Projects marked "featured: true" in JSON
        // 2. OR top most clicked projects if none are marked
        const featuredProjects = projects
            .filter(p => p.featured)
            .sort((a, b) => (clickStats[b.id] || 0) - (clickStats[a.id] || 0))
            .slice(0, 2);

        featuredProjects.forEach(project => {
            const projectCard = createProjectCard(project, true);
            featuredContainer.appendChild(projectCard);
        });

        // All Projects
        projects.forEach(project => {
            const projectCard = createProjectCard(project, false);
            allProjectsContainer.appendChild(projectCard);
        });
    }

    /**
     * Create Project Card Element
     * @param {Object} project - Project data
     * @param {Boolean} isFeatured - Whether this is a featured card (uses larger design)
     */
    function createProjectCard(project, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `project-card reveal ${isFeatured ? 'featured-card' : ''}`;
        card.dataset.id = project.id;
        
        const thumbnail = project.images && project.images.length > 0 ? project.images[0] : 'placeholder.jpg';
        
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

        card.innerHTML = `
            <div class="project-image">
                <img src="${thumbnail}" alt="${project.title}" loading="lazy">
                ${isFeatured ? '<div class="featured-badge">Featured Project</div>' : ''}
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description}</p>
                
                <div class="project-info">
                    <p class="learned"><strong>Key Learning:</strong> ${project.learned}</p>
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

        // Click Tracking System
        card.addEventListener('click', () => {
            trackProjectClick(project.id, project.title);
        });

        return card;
    }

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
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('section, .project-card, .skill-item, .contact-card, .stat-item').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }
});
