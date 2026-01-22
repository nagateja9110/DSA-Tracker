/**
 * Linked List Renderer
 * Visualizes linked lists with nodes and arrows
 */

class LinkedListRenderer {
    constructor(container) {
        this.container = container;
    }

    /**
     * Render a linked list
     * @param {string} name - Variable name
     * @param {Object} head - Head node of the list
     * @param {Object} highlights - Highlight information
     */
    render(name, head, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'linkedlist-wrapper';
        wrapper.innerHTML = `
            <div class="list-label">${name}</div>
            <div class="linkedlist-container" id="list-${name}"></div>
        `;
        
        const listContainer = wrapper.querySelector('.linkedlist-container');
        
        if (!head) {
            listContainer.innerHTML = '<div class="null-pointer">null (empty list)</div>';
            this.container.appendChild(wrapper);
            return;
        }

        // Traverse and render nodes
        let current = head;
        let index = 0;
        const visited = new Set();
        
        while (current !== null && !visited.has(current)) {
            visited.add(current);
            
            const nodeElement = this.createNodeElement(current, index, highlights);
            listContainer.appendChild(nodeElement);
            
            // Add arrow if there's a next node
            if (current.next !== null) {
                const arrow = document.createElement('span');
                arrow.className = 'node-arrow';
                arrow.textContent = '→';
                
                if (highlights.activeEdge && highlights.activeEdge.includes(index)) {
                    arrow.classList.add('active');
                }
                
                listContainer.appendChild(arrow);
            }
            
            current = current.next;
            index++;
            
            // Prevent infinite loops
            if (index > 100) {
                const cycleIndicator = document.createElement('span');
                cycleIndicator.className = 'cycle-indicator';
                cycleIndicator.textContent = '⟳ (cycle detected)';
                listContainer.appendChild(cycleIndicator);
                break;
            }
        }
        
        // Add null pointer at end
        if (current === null) {
            const nullPointer = document.createElement('span');
            nullPointer.className = 'null-pointer';
            nullPointer.innerHTML = '→ <em>null</em>';
            listContainer.appendChild(nullPointer);
        }

        this.container.appendChild(wrapper);
    }

    /**
     * Create a node element
     */
    createNodeElement(node, index, highlights) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'list-node';
        
        const nodeBox = document.createElement('div');
        nodeBox.className = 'node-box';
        
        // Apply highlights
        if (highlights.active === index || (Array.isArray(highlights.active) && highlights.active.includes(index))) {
            nodeBox.classList.add('active');
        }
        if (highlights.visited && highlights.visited.includes(index)) {
            nodeBox.classList.add('visited');
        }
        if (highlights.current === index) {
            nodeBox.classList.add('current');
        }
        
        nodeBox.innerHTML = `
            <div class="node-value">${this.formatValue(node.val)}</div>
            <div class="node-label">${index}</div>
        `;
        
        nodeDiv.appendChild(nodeBox);
        
        // Show pointer labels if they exist
        if (highlights.pointers) {
            for (const [ptrName, ptrIndex] of Object.entries(highlights.pointers)) {
                if (ptrIndex === index) {
                    const ptrLabel = document.createElement('div');
                    ptrLabel.className = 'pointer-label';
                    ptrLabel.textContent = ptrName;
                    nodeDiv.appendChild(ptrLabel);
                }
            }
        }
        
        return nodeDiv;
    }

    /**
     * Render a doubly linked list
     */
    renderDoubly(name, head, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'linkedlist-wrapper doubly';
        wrapper.innerHTML = `
            <div class="list-label">${name} (doubly linked)</div>
            <div class="linkedlist-container doubly" id="list-${name}"></div>
        `;
        
        const listContainer = wrapper.querySelector('.linkedlist-container');
        
        if (!head) {
            listContainer.innerHTML = '<div class="null-pointer">null (empty list)</div>';
            this.container.appendChild(wrapper);
            return;
        }

        // Traverse and render
        let current = head;
        let index = 0;
        
        while (current !== null && index < 100) {
            const nodeElement = this.createDoublyNodeElement(current, index, highlights);
            listContainer.appendChild(nodeElement);
            
            if (current.next !== null) {
                const arrows = document.createElement('div');
                arrows.className = 'doubly-arrows';
                arrows.innerHTML = `
                    <span class="arrow-forward">→</span>
                    <span class="arrow-backward">←</span>
                `;
                listContainer.appendChild(arrows);
            }
            
            current = current.next;
            index++;
        }

        this.container.appendChild(wrapper);
    }

    /**
     * Create doubly linked list node element
     */
    createDoublyNodeElement(node, index, highlights) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'list-node doubly-node';
        
        const nodeBox = document.createElement('div');
        nodeBox.className = 'node-box doubly';
        
        if (highlights.active === index) {
            nodeBox.classList.add('active');
        }
        
        nodeBox.innerHTML = `
            <div class="node-prev-arrow">◀</div>
            <div class="node-content">
                <div class="node-value">${this.formatValue(node.val)}</div>
                <div class="node-label">${index}</div>
            </div>
            <div class="node-next-arrow">▶</div>
        `;
        
        nodeDiv.appendChild(nodeBox);
        return nodeDiv;
    }

    /**
     * Animate node insertion
     */
    animateInsert(name, index, value, duration = 300) {
        return new Promise(resolve => {
            const nodes = document.querySelectorAll(`#list-${name} .list-node`);
            
            if (index < nodes.length) {
                const newNode = document.createElement('div');
                newNode.className = 'list-node inserting';
                newNode.innerHTML = `
                    <div class="node-box active">
                        <div class="node-value">${this.formatValue(value)}</div>
                        <div class="node-label">new</div>
                    </div>
                `;
                
                // Insert before target or at end
                if (nodes[index]) {
                    nodes[index].parentNode.insertBefore(newNode, nodes[index]);
                }
                
                setTimeout(() => {
                    newNode.classList.remove('inserting');
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }

    /**
     * Animate node deletion
     */
    animateDelete(name, index, duration = 300) {
        return new Promise(resolve => {
            const nodes = document.querySelectorAll(`#list-${name} .list-node`);
            
            if (nodes[index]) {
                nodes[index].classList.add('deleting');
                
                setTimeout(() => {
                    nodes[index].remove();
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }

    /**
     * Highlight a node
     */
    highlightNode(name, index, type = 'active') {
        const nodes = document.querySelectorAll(`#list-${name} .list-node .node-box`);
        
        // Clear previous highlights
        nodes.forEach(n => n.classList.remove('active', 'visited', 'current'));
        
        if (nodes[index]) {
            nodes[index].classList.add(type);
        }
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
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
}

// Add additional styles
const listStyles = document.createElement('style');
listStyles.textContent = `
    .linkedlist-wrapper {
        margin-bottom: 20px;
    }
    
    .list-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .pointer-label {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-purple);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .list-node {
        position: relative;
    }
    
    .cycle-indicator {
        color: var(--accent-warning);
        font-style: italic;
        padding: 12px;
    }
    
    .list-node.inserting {
        animation: slideIn 0.3s ease;
    }
    
    .list-node.deleting {
        animation: fadeOut 0.3s ease;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.5); }
    }
    
    .doubly-arrows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-size: 16px;
        color: var(--viz-edge);
    }
    
    .node-box.doubly {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .node-prev-arrow, .node-next-arrow {
        font-size: 10px;
        color: var(--text-muted);
    }
    
    .node-box.current {
        border-color: var(--accent-warning);
        box-shadow: 0 0 15px rgba(210, 153, 34, 0.4);
    }
`;
document.head.appendChild(listStyles);

// Export
window.LinkedListRenderer = LinkedListRenderer;
