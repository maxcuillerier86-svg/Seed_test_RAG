/**
 * SeedGuide - AI-Powered Growing Assistant
 * Frontend application
 */

const API_BASE = "";
let allSeeds = [];
let currentSeedId = null;
let currentFilter = "all";
let myGarden = JSON.parse(localStorage.getItem("seedguide_garden") || "[]");

// ── Initialization ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    loadSeeds();
    loadLibraryResources();
    setupNavigation();
    setupSearch();
    setupFilterPills();
    setupGuideForm();
    renderMyGarden();
});

// ── Navigation ──────────────────────────────────────────────────

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navLink) navLink.classList.add("active");

    if (sectionId === "my-garden") renderMyGarden();
}

// ── Load Seeds ──────────────────────────────────────────────────

async function loadSeeds() {
    try {
        const res = await fetch(`${API_BASE}/api/seeds`);
        allSeeds = await res.json();
        renderSeedGrid(allSeeds);
    } catch (err) {
        console.error("Failed to load seeds:", err);
        document.getElementById("seed-grid").innerHTML =
            '<p style="text-align:center;color:#9ca3af;padding:2rem;">Unable to load seeds. Make sure the server is running.</p>';
    }
}

// ── Search & Filter ─────────────────────────────────────────────

function setupSearch() {
    const input = document.getElementById("seed-search");
    input.addEventListener("input", () => {
        filterAndRender();
    });
}

function setupFilterPills() {
    document.querySelectorAll(".pill").forEach((pill) => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            currentFilter = pill.dataset.filter;
            filterAndRender();
        });
    });
}

function filterAndRender() {
    const query = document.getElementById("seed-search").value.toLowerCase();
    let filtered = allSeeds;

    if (currentFilter !== "all") {
        filtered = filtered.filter((s) => s.category === currentFilter);
    }

    if (query) {
        filtered = filtered.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query)
        );
    }

    renderSeedGrid(filtered);
}

// ── Render Seed Grid ────────────────────────────────────────────

function renderSeedGrid(seeds) {
    const grid = document.getElementById("seed-grid");

    if (seeds.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;">No seeds found matching your search.</p>';
        return;
    }

    grid.innerHTML = seeds
        .map((seed) => {
            const catClass = seed.category.toLowerCase();
            const diffClass = seed.difficulty.toLowerCase();
            return `
            <div class="seed-card" onclick="showSeedDetail('${seed.id}')">
                <div class="seed-card-header">
                    <h3>${seed.name}</h3>
                    <span class="category-badge ${catClass}">${seed.category}</span>
                </div>
                <span class="difficulty-badge ${diffClass}">${seed.difficulty}</span>
                <div class="seed-card-meta">
                    <span>${seed.days_to_harvest}</span>
                </div>
            </div>`;
        })
        .join("");
}

// ── Seed Detail ─────────────────────────────────────────────────

async function showSeedDetail(seedId) {
    currentSeedId = seedId;
    try {
        const res = await fetch(`${API_BASE}/api/seeds/${seedId}`);
        const seed = await res.json();
        renderSeedDetail(seed);
        showSection("seed-detail");
    } catch (err) {
        console.error("Failed to load seed detail:", err);
    }
}

function renderSeedDetail(seed) {
    const container = document.getElementById("seed-detail-content");
    const isInGarden = myGarden.some((g) => g.seed_id === seed.id);

    container.innerHTML = `
        <div class="detail-header">
            <h2>${seed.name}</h2>
            <span class="category-badge ${seed.category.toLowerCase()}">${seed.category}</span>
            <div class="varieties">Varieties: ${seed.varieties.join(", ")}</div>
        </div>

        <div class="detail-stats">
            <div class="stat-card">
                <div class="stat-icon">&#9728;&#65039;</div>
                <div class="stat-label">Light</div>
                <div class="stat-value">${seed.sun}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">&#128167;</div>
                <div class="stat-label">Water</div>
                <div class="stat-value">${seed.water}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">&#127793;</div>
                <div class="stat-label">Germination</div>
                <div class="stat-value">${seed.germination_days}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">&#128197;</div>
                <div class="stat-label">Harvest</div>
                <div class="stat-value">${seed.days_to_harvest}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">&#128207;</div>
                <div class="stat-label">Space</div>
                <div class="stat-value">${seed.space_needed}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">&#127777;&#65039;</div>
                <div class="stat-label">Temp</div>
                <div class="stat-value">${seed.temperature_ideal_f}°F</div>
            </div>
        </div>

        <div class="detail-section">
            <h3>&#127759; Growing Requirements</h3>
            <ul>
                <li><strong>Soil:</strong> ${seed.soil}</li>
                <li><strong>Planting depth:</strong> ${seed.planting_depth}</li>
                <li><strong>Spacing:</strong> ${seed.spacing}</li>
                <li><strong>Effort:</strong> ${seed.effort_level}</li>
            </ul>
        </div>

        <div class="detail-section">
            <h3>&#128221; Equipment Needed</h3>
            <ul class="equipment-list">
                ${seed.equipment.map((e) => `<li>${e}</li>`).join("")}
            </ul>
        </div>

        <div class="detail-section">
            <h3>&#128161; Pro Tips</h3>
            ${seed.tips.map((t) => `<div class="tip-item">${t}</div>`).join("")}
        </div>

        <div class="detail-section">
            <h3>&#127963;&#65039; Library Resources</h3>
            <ul>
                ${seed.library_resources.map((r) => `<li>${r}</li>`).join("")}
            </ul>
        </div>

        <div class="cta-row">
            <button class="btn-primary" onclick="startGuide('${seed.id}', '${seed.name}')">
                Get Personalized Growing Guide
            </button>
            <button class="btn-add-garden ${isInGarden ? "added" : ""}" onclick="quickAddToGarden('${seed.id}', '${seed.name}')">
                ${isInGarden ? "&#10003; In My Garden" : "&#127807; Add to My Garden"}
            </button>
        </div>
    `;
}

// ── Personalized Guide ─────────────────────────────────────────

function startGuide(seedId, seedName) {
    document.getElementById("guide-seed-id").value = seedId;
    document.getElementById("guide-seed-name").textContent = `Growing guide for: ${seedName}`;

    // Default plant date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("plant-date").value = today;

    showSection("guide-setup");
}

function setupGuideForm() {
    document.getElementById("guide-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            seed_id: formData.get("seed_id") || document.getElementById("guide-seed-id").value,
            space_type: formData.get("space_type"),
            experience: formData.get("experience"),
            plant_date: formData.get("plant_date"),
        };

        try {
            const res = await fetch(`${API_BASE}/api/guide`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const guide = await res.json();
            renderGuideResult(guide, data);
            showSection("guide-result");
        } catch (err) {
            console.error("Failed to generate guide:", err);
        }
    });
}

function renderGuideResult(guide, formData) {
    const container = document.getElementById("guide-result-content");
    const seedId = formData.seed_id;
    const plantDate = formData.plant_date;

    container.innerHTML = `
        <div class="guide-overview">
            <h2>Your ${guide.seed} Growing Guide</h2>
            <div class="guide-badges">
                <span class="guide-badge green">${guide.overview.difficulty}</span>
                <span class="guide-badge amber">${guide.overview.time_to_harvest}</span>
                <span class="guide-badge blue">${guide.overview.effort}</span>
            </div>
            <p>${guide.space_recommendations}</p>
        </div>

        <div class="guide-section">
            <h3>&#127891; Tips for Your Level</h3>
            ${guide.experience_tips.map((t) => `<div class="tip-item">${t}</div>`).join("")}
        </div>

        <div class="guide-section">
            <h3>&#9881;&#65039; What You'll Need</h3>
            <ul class="equipment-list">
                ${guide.equipment_needed.map((e) => `<li>${e}</li>`).join("")}
            </ul>
        </div>

        <div class="guide-section">
            <h3>&#127793; Growing Requirements</h3>
            <div class="requirements-grid">
                ${Object.entries(guide.requirements)
                    .map(
                        ([key, val]) => `
                    <div class="req-item">
                        <div class="req-label">${key.replace(/_/g, " ")}</div>
                        <div class="req-value">${val}</div>
                    </div>`
                    )
                    .join("")}
            </div>
        </div>

        <div class="guide-section">
            <h3>&#128197; Step-by-Step Growing Timeline</h3>
            <div class="timeline">
                ${guide.growing_steps
                    .map(
                        (s) => `
                    <div class="timeline-step">
                        <div class="timeline-week">Week ${s.week}</div>
                        <div class="timeline-text">${s.step}</div>
                    </div>`
                    )
                    .join("")}
            </div>
        </div>

        <div class="guide-section">
            <h3>&#128161; Pro Tips</h3>
            ${guide.pro_tips.map((t) => `<div class="tip-item">${t}</div>`).join("")}
        </div>

        <div class="guide-section">
            <h3>&#127963;&#65039; Library & Community Resources</h3>
            <ul>
                ${guide.library_resources.map((r) => `<li style="padding:0.3rem 0;color:#4b5563;">${r}</li>`).join("")}
            </ul>
        </div>

        <div class="cta-row">
            <button class="btn-primary" onclick="addToGardenFromGuide('${seedId}', '${guide.seed}', '${plantDate}')">
                &#127807; Add to My Garden & Track Progress
            </button>
            ${plantDate ? `<button class="btn-reminder" onclick="downloadCalendar('${seedId}', '${plantDate}')">&#128197; Download Calendar Reminders</button>` : ""}
        </div>
    `;
}

// ── My Garden ───────────────────────────────────────────────────

function quickAddToGarden(seedId, seedName) {
    if (myGarden.some((g) => g.seed_id === seedId)) {
        showToast(`${seedName} is already in your garden!`);
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    myGarden.push({
        seed_id: seedId,
        seed_name: seedName,
        plant_date: today,
        added_at: new Date().toISOString(),
    });
    saveGarden();
    showToast(`${seedName} added to your garden!`);

    // Update button state
    const btn = document.querySelector(".btn-add-garden");
    if (btn) {
        btn.classList.add("added");
        btn.innerHTML = "&#10003; In My Garden";
    }
}

function addToGardenFromGuide(seedId, seedName, plantDate) {
    if (myGarden.some((g) => g.seed_id === seedId)) {
        showToast(`${seedName} is already in your garden!`);
        showSection("my-garden");
        return;
    }

    myGarden.push({
        seed_id: seedId,
        seed_name: seedName,
        plant_date: plantDate || new Date().toISOString().split("T")[0],
        added_at: new Date().toISOString(),
    });
    saveGarden();
    showToast(`${seedName} added to your garden!`);
    showSection("my-garden");
}

function removeFromGarden(seedId) {
    myGarden = myGarden.filter((g) => g.seed_id !== seedId);
    saveGarden();
    renderMyGarden();
    showToast("Plant removed from your garden.");
}

function saveGarden() {
    localStorage.setItem("seedguide_garden", JSON.stringify(myGarden));
}

async function renderMyGarden() {
    const emptyEl = document.getElementById("garden-empty");
    const plantsEl = document.getElementById("garden-plants");

    if (myGarden.length === 0) {
        emptyEl.style.display = "block";
        plantsEl.style.display = "none";
        return;
    }

    emptyEl.style.display = "none";
    plantsEl.style.display = "grid";

    let html = "";
    for (const plant of myGarden) {
        try {
            const res = await fetch(`${API_BASE}/api/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seed_id: plant.seed_id,
                    plant_date: plant.plant_date,
                }),
            });
            const schedule = await res.json();

            // Find next upcoming step
            const nextStep = schedule.schedule.find(
                (s) => !s.is_past && !s.is_today
            );
            const todayStep = schedule.schedule.find((s) => s.is_today);
            const completedSteps = schedule.schedule.filter((s) => s.is_past).length;
            const totalSteps = schedule.schedule.length;
            const progress = Math.round((completedSteps / totalSteps) * 100);

            html += `
                <div class="garden-card">
                    <div class="garden-card-header">
                        <h3>&#127793; ${plant.seed_name}</h3>
                        <button class="remove-btn" onclick="removeFromGarden('${plant.seed_id}')">Remove</button>
                    </div>
                    <div style="font-size:0.85rem;color:#6b7280;">
                        Planted: ${new Date(plant.plant_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div style="font-size:0.8rem;color:#9ca3af;margin-top:0.25rem;">${progress}% through growing timeline</div>

                    ${
                        todayStep
                            ? `
                        <div class="next-step" style="border-color: #22c55e; background: #f0fdf4;">
                            <div class="next-step-label" style="color: #16a34a;">&#128994; Today's Task</div>
                            <div class="next-step-text">${todayStep.task}</div>
                            <div style="font-size:0.8rem;color:#9ca3af;margin-top:0.25rem;">Week ${todayStep.week}</div>
                        </div>
                    `
                            : ""
                    }

                    ${
                        nextStep
                            ? `
                        <div class="next-step">
                            <div class="next-step-label">Next Step — ${nextStep.display_date}</div>
                            <div class="next-step-text">${nextStep.task}</div>
                            <div style="font-size:0.8rem;color:#9ca3af;margin-top:0.25rem;">Week ${nextStep.week}</div>
                        </div>
                    `
                            : '<div class="next-step"><div class="next-step-label">&#127881; All done!</div><div class="next-step-text">You\'ve completed all growing steps. Happy harvesting!</div></div>'
                    }

                    <div class="reminder-actions">
                        <button class="btn-reminder" onclick="viewFullSchedule('${plant.seed_id}', '${plant.plant_date}')">
                            &#128197; View Full Schedule
                        </button>
                        <button class="btn-reminder" onclick="downloadCalendar('${plant.seed_id}', '${plant.plant_date}')">
                            &#128229; Calendar Reminders
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            html += `
                <div class="garden-card">
                    <div class="garden-card-header">
                        <h3>&#127793; ${plant.seed_name}</h3>
                        <button class="remove-btn" onclick="removeFromGarden('${plant.seed_id}')">Remove</button>
                    </div>
                    <p style="color:#9ca3af;">Unable to load schedule.</p>
                </div>
            `;
        }
    }

    plantsEl.innerHTML = html;
}

async function viewFullSchedule(seedId, plantDate) {
    try {
        const res = await fetch(`${API_BASE}/api/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seed_id: seedId, plant_date: plantDate }),
        });
        const schedule = await res.json();

        const container = document.getElementById("guide-result-content");
        container.innerHTML = `
            <div class="guide-overview">
                <h2>&#128197; ${schedule.seed_name} Schedule</h2>
                <p>Started: ${new Date(schedule.plant_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div class="guide-section">
                <h3>Growing Timeline</h3>
                <div class="timeline">
                    ${schedule.schedule
                        .map(
                            (s) => `
                        <div class="timeline-step ${s.is_past ? "past" : ""} ${s.is_today ? "today" : ""} ${s.is_upcoming ? "upcoming" : ""}">
                            <div class="timeline-week">Week ${s.week}${s.is_today ? " — TODAY" : ""}${s.is_upcoming ? " — COMING UP" : ""}</div>
                            <div class="timeline-date">${s.display_date}</div>
                            <div class="timeline-text">${s.task}</div>
                        </div>`
                        )
                        .join("")}
                </div>
            </div>
            <div class="cta-row">
                <button class="btn-secondary" onclick="showSection('my-garden')">&larr; Back to My Garden</button>
                <button class="btn-reminder" onclick="downloadCalendar('${seedId}', '${plantDate}')">&#128229; Download Calendar Reminders</button>
            </div>
        `;
        showSection("guide-result");
    } catch (err) {
        console.error("Failed to load schedule:", err);
    }
}

// ── Calendar Export (ICS) ───────────────────────────────────────

async function downloadCalendar(seedId, plantDate) {
    try {
        const res = await fetch(`${API_BASE}/api/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seed_id: seedId, plant_date: plantDate }),
        });
        const schedule = await res.json();

        let ics = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//SeedGuide//Growing Reminders//EN",
            "CALSCALE:GREGORIAN",
        ];

        schedule.schedule.forEach((step) => {
            const date = step.date.replace(/-/g, "");
            const uid = `seedguide-${seedId}-week${step.week}@seedguide`;
            const summary = `SeedGuide: ${schedule.seed_name} - Week ${step.week}`;
            const description = step.task.replace(/\n/g, "\\n");

            ics.push("BEGIN:VEVENT");
            ics.push(`DTSTART;VALUE=DATE:${date}`);
            ics.push(`DTEND;VALUE=DATE:${date}`);
            ics.push(`UID:${uid}`);
            ics.push(`SUMMARY:${summary}`);
            ics.push(`DESCRIPTION:${description}`);
            ics.push("BEGIN:VALARM");
            ics.push("TRIGGER:-PT9H");
            ics.push("ACTION:DISPLAY");
            ics.push(`DESCRIPTION:Time to care for your ${schedule.seed_name}!`);
            ics.push("END:VALARM");
            ics.push("END:VEVENT");
        });

        ics.push("END:VCALENDAR");

        const blob = new Blob([ics.join("\r\n")], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `seedguide-${schedule.seed_name.toLowerCase()}-reminders.ics`;
        a.click();
        URL.revokeObjectURL(url);

        showToast("Calendar reminders downloaded! Import into your calendar app.");
    } catch (err) {
        console.error("Failed to generate calendar:", err);
    }
}

// ── Library Resources ───────────────────────────────────────────

async function loadLibraryResources() {
    try {
        const res = await fetch(`${API_BASE}/api/library-resources`);
        const resources = await res.json();
        renderLibraryResources(resources);
    } catch (err) {
        console.error("Failed to load library resources:", err);
    }
}

function renderLibraryResources(resources) {
    const container = document.getElementById("library-content");
    const sections = {
        seed_libraries: { title: "Seed Libraries", icon: "&#127793;" },
        tool_libraries: { title: "Tool Lending Libraries", icon: "&#128295;" },
        growing_equipment: { title: "Growing Equipment", icon: "&#128161;" },
        knowledge_resources: { title: "Knowledge & Learning", icon: "&#128218;" },
    };

    let html = "";
    for (const [key, meta] of Object.entries(sections)) {
        const r = resources[key];
        if (!r) continue;

        const items = r.common_tools || r.items || [];
        html += `
            <div class="library-card">
                <h3>${meta.icon} ${meta.title}</h3>
                <p>${r.description}</p>
                ${
                    items.length > 0
                        ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
                        : ""
                }
                ${
                    r.how_to_find
                        ? `<div class="how-to"><strong>How to find:</strong> ${r.how_to_find}</div>`
                        : ""
                }
            </div>
        `;
    }

    container.innerHTML = html;
}

// ── Toast Notifications ─────────────────────────────────────────

function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
