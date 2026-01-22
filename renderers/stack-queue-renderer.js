/**
 * Stack & Queue Renderer
 * Visualizes stacks and queues with push/pop and enqueue/dequeue animations
 */

class StackQueueRenderer {
    constructor(container) {
        this.container = container;
    }

    /**
     * Render a stack
     * @param {string} name - Stack name
     * @param {Array} items - Stack items (bottom to top)
     * @param {Object} highlights - Highlight info
     */
    renderStack(name, items, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'stack-wrapper';
        wrapper.innerHTML = `
            <div class="stack-label">${name} (Stack)</div>
            <div class="stack-container">
                <div class="stack-top-label">← TOP</div>
                <div class="stack-visual" id="stack-${name}"></div>
                <div class="stack-bottom-label">BOTTOM</div>
            </div>
        `;
        
        const stackVisual = wrapper.querySelector('.stack-visual');
        
        if (items.length === 0) {
            stackVisual.innerHTML = '<div class="empty-indicator">Empty Stack</div>';
        } else {
            // Render items from bottom to top
            items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'stack-item';
                
                // Top item highlight
                if (index === items.length - 1) {
                    itemDiv.classList.add('top');
                }
                
                if (highlights.active === index) {
                    itemDiv.classList.add('active');
                }
                if (highlights.new === index) {
                    itemDiv.classList.add('new');
                }
                
                itemDiv.textContent = this.formatValue(item);
                stackVisual.appendChild(itemDiv);
            });
        }

        this.container.appendChild(wrapper);
    }

    /**
     * Render a queue
     * @param {string} name - Queue name
     * @param {Array} items - Queue items (front to back)
     * @param {Object} highlights - Highlight info
     */
    renderQueue(name, items, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'queue-wrapper';
        wrapper.innerHTML = `
            <div class="queue-label">${name} (Queue)</div>
            <div class="queue-container">
                <div class="queue-front-label">FRONT →</div>
                <div class="queue-visual" id="queue-${name}"></div>
                <div class="queue-rear-label">← REAR</div>
            </div>
        `;
        
        const queueVisual = wrapper.querySelector('.queue-visual');
        
        if (items.length === 0) {
            queueVisual.innerHTML = '<div class="empty-indicator">Empty Queue</div>';
        } else {
            items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'queue-item';
                
                // Front and rear highlights
                if (index === 0) {
                    itemDiv.classList.add('front');
                }
                if (index === items.length - 1) {
                    itemDiv.classList.add('rear');
                }
                
                if (highlights.active === index) {
                    itemDiv.classList.add('active');
                }
                if (highlights.new === index) {
                    itemDiv.classList.add('new');
                }
                
                itemDiv.textContent = this.formatValue(item);
                queueVisual.appendChild(itemDiv);
            });
        }

        this.container.appendChild(wrapper);
    }

    /**
     * Render a deque (double-ended queue)
     */
    renderDeque(name, items, highlights = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'deque-wrapper';
        wrapper.innerHTML = `
            <div class="deque-label">${name} (Deque)</div>
            <div class="deque-container">
                <div class="deque-arrow left">↔</div>
                <div class="deque-visual" id="deque-${name}"></div>
                <div class="deque-arrow right">↔</div>
            </div>
        `;
        
        const dequeVisual = wrapper.querySelector('.deque-visual');
        
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'deque-item';
            itemDiv.textContent = this.formatValue(item);
            dequeVisual.appendChild(itemDiv);
        });

        this.container.appendChild(wrapper);
    }

    /**
     * Animate push operation
     */
    animatePush(name, value, duration = 300) {
        return new Promise(resolve => {
            const stack = document.querySelector(`#stack-${name}`);
            if (!stack) {
                resolve();
                return;
            }

            const newItem = document.createElement('div');
            newItem.className = 'stack-item new top';
            newItem.textContent = this.formatValue(value);
            
            // Remove top class from previous top
            const prevTop = stack.querySelector('.stack-item.top');
            if (prevTop) {
                prevTop.classList.remove('top');
            }
            
            stack.appendChild(newItem);
            
            setTimeout(() => {
                newItem.classList.remove('new');
                resolve();
            }, duration);
        });
    }

    /**
     * Animate pop operation
     */
    animatePop(name, duration = 300) {
        return new Promise(resolve => {
            const stack = document.querySelector(`#stack-${name}`);
            if (!stack) {
                resolve();
                return;
            }

            const topItem = stack.querySelector('.stack-item.top');
            if (topItem) {
                topItem.classList.add('removing');
                
                setTimeout(() => {
                    topItem.remove();
                    // Mark new top
                    const newTop = stack.lastElementChild;
                    if (newTop && newTop.classList.contains('stack-item')) {
                        newTop.classList.add('top');
                    }
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }

    /**
     * Animate enqueue operation
     */
    animateEnqueue(name, value, duration = 300) {
        return new Promise(resolve => {
            const queue = document.querySelector(`#queue-${name}`);
            if (!queue) {
                resolve();
                return;
            }

            const newItem = document.createElement('div');
            newItem.className = 'queue-item new rear';
            newItem.textContent = this.formatValue(value);
            
            // Remove rear class from previous rear
            const prevRear = queue.querySelector('.queue-item.rear');
            if (prevRear) {
                prevRear.classList.remove('rear');
            }
            
            queue.appendChild(newItem);
            
            setTimeout(() => {
                newItem.classList.remove('new');
                resolve();
            }, duration);
        });
    }

    /**
     * Animate dequeue operation
     */
    animateDequeue(name, duration = 300) {
        return new Promise(resolve => {
            const queue = document.querySelector(`#queue-${name}`);
            if (!queue) {
                resolve();
                return;
            }

            const frontItem = queue.querySelector('.queue-item.front');
            if (frontItem) {
                frontItem.classList.add('removing');
                
                setTimeout(() => {
                    frontItem.remove();
                    // Mark new front
                    const newFront = queue.firstElementChild;
                    if (newFront && newFront.classList.contains('queue-item')) {
                        newFront.classList.add('front');
                    }
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
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
}

// Add styles
const sqStyles = document.createElement('style');
sqStyles.textContent = `
    .stack-wrapper, .queue-wrapper, .deque-wrapper {
        margin-bottom: 20px;
    }
    
    .stack-label, .queue-label, .deque-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
    }
    
    .stack-container {
        display: flex;
        align-items: flex-end;
        gap: 12px;
    }
    
    .stack-visual {
        display: flex;
        flex-direction: column-reverse;
        gap: 4px;
        min-width: 100px;
        min-height: 150px;
        padding: 12px;
        border: 2px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
        background: var(--bg-secondary);
    }
    
    .stack-top-label, .stack-bottom-label {
        font-size: 11px;
        color: var(--text-muted);
        font-family: 'JetBrains Mono', monospace;
    }
    
    .stack-item {
        padding: 12px 24px;
        background: var(--accent-primary);
        color: white;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        border-radius: 6px;
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .stack-item.top {
        background: linear-gradient(135deg, var(--accent-success), #4ade80);
        box-shadow: 0 4px 15px rgba(63, 185, 80, 0.3);
    }
    
    .stack-item.active {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(88, 166, 255, 0.5);
    }
    
    .stack-item.new {
        animation: stackPush 0.3s ease;
    }
    
    .stack-item.removing {
        animation: stackPop 0.3s ease forwards;
    }
    
    @keyframes stackPush {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes stackPop {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-50px); opacity: 0; }
    }
    
    .queue-container {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .queue-visual {
        display: flex;
        gap: 4px;
        padding: 12px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-secondary);
        min-width: 200px;
        min-height: 60px;
    }
    
    .queue-front-label, .queue-rear-label {
        font-size: 11px;
        color: var(--text-muted);
        font-family: 'JetBrains Mono', monospace;
    }
    
    .queue-item {
        padding: 12px 20px;
        background: var(--accent-purple);
        color: white;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        border-radius: 6px;
        transition: all 0.3s ease;
    }
    
    .queue-item.front {
        background: linear-gradient(135deg, var(--accent-success), #4ade80);
    }
    
    .queue-item.rear {
        background: linear-gradient(135deg, var(--accent-warning), #f0b429);
    }
    
    .queue-item.new {
        animation: queueEnqueue 0.3s ease;
    }
    
    .queue-item.removing {
        animation: queueDequeue 0.3s ease forwards;
    }
    
    @keyframes queueEnqueue {
        from { transform: translateX(50px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes queueDequeue {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-50px); opacity: 0; }
    }
    
    .empty-indicator {
        color: var(--text-muted);
        font-style: italic;
        padding: 20px;
        text-align: center;
    }
    
    .deque-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .deque-arrow {
        color: var(--accent-primary);
        font-size: 20px;
    }
    
    .deque-visual {
        display: flex;
        gap: 4px;
        padding: 12px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-secondary);
    }
    
    .deque-item {
        padding: 12px 20px;
        background: var(--accent-cyan);
        color: white;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        border-radius: 6px;
    }
`;
document.head.appendChild(sqStyles);

// Export
window.StackQueueRenderer = StackQueueRenderer;
