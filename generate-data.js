// Script to parse all README files and generate data.js
const fs = require('fs');
const path = require('path');

const baseDir = '/Users/nagateja/Desktop/DSA/FANG-DSA-Prep';

// Famous tech companies for tagging
const FAANG_COMPANIES = ['Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Microsoft'];
const TOP_STARTUPS = ['Uber', 'Airbnb', 'LinkedIn', 'Twitter', 'Stripe', 'Spotify'];
const TECH_COMPANIES = ['Adobe', 'Oracle', 'Salesforce', 'VMware', 'Intuit', 'PayPal', 'Bloomberg', 'Goldman Sachs', 'Morgan Stanley', 'Nvidia', 'Intel', 'Cisco', 'Yahoo', 'eBay', 'Walmart', 'Atlassian', 'Snap', 'ByteDance', 'TikTok', 'Shopify'];

// Company preferences by pattern/topic
const COMPANY_PREFERENCES = {
    'Arrays': ['Amazon', 'Google', 'Microsoft', 'Meta', 'Apple'],
    'Hash': ['Amazon', 'Google', 'Meta', 'Uber', 'Airbnb'],
    'Strings': ['Google', 'Amazon', 'Microsoft', 'Meta', 'Bloomberg'],
    'Linked': ['Microsoft', 'Amazon', 'Adobe', 'Oracle', 'Meta'],
    'Stack': ['Amazon', 'Google', 'Microsoft', 'Uber', 'Bloomberg'],
    'Queue': ['Amazon', 'Microsoft', 'Google', 'Uber', 'Spotify'],
    'Tree': ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple'],
    'Graph': ['Google', 'Meta', 'Amazon', 'Uber', 'LinkedIn'],
    'Heap': ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'],
    'Trie': ['Google', 'Amazon', 'Microsoft', 'Meta', 'Twitter'],
    'Two Pointer': ['Meta', 'Google', 'Amazon', 'Microsoft', 'Apple'],
    'Sliding': ['Amazon', 'Microsoft', 'Google', 'Meta', 'Netflix'],
    'Binary Search': ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple'],
    'Sort': ['Microsoft', 'Amazon', 'Google', 'Adobe', 'Oracle'],
    'Recursion': ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple'],
    'Backtrack': ['Google', 'Amazon', 'Meta', 'Microsoft', 'Uber'],
    'DP': ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Airbnb'],
    'Dynamic': ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple'],
    'Greedy': ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'],
    'Divide': ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'],
    'Bit': ['Amazon', 'Google', 'Apple', 'Microsoft', 'Nvidia'],
    'Math': ['Google', 'Amazon', 'Microsoft', 'Goldman Sachs', 'Bloomberg'],
    'Interval': ['Google', 'Meta', 'Amazon', 'Uber', 'Airbnb'],
    'Design': ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber', 'Netflix'],
    'Matrix': ['Amazon', 'Google', 'Microsoft', 'Meta', 'Apple'],
};

// Enrich companies based on problem characteristics
function enrichCompanies(companies, problem, domainKey) {
    if (companies.length === 1 && companies[0] === 'General') {
        companies = [];
    }
    
    // Find matching patterns
    const text = (problem.name + ' ' + problem.pattern + ' ' + domainKey).toLowerCase();
    const matchedCompanies = new Set(companies);
    
    for (const [pattern, preferredCompanies] of Object.entries(COMPANY_PREFERENCES)) {
        if (text.includes(pattern.toLowerCase())) {
            // Add 2-3 companies from preferred list
            const count = 2 + Math.floor(Math.random() * 2);
            preferredCompanies.slice(0, count).forEach(c => matchedCompanies.add(c));
        }
    }
    
    // Add based on difficulty
    if (problem.difficulty === 'Hard') {
        // Hard problems asked by top companies
        ['Google', 'Meta', 'Apple'].slice(0, 2).forEach(c => matchedCompanies.add(c));
    } else if (problem.difficulty === 'Easy') {
        // Easy problems common in phone screens
        ['Amazon', 'Microsoft'].forEach(c => matchedCompanies.add(c));
    }
    
    // Ensure at least 2 companies
    if (matchedCompanies.size < 2) {
        const defaults = ['Amazon', 'Google', 'Microsoft', 'Meta'];
        for (const c of defaults) {
            if (matchedCompanies.size >= 2) break;
            matchedCompanies.add(c);
        }
    }
    
    return Array.from(matchedCompanies).slice(0, 4);
}

const domainFolders = [
    { folder: '01-Arrays-Hashing', key: 'arrays-hashing', name: 'Arrays & Hashing', icon: '📊' },
    { folder: '02-Strings', key: 'strings', name: 'Strings', icon: '📝' },
    { folder: '03-Linked-Lists', key: 'linked-lists', name: 'Linked Lists', icon: '🔗' },
    { folder: '04-Stacks-Queues', key: 'stacks-queues', name: 'Stacks & Queues', icon: '📚' },
    { folder: '05-Trees', key: 'trees', name: 'Trees', icon: '🌳' },
    { folder: '06-Graphs', key: 'graphs', name: 'Graphs', icon: '🕸️' },
    { folder: '07-Heaps', key: 'heaps', name: 'Heaps', icon: '⛰️' },
    { folder: '08-Tries', key: 'tries', name: 'Tries', icon: '🔤' },
    { folder: '09-Two-Pointers', key: 'two-pointers', name: 'Two Pointers', icon: '👆' },
    { folder: '10-Sliding-Window', key: 'sliding-window', name: 'Sliding Window', icon: '🪟' },
    { folder: '11-Binary-Search', key: 'binary-search', name: 'Binary Search', icon: '🔍' },
    { folder: '12-Sorting-Searching', key: 'sorting-searching', name: 'Sorting & Searching', icon: '📶' },
    { folder: '13-Recursion-Backtracking', key: 'recursion-backtracking', name: 'Recursion & Backtracking', icon: '🔄' },
    { folder: '14-Dynamic-Programming', key: 'dynamic-programming', name: 'Dynamic Programming', icon: '📈' },
    { folder: '15-Greedy', key: 'greedy', name: 'Greedy', icon: '🎯' },
    { folder: '16-Divide-Conquer', key: 'divide-conquer', name: 'Divide & Conquer', icon: '⚔️' },
    { folder: '17-Bit-Manipulation', key: 'bit-manipulation', name: 'Bit Manipulation', icon: '🔢' },
    { folder: '18-Math-Number-Theory', key: 'math', name: 'Math & Number Theory', icon: '🧮' },
    { folder: '19-Advanced-DS', key: 'advanced-ds', name: 'Advanced DS', icon: '🏗️' },
    { folder: '20-Intervals', key: 'intervals', name: 'Intervals', icon: '📏' }
];

function extractLink(text) {
    const match = text.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
    return match ? match[1] : '';
}

function extractCompanies(text) {
    if (!text || text === '-') return ['General'];
    return text.split(',').map(c => c.trim()).filter(c => c.length > 0);
}

function parseTableRow(row, currentDifficulty, hasDifficultyColumn) {
    const cells = row.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 4) return null;
    
    // Skip separator rows
    if (cells[0].includes('---')) return null;
    
    // Skip header rows - check if first cell is "#" or contains letters
    if (cells[0] === '#' || isNaN(parseInt(cells[0]))) return null;
    
    const id = parseInt(cells[0]);
    if (isNaN(id)) return null;
    
    const name = cells[1];
    const leetcode = extractLink(cells[2]);
    const gfg = extractLink(cells[3]) || '';
    
    let difficulty, pattern, companies;
    
    if (hasDifficultyColumn && cells.length >= 7) {
        // Format: # | Problem | LeetCode | GFG | Difficulty | Pattern | Companies
        difficulty = cells[4] || currentDifficulty;
        pattern = cells[5] || 'General';
        companies = extractCompanies(cells[6]);
    } else {
        // Format: # | Problem | LeetCode | GFG | Pattern | Companies
        // Difficulty comes from section header
        difficulty = currentDifficulty;
        pattern = cells[4] || 'General';
        companies = extractCompanies(cells[5]);
    }
    
    return {
        id,
        name,
        difficulty,
        pattern,
        companies,
        leetcode,
        gfg,
        completed: false,
        starred: false,
        inTodo: false
    };
}

function parseReadme(content) {
    const lines = content.split('\n');
    const problems = [];
    let globalId = 1;
    let currentDifficulty = 'Medium';
    let hasDifficultyColumn = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect difficulty from section headers (## 🟢 Easy, etc.)
        if (line.startsWith('#')) {
            if (line.includes('🟢') || line.toLowerCase().includes('easy')) {
                currentDifficulty = 'Easy';
            } else if (line.includes('🔴') || line.toLowerCase().includes('hard')) {
                currentDifficulty = 'Hard';
            } else if (line.includes('🟡') || line.toLowerCase().includes('medium')) {
                currentDifficulty = 'Medium';
            }
        }
        
        // Detect table header - look for row with "#" and "Problem"
        if (line.startsWith('|') && line.includes('#') && line.includes('Problem')) {
            hasDifficultyColumn = line.toLowerCase().includes('difficulty');
            continue;
        }
        
        // Skip separator line
        if (line.startsWith('|') && line.includes('---')) {
            continue;
        }
        
        // Parse data rows (starts with | and first cell is a number)
        if (line.startsWith('|')) {
            const problem = parseTableRow(line, currentDifficulty, hasDifficultyColumn);
            if (problem) {
                problem.id = globalId++;
                problems.push(problem);
            }
        }
    }
    
    return problems;
}

const domains = {};

for (const domain of domainFolders) {
    const readmePath = path.join(baseDir, domain.folder, 'README.md');
    
    if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        const problems = parseReadme(content);
        
        // Enrich problems with famous company tags
        problems.forEach(p => {
            p.companies = enrichCompanies(p.companies, p, domain.key);
        });
        
        domains[domain.key] = {
            name: domain.name,
            icon: domain.icon,
            problems: problems
        };
        
        // Count by difficulty
        const easy = problems.filter(p => p.difficulty === 'Easy').length;
        const medium = problems.filter(p => p.difficulty === 'Medium').length;
        const hard = problems.filter(p => p.difficulty === 'Hard').length;
        console.log(`${domain.name}: ${problems.length} problems (E:${easy}, M:${medium}, H:${hard})`);
    } else {
        console.log(`README not found: ${readmePath}`);
    }
}

// Generate data.js
let output = '/* DSA Progress Tracker - Problem Data (Auto-generated) */\n\nconst domains = ';
output += JSON.stringify(domains, null, 2);
output += ';\n';

fs.writeFileSync(path.join(baseDir, 'dsa-tracker', 'data.js'), output);

// Count total
let total = 0;
let totalEasy = 0, totalMedium = 0, totalHard = 0;
Object.values(domains).forEach(d => {
    total += d.problems.length;
    totalEasy += d.problems.filter(p => p.difficulty === 'Easy').length;
    totalMedium += d.problems.filter(p => p.difficulty === 'Medium').length;
    totalHard += d.problems.filter(p => p.difficulty === 'Hard').length;
});
console.log(`\nTotal: ${total} problems (Easy:${totalEasy}, Medium:${totalMedium}, Hard:${totalHard})`);
console.log('data.js generated successfully!');
