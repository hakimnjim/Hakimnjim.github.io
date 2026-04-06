document.addEventListener("DOMContentLoaded", () => {
    const featuredContainer = document.getElementById("featured-container");
    const smallProjectsContainer = document.getElementById("small-projects-container");
    const allProjectsContainer = document.getElementById("all-projects-container");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const navbar = document.querySelector(".navbar");
    const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
    const clickStorageKey = "game_dev_portfolio_clicks";
    let mouseFramePending = false;
    let pendingMouseX = 12;
    let pendingMouseY = 18;

    let projects = [];
    let smallProjects = [];
    let revealObserver;

    init();

    async function init() {
        try {
            [projects, smallProjects] = await Promise.all([
                fetchProjects(),
                fetchSmallProjects()
            ]);
            renderProjects();
            renderSmallProjects();
            setupEventListeners();
            setupScrollAnimations();
            logClickStats();
        } catch (error) {
            console.error("Initialization failed:", error);
            renderProjectError();
        }
    }

    async function fetchProjects() {
        const response = await fetch("projects.json");

        if (!response.ok) {
            throw new Error(`Unable to load projects.json (${response.status})`);
        }

        return response.json();
    }

    async function fetchSmallProjects() {
        const response = await fetch("small_project.json");

        if (!response.ok) {
            throw new Error(`Unable to load small_project.json (${response.status})`);
        }

        const rawText = await response.text();
        if (!rawText.trim()) {
            return [];
        }

        const parsed = JSON.parse(rawText);
        return Array.isArray(parsed) ? parsed : [];
    }

    function renderProjects(filter = "all") {
        if (!featuredContainer || !allProjectsContainer) {
            return;
        }

        allProjectsContainer.style.opacity = "1";
        allProjectsContainer.style.transform = "translateY(0)";
        featuredContainer.innerHTML = "";
        allProjectsContainer.innerHTML = "";

        const clickStats = getClickStats();
        const featuredProjects = projects
            .filter((project) => project.featured)
            .sort((a, b) => (clickStats[b.id] || 0) - (clickStats[a.id] || 0))
            .slice(0, 2);

        if (filter === "all") {
            const featuredFragment = document.createDocumentFragment();
            featuredProjects.forEach((project) => {
                try {
                    featuredFragment.appendChild(createProjectCard(project, true));
                } catch (error) {
                    console.error("Failed to render featured project:", project, error);
                }
            });
            featuredContainer.appendChild(featuredFragment);
        }

        const filteredProjects = filter === "all"
            ? projects
            : projects.filter((project) => project.type === filter);

        if (filteredProjects.length === 0) {
            allProjectsContainer.innerHTML = `
                <article class="project-card empty-project-state">
                    <div class="project-content">
                        <div class="type-badge">No Projects</div>
                        <h3 class="project-title">No projects in this category yet</h3>
                        <p class="project-desc">Try another filter or add more items to <code>projects.json</code>.</p>
                    </div>
                </article>
            `;
            observeRevealTargets();
            return;
        }

        const projectsFragment = document.createDocumentFragment();

        filteredProjects.forEach((project) => {
            try {
                projectsFragment.appendChild(createProjectCard(project, false));
            } catch (error) {
                console.error("Failed to render project:", project, error);
            }
        });

        if (!projectsFragment.childNodes.length) {
            renderProjectError();
            return;
        }

        allProjectsContainer.appendChild(projectsFragment);

        observeRevealTargets();
    }

    function renderSmallProjects() {
        if (!smallProjectsContainer) {
            return;
        }

        smallProjectsContainer.innerHTML = "";

        const itemsToRender = smallProjects
            .filter((item) => item && item.clientName && Array.isArray(item.projects) && item.projects.length > 0)
            .slice(0, 2);

        if (itemsToRender.length === 0) {
            smallProjectsContainer.innerHTML = `
                <article class="small-project-card reveal">
                    <div class="small-project-copy">
                        <p class="small-project-label">Ready for content</p>
                        <h3 class="small-project-title">Add client sprint projects to <code>small_project.json</code></h3>
                        <p class="small-project-description">Each item supports one client name, one shared description, and three local videos for a compact showcase layout.</p>
                    </div>
                </article>
            `;
            observeRevealTargets();
            return;
        }

        itemsToRender.forEach((item) => {
            smallProjectsContainer.appendChild(createSmallProjectCard(item));
        });

        observeRevealTargets();
    }

    function createProjectCard(project, isFeatured = false) {
        const safeProject = normalizeProject(project);
        const card = document.createElement("article");
        card.className = `project-card reveal ${isFeatured ? "featured-card" : ""}`.trim();
        card.dataset.id = String(safeProject.id);
        card.dataset.type = safeProject.type;

        const mediaItems = Array.isArray(safeProject.media) && safeProject.media.length > 0
            ? safeProject.media
            : [{ type: "image", src: "", thumbnail: "" }];

        const firstMedia = mediaItems[0];

        card.innerHTML = `
            <div class="project-viewer">
                <div class="main-display">
                    ${renderMainMedia(safeProject, firstMedia, isFeatured)}
                    ${isFeatured ? '<div class="featured-badge">Featured</div>' : ""}
                </div>
                <div class="media-strip" aria-label="${safeProject.title} media gallery">
                    ${renderThumbnails(safeProject, mediaItems)}
                </div>
            </div>
            <div class="project-content">
                <div class="type-badge type-${safeProject.type}">${safeProject.type}</div>
                <h3 class="project-title">${escapeHtml(safeProject.title)}</h3>
                <span class="project-role">${escapeHtml(safeProject.role)}</span>
                <p class="project-desc">${escapeHtml(safeProject.description)}</p>
                <div class="project-info">
                    <p class="learned"><strong>Developer Insights</strong>${escapeHtml(safeProject.learned)}</p>
                </div>
                <div class="project-tags">
                    ${renderTags(safeProject.skills)}
                </div>
                <div class="project-links">
                    <div class="project-link-group">
                        ${renderProjectLinks(safeProject.links)}
                    </div>
                    <button class="btn-track-view" type="button">View Details</button>
                </div>
            </div>
        `;

        setupMediaSwitching(card, safeProject, mediaItems, isFeatured);
        setupCardClickTracking(card, safeProject);

        return card;
    }

    function createSmallProjectCard(item) {
        const card = document.createElement("article");
        card.className = "small-project-card reveal";

        const projectsForCard = item.projects.slice(0, 3);

        card.innerHTML = `
            <div class="small-project-media-grid">
                ${projectsForCard.map((project, index) => renderSmallProjectVideo(project, item.clientName, index)).join("")}
            </div>
            <div class="small-project-copy">
                <p class="small-project-label">Long-term client collaboration</p>
                <h3 class="small-project-title">${escapeHtml(item.clientName)}</h3>
                <p class="small-project-description">${escapeHtml(item.description || "")}</p>
                <ul class="small-project-list">
                    ${projectsForCard.map((project) => `<li>${escapeHtml(project.title || "Project")}</li>`).join("")}
                </ul>
            </div>
        `;

        return card;
    }

    function renderSmallProjectVideo(project, clientName, index) {
        const videoSrc = project.video || project.src || "";
        const poster = project.poster || "";
        const title = project.title || `Project ${index + 1}`;

        if (!videoSrc) {
            return `
                <div class="small-project-video-shell small-project-video-placeholder">
                    <span>${escapeHtml(title)}</span>
                </div>
            `;
        }

        return `
            <div class="small-project-video-shell">
                <video
                    src="${videoSrc}"
                    ${poster ? `poster="${poster}"` : ""}
                    class="small-project-video"
                    autoplay
                    muted
                    loop
                    playsinline
                    preload="metadata"
                    aria-label="${escapeAttribute(clientName)} ${escapeAttribute(title)} video">
                </video>
                <span class="small-project-video-title">${escapeHtml(title)}</span>
            </div>
        `;
    }

    function renderMainMedia(project, mediaItem, prioritizeLoading = false) {
        const youTubeEmbedUrl = getYouTubeEmbedUrl(mediaItem.src);
        const loadingMode = prioritizeLoading ? "eager" : "lazy";

        if (youTubeEmbedUrl) {
            return `<iframe src="${youTubeEmbedUrl}" class="main-media-content" title="${escapeAttribute(project.title)} gameplay video" loading="${loadingMode}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        }

        if (mediaItem.type === "video" && mediaItem.src) {
            return `<video src="${mediaItem.src}" controls playsinline preload="metadata" class="main-media-content" aria-label="${escapeAttribute(project.title)} gameplay video"></video>`;
        }

        if (mediaItem.src) {
            return `<img src="${mediaItem.src}" alt="${escapeAttribute(project.title)} preview" class="main-media-content" loading="${loadingMode}" decoding="async">`;
        }

        return `<div class="main-media-content" aria-hidden="true"></div>`;
    }

    function renderThumbnails(project, mediaItems) {
        return mediaItems.map((item, index) => {
            const thumbnailSrc = item.thumbnail || item.src || "";
            const mediaLabel = item.type === "video"
                ? `${project.title} video thumbnail ${index + 1}`
                : `${project.title} screenshot ${index + 1}`;

            return `
                <button class="thumb ${index === 0 ? "active" : ""}" type="button" data-index="${index}" data-type="${item.type}" data-src="${item.src || ""}" aria-label="Show ${escapeAttribute(mediaLabel)}">
                    <img src="${thumbnailSrc}" alt="${escapeAttribute(mediaLabel)}" loading="lazy">
                    ${item.type === "video" ? '<i class="fas fa-play thumb-play-icon" aria-hidden="true"></i>' : ""}
                </button>
            `;
        }).join("");
    }

    function renderProjectLinks(links = {}) {
        const items = [
            { key: "steam", label: "Steam", icon: "fab fa-steam" },
            { key: "playstore", label: "Play Store", icon: "fab fa-google-play" },
            { key: "download", label: "Download", icon: "fas fa-download" }
        ];

        return items
            .filter((item) => links[item.key] && links[item.key] !== "#")
            .map((item) => `
                <a href="${links[item.key]}" class="project-link" aria-label="${item.label}" target="_blank" rel="noopener noreferrer">
                    <i class="${item.icon}" aria-hidden="true"></i>
                </a>
            `)
            .join("");
    }

    function getProjectPrimaryLink(links = {}) {
        const priority = ["playstore", "steam", "download"];

        for (const key of priority) {
            if (links[key] && links[key] !== "#") {
                return links[key];
            }
        }

        return "";
    }

    function renderTags(skills = []) {
        return (skills || [])
            .map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`)
            .join("");
    }

    function setupMediaSwitching(card, project, mediaItems, isFeatured) {
        const thumbs = Array.from(card.querySelectorAll(".thumb"));
        const display = card.querySelector(".main-display");

        thumbs.forEach((thumb) => {
            thumb.addEventListener("click", (event) => {
                event.stopPropagation();

                if (thumb.classList.contains("active")) {
                    return;
                }

                thumbs.forEach((item) => item.classList.remove("active"));
                thumb.classList.add("active");

                const selectedMedia = mediaItems[Number(thumb.dataset.index)];
                const currentMedia = display.querySelector(".main-media-content");

                if (currentMedia) {
                    currentMedia.style.opacity = "0";
                    currentMedia.style.transform = "scale(0.98)";
                }

                window.setTimeout(() => {
                    display.innerHTML = `
                        ${renderMainMedia(project, selectedMedia, isFeatured)}
                        ${isFeatured ? '<div class="featured-badge">Featured</div>' : ""}
                    `;

                    const newMedia = display.querySelector(".main-media-content");
                    if (newMedia) {
                        newMedia.style.opacity = "0";
                        newMedia.style.transform = "scale(0.98)";
                        newMedia.offsetHeight;
                        newMedia.style.opacity = "1";
                        newMedia.style.transform = "scale(1)";
                    }
                }, 180);
            });
        });
    }

    function setupCardClickTracking(card, project) {
        const detailButton = card.querySelector(".btn-track-view");

        if (detailButton) {
            detailButton.addEventListener("click", (event) => {
                event.stopPropagation();
                trackProjectClick(project.id, project.title);

                const destination = getProjectPrimaryLink(project.links);
                if (destination) {
                    window.open(destination, "_blank", "noopener,noreferrer");
                }
            });
        }

        card.addEventListener("click", (event) => {
            if (event.target.closest(".thumb") || event.target.closest(".project-link")) {
                return;
            }

            trackProjectClick(project.id, project.title);
            createPulse(card, event);
        });
    }

    function createPulse(card, event) {
        const rect = card.getBoundingClientRect();
        const pulse = document.createElement("div");
        pulse.className = "click-pulse";
        pulse.style.left = `${event.clientX - rect.left}px`;
        pulse.style.top = `${event.clientY - rect.top}px`;
        card.appendChild(pulse);
        window.setTimeout(() => pulse.remove(), 500);
    }

    function setupEventListeners() {
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                filterButtons.forEach((item) => {
                    item.classList.remove("active");
                    item.setAttribute("aria-pressed", "false");
                });

                button.classList.add("active");
                button.setAttribute("aria-pressed", "true");

                renderProjects(button.dataset.filter || "all");
            });
        });

        if (menuToggle && navLinks) {
            menuToggle.addEventListener("click", () => {
                const isOpen = navLinks.classList.toggle("active");
                menuToggle.setAttribute("aria-expanded", String(isOpen));

                const icon = menuToggle.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-bars", !isOpen);
                    icon.classList.toggle("fa-times", isOpen);
                }
            });

            navLinks.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => {
                    navLinks.classList.remove("active");
                    menuToggle.setAttribute("aria-expanded", "false");

                    const icon = menuToggle.querySelector("i");
                    if (icon) {
                        icon.classList.add("fa-bars");
                        icon.classList.remove("fa-times");
                    }
                });
            });
        }

        document.addEventListener("mousemove", (event) => {
            pendingMouseX = (event.clientX / window.innerWidth) * 100;
            pendingMouseY = (event.clientY / window.innerHeight) * 100;

            if (mouseFramePending) {
                return;
            }

            mouseFramePending = true;
            window.requestAnimationFrame(() => {
                document.body.style.setProperty("--mouse-x", `${pendingMouseX}%`);
                document.body.style.setProperty("--mouse-y", `${pendingMouseY}%`);
                mouseFramePending = false;
            });
        }, { passive: true });

        window.addEventListener("scroll", () => {
            if (!navbar) {
                return;
            }

            const compact = window.scrollY > 36;
            navbar.style.padding = compact ? "0.85rem 0" : "1.2rem 0";
            navbar.style.background = compact ? "rgba(2, 6, 23, 0.92)" : "rgba(2, 6, 23, 0.72)";
            navbar.style.boxShadow = compact ? "0 18px 40px rgba(2, 6, 23, 0.28)" : "none";
        }, { passive: true });
    }

    function setupScrollAnimations() {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: "0px 0px -40px 0px"
        });

        observeRevealTargets();
    }

    function observeRevealTargets() {
        if (!revealObserver) {
            return;
        }

        document.querySelectorAll("section, .project-card, .small-project-card, .skill-category, .contact-card, .stat-item, .about-highlight").forEach((element) => {
            element.classList.add("reveal");
            revealObserver.observe(element);
        });
    }

    function trackProjectClick(projectId, projectTitle) {
        const stats = getClickStats();
        stats[projectId] = (stats[projectId] || 0) + 1;
        localStorage.setItem(clickStorageKey, JSON.stringify(stats));
        console.log(`Project clicked: ${projectTitle} (${stats[projectId]} views)`);
    }

    function getClickStats() {
        return JSON.parse(localStorage.getItem(clickStorageKey) || "{}");
    }

    function logClickStats() {
        const stats = getClickStats();
        if (Object.keys(stats).length > 0) {
            console.log("Current interaction stats:", stats);
        }
    }

    function renderProjectError() {
        if (!allProjectsContainer) {
            return;
        }

        allProjectsContainer.innerHTML = `
            <article class="project-card">
                <div class="project-content">
                    <h3 class="project-title">Projects unavailable</h3>
                    <p class="project-desc">The project data could not be loaded right now. Please try again after checking the JSON file.</p>
                </div>
            </article>
        `;
    }

    function normalizeProject(project = {}) {
        const normalizedType = String(project.type || "project").trim().toLowerCase().replace(/\s+/g, "-");

        return {
            id: project.id ?? Date.now(),
            title: project.title || "Untitled Project",
            type: normalizedType || "project",
            role: project.role || "Game Developer",
            description: project.description || "Project details coming soon.",
            learned: project.learned || "Built with care and iterative improvement.",
            skills: Array.isArray(project.skills) ? project.skills : [],
            media: Array.isArray(project.media) ? project.media : [],
            links: project.links && typeof project.links === "object" ? project.links : {}
        };
    }

    function getYouTubeEmbedUrl(url) {
        if (!url) {
            return "";
        }

        try {
            const parsedUrl = new URL(url, window.location.href);
            const host = parsedUrl.hostname.replace(/^www\./, "");

            if (host === "youtu.be") {
                const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
                return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
            }

            if (host === "youtube.com" || host === "m.youtube.com") {
                if (parsedUrl.pathname === "/watch") {
                    const videoId = parsedUrl.searchParams.get("v");
                    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
                }

                if (parsedUrl.pathname.startsWith("/embed/")) {
                    return `${parsedUrl.origin}${parsedUrl.pathname}?rel=0`;
                }

                if (parsedUrl.pathname.startsWith("/shorts/")) {
                    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[1];
                    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
                }
            }
        } catch (error) {
            console.warn("Invalid media URL:", url, error);
        }

        return "";
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
});
