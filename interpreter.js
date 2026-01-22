/**
 * DSA Code Interpreter v2
 * Enhanced step-by-step JavaScript interpreter with real execution and state tracking
 */

class DSAInterpreter {
    constructor() {
        this.reset();
    }

    reset() {
        this.steps = [];
        this.currentStep = 0;
        this.executionContext = null;
        this.consoleOutput = [];
        this.dataStructures = {
            arrays: {},
            linkedLists: {},
            trees: {},
            graphs: {},
            stacks: {},
            queues: {},
            heaps: {}
        };
    }

    /**
     * Parse and prepare code for step-by-step execution
     */
    parse(code) {
        this.reset();
        
        try {
            // Parse code into AST
            const ast = acorn.parse(code, {
                ecmaVersion: 2020,
                sourceType: 'script',
                locations: true
            });

            // Create instrumented execution 
            this.instrumentCode(ast, code);
            
            return {
                success: true,
                stepCount: this.steps.length,
                steps: this.steps
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                line: error.loc ? error.loc.line : null
            };
        }
    }

    /**
     * Instrument the AST to create execution steps
     */
    instrumentCode(ast, originalCode) {
        const lines = originalCode.split('\n');
        const self = this;
        
        // Create a sandboxed execution environment
        this.executionContext = {
            variables: {},
            functions: {},
            console: {
                log: (...args) => {
                    self.consoleOutput.push({
                        type: 'log',
                        message: args.map(a => self.formatValue(a)).join(' ')
                    });
                },
                warn: (...args) => {
                    self.consoleOutput.push({
                        type: 'warn',
                        message: args.map(a => self.formatValue(a)).join(' ')
                    });
                },
                error: (...args) => {
                    self.consoleOutput.push({
                        type: 'error',
                        message: args.map(a => self.formatValue(a)).join(' ')
                    });
                }
            }
        };

        // Walk AST and create steps
        this.walkAST(ast.body, lines);
    }

    /**
     * Walk AST and generate execution steps
     */
    walkAST(nodes, lines) {
        for (const node of nodes) {
            this.processNode(node, lines);
        }
    }

    /**
     * Process individual AST node and create execution step
     */
    processNode(node, lines) {
        const lineNum = node.loc ? node.loc.start.line : 0;
        const lineCode = lines[lineNum - 1] || '';
        
        // Skip empty lines and comments
        if (!lineCode.trim() || lineCode.trim().startsWith('//')) {
            return;
        }

        switch (node.type) {
            case 'VariableDeclaration':
                this.processVariableDeclaration(node, lineNum, lineCode);
                break;
                
            case 'ExpressionStatement':
                this.processExpressionStatement(node, lineNum, lineCode);
                break;
                
            case 'ForStatement':
                this.processForStatement(node, lines);
                break;
                
            case 'WhileStatement':
                this.processWhileStatement(node, lines);
                break;
                
            case 'IfStatement':
                this.processIfStatement(node, lines);
                break;
                
            case 'FunctionDeclaration':
                this.processFunctionDeclaration(node, lineNum, lineCode);
                break;
                
            case 'BlockStatement':
                this.walkAST(node.body, lines);
                break;
                
            case 'ReturnStatement':
                this.processReturnStatement(node, lineNum, lineCode);
                break;
        }
    }

    /**
     * Process variable declarations
     */
    processVariableDeclaration(node, lineNum, lineCode) {
        const self = this;
        
        for (const decl of node.declarations) {
            const varName = decl.id.name;
            const kind = node.kind;
            
            this.steps.push({
                type: 'variable-declaration',
                line: lineNum,
                code: lineCode.trim(),
                description: `Declare ${kind} ${varName}`,
                varName: varName,
                execute: () => {
                    const value = decl.init ? self.evaluate(decl.init) : undefined;
                    self.executionContext.variables[varName] = {
                        value: self.cloneValue(value),
                        type: self.getType(value),
                        dsType: self.detectDataStructure(value)
                    };
                    
                    // Register data structure if detected
                    self.registerDataStructure(varName, value);
                    
                    return self.captureState();
                }
            });
        }
    }

    /**
     * Process expression statements
     */
    processExpressionStatement(node, lineNum, lineCode) {
        const self = this;
        const expr = node.expression;
        
        let description = 'Execute expression';
        let highlights = {};
        
        // Detect specific operations
        if (expr.type === 'AssignmentExpression') {
            description = this.describeAssignment(expr);
            highlights = this.getAssignmentHighlights(expr);
        } else if (expr.type === 'UpdateExpression') {
            description = `Update: ${expr.argument.name}${expr.operator}`;
        } else if (expr.type === 'CallExpression') {
            description = this.describeCall(expr);
        }
        
        this.steps.push({
            type: 'expression',
            line: lineNum,
            code: lineCode.trim(),
            description: description,
            highlights: highlights,
            execute: () => {
                self.evaluate(expr);
                return self.captureState();
            }
        });
    }

    /**
     * Process for loops - unroll iterations
     */
    processForStatement(node, lines) {
        const self = this;
        const lineNum = node.loc.start.line;
        const lineCode = lines[lineNum - 1] || '';
        
        // Process init
        if (node.init) {
            if (node.init.type === 'VariableDeclaration') {
                this.processVariableDeclaration(node.init, lineNum, lineCode);
            } else {
                this.steps.push({
                    type: 'for-init',
                    line: lineNum,
                    code: lineCode.trim(),
                    description: 'Initialize loop',
                    execute: () => {
                        self.evaluate(node.init);
                        return self.captureState();
                    }
                });
            }
        }
        
        // Create loop structure step
        this.steps.push({
            type: 'for-loop',
            line: lineNum,
            code: lineCode.trim(),
            description: 'Enter for loop',
            isLoop: true,
            testNode: node.test,
            updateNode: node.update,
            bodyNode: node.body,
            execute: () => self.captureState()
        });
        
        // Process body (simplified - shows one iteration)
        if (node.body.type === 'BlockStatement') {
            this.walkAST(node.body.body, lines);
        } else {
            this.processNode(node.body, lines);
        }
        
        // Loop update step
        if (node.update) {
            this.steps.push({
                type: 'for-update',
                line: lineNum,
                code: `Loop update`,
                description: 'Loop iteration',
                execute: () => {
                    self.evaluate(node.update);
                    return self.captureState();
                }
            });
        }
    }

    /**
     * Process while loops
     */
    processWhileStatement(node, lines) {
        const self = this;
        const lineNum = node.loc.start.line;
        const lineCode = lines[lineNum - 1] || '';
        
        this.steps.push({
            type: 'while-loop',
            line: lineNum,
            code: lineCode.trim(),
            description: 'Check while condition',
            isLoop: true,
            testNode: node.test,
            execute: () => self.captureState()
        });
        
        if (node.body.type === 'BlockStatement') {
            this.walkAST(node.body.body, lines);
        } else {
            this.processNode(node.body, lines);
        }
    }

    /**
     * Process if statements
     */
    processIfStatement(node, lines) {
        const self = this;
        const lineNum = node.loc.start.line;
        const lineCode = lines[lineNum - 1] || '';
        
        this.steps.push({
            type: 'if-statement',
            line: lineNum,
            code: lineCode.trim(),
            description: 'Evaluate condition',
            testNode: node.test,
            execute: () => self.captureState()
        });
        
        // Process consequent
        if (node.consequent.type === 'BlockStatement') {
            this.walkAST(node.consequent.body, lines);
        } else {
            this.processNode(node.consequent, lines);
        }
        
        // Process else
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                this.processIfStatement(node.alternate, lines);
            } else if (node.alternate.type === 'BlockStatement') {
                this.walkAST(node.alternate.body, lines);
            } else {
                this.processNode(node.alternate, lines);
            }
        }
    }

    /**
     * Process function declarations
     */
    processFunctionDeclaration(node, lineNum, lineCode) {
        const self = this;
        const funcName = node.id.name;
        const params = node.params.map(p => p.name);
        
        this.steps.push({
            type: 'function-declaration',
            line: lineNum,
            code: lineCode.trim(),
            description: `Define function ${funcName}(${params.join(', ')})`,
            execute: () => {
                self.executionContext.functions[funcName] = {
                    params: params,
                    body: node.body,
                    node: node
                };
                return self.captureState();
            }
        });
    }

    /**
     * Process return statements
     */
    processReturnStatement(node, lineNum, lineCode) {
        const self = this;
        
        this.steps.push({
            type: 'return',
            line: lineNum,
            code: lineCode.trim(),
            description: 'Return from function',
            execute: () => self.captureState()
        });
    }

    /**
     * Evaluate an expression
     */
    evaluate(node) {
        if (!node) return undefined;
        
        switch (node.type) {
            case 'Literal':
                return node.value;
                
            case 'Identifier':
                const varData = this.executionContext.variables[node.name];
                return varData ? varData.value : undefined;
                
            case 'ArrayExpression':
                return node.elements.map(el => this.evaluate(el));
                
            case 'ObjectExpression':
                const obj = {};
                for (const prop of node.properties) {
                    const key = prop.key.name || prop.key.value;
                    obj[key] = this.evaluate(prop.value);
                }
                return obj;
                
            case 'BinaryExpression':
                return this.evaluateBinary(node);
                
            case 'LogicalExpression':
                return this.evaluateLogical(node);
                
            case 'UnaryExpression':
                return this.evaluateUnary(node);
                
            case 'UpdateExpression':
                return this.evaluateUpdate(node);
                
            case 'AssignmentExpression':
                return this.evaluateAssignment(node);
                
            case 'MemberExpression':
                return this.evaluateMember(node);
                
            case 'CallExpression':
                return this.evaluateCall(node);
                
            case 'ConditionalExpression':
                const test = this.evaluate(node.test);
                return test ? this.evaluate(node.consequent) : this.evaluate(node.alternate);
                
            case 'NewExpression':
                return this.evaluateNew(node);
                
            default:
                return undefined;
        }
    }

    /**
     * Evaluate binary expression
     */
    evaluateBinary(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        
        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '**': return left ** right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '==': return left == right;
            case '===': return left === right;
            case '!=': return left != right;
            case '!==': return left !== right;
            case '&': return left & right;
            case '|': return left | right;
            case '^': return left ^ right;
            case '<<': return left << right;
            case '>>': return left >> right;
            default: return undefined;
        }
    }

    /**
     * Evaluate logical expression
     */
    evaluateLogical(node) {
        const left = this.evaluate(node.left);
        
        if (node.operator === '&&') {
            return left ? this.evaluate(node.right) : left;
        } else if (node.operator === '||') {
            return left ? left : this.evaluate(node.right);
        } else if (node.operator === '??') {
            return left != null ? left : this.evaluate(node.right);
        }
        return undefined;
    }

    /**
     * Evaluate unary expression
     */
    evaluateUnary(node) {
        const arg = this.evaluate(node.argument);
        
        switch (node.operator) {
            case '-': return -arg;
            case '+': return +arg;
            case '!': return !arg;
            case '~': return ~arg;
            case 'typeof': return typeof arg;
            default: return undefined;
        }
    }

    /**
     * Evaluate update expression (++, --)
     */
    evaluateUpdate(node) {
        const name = node.argument.name;
        const varData = this.executionContext.variables[name];
        
        if (!varData) return undefined;
        
        const oldValue = varData.value;
        const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
        
        varData.value = newValue;
        
        // Update data structure
        this.registerDataStructure(name, newValue);
        
        return node.prefix ? newValue : oldValue;
    }

    /**
     * Evaluate assignment expression
     */
    evaluateAssignment(node) {
        const value = this.evaluate(node.right);
        
        if (node.left.type === 'Identifier') {
            const name = node.left.name;
            let varData = this.executionContext.variables[name];
            
            if (!varData) {
                varData = { value: undefined, type: 'undefined' };
                this.executionContext.variables[name] = varData;
            }
            
            switch (node.operator) {
                case '=': varData.value = value; break;
                case '+=': varData.value += value; break;
                case '-=': varData.value -= value; break;
                case '*=': varData.value *= value; break;
                case '/=': varData.value /= value; break;
                case '%=': varData.value %= value; break;
            }
            
            varData.type = this.getType(varData.value);
            varData.dsType = this.detectDataStructure(varData.value);
            
            // Update data structure
            this.registerDataStructure(name, varData.value);
            
            return varData.value;
            
        } else if (node.left.type === 'MemberExpression') {
            const obj = this.evaluate(node.left.object);
            let prop;
            
            if (node.left.computed) {
                prop = this.evaluate(node.left.property);
            } else {
                prop = node.left.property.name;
            }
            
            if (obj !== undefined && obj !== null) {
                switch (node.operator) {
                    case '=': obj[prop] = value; break;
                    case '+=': obj[prop] += value; break;
                    case '-=': obj[prop] -= value; break;
                    case '*=': obj[prop] *= value; break;
                    case '/=': obj[prop] /= value; break;
                }
                
                // Update parent array in data structures
                if (node.left.object.type === 'Identifier') {
                    const arrName = node.left.object.name;
                    const arrData = this.executionContext.variables[arrName];
                    if (arrData) {
                        this.registerDataStructure(arrName, arrData.value);
                    }
                }
            }
            
            return value;
        }
        
        return value;
    }

    /**
     * Evaluate member expression
     */
    evaluateMember(node) {
        const obj = this.evaluate(node.object);
        
        if (obj === undefined || obj === null) return undefined;
        
        let prop;
        if (node.computed) {
            prop = this.evaluate(node.property);
        } else {
            prop = node.property.name;
        }
        
        return obj[prop];
    }

    /**
     * Evaluate function call
     */
    evaluateCall(node) {
        // Handle console methods
        if (node.callee.type === 'MemberExpression' && 
            node.callee.object.name === 'console') {
            const method = node.callee.property.name;
            const args = node.arguments.map(arg => this.evaluate(arg));
            
            if (this.executionContext.console[method]) {
                this.executionContext.console[method](...args);
            }
            return undefined;
        }
        
        // Handle Math methods
        if (node.callee.type === 'MemberExpression' && 
            node.callee.object.name === 'Math') {
            const method = node.callee.property.name;
            const args = node.arguments.map(arg => this.evaluate(arg));
            return Math[method](...args);
        }
        
        // Handle array methods
        if (node.callee.type === 'MemberExpression') {
            const obj = this.evaluate(node.callee.object);
            const method = node.callee.property.name;
            const args = node.arguments.map(arg => this.evaluate(arg));
            
            if (Array.isArray(obj) && typeof obj[method] === 'function') {
                const result = obj[method](...args);
                
                // Update the array in context
                if (node.callee.object.type === 'Identifier') {
                    const arrName = node.callee.object.name;
                    this.registerDataStructure(arrName, obj);
                }
                
                return result;
            }
            
            if (obj && typeof obj[method] === 'function') {
                return obj[method](...args);
            }
        }
        
        // Handle user-defined functions
        if (node.callee.type === 'Identifier') {
            const funcName = node.callee.name;
            const func = this.executionContext.functions[funcName];
            
            if (func) {
                // Create new scope
                const oldVars = { ...this.executionContext.variables };
                
                // Bind parameters
                const args = node.arguments.map(arg => this.evaluate(arg));
                func.params.forEach((param, i) => {
                    this.executionContext.variables[param] = {
                        value: args[i],
                        type: this.getType(args[i])
                    };
                });
                
                // Note: Simplified execution - full implementation would need call stack
                return undefined;
            }
        }
        
        return undefined;
    }

    /**
     * Evaluate new expression
     */
    evaluateNew(node) {
        const className = node.callee.name;
        const args = node.arguments.map(arg => this.evaluate(arg));
        
        switch (className) {
            case 'ListNode':
                return { val: args[0], next: args[1] || null };
            case 'TreeNode':
                return { val: args[0], left: args[1] || null, right: args[2] || null };
            case 'Map':
                return new Map();
            case 'Set':
                return new Set(args[0]);
            case 'Array':
                return new Array(...args);
            default:
                return { __class__: className };
        }
    }

    /**
     * Capture current execution state
     */
    captureState() {
        const state = {
            variables: {},
            arrays: {},
            linkedLists: {},
            trees: {},
            graphs: {},
            stacks: {},
            queues: {},
            heaps: {},
            console: [...this.consoleOutput]
        };
        
        // Copy variables
        for (const [name, data] of Object.entries(this.executionContext.variables)) {
            state.variables[name] = {
                value: this.cloneValue(data.value),
                type: data.type,
                dsType: data.dsType
            };
        }
        
        // Copy data structures
        state.arrays = this.cloneValue(this.dataStructures.arrays);
        state.linkedLists = this.cloneValue(this.dataStructures.linkedLists);
        state.trees = this.cloneValue(this.dataStructures.trees);
        state.graphs = this.cloneValue(this.dataStructures.graphs);
        state.stacks = this.cloneValue(this.dataStructures.stacks);
        state.queues = this.cloneValue(this.dataStructures.queues);
        state.heaps = this.cloneValue(this.dataStructures.heaps);
        
        return state;
    }

    /**
     * Register data structure for visualization
     */
    registerDataStructure(name, value) {
        if (!value) return;
        
        // Array detection
        if (Array.isArray(value)) {
            this.dataStructures.arrays[name] = this.cloneValue(value);
        }
        // Linked List detection
        else if (value && typeof value === 'object' && 'next' in value && 'val' in value) {
            this.dataStructures.linkedLists[name] = this.cloneValue(value);
        }
        // Tree detection
        else if (value && typeof value === 'object' && 'val' in value && ('left' in value || 'right' in value)) {
            this.dataStructures.trees[name] = this.cloneValue(value);
        }
        // Graph detection (adjacency list)
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            const values = Object.values(value);
            if (values.length > 0 && values.every(v => Array.isArray(v))) {
                this.dataStructures.graphs[name] = this.cloneValue(value);
            }
        }
    }

    /**
     * Detect data structure type
     */
    detectDataStructure(value) {
        if (Array.isArray(value)) return 'array';
        if (value && typeof value === 'object') {
            if ('next' in value && 'val' in value) return 'linkedlist';
            if ('val' in value && ('left' in value || 'right' in value)) return 'tree';
            const vals = Object.values(value);
            if (vals.length > 0 && vals.every(v => Array.isArray(v))) return 'graph';
        }
        return null;
    }

    /**
     * Get type of value
     */
    getType(value) {
        if (Array.isArray(value)) return 'array';
        if (value === null) return 'null';
        return typeof value;
    }

    /**
     * Describe assignment operation
     */
    describeAssignment(expr) {
        if (expr.left.type === 'Identifier') {
            return `Assign to ${expr.left.name}`;
        } else if (expr.left.type === 'MemberExpression') {
            if (expr.left.object.type === 'Identifier') {
                const objName = expr.left.object.name;
                if (expr.left.computed) {
                    return `Update ${objName}[...]`;
                } else {
                    return `Update ${objName}.${expr.left.property.name}`;
                }
            }
        }
        return 'Assignment';
    }

    /**
     * Get highlights for assignment
     */
    getAssignmentHighlights(expr) {
        if (expr.left.type === 'MemberExpression' && 
            expr.left.object.type === 'Identifier' &&
            expr.left.computed) {
            return {
                array: expr.left.object.name,
                type: 'assignment'
            };
        }
        return {};
    }

    /**
     * Describe function call
     */
    describeCall(expr) {
        if (expr.callee.type === 'MemberExpression') {
            if (expr.callee.object.name === 'console') {
                return `console.${expr.callee.property.name}()`;
            }
            if (expr.callee.object.type === 'Identifier') {
                return `${expr.callee.object.name}.${expr.callee.property.name}()`;
            }
        }
        if (expr.callee.type === 'Identifier') {
            return `Call ${expr.callee.name}()`;
        }
        return 'Function call';
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        return String(value);
    }

    /**
     * Deep clone a value
     */
    cloneValue(value) {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map(v => this.cloneValue(v));
        
        const clone = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                clone[key] = this.cloneValue(value[key]);
            }
        }
        return clone;
    }

    /**
     * Get step at index
     */
    getStep(index) {
        if (index >= 0 && index < this.steps.length) {
            return this.steps[index];
        }
        return null;
    }

    /**
     * Get total step count
     */
    getStepCount() {
        return this.steps.length;
    }
}

// Export
window.DSAInterpreter = DSAInterpreter;
