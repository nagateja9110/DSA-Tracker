/**
 * Heap Renderer
 * Visualizes heaps as binary trees with array representation
 */

class HeapRenderer {
    constructor(container) {
        this.container = container;
        this.nodeRadius = 22;
        this.levelHeight = 70;
    }

    /**
     * Render a heap (shows both tree and array view)
     * @param {string} name - Heap name
     * @param {Array} heapArray - Heap as array
     * @param {Object} highlights - Highlight info
     * @param {string} type - 'min' or 'max' heap
     */
    render(name, heapArray, highlights = {}, type = 'max') {
        const wrapper = document.createElement('div');
        wrapper.className = 'heap-wrapper';
        wrapper.innerHTML = `
            <div class="heap-label">${name} (${type === 'min' ? 'Min' : 'Max'} Heap)</div>
            <div class="heap-views">
                <div class="heap-tree-view">
                    <div class="view-label">Tree View</div>
                    <div class="heap-tree-container" id="heap-tree-${name}"></div>
                </div>
                <div class="heap-array-view">
                    <div class="view-label">Array View</div>
                    <div class="heap-array-container" id="heap-array-${name}"></div>
                </div>
            </div>
        `;
        
        // Render tree view
        const treeContainer = wrapper.querySelector('.heap-tree-container');
        if (heapArray.length === 0) {
            treeContainer.innerHTML = '<div class="null-pointer">Empty heap</div>';
        } else {
            this.renderTreeView(treeContainer, heapArray, name, highlights);
        }
        
        // Render array view
        const arrayContainer = wrapper.querySelector('.heap-array-container');
        this.renderArrayView(arrayContainer, heapArray, name, highlights);

        this.container.appendChild(wrapper);
    }

    /**
     * Render tree view of heap
     */
    renderTreeView(container, heapArray, name, highlights) {
        const height = Math.ceil(Math.log2(heapArray.length + 1));
        const width = Math.max(400, Math.pow(2, height) * 50);
        const svgHeight = height * this.levelHeight + 60;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('class', 'heap-tree-svg');
        
        // Calculate positions
        const positions = this.calculatePositions(heapArray.length, width, this.levelHeight);
        
        // Draw edges
        for (let i = 0; i < heapArray.length; i++) {
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;
            
            if (leftChild < heapArray.length) {
                this.drawEdge(svg, positions[i], positions[leftChild], highlights, i, leftChild);
            }
            if (rightChild < heapArray.length) {
                this.drawEdge(svg, positions[i], positions[rightChild], highlights, i, rightChild);
            }
        }
        
        // Draw nodes
        heapArray.forEach((value, index) => {
            this.drawNode(svg, positions[index], value, index, highlights);
        });
        
        container.appendChild(svg);
    }

    /**
     * Calculate positions for heap tree nodes
     */
    calculatePositions(size, width, levelHeight) {
        const positions = [];
        
        for (let i = 0; i < size; i++) {
            const level = Math.floor(Math.log2(i + 1));
            const posInLevel = i - (Math.pow(2, level) - 1);
            const nodesInLevel = Math.pow(2, level);
            const spacing = width / (nodesInLevel + 1);
            
            positions.push({
                x: spacing * (posInLevel + 1),
                y: level * levelHeight + 40
            });
        }
        
        return positions;
    }

    /**
     * Draw edge between nodes
     */
    drawEdge(svg, from, to, highlights, fromIdx, toIdx) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y + this.nodeRadius);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y - this.nodeRadius);
        line.setAttribute('class', 'heap-edge');
        
        if (highlights.swapping && 
            highlights.swapping.includes(fromIdx) && 
            highlights.swapping.includes(toIdx)) {
            line.classList.add('active');
        }
        
        svg.appendChild(line);
    }

    /**
     * Draw heap node
     */
    drawNode(svg, pos, value, index, highlights) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
        g.setAttribute('class', 'heap-node-group');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', this.nodeRadius);
        circle.setAttribute('class', 'heap-node-circle');
        
        // Apply highlights
        if (highlights.comparing && highlights.comparing.includes(index)) {
            circle.classList.add('comparing');
        }
        if (highlights.swapping && highlights.swapping.includes(index)) {
            circle.classList.add('swapping');
        }
        if (highlights.active === index) {
            circle.classList.add('active');
        }
        if (index === 0) {
            circle.classList.add('root');
        }
        
        g.appendChild(circle);
        
        // Value text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'heap-node-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.textContent = String(value);
        g.appendChild(text);
        
        // Index label
        const indexText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        indexText.setAttribute('class', 'heap-node-index');
        indexText.setAttribute('text-anchor', 'middle');
        indexText.setAttribute('y', this.nodeRadius + 12);
        indexText.textContent = `[${index}]`;
        g.appendChild(indexText);
        
        svg.appendChild(g);
    }

    /**
     * Render array view of heap
     */
    renderArrayView(container, heapArray, name, highlights) {
        const arrayDiv = document.createElement('div');
        arrayDiv.className = 'heap-array';
        
        heapArray.forEach((value, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'heap-array-item';
            
            if (highlights.comparing && highlights.comparing.includes(index)) {
                itemDiv.classList.add('comparing');
            }
            if (highlights.swapping && highlights.swapping.includes(index)) {
                itemDiv.classList.add('swapping');
            }
            if (index === 0) {
                itemDiv.classList.add('root');
            }
            
            itemDiv.innerHTML = `
                <span class="item-value">${value}</span>
                <span class="item-index">${index}</span>
            `;
            
            arrayDiv.appendChild(itemDiv);
        });
        
        container.appendChild(arrayDiv);
    }

    /**
     * Animate heapify operation
     */
    async animateHeapify(name, heapArray, index, duration = 300) {
        // Highlight the node being heapified
        await this.highlightNodes(name, [index], 'active', duration);
        
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        
        // Highlight children for comparison
        const children = [];
        if (leftChild < heapArray.length) children.push(leftChild);
        if (rightChild < heapArray.length) children.push(rightChild);
        
        if (children.length > 0) {
            await this.highlightNodes(name, children, 'comparing', duration);
        }
    }

    /**
     * Animate swap operation
     */
    async animateSwap(name, i, j, duration = 300) {
        await this.highlightNodes(name, [i, j], 'swapping', duration);
    }

    /**
     * Highlight nodes
     */
    highlightNodes(name, indices, type, duration) {
        return new Promise(resolve => {
            // Update tree view
            const treeNodes = document.querySelectorAll(`#heap-tree-${name} .heap-node-group`);
            // Update array view
            const arrayItems = document.querySelectorAll(`#heap-array-${name} .heap-array-item`);
            
            indices.forEach(i => {
                if (treeNodes[i]) {
                    const circle = treeNodes[i].querySelector('circle');
                    circle.classList.add(type);
                }
                if (arrayItems[i]) {
                    arrayItems[i].classList.add(type);
                }
            });
            
            setTimeout(() => {
                indices.forEach(i => {
                    if (treeNodes[i]) {
                        const circle = treeNodes[i].querySelector('circle');
                        circle.classList.remove(type);
                    }
                    if (arrayItems[i]) {
                        arrayItems[i].classList.remove(type);
                    }
                });
                resolve();
            }, duration);
        });
    }

    /**
     * Clear container
     */
    clear() {
        this.container.innerHTML = '';
    }
}

// Add styles
const heapStyles = document.createElement('style');
heapStyles.textContent = `
    .heap-wrapper {
        margin-bottom: 20px;
    }
    
    .heap-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .heap-views {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .view-label {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 8px;
    }
    
    .heap-tree-container {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 10px;
        overflow-x: auto;
    }
    
    .heap-tree-svg {
        display: block;
        margin: 0 auto;
    }
    
    .heap-edge {
        stroke: var(--viz-edge);
        stroke-width: 2;
        transition: all 0.3s ease;
    }
    
    .heap-edge.active {
        stroke: var(--viz-edge-active);
        stroke-width: 3;
    }
    
    .heap-node-circle {
        fill: var(--accent-primary);
        stroke: var(--accent-primary);
        stroke-width: 2;
        transition: all 0.3s ease;
    }
    
    .heap-node-circle.root {
        fill: var(--accent-success);
        stroke: var(--accent-success);
    }
    
    .heap-node-circle.comparing {
        fill: var(--accent-warning);
        stroke: var(--accent-warning);
        filter: drop-shadow(0 0 10px rgba(210, 153, 34, 0.5));
    }
    
    .heap-node-circle.swapping {
        fill: var(--accent-danger);
        stroke: var(--accent-danger);
        filter: drop-shadow(0 0 10px rgba(248, 81, 73, 0.5));
        transform: scale(1.15);
    }
    
    .heap-node-circle.active {
        fill: var(--viz-node-active);
        stroke: var(--viz-node-active);
        filter: drop-shadow(0 0 10px rgba(88, 166, 255, 0.5));
    }
    
    .heap-node-text {
        fill: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        pointer-events: none;
    }
    
    .heap-node-index {
        fill: var(--text-muted);
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
    }
    
    .heap-array-container {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 12px;
    }
    
    .heap-array {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .heap-array-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 45px;
        height: 45px;
        background: var(--accent-primary);
        border-radius: 6px;
        transition: all 0.3s ease;
    }
    
    .heap-array-item.root {
        background: var(--accent-success);
    }
    
    .heap-array-item.comparing {
        background: var(--accent-warning);
        transform: scale(1.1);
    }
    
    .heap-array-item.swapping {
        background: var(--accent-danger);
        transform: scale(1.15);
    }
    
    .heap-array-item .item-value {
        color: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
    }
    
    .heap-array-item .item-index {
        color: rgba(255, 255, 255, 0.6);
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
    }
`;
document.head.appendChild(heapStyles);

// Export
window.HeapRenderer = HeapRenderer;
