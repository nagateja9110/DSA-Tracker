/**
 * Array Renderer
 * Visualizes arrays with bars, highlighting comparisons and swaps
 */

class ArrayRenderer {
    constructor(container) {
        this.container = container;
        this.currentHighlights = [];
    }

    /**
     * Render an array as visual bars
     * @param {string} name - Array name
     * @param {Array} arr - Array to render
     * @param {Object} highlights - Highlight information
     */
    render(name, arr, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'array-wrapper';
        wrapper.innerHTML = `
            <div class="array-label">${name}</div>
            <div class="array-bars" id="array-${name}"></div>
        `;
        
        const barsContainer = wrapper.querySelector('.array-bars');
        
        // Calculate max value for scaling
        const maxVal = Math.max(...arr.filter(v => typeof v === 'number'), 1);
        const minHeight = 30;
        const maxHeight = 180;
        
        arr.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            
            // Apply highlight classes
            if (highlights.comparing && highlights.comparing.includes(index)) {
                bar.classList.add('comparing');
            }
            if (highlights.swapping && highlights.swapping.includes(index)) {
                bar.classList.add('swapping');
            }
            if (highlights.sorted && highlights.sorted.includes(index)) {
                bar.classList.add('sorted');
            }
            if (highlights.active === index) {
                bar.classList.add('active');
            }

            // Calculate bar height
            let height = minHeight;
            if (typeof value === 'number') {
                height = Math.max(minHeight, (value / maxVal) * maxHeight);
            }

            bar.innerHTML = `
                <div class="bar-visual" style="height: ${height}px"></div>
                <div class="bar-value">${this.formatValue(value)}</div>
                <div class="bar-index">${index}</div>
            `;
            
            barsContainer.appendChild(bar);
        });

        this.container.appendChild(wrapper);
    }

    /**
     * Render array as a grid (for 2D arrays)
     */
    renderGrid(name, arr) {
        const wrapper = document.createElement('div');
        wrapper.className = 'array-grid-wrapper';
        wrapper.innerHTML = `
            <div class="array-label">${name}</div>
            <div class="array-grid" id="grid-${name}"></div>
        `;
        
        const grid = wrapper.querySelector('.array-grid');
        
        if (Array.isArray(arr[0])) {
            // 2D array
            arr.forEach((row, i) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'grid-row';
                
                row.forEach((cell, j) => {
                    const cellDiv = document.createElement('div');
                    cellDiv.className = 'grid-cell';
                    cellDiv.textContent = this.formatValue(cell);
                    rowDiv.appendChild(cellDiv);
                });
                
                grid.appendChild(rowDiv);
            });
        } else {
            // 1D array as horizontal grid
            const rowDiv = document.createElement('div');
            rowDiv.className = 'grid-row';
            
            arr.forEach((cell, i) => {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';
                cellDiv.innerHTML = `
                    <span class="cell-value">${this.formatValue(cell)}</span>
                    <span class="cell-index">${i}</span>
                `;
                rowDiv.appendChild(cellDiv);
            });
            
            grid.appendChild(rowDiv);
        }

        this.container.appendChild(wrapper);
    }

    /**
     * Animate swap between two indices
     */
    animateSwap(name, i, j, duration = 300) {
        return new Promise(resolve => {
            const bars = document.querySelectorAll(`#array-${name} .array-bar`);
            if (!bars[i] || !bars[j]) {
                resolve();
                return;
            }

            const bar1 = bars[i];
            const bar2 = bars[j];
            
            bar1.classList.add('swapping');
            bar2.classList.add('swapping');

            // Calculate positions
            const rect1 = bar1.getBoundingClientRect();
            const rect2 = bar2.getBoundingClientRect();
            const diff = rect2.left - rect1.left;

            bar1.style.transform = `translateX(${diff}px)`;
            bar2.style.transform = `translateX(${-diff}px)`;

            setTimeout(() => {
                bar1.style.transform = '';
                bar2.style.transform = '';
                bar1.classList.remove('swapping');
                bar2.classList.remove('swapping');
                resolve();
            }, duration);
        });
    }

    /**
     * Highlight comparison between indices
     */
    highlightComparison(name, indices, duration = 200) {
        return new Promise(resolve => {
            const bars = document.querySelectorAll(`#array-${name} .array-bar`);
            
            indices.forEach(i => {
                if (bars[i]) {
                    bars[i].classList.add('comparing');
                }
            });

            setTimeout(() => {
                indices.forEach(i => {
                    if (bars[i]) {
                        bars[i].classList.remove('comparing');
                    }
                });
                resolve();
            }, duration);
        });
    }

    /**
     * Mark indices as sorted
     */
    markSorted(name, indices) {
        const bars = document.querySelectorAll(`#array-${name} .array-bar`);
        
        indices.forEach(i => {
            if (bars[i]) {
                bars[i].classList.add('sorted');
            }
        });
    }

    /**
     * Update array values with animation
     */
    updateArray(name, arr, changedIndices = []) {
        const bars = document.querySelectorAll(`#array-${name} .array-bar`);
        const maxVal = Math.max(...arr.filter(v => typeof v === 'number'), 1);
        const minHeight = 30;
        const maxHeight = 180;

        arr.forEach((value, index) => {
            if (bars[index]) {
                const bar = bars[index];
                const visual = bar.querySelector('.bar-visual');
                const valueEl = bar.querySelector('.bar-value');

                // Update height
                let height = minHeight;
                if (typeof value === 'number') {
                    height = Math.max(minHeight, (value / maxVal) * maxHeight);
                }
                visual.style.height = `${height}px`;
                
                // Update value text
                valueEl.textContent = this.formatValue(value);

                // Highlight changes
                if (changedIndices.includes(index)) {
                    bar.classList.add('changed');
                    setTimeout(() => bar.classList.remove('changed'), 300);
                }
            }
        });
    }

    /**
     * Clear the container
     */
    clear() {
        this.container.innerHTML = '';
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'T' : 'F';
        if (typeof value === 'string') return value.length > 5 ? value.slice(0, 5) + '…' : value;
        return String(value);
    }
}

// Add additional CSS for grid view
const gridStyles = document.createElement('style');
gridStyles.textContent = `
    .array-wrapper {
        margin-bottom: 20px;
    }
    
    .array-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .array-grid-wrapper {
        margin-bottom: 20px;
    }
    
    .array-grid {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .grid-row {
        display: flex;
        gap: 2px;
    }
    
    .grid-cell {
        width: 50px;
        height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .cell-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .cell-index {
        font-size: 9px;
        color: var(--text-muted);
    }
    
    .array-bar.changed .bar-visual {
        animation: pulse-change 0.3s ease;
    }
    
    @keyframes pulse-change {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(gridStyles);

// Export
window.ArrayRenderer = ArrayRenderer;
