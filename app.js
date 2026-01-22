/* ========================================
   DSA Progress Tracker - Enhanced App Logic
   All Features: Notes, Goals, Stats, Keys
======================================== */

// State Management
let currentDomain = 'all';
let currentFilter = 'all';
let currentDifficulty = 'all';
let currentCompany = 'all';
let searchQuery = '';
let selectedRowIndex = -1;
let dailyGoal = 5;
let todaySolved = 0;
let streak = 0;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    loadSettings();
    populateCompanyFilter();
    renderDomainsList();
    renderProblems();
    updateAllStats();
    updateDailyGoal();
    setupEventListeners();
    setupKeyboardShortcuts();
    applyTheme();
});

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('dsaProgress');
    if (saved) {
        const savedData = JSON.parse(saved);
        Object.keys(domains).forEach(domainKey => {
            domains[domainKey].problems.forEach(problem => {
                const savedProblem = savedData[`${domainKey}-${problem.id}`];
                if (savedProblem) {
                    problem.completed = savedProblem.completed || false;
                    problem.starred = savedProblem.starred || false;
                    problem.inTodo = savedProblem.inTodo || false;
                    problem.notes = savedProblem.notes || '';
                    problem.lastSolved = savedProblem.lastSolved || null;
                }
            });
        });
    }
}

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('dsaSettings') || '{}');
    dailyGoal = settings.dailyGoal || 5;
    streak = settings.streak || 0;
    
    // Calculate today's solved
    const today = new Date().toDateString();
    const todayData = JSON.parse(localStorage.getItem('dsaTodayData') || '{}');
    if (todayData.date === today) {
        todaySolved = todayData.count || 0;
    } else {
        // New day - check if streak continues
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (todayData.date === yesterday.toDateString() && todayData.count >= dailyGoal) {
            streak++;
        } else if (todayData.date !== yesterday.toDateString()) {
            streak = 0;
        }
        todaySolved = 0;
        saveTodayData();
    }
    saveSettings();
}

// Save progress to localStorage
function saveProgress() {
    const progressData = {};
    Object.keys(domains).forEach(domainKey => {
        domains[domainKey].problems.forEach(problem => {
            progressData[`${domainKey}-${problem.id}`] = {
                completed: problem.completed,
                starred: problem.starred,
                inTodo: problem.inTodo,
                notes: problem.notes || '',
                lastSolved: problem.lastSolved || null
            };
        });
    });
    localStorage.setItem('dsaProgress', JSON.stringify(progressData));
}

// Save settings
function saveSettings() {
    localStorage.setItem('dsaSettings', JSON.stringify({ dailyGoal, streak }));
}

// Save today's data
function saveTodayData() {
    localStorage.setItem('dsaTodayData', JSON.stringify({
        date: new Date().toDateString(),
        count: todaySolved
    }));
}

// Apply theme
function applyTheme() {
    const theme = localStorage.getItem('dsaTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeBtn').textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Toggle theme
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dsaTheme', newTheme);
    document.getElementById('themeBtn').textContent = newTheme === 'dark' ? '🌙' : '☀️';
}

// Populate company filter
function populateCompanyFilter() {
    const companies = new Set();
    Object.keys(domains).forEach(domainKey => {
        domains[domainKey].problems.forEach(problem => {
            problem.companies.forEach(c => companies.add(c));
        });
    });
    
    const select = document.getElementById('companyFilter');
    const sorted = Array.from(companies).filter(c => c !== 'General').sort();
    sorted.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        select.appendChild(option);
    });
}

// Render domains list in sidebar
function renderDomainsList() {
    const domainsList = document.getElementById('domainsList');
    domainsList.innerHTML = '';
    
    Object.keys(domains).forEach(domainKey => {
        const domain = domains[domainKey];
        const completed = domain.problems.filter(p => p.completed).length;
        const total = domain.problems.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;
        
        const btn = document.createElement('button');
        btn.className = `domain-btn ${currentDomain === domainKey ? 'active' : ''}`;
        btn.dataset.domain = domainKey;
        btn.innerHTML = `
            <span class="domain-btn-left">
                <span class="domain-btn-icon">${domain.icon}</span>
                <span>${domain.name}</span>
            </span>
            <div class="domain-progress-mini">
                <div class="domain-progress-mini-fill" style="width: ${percent}%"></div>
            </div>
        `;
        btn.addEventListener('click', () => selectDomain(domainKey));
        domainsList.appendChild(btn);
    });
}

// Select a domain
function selectDomain(domainKey) {
    currentDomain = domainKey;
    currentFilter = 'all';
    selectedRowIndex = -1;
    
    document.querySelectorAll('.domain-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.domain === domainKey);
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    
    renderProblems();
    updateDomainHeader();
}

// Check if problem needs revision (not solved in last 7 days)
function needsRevision(problem) {
    if (!problem.completed || !problem.lastSolved) return false;
    const lastSolved = new Date(problem.lastSolved);
    const daysSince = (Date.now() - lastSolved.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 7;
}

// Get filtered problems
function getFilteredProblems() {
    let problems = [];
    
    if (currentDomain === 'all') {
        Object.keys(domains).forEach(domainKey => {
            domains[domainKey].problems.forEach(p => {
                problems.push({ ...p, domainKey });
            });
        });
    } else {
        problems = domains[currentDomain].problems.map(p => ({ ...p, domainKey: currentDomain }));
    }
    
    // Apply filter
    switch (currentFilter) {
        case 'starred':
            problems = problems.filter(p => p.starred);
            break;
        case 'todo':
            problems = problems.filter(p => p.inTodo);
            break;
        case 'completed':
            problems = problems.filter(p => p.completed);
            break;
        case 'pending':
            problems = problems.filter(p => !p.completed);
            break;
        case 'revision':
            problems = problems.filter(p => needsRevision(p));
            break;
    }
    
    // Apply difficulty filter
    if (currentDifficulty !== 'all') {
        problems = problems.filter(p => p.difficulty === currentDifficulty);
    }
    
    // Apply company filter
    if (currentCompany !== 'all') {
        problems = problems.filter(p => p.companies.includes(currentCompany));
    }
    
    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        problems = problems.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.pattern.toLowerCase().includes(query) ||
            p.companies.some(c => c.toLowerCase().includes(query))
        );
    }
    
    return problems;
}

// Render problems table
function renderProblems() {
    const tbody = document.getElementById('problemsTableBody');
    const noResults = document.getElementById('noResults');
    const problems = getFilteredProblems();
    
    if (problems.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    tbody.innerHTML = problems.map((problem, index) => `
        <tr class="${problem.completed ? 'completed' : ''} ${needsRevision(problem) ? 'needs-revision' : ''} ${index === selectedRowIndex ? 'selected' : ''}" 
            data-domain="${problem.domainKey}" data-id="${problem.id}" data-index="${index}">
            <td class="th-status">
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="custom-checkbox status-check" 
                           ${problem.completed ? 'checked' : ''} 
                           data-domain="${problem.domainKey}" 
                           data-id="${problem.id}">
                </div>
            </td>
            <td class="th-star">
                <button class="star-btn ${problem.starred ? 'active' : ''}" 
                        data-domain="${problem.domainKey}" 
                        data-id="${problem.id}">
                    ${problem.starred ? '⭐' : '☆'}
                </button>
            </td>
            <td class="th-todo">
                <button class="todo-btn ${problem.inTodo ? 'active' : ''}" 
                        data-domain="${problem.domainKey}" 
                        data-id="${problem.id}">
                    ${problem.inTodo ? '✓' : '📋'}
                </button>
            </td>
            <td>
                <span class="problem-name">${problem.name}</span>
            </td>
            <td>
                <span class="difficulty-badge ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
            </td>
            <td>
                <span class="pattern-tag">${problem.pattern}</span>
            </td>
            <td>
                <span class="companies-list">${problem.companies.slice(0, 3).join(', ')}</span>
            </td>
            <td>
                <div class="links-container">
                    ${problem.leetcode ? `<a href="${problem.leetcode}" target="_blank" class="link-btn">LC</a>` : ''}
                    ${problem.gfg ? `<a href="${problem.gfg}" target="_blank" class="link-btn">GFG</a>` : ''}
                </div>
            </td>
            <td class="th-notes">
                <button class="notes-btn ${problem.notes ? 'has-notes' : ''}" 
                        data-domain="${problem.domainKey}" 
                        data-id="${problem.id}" 
                        title="${problem.notes ? 'View notes' : 'Add notes'}">
                    📝
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    tbody.querySelectorAll('.status-check').forEach(cb => cb.addEventListener('change', handleStatusChange));
    tbody.querySelectorAll('.star-btn').forEach(btn => btn.addEventListener('click', handleStarClick));
    tbody.querySelectorAll('.todo-btn').forEach(btn => btn.addEventListener('click', handleTodoClick));
    tbody.querySelectorAll('.notes-btn').forEach(btn => btn.addEventListener('click', handleNotesClick));
    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('a')) {
                selectedRowIndex = parseInt(row.dataset.index);
                updateSelectedRow();
            }
        });
    });
}

// Update selected row visual
function updateSelectedRow() {
    document.querySelectorAll('.problems-table tbody tr').forEach((row, i) => {
        row.classList.toggle('selected', i === selectedRowIndex);
    });
    
    // Scroll into view
    const selectedRow = document.querySelector('.problems-table tbody tr.selected');
    if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// Handle status checkbox change
function handleStatusChange(e) {
    const domainKey = e.target.dataset.domain;
    const id = parseInt(e.target.dataset.id);
    const problem = domains[domainKey].problems.find(p => p.id === id);
    
    if (problem) {
        const wasCompleted = problem.completed;
        problem.completed = e.target.checked;
        
        if (problem.completed && !wasCompleted) {
            problem.lastSolved = new Date().toISOString();
            todaySolved++;
            saveTodayData();
            updateDailyGoal();
        }
        
        saveProgress();
        updateAllStats();
        renderDomainsList();
        
        const row = e.target.closest('tr');
        row.classList.toggle('completed', problem.completed);
    }
}

// Handle star button click
function handleStarClick(e) {
    const btn = e.currentTarget;
    const domainKey = btn.dataset.domain;
    const id = parseInt(btn.dataset.id);
    const problem = domains[domainKey].problems.find(p => p.id === id);
    
    if (problem) {
        problem.starred = !problem.starred;
        btn.classList.toggle('active', problem.starred);
        btn.textContent = problem.starred ? '⭐' : '☆';
        saveProgress();
        updateAllStats();
        
        if (currentFilter === 'starred') renderProblems();
    }
}

// Handle todo button click
function handleTodoClick(e) {
    const btn = e.currentTarget;
    const domainKey = btn.dataset.domain;
    const id = parseInt(btn.dataset.id);
    const problem = domains[domainKey].problems.find(p => p.id === id);
    
    if (problem) {
        problem.inTodo = !problem.inTodo;
        btn.classList.toggle('active', problem.inTodo);
        btn.textContent = problem.inTodo ? '✓' : '📋';
        saveProgress();
        updateAllStats();
        
        if (currentFilter === 'todo') renderProblems();
    }
}

// Handle notes button click
let currentNotesProblem = null;
function handleNotesClick(e) {
    const btn = e.currentTarget;
    const domainKey = btn.dataset.domain;
    const id = parseInt(btn.dataset.id);
    const problem = domains[domainKey].problems.find(p => p.id === id);
    
    if (problem) {
        currentNotesProblem = { domainKey, id, problem };
        document.getElementById('notesProblemName').textContent = problem.name;
        document.getElementById('notesTextarea').value = problem.notes || '';
        document.getElementById('notesModal').classList.add('show');
    }
}

// Update domain header
function updateDomainHeader() {
    const title = document.getElementById('domainTitle');
    const subtitle = document.getElementById('domainSubtitle');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    
    let completed = 0, total = 0;
    let domainName = '📚 All Problems';
    let domainDesc = 'Track your DSA preparation progress';
    
    if (currentDomain === 'all') {
        Object.keys(domains).forEach(key => {
            completed += domains[key].problems.filter(p => p.completed).length;
            total += domains[key].problems.length;
        });
    } else {
        const domain = domains[currentDomain];
        completed = domain.problems.filter(p => p.completed).length;
        total = domain.problems.length;
        domainName = `${domain.icon} ${domain.name}`;
        domainDesc = `${total} problems to master`;
    }
    
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    title.textContent = domainName;
    subtitle.textContent = domainDesc;
    progressText.textContent = `${completed}/${total} completed`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

// Update all statistics
function updateAllStats() {
    let totalCompleted = 0, totalStarred = 0, totalTodo = 0, totalProblems = 0, revisionCount = 0;
    
    Object.keys(domains).forEach(key => {
        domains[key].problems.forEach(p => {
            totalProblems++;
            if (p.completed) totalCompleted++;
            if (p.starred) totalStarred++;
            if (p.inTodo) totalTodo++;
            if (needsRevision(p)) revisionCount++;
        });
    });
    
    document.getElementById('totalCompleted').textContent = totalCompleted;
    document.getElementById('totalStarred').textContent = totalStarred;
    document.getElementById('totalTodo').textContent = totalTodo;
    
    document.getElementById('countAll').textContent = totalProblems;
    document.getElementById('countStarred').textContent = totalStarred;
    document.getElementById('countTodo').textContent = totalTodo;
    document.getElementById('countCompleted').textContent = totalCompleted;
    document.getElementById('countPending').textContent = totalProblems - totalCompleted;
    document.getElementById('countRevision').textContent = revisionCount;
    
    updateDomainHeader();
}

// Update daily goal widget
function updateDailyGoal() {
    const percent = Math.min((todaySolved / dailyGoal) * 100, 100);
    document.getElementById('goalProgress').setAttribute('stroke-dasharray', `${percent}, 100`);
    document.getElementById('goalText').textContent = `${todaySolved}/${dailyGoal}`;
    document.getElementById('streakBadge').textContent = `🔥 ${streak}`;
}

// Update statistics modal
function updateStatsModal() {
    let completed = 0, total = 0;
    let easyDone = 0, easyTotal = 0;
    let mediumDone = 0, mediumTotal = 0;
    let hardDone = 0, hardTotal = 0;
    const patternStats = {};
    const companyStats = {};
    
    Object.keys(domains).forEach(key => {
        domains[key].problems.forEach(p => {
            total++;
            if (p.completed) completed++;
            
            if (p.difficulty === 'Easy') { easyTotal++; if (p.completed) easyDone++; }
            if (p.difficulty === 'Medium') { mediumTotal++; if (p.completed) mediumDone++; }
            if (p.difficulty === 'Hard') { hardTotal++; if (p.completed) hardDone++; }
            
            if (!patternStats[p.pattern]) patternStats[p.pattern] = { done: 0, total: 0 };
            patternStats[p.pattern].total++;
            if (p.completed) patternStats[p.pattern].done++;
            
            p.companies.forEach(c => {
                if (c !== 'General') {
                    if (!companyStats[c]) companyStats[c] = { done: 0, total: 0 };
                    companyStats[c].total++;
                    if (p.completed) companyStats[c].done++;
                }
            });
        });
    });
    
    document.getElementById('statOverall').textContent = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
    document.getElementById('statOverallText').textContent = `${completed} of ${total} problems solved`;
    document.getElementById('statStreak').textContent = streak;
    document.getElementById('statToday').textContent = todaySolved;
    document.getElementById('dailyGoalValue').textContent = dailyGoal;
    
    document.getElementById('barEasy').style.width = easyTotal > 0 ? `${(easyDone / easyTotal) * 100}%` : '0%';
    document.getElementById('barMedium').style.width = mediumTotal > 0 ? `${(mediumDone / mediumTotal) * 100}%` : '0%';
    document.getElementById('barHard').style.width = hardTotal > 0 ? `${(hardDone / hardTotal) * 100}%` : '0%';
    document.getElementById('countEasyStats').textContent = `${easyDone}/${easyTotal}`;
    document.getElementById('countMediumStats').textContent = `${mediumDone}/${mediumTotal}`;
    document.getElementById('countHardStats').textContent = `${hardDone}/${hardTotal}`;
    
    // Weak areas
    const weakAreas = Object.entries(patternStats)
        .filter(([_, stats]) => stats.total >= 3 && (stats.done / stats.total) < 0.3)
        .sort((a, b) => (a[1].done / a[1].total) - (b[1].done / b[1].total))
        .slice(0, 5);
    
    const weakAreasEl = document.getElementById('weakAreas');
    if (weakAreas.length > 0) {
        weakAreasEl.innerHTML = weakAreas.map(([pattern, stats]) => 
            `<span class="weak-tag">${pattern} (${Math.round((stats.done / stats.total) * 100)}%)</span>`
        ).join('');
    } else {
        weakAreasEl.innerHTML = '<p class="no-weak">🎉 No weak areas detected!</p>';
    }
    
    // Top companies
    const topCompanies = Object.entries(companyStats)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8);
    
    document.getElementById('companyStats').innerHTML = topCompanies.map(([company, stats]) =>
        `<span class="company-tag">${company}<span>${stats.done}/${stats.total}</span></span>`
    ).join('');
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') e.target.blur();
            return;
        }
        
        // Ignore if modal is open (except Escape)
        const modalOpen = document.querySelector('.modal.show');
        if (modalOpen && e.key !== 'Escape') return;
        
        const problems = getFilteredProblems();
        
        switch (e.key) {
            case 'j':
            case 'ArrowDown':
                e.preventDefault();
                if (selectedRowIndex < problems.length - 1) {
                    selectedRowIndex++;
                    updateSelectedRow();
                }
                break;
            case 'k':
            case 'ArrowUp':
                e.preventDefault();
                if (selectedRowIndex > 0) {
                    selectedRowIndex--;
                    updateSelectedRow();
                }
                break;
            case ' ':
                e.preventDefault();
                if (selectedRowIndex >= 0 && problems[selectedRowIndex]) {
                    const p = problems[selectedRowIndex];
                    const cb = document.querySelector(`tr[data-index="${selectedRowIndex}"] .status-check`);
                    if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
                }
                break;
            case 's':
                if (selectedRowIndex >= 0) {
                    const btn = document.querySelector(`tr[data-index="${selectedRowIndex}"] .star-btn`);
                    if (btn) btn.click();
                }
                break;
            case 't':
                if (selectedRowIndex >= 0) {
                    const btn = document.querySelector(`tr[data-index="${selectedRowIndex}"] .todo-btn`);
                    if (btn) btn.click();
                }
                break;
            case 'n':
                if (selectedRowIndex >= 0) {
                    const btn = document.querySelector(`tr[data-index="${selectedRowIndex}"] .notes-btn`);
                    if (btn) btn.click();
                }
                break;
            case 'Enter':
                if (selectedRowIndex >= 0 && problems[selectedRowIndex]) {
                    const p = problems[selectedRowIndex];
                    if (p.leetcode) window.open(p.leetcode, '_blank');
                }
                break;
            case '/':
                e.preventDefault();
                document.getElementById('searchInput').focus();
                break;
            case 'd':
                toggleTheme();
                break;
            case '?':
                document.getElementById('shortcutsModal').classList.add('show');
                break;
            case 'Escape':
                document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebarOverlay').classList.remove('show');
                break;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            selectedRowIndex = -1;
            renderProblems();
        }, 300);
    });
    
    // Company filter
    document.getElementById('companyFilter').addEventListener('change', (e) => {
        currentCompany = e.target.value;
        selectedRowIndex = -1;
        renderProblems();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            currentDomain = 'all';
            selectedRowIndex = -1;
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.domain-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderProblems();
            updateDomainHeader();
        });
    });
    
    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentDifficulty = btn.dataset.difficulty;
            selectedRowIndex = -1;
            
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderProblems();
        });
    });
    
    // Theme toggle
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    
    // Mobile hamburger
    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('show');
    });
    
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    
    // Stats modal
    document.getElementById('statsBtn').addEventListener('click', () => {
        updateStatsModal();
        document.getElementById('statsModal').classList.add('show');
    });
    document.getElementById('statsModalClose').addEventListener('click', () => {
        document.getElementById('statsModal').classList.remove('show');
    });
    
    // Goal buttons
    document.getElementById('goalMinus').addEventListener('click', () => {
        if (dailyGoal > 1) { dailyGoal--; saveSettings(); updateDailyGoal(); updateStatsModal(); }
    });
    document.getElementById('goalPlus').addEventListener('click', () => {
        dailyGoal++; saveSettings(); updateDailyGoal(); updateStatsModal();
    });
    
    // Shortcuts modal
    document.getElementById('shortcutsBtn').addEventListener('click', () => {
        document.getElementById('shortcutsModal').classList.add('show');
    });
    document.getElementById('shortcutsModalClose').addEventListener('click', () => {
        document.getElementById('shortcutsModal').classList.remove('show');
    });
    
    // Notes modal
    document.getElementById('notesModalClose').addEventListener('click', () => {
        document.getElementById('notesModal').classList.remove('show');
    });
    document.getElementById('notesCancelBtn').addEventListener('click', () => {
        document.getElementById('notesModal').classList.remove('show');
    });
    document.getElementById('notesSaveBtn').addEventListener('click', () => {
        if (currentNotesProblem) {
            const problem = domains[currentNotesProblem.domainKey].problems.find(p => p.id === currentNotesProblem.id);
            if (problem) {
                problem.notes = document.getElementById('notesTextarea').value;
                saveProgress();
                renderProblems();
            }
        }
        document.getElementById('notesModal').classList.remove('show');
    });
    
    // Export modal
    document.getElementById('exportBtn').addEventListener('click', () => {
        document.getElementById('exportModal').classList.add('show');
    });
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('exportModal').classList.remove('show');
    });
    document.getElementById('exportModal').addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') document.getElementById('exportModal').classList.remove('show');
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const data = {
            progress: JSON.parse(localStorage.getItem('dsaProgress') || '{}'),
            settings: JSON.parse(localStorage.getItem('dsaSettings') || '{}'),
            todayData: JSON.parse(localStorage.getItem('dsaTodayData') || '{}')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dsa-progress-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // Import button
    const importFile = document.getElementById('importFile');
    document.getElementById('importBtn').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.progress) localStorage.setItem('dsaProgress', JSON.stringify(data.progress));
                    if (data.settings) localStorage.setItem('dsaSettings', JSON.stringify(data.settings));
                    if (data.todayData) localStorage.setItem('dsaTodayData', JSON.stringify(data.todayData));
                    location.reload();
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            localStorage.removeItem('dsaProgress');
            localStorage.removeItem('dsaSettings');
            localStorage.removeItem('dsaTodayData');
            location.reload();
        }
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });
}
