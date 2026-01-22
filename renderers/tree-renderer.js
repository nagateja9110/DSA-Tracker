/**
 * Tree Renderer
 * Visualizes binary trees and general trees
 */

class TreeRenderer {
    constructor(container) {
        this.container = container;
        this.nodeRadius = 25;
        this.levelHeight = 80;
        this.minNodeSpacing = 60;
    }

    /**
     * Render a binary tree
     * @param {string} name - Tree name
     * @param {Object} root - Root node
     * @param {Object} highlights - Highlight info
     */
    render(name, root, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-wrapper';
        wrapper.innerHTML = `
            <div class="tree-label">${name}</div>
            <div class="tree-svg-container" id="tree-${name}"></div>
        `;
        
        const svgContainer = wrapper.querySelector('.tree-svg-container');
        
        if (!root) {
            svgContainer.innerHTML = '<div class="null-pointer">null (empty tree)</div>';
            this.container.appendChild(wrapper);
            return;
        }

        // Calculate tree dimensions
        const treeInfo = this.calculateTreeLayout(root);
        const width = Math.max(400, treeInfo.width + 100);
        const height = treeInfo.height + 60;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('class', 'tree-svg');

        // Draw edges first (so they appear behind nodes)
        this.drawEdges(svg, root, treeInfo.positions, highlights);
        
        // Draw nodes
        this.drawNodes(svg, root, treeInfo.positions, highlights);

        svgContainer.appendChild(svg);
        this.container.appendChild(wrapper);
    }

    /**
     * Calculate positions for all nodes
     */
    calculateTreeLayout(root) {
        const positions = new Map();
        const nodeWidths = new Map();
        
        // First pass: calculate widths
        const calculateWidth = (node) => {
            if (!node) return 0;
            const leftWidth = calculateWidth(node.left);
            const rightWidth = calculateWidth(node.right);
            const width = Math.max(this.minNodeSpacing, leftWidth + rightWidth);
            nodeWidths.set(node, { left: leftWidth, right: rightWidth, total: width });
            return width;
        };
        
        const totalWidth = calculateWidth(root);
        
        // Second pass: assign positions
        const assignPositions = (node, x, y, level) => {
            if (!node) return;
            
            positions.set(node, { x, y, level });
            
            const widthInfo = nodeWidths.get(node);
            if (widthInfo) {
                const leftOffset = widthInfo.left || this.minNodeSpacing / 2;
                const rightOffset = widthInfo.right || this.minNodeSpacing / 2;
                
                if (node.left) {
                    assignPositions(node.left, x - rightOffset / 2, y + this.levelHeight, level + 1);
                }
                if (node.right) {
                    assignPositions(node.right, x + leftOffset / 2, y + this.levelHeight, level + 1);
                }
            }
        };
        
        assignPositions(root, totalWidth / 2 + 50, 40, 0);
        
        // Find tree height
        let maxY = 40;
        for (const pos of positions.values()) {
            maxY = Math.max(maxY, pos.y);
        }
        
        return {
            positions,
            width: totalWidth,
            height: maxY + 40
        };
    }

    /**
     * Draw edges between nodes
     */
    drawEdges(svg, root, positions, highlights) {
        const drawEdge = (parent, child, isLeft) => {
            if (!parent || !child) return;
            
            const parentPos = positions.get(parent);
            const childPos = positions.get(child);
            
            if (!parentPos || !childPos) return;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', parentPos.x);
            line.setAttribute('y1', parentPos.y + this.nodeRadius);
            line.setAttribute('x2', childPos.x);
            line.setAttribute('y2', childPos.y - this.nodeRadius);
            line.setAttribute('class', 'tree-edge');
            
            // Check if edge should be highlighted
            if (highlights.activeEdges) {
                const edgeKey = `${parent.val}-${child.val}`;
                if (highlights.activeEdges.includes(edgeKey)) {
                    line.classList.add('active');
                }
            }
            
            svg.appendChild(line);
        };
        
        const traverse = (node) => {
            if (!node) return;
            if (node.left) drawEdge(node, node.left, true);
            if (node.right) drawEdge(node, node.right, false);
            traverse(node.left);
            traverse(node.right);
        };
        
        traverse(root);
    }

    /**
     * Draw tree nodes
     */
    drawNodes(svg, root, positions, highlights) {
        let nodeIndex = 0;
        
        const drawNode = (node) => {
            if (!node) return;
            
            const pos = positions.get(node);
            if (!pos) return;
            
            const currentIndex = nodeIndex++;
            
            // Create group for node
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'tree-node-group');
            g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
            
            // Draw circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', this.nodeRadius);
            circle.setAttribute('class', 'tree-node-circle-svg');
            
            // Apply highlights
            if (highlights.active === currentIndex || 
                (Array.isArray(highlights.active) && highlights.active.includes(currentIndex))) {
                circle.classList.add('active');
            }
            if (highlights.visited && highlights.visited.includes(currentIndex)) {
                circle.classList.add('visited');
            }
            if (highlights.current === currentIndex) {
                circle.classList.add('current');
            }
            
            g.appendChild(circle);
            
            // Draw value text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tree-node-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.textContent = this.formatValue(node.val);
            g.appendChild(text);
            
            svg.appendChild(g);
            
            // Recursively draw children
            drawNode(node.left);
            drawNode(node.right);
        };
        
        drawNode(root);
    }

    /**
     * Render tree with traversal path
     */
    renderWithPath(name, root, path, pathType = 'inorder') {
        this.render(name, root, { visited: path });
    }

    /**
     * Animate node highlight
     */
    animateHighlight(name, nodeIndex, duration = 300) {
        return new Promise(resolve => {
            const nodes = document.querySelectorAll(`#tree-${name} .tree-node-group`);
            
            if (nodes[nodeIndex]) {
                const circle = nodes[nodeIndex].querySelector('circle');
                circle.classList.add('active');
                
                setTimeout(() => {
                    circle.classList.remove('active');
                    circle.classList.add('visited');
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }

    /**
     * Clear container
     */
    clear() {
        this.container.innerHTML = '';
    }

    /**
     * Format value
     */
    formatValue(value) {
        if (value === null || value === undefined) return '-';
        return String(value);
    }
}

// Add SVG styles
const treeStyles = document.createElement('style');
treeStyles.textContent = `
    .tree-wrapper {
        margin-bottom: 20px;
    }
    
    .tree-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .tree-svg-container {
        overflow: auto;
        padding: 10px;
    }
    
    .tree-svg {
        display: block;
        margin: 0 auto;
    }
    
    .tree-edge {
        stroke: var(--viz-edge);
        stroke-width: 2;
        transition: all 0.3s ease;
    }
    
    .tree-edge.active {
        stroke: var(--viz-edge-active);
        stroke-width: 3;
    }
    
    .tree-node-circle-svg {
        fill: var(--viz-node);
        stroke: var(--viz-node);
        stroke-width: 3;
        transition: all 0.3s ease;
    }
    
    .tree-node-circle-svg.active {
        fill: var(--viz-node-active);
        stroke: var(--viz-node-active);
        filter: drop-shadow(0 0 10px rgba(88, 166, 255, 0.5));
        transform: scale(1.15);
    }
    
    .tree-node-circle-svg.visited {
        fill: var(--viz-node-visited);
        stroke: var(--viz-node-visited);
    }
    
    .tree-node-circle-svg.current {
        fill: var(--accent-warning);
        stroke: var(--accent-warning);
    }
    
    .tree-node-text {
        fill: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        pointer-events: none;
    }
`;
document.head.appendChild(treeStyles);

// Export
window.TreeRenderer = TreeRenderer;
