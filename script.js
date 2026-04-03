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
            updateClickStats();
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

        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            
            if (project.featured) {
                featuredContainer.appendChild(projectCard.cloneNode(true));
            }
            
            allProjectsContainer.appendChild(projectCard);
        });

        // Add click tracking to all project links
        document.querySelectorAll('.project-link, .btn').forEach(link => {
            link.addEventListener('click', (e) => {
                const label = e.currentTarget.innerText || e.currentTarget.getAttribute('aria-label');
                trackClick(label);
            });
        });
    }

    // Create Project Card Element
    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card reveal';
        card.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
            </div>
            <div class="project-content">
                <div class="project-category">${project.category}</div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="project-links">
                    <a href="${project.links.demo}" class="project-link" aria-label="View Demo"><i class="fas fa-external-link-alt"></i></a>
                    <a href="${project.links.source}" class="project-link" aria-label="View Source"><i class="fab fa-github"></i></a>
                </div>
            </div>
        `;
        return card;
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

            // Close menu when clicking a link
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
                navbar.style.background = 'rgba(5, 8, 22, 0.95)';
                navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
            } else {
                navbar.style.padding = '1.5rem 0';
                navbar.style.background = 'rgba(5, 8, 22, 0.8)';
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

        // Add reveal class to sections
        document.querySelectorAll('section, .project-card, .skill-category, .contact-card').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // Click Tracking System
    function trackClick(label) {
        if (!label) return;
        
        const clicks = JSON.parse(localStorage.getItem('portfolio_clicks') || '{}');
        clicks[label] = (clicks[label] || 0) + 1;
        localStorage.setItem('portfolio_clicks', JSON.stringify(clicks));
        
        console.log(`Tracked click: ${label}. Total: ${clicks[label]}`);
    }

    function updateClickStats() {
        const clicks = JSON.parse(localStorage.getItem('portfolio_clicks') || '{}');
        // You could use this to show most popular projects, etc.
        // For now, just logging to console
        if (Object.keys(clicks).length > 0) {
            console.log('User interaction stats:', clicks);
        }
    }
});

// Add these styles dynamically for animations if not in CSS
const style = document.createElement('style');
style.textContent = `
    .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .reveal.active {
        opacity: 1;
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        .nav-links.active {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: var(--bg-color);
            padding: 2rem;
            border-bottom: 1px solid var(--accent-cyan);
            animation: slideDown 0.3s ease-out forwards;
        }
    }
    
    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
