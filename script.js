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
        
        // Use the first image from the array as the thumbnail
        const thumbnail = project.images && project.images.length > 0 ? project.images[0] : 'placeholder.jpg';
        
        // Generate link icons based on availability
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
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description}</p>
                
                <div class="project-info">
                    <p class="learned"><strong>What I learned:</strong> ${project.learned}</p>
                </div>

                <div class="project-tags">
                    ${project.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                </div>
                
                <div class="project-links">
                    ${linksHTML}
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
