/**
 * Graph Renderer
 * Visualizes graphs with force-directed layout
 */

class GraphRenderer {
    constructor(container) {
        this.container = container;
        this.nodeRadius = 25;
    }

    /**
     * Render a graph from adjacency list
     * @param {string} name - Graph name
     * @param {Object} adjList - Adjacency list (object or Map)
     * @param {Object} highlights - Highlight info
     */
    render(name, adjList, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'graph-wrapper';
        wrapper.innerHTML = `
            <div class="graph-label">${name}</div>
            <div class="graph-svg-container" id="graph-${name}"></div>
        `;
        
        const svgContainer = wrapper.querySelector('.graph-svg-container');
        
        // Convert to consistent format
        const nodes = this.getNodes(adjList);
        const edges = this.getEdges(adjList);
        
        if (nodes.length === 0) {
            svgContainer.innerHTML = '<div class="null-pointer">Empty graph</div>';
            this.container.appendChild(wrapper);
            return;
        }

        // Calculate positions using force-directed layout
        const positions = this.calculatePositions(nodes, edges, 500, 400);
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', 500);
        svg.setAttribute('height', 400);
        svg.setAttribute('class', 'graph-svg');

        // Draw edges
        this.drawEdges(svg, edges, positions, highlights);
        
        // Draw nodes
        this.drawNodes(svg, nodes, positions, highlights);

        svgContainer.appendChild(svg);
        this.container.appendChild(wrapper);
    }

    /**
     * Get unique nodes from adjacency list
     */
    getNodes(adjList) {
        const nodes = new Set();
        
        if (adjList instanceof Map) {
            for (const [node, neighbors] of adjList) {
                nodes.add(String(node));
                neighbors.forEach(n => nodes.add(String(n)));
            }
        } else {
            for (const [node, neighbors] of Object.entries(adjList)) {
                nodes.add(node);
                if (Array.isArray(neighbors)) {
                    neighbors.forEach(n => nodes.add(String(n)));
                }
            }
        }
        
        return Array.from(nodes);
    }

    /**
     * Get edges from adjacency list
     */
    getEdges(adjList) {
        const edges = [];
        const addedEdges = new Set();
        
        if (adjList instanceof Map) {
            for (const [node, neighbors] of adjList) {
                neighbors.forEach(neighbor => {
                    const edgeKey = [node, neighbor].sort().join('-');
                    if (!addedEdges.has(edgeKey)) {
                        edges.push({ from: String(node), to: String(neighbor) });
                        addedEdges.add(edgeKey);
                    }
                });
            }
        } else {
            for (const [node, neighbors] of Object.entries(adjList)) {
                if (Array.isArray(neighbors)) {
                    neighbors.forEach(neighbor => {
                        const edgeKey = [node, neighbor].sort().join('-');
                        if (!addedEdges.has(edgeKey)) {
                            edges.push({ from: node, to: String(neighbor) });
                            addedEdges.add(edgeKey);
                        }
                    });
                }
            }
        }
        
        return edges;
    }

    /**
     * Calculate node positions using simple force-directed layout
     */
    calculatePositions(nodes, edges, width, height) {
        const positions = {};
        const padding = 60;
        
        // Initialize with circular layout
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - padding;
        
        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
            positions[node] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Simple force-directed iterations
        const iterations = 50;
        const repulsion = 5000;
        const attraction = 0.1;
        
        for (let iter = 0; iter < iterations; iter++) {
            const forces = {};
            nodes.forEach(n => forces[n] = { x: 0, y: 0 });
            
            // Repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i];
                    const n2 = nodes[j];
                    const dx = positions[n2].x - positions[n1].x;
                    const dy = positions[n2].y - positions[n1].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = repulsion / (dist * dist);
                    
                    forces[n1].x -= (dx / dist) * force;
                    forces[n1].y -= (dy / dist) * force;
                    forces[n2].x += (dx / dist) * force;
                    forces[n2].y += (dy / dist) * force;
                }
            }
            
            // Attraction along edges
            edges.forEach(edge => {
                const dx = positions[edge.to].x - positions[edge.from].x;
                const dy = positions[edge.to].y - positions[edge.from].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = attraction * dist;
                
                forces[edge.from].x += (dx / dist) * force;
                forces[edge.from].y += (dy / dist) * force;
                forces[edge.to].x -= (dx / dist) * force;
                forces[edge.to].y -= (dy / dist) * force;
            });
            
            // Apply forces
            nodes.forEach(node => {
                positions[node].x += forces[node].x * 0.1;
                positions[node].y += forces[node].y * 0.1;
                
                // Keep within bounds
                positions[node].x = Math.max(padding, Math.min(width - padding, positions[node].x));
                positions[node].y = Math.max(padding, Math.min(height - padding, positions[node].y));
            });
        }
        
        return positions;
    }

    /**
     * Draw edges
     */
    drawEdges(svg, edges, positions, highlights) {
        edges.forEach(edge => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            
            if (!from || !to) return;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.setAttribute('class', 'graph-edge-svg');
            
            if (highlights.activeEdges) {
                const edgeKey = [edge.from, edge.to].sort().join('-');
                if (highlights.activeEdges.includes(edgeKey)) {
                    line.classList.add('active');
                }
            }
            
            svg.appendChild(line);
        });
    }

    /**
     * Draw nodes
     */
    drawNodes(svg, nodes, positions, highlights) {
        nodes.forEach((node, index) => {
            const pos = positions[node];
            if (!pos) return;
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'graph-node-group');
            g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', this.nodeRadius);
            circle.setAttribute('class', 'graph-node-svg');
            
            // Apply highlights
            if (highlights.active === node || 
                (Array.isArray(highlights.active) && highlights.active.includes(node))) {
                circle.classList.add('active');
            }
            if (highlights.visited && highlights.visited.includes(node)) {
                circle.classList.add('visited');
            }
            if (highlights.current === node) {
                circle.classList.add('current');
            }
            
            g.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'graph-node-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.textContent = node;
            g.appendChild(text);
            
            svg.appendChild(g);
        });
    }

    /**
     * Animate BFS traversal
     */
    async animateBFS(name, startNode, adjList, delay = 500) {
        const visited = new Set();
        const queue = [startNode];
        
        while (queue.length > 0) {
            const node = queue.shift();
            
            if (visited.has(node)) continue;
            visited.add(node);
            
            // Highlight current node
            await this.highlightNode(name, node, 'active', delay);
            await this.highlightNode(name, node, 'visited', 0);
            
            // Add neighbors to queue
            const neighbors = adjList[node] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }

    /**
     * Animate DFS traversal
     */
    async animateDFS(name, startNode, adjList, delay = 500) {
        const visited = new Set();
        
        const dfs = async (node) => {
            if (visited.has(node)) return;
            visited.add(node);
            
            await this.highlightNode(name, node, 'active', delay);
            await this.highlightNode(name, node, 'visited', 0);
            
            const neighbors = adjList[node] || [];
            for (const neighbor of neighbors) {
                await dfs(neighbor);
            }
        };
        
        await dfs(startNode);
    }

    /**
     * Highlight a node
     */
    highlightNode(name, nodeId, type, duration) {
        return new Promise(resolve => {
            const nodes = document.querySelectorAll(`#graph-${name} .graph-node-group`);
            
            nodes.forEach(g => {
                const text = g.querySelector('text');
                const circle = g.querySelector('circle');
                
                if (text && text.textContent === String(nodeId)) {
                    if (type === 'active') {
                        circle.classList.add('active');
                    } else if (type === 'visited') {
                        circle.classList.remove('active');
                        circle.classList.add('visited');
                    }
                }
            });
            
            setTimeout(resolve, duration);
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
const graphStyles = document.createElement('style');
graphStyles.textContent = `
    .graph-wrapper {
        margin-bottom: 20px;
    }
    
    .graph-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .graph-svg-container {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 10px;
        overflow: hidden;
    }
    
    .graph-svg {
        display: block;
        margin: 0 auto;
    }
    
    .graph-edge-svg {
        stroke: var(--viz-edge);
        stroke-width: 2;
        transition: all 0.3s ease;
    }
    
    .graph-edge-svg.active {
        stroke: var(--viz-edge-active);
        stroke-width: 3;
    }
    
    .graph-node-svg {
        fill: var(--viz-node);
        stroke: var(--viz-node);
        stroke-width: 3;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .graph-node-svg:hover {
        transform: scale(1.1);
    }
    
    .graph-node-svg.active {
        fill: var(--viz-node-active);
        stroke: var(--viz-node-active);
        filter: drop-shadow(0 0 15px rgba(88, 166, 255, 0.6));
    }
    
    .graph-node-svg.visited {
        fill: var(--viz-node-visited);
        stroke: var(--viz-node-visited);
    }
    
    .graph-node-svg.current {
        fill: var(--accent-warning);
        stroke: var(--accent-warning);
    }
    
    .graph-node-text {
        fill: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 600;
        pointer-events: none;
    }
`;
document.head.appendChild(graphStyles);

// Export
window.GraphRenderer = GraphRenderer;
