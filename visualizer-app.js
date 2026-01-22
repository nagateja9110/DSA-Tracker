/**
 * DSA Code Visualizer - Main Application
 * Connects the interpreter, renderers, and UI components
 */

class VisualizerApp {
    constructor() {
        this.editor = null;
        this.interpreter = new DSAInterpreter();
        this.renderers = {};
        this.states = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.speed = 1;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        await this.initMonacoEditor();
        this.initRenderers();
        this.initEventListeners();
        this.initResizer();
        this.loadDefaultCode();
        this.showToast('Welcome! Paste your code and click Visualize 🚀', 'info');
    }

    /**
     * Initialize Monaco Editor
     */
    initMonacoEditor() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { 
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
                }
            });

            require(['vs/editor/editor.main'], () => {
                // Define custom dark theme
                monaco.editor.defineTheme('dsa-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: '6a9955' },
                        { token: 'keyword', foreground: 'c586c0' },
                        { token: 'identifier', foreground: '9cdcfe' },
                        { token: 'string', foreground: 'ce9178' },
                        { token: 'number', foreground: 'b5cea8' },
                        { token: 'type', foreground: '4ec9b0' }
                    ],
                    colors: {
                        'editor.background': '#0d1117',
                        'editor.foreground': '#e6edf3',
                        'editor.lineHighlightBackground': '#161b22',
                        'editorCursor.foreground': '#58a6ff',
                        'editor.selectionBackground': '#264f78',
                        'editorLineNumber.foreground': '#6e7681'
                    }
                });

                this.editor = monaco.editor.create(document.getElementById('monacoEditor'), {
                    value: '',
                    language: 'javascript',
                    theme: 'dsa-dark',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    tabSize: 4,
                    automaticLayout: true,
                    lineDecorationsWidth: 10,
                    padding: { top: 10, bottom: 10 }
                });

                resolve();
            });
        });
    }

    /**
     * Initialize data structure renderers
     */
    initRenderers() {
        const canvas = document.getElementById('visualizationCanvas');
        
        this.renderers = {
            array: new ArrayRenderer(canvas),
            linkedList: new LinkedListRenderer(canvas),
            tree: new TreeRenderer(canvas),
            stackQueue: new StackQueueRenderer(canvas),
            graph: new GraphRenderer(canvas),
            heap: new HeapRenderer(canvas)
        };
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Run visualization
        document.getElementById('runBtn').addEventListener('click', () => this.runVisualization());
        
        // Playback controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('stepForwardBtn').addEventListener('click', () => this.stepForward());
        document.getElementById('stepBackBtn').addEventListener('click', () => this.stepBack());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // Speed control
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = `${this.speed / 5}x`;
        });
        
        // Example selector
        document.getElementById('exampleSelect').addEventListener('change', (e) => {
            if (e.target.value && EXAMPLES[e.target.value]) {
                this.loadExample(e.target.value);
            }
        });
        
        // Format code
        document.getElementById('formatBtn').addEventListener('click', () => this.formatCode());
        
        // Clear code
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.editor.setValue('');
            this.clearVisualization();
        });
        
        // Clear console
        document.getElementById('clearConsole').addEventListener('click', () => {
            document.getElementById('consoleOutput').innerHTML = 
                '<div class="console-welcome"><span class="console-line">// Console cleared</span></div>';
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Visualization tabs
        document.querySelectorAll('.viz-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    /**
     * Initialize panel resizer
     */
    initResizer() {
        const resizer = document.getElementById('resizer');
        const leftPanel = document.querySelector('.left-panel');
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = leftPanel.offsetWidth;
            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const width = startWidth + (e.clientX - startX);
            leftPanel.style.width = `${Math.max(300, Math.min(800, width))}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        });
    }

    /**
     * Run the visualization
     */
    runVisualization() {
        const code = this.editor.getValue();
        
        if (!code.trim()) {
            this.showToast('Please enter some code first!', 'error');
            return;
        }

        // Clear previous visualization
        this.clearVisualization();
        
        try {
            // Parse and execute code
            const result = this.interpreter.parse(code);
            
            if (!result.success) {
                this.showToast(`Parse error: ${result.error}`, 'error');
                this.logToConsole(`Error at line ${result.line}: ${result.error}`, 'error');
                return;
            }
            
            // Execute and collect states
            this.executeAndCollectStates();
            
            // Enable controls
            this.enableControls();
            
            // Show first state
            this.renderCurrentState();
            
            this.showToast(`Ready! ${this.states.length} steps to visualize`, 'success');
            this.logToConsole(`Parsed ${this.states.length} execution steps`, 'info');
            
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
            this.logToConsole(error.message, 'error');
            console.error(error);
        }
    }

    /**
     * Execute code and collect state snapshots
     */
    executeAndCollectStates() {
        this.states = [];
        this.currentStep = 0;
        
        // Clear console output tracking
        document.getElementById('consoleOutput').innerHTML = 
            '<div class="console-welcome"><span class="console-line">// Console output</span></div>';
        
        // Execute each step and capture state
        const steps = this.interpreter.steps;
        let lastConsoleLength = 0;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            try {
                // Execute the step and get state snapshot
                const state = step.execute();
                
                // Add step info to state
                state.stepInfo = {
                    type: step.type,
                    line: step.line,
                    code: step.code,
                    description: step.description
                };
                
                // Track new console messages for this step
                if (state.console && state.console.length > lastConsoleLength) {
                    state.newConsoleMessages = state.console.slice(lastConsoleLength);
                    lastConsoleLength = state.console.length;
                } else {
                    state.newConsoleMessages = [];
                }
                
                this.states.push(state);
                
            } catch (error) {
                console.warn(`Step ${i} execution warning:`, error);
                // Continue anyway to show partial progress
                this.states.push({
                    variables: {},
                    arrays: {},
                    stepInfo: {
                        type: step.type,
                        line: step.line,
                        code: step.code || '',
                        description: step.description + ' (error)'
                    },
                    newConsoleMessages: []
                });
            }
        }
        
        this.updateProgress();
    }

    /**
     * Render current state
     */
    renderCurrentState() {
        if (this.states.length === 0) return;
        
        const state = this.states[this.currentStep];
        const canvas = document.getElementById('visualizationCanvas');
        
        // Clear canvas
        canvas.innerHTML = '';
        
        // Highlight current line in editor
        this.highlightLine(state.stepInfo.line);
        
        // Create step info display with code preview
        const stepInfo = document.createElement('div');
        stepInfo.className = 'step-info';
        stepInfo.innerHTML = `
            <div class="step-header">
                <span class="step-number">Step ${this.currentStep + 1}</span>
                <span class="step-type">${state.stepInfo.type}</span>
            </div>
            <div class="step-code">${this.escapeHtml(state.stepInfo.code || '')}</div>
            <div class="step-description">${state.stepInfo.description}</div>
        `;
        canvas.appendChild(stepInfo);
        
        // Render data structures
        this.renderDataStructures(state);
        
        // Update variable inspector
        this.updateVariableInspector(state.variables);
        
        // Show new console messages for this step
        if (state.newConsoleMessages && state.newConsoleMessages.length > 0) {
            state.newConsoleMessages.forEach(log => {
                this.logToConsole(log.message, log.type);
            });
        }
        
        // Update progress
        this.updateProgress();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render all detected data structures
     */
    renderDataStructures(state) {
        // Render arrays
        for (const [name, arr] of Object.entries(state.arrays || {})) {
            if (Array.isArray(arr)) {
                const highlights = this.getHighlightsForStep(name);
                this.renderers.array.render(name, arr, highlights);
            }
        }
        
        // Render linked lists
        for (const [name, head] of Object.entries(state.linkedLists || {})) {
            if (head && typeof head === 'object' && 'next' in head) {
                this.renderers.linkedList.render(name, head, {});
            }
        }
        
        // Render trees
        for (const [name, root] of Object.entries(state.trees || {})) {
            if (root && typeof root === 'object' && ('left' in root || 'right' in root)) {
                this.renderers.tree.render(name, root, {});
            }
        }
        
        // Render graphs
        for (const [name, adjList] of Object.entries(state.graphs || {})) {
            if (typeof adjList === 'object' && !Array.isArray(adjList)) {
                this.renderers.graph.render(name, adjList, {});
            }
        }
        
        // Check variables for more data structures
        for (const [name, data] of Object.entries(state.variables || {})) {
            if (!data) continue;
            
            const value = data.value;
            
            // Stack detection (array with push/pop pattern)
            if (data.dsType === 'stack' && Array.isArray(value)) {
                this.renderers.stackQueue.renderStack(name, value, {});
            }
            
            // Queue detection
            if (data.dsType === 'queue' && Array.isArray(value)) {
                this.renderers.stackQueue.renderQueue(name, value, {});
            }
            
            // Heap detection
            if (data.dsType === 'heap' && Array.isArray(value)) {
                this.renderers.heap.render(name, value, {});
            }
        }
    }

    /**
     * Get highlights for current step
     */
    getHighlightsForStep(arrayName) {
        const step = this.interpreter.getStep(this.currentStep);
        if (!step) return {};
        
        // TODO: Implement more sophisticated highlight detection
        return {};
    }

    /**
     * Highlight line in editor
     */
    highlightLine(lineNumber) {
        if (!this.editor || !lineNumber) return;
        
        // Remove previous decorations
        this.editor.deltaDecorations(
            this.editor.getModel().getAllDecorations()
                .filter(d => d.options.className === 'line-highlight')
                .map(d => d.id),
            []
        );
        
        // Add new decoration
        this.editor.deltaDecorations([], [{
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'line-highlight',
                linesDecorationsClassName: 'line-decoration'
            }
        }]);
        
        // Scroll to line
        this.editor.revealLineInCenter(lineNumber);
    }

    /**
     * Update variable inspector
     */
    updateVariableInspector(variables) {
        const inspector = document.getElementById('variableInspector');
        
        if (!variables || Object.keys(variables).length === 0) {
            inspector.innerHTML = '<div class="inspector-placeholder">No variables yet</div>';
            return;
        }
        
        let html = '';
        for (const [name, data] of Object.entries(variables)) {
            if (!data) continue;
            
            const typeLabel = this.getTypeLabel(data.type, data.dsType);
            const valueStr = this.formatValueForDisplay(data.value);
            
            html += `
                <div class="variable-item">
                    <span class="var-name">${name}</span>
                    <span class="var-type">${typeLabel}</span>
                    <span class="var-value">${valueStr}</span>
                </div>
            `;
        }
        
        inspector.innerHTML = html;
    }

    /**
     * Get type label for variable
     */
    getTypeLabel(type, dsType) {
        if (dsType) {
            return dsType.charAt(0).toUpperCase() + dsType.slice(1);
        }
        return type || 'unknown';
    }

    /**
     * Format value for display in inspector
     */
    formatValueForDisplay(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            if (value.length > 10) {
                return `[${value.slice(0, 10).join(', ')}, ...]`;
            }
            return `[${value.join(', ')}]`;
        }
        if (typeof value === 'object') {
            const str = JSON.stringify(value);
            return str.length > 50 ? str.slice(0, 50) + '...' : str;
        }
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        return String(value);
    }

    /**
     * Step forward
     */
    stepForward() {
        if (this.currentStep < this.states.length - 1) {
            this.currentStep++;
            this.renderCurrentState();
        }
    }

    /**
     * Step back
     */
    stepBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderCurrentState();
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Play animation
     */
    play() {
        if (this.states.length === 0) return;
        
        this.isPlaying = true;
        document.querySelector('#playPauseBtn .btn-icon').textContent = '⏸️';
        
        const delay = 1000 / this.speed;
        
        this.playInterval = setInterval(() => {
            if (this.currentStep < this.states.length - 1) {
                this.currentStep++;
                this.renderCurrentState();
            } else {
                this.pause();
            }
        }, delay);
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPlaying = false;
        document.querySelector('#playPauseBtn .btn-icon').textContent = '▶️';
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    /**
     * Reset to beginning
     */
    reset() {
        this.pause();
        this.currentStep = 0;
        this.renderCurrentState();
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const counter = document.getElementById('stepCounter');
        const fill = document.getElementById('progressFill');
        
        counter.textContent = `Step: ${this.currentStep + 1} / ${this.states.length}`;
        
        const progress = this.states.length > 0 
            ? ((this.currentStep + 1) / this.states.length) * 100 
            : 0;
        fill.style.width = `${progress}%`;
    }

    /**
     * Enable playback controls
     */
    enableControls() {
        document.getElementById('stepForwardBtn').disabled = false;
        document.getElementById('stepBackBtn').disabled = false;
        document.getElementById('playPauseBtn').disabled = false;
        document.getElementById('resetBtn').disabled = false;
    }

    /**
     * Clear visualization
     */
    clearVisualization() {
        this.pause();
        this.states = [];
        this.currentStep = 0;
        this.interpreter.reset();
        
        const canvas = document.getElementById('visualizationCanvas');
        canvas.innerHTML = `
            <div class="viz-placeholder">
                <span class="placeholder-icon">🚀</span>
                <p>Paste your code and click <strong>Visualize</strong> to see the magic!</p>
            </div>
        `;
        
        document.getElementById('variableInspector').innerHTML = 
            '<div class="inspector-placeholder"><p>Variables will appear here during execution</p></div>';
        
        document.getElementById('stepCounter').textContent = 'Step: 0 / 0';
        document.getElementById('progressFill').style.width = '0%';
        
        // Disable controls
        document.getElementById('stepForwardBtn').disabled = true;
        document.getElementById('stepBackBtn').disabled = true;
        document.getElementById('playPauseBtn').disabled = true;
        document.getElementById('resetBtn').disabled = true;
    }

    /**
     * Load an example
     */
    loadExample(exampleKey) {
        const example = EXAMPLES[exampleKey];
        if (example) {
            this.editor.setValue(example.code);
            this.clearVisualization();
            this.showToast(`Loaded: ${example.name}`, 'info');
        }
        
        // Reset selector
        document.getElementById('exampleSelect').value = '';
    }

    /**
     * Load default code
     */
    loadDefaultCode() {
        const defaultCode = `// Welcome to DSA Code Visualizer! 🚀
// Try these examples:
// 1. Select an example from the dropdown above
// 2. Or write your own code below

// Example: Bubble Sort
let arr = [64, 34, 25, 12, 22, 11, 90];

for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            // Swap elements
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}

console.log("Sorted array:", arr);`;

        this.editor.setValue(defaultCode);
    }

    /**
     * Format code using Monaco's built-in formatter
     */
    formatCode() {
        this.editor.getAction('editor.action.formatDocument').run();
        this.showToast('Code formatted!', 'success');
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const body = document.body;
        const btn = document.getElementById('themeToggle');
        
        if (body.getAttribute('data-theme') === 'light') {
            body.removeAttribute('data-theme');
            btn.textContent = '🌙';
            monaco.editor.setTheme('dsa-dark');
        } else {
            body.setAttribute('data-theme', 'light');
            btn.textContent = '☀️';
            monaco.editor.setTheme('vs');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Don't trigger if in editor
        if (document.activeElement === document.querySelector('.monaco-editor textarea')) {
            if (e.key === 'Escape') {
                document.activeElement.blur();
            }
            return;
        }
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.stepForward();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.stepBack();
                break;
            case 'r':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.reset();
                }
                break;
            case 'Enter':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.runVisualization();
                }
                break;
        }
    }

    /**
     * Log to console
     */
    logToConsole(message, type = 'log') {
        const console = document.getElementById('consoleOutput');
        const welcome = console.querySelector('.console-welcome');
        if (welcome) welcome.remove();
        
        const line = document.createElement('span');
        line.className = `console-line console-${type}`;
        line.textContent = `> ${message}`;
        console.appendChild(line);
        console.scrollTop = console.scrollHeight;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add additional styles for step info
const appStyles = document.createElement('style');
appStyles.textContent = `
    .step-info {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
    }
    
    .step-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }
    
    .step-number {
        font-size: 12px;
        font-weight: 600;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.15);
        padding: 4px 10px;
        border-radius: 12px;
    }
    
    .step-type {
        font-size: 11px;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 3px 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .step-code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        color: var(--text-primary);
        background: var(--bg-primary);
        padding: 10px 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        border-left: 3px solid var(--accent-primary);
        overflow-x: auto;
    }
    
    .step-description {
        font-size: 13px;
        color: var(--text-secondary);
    }
    
    .step-description strong {
        color: var(--accent-primary);
    }
    
    .line-highlight {
        background: rgba(88, 166, 255, 0.15) !important;
    }
    
    .line-decoration {
        background: var(--accent-primary);
        width: 3px !important;
        margin-left: 3px;
    }
`;
document.head.appendChild(appStyles);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VisualizerApp();
});
