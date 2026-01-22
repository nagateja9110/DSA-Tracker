/**
 * DSA Code Interpreter
 * Step-by-step JavaScript interpreter with state tracking
 */

class DSAInterpreter {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.variables = new Map();
        this.callStack = [];
        this.dataStructures = new Map();
        this.consoleOutput = [];
        this.isRunning = false;
    }

    /**
     * Parse and prepare code for step-by-step execution
     * @param {string} code - JavaScript code to interpret
     * @returns {Array} Array of execution steps
     */
    parse(code) {
        this.reset();
        
        try {
            // Parse code into AST using Acorn
            const ast = acorn.parse(code, {
                ecmaVersion: 2020,
                sourceType: 'script',
                locations: true
            });

            // Generate execution steps from AST
            this.generateSteps(ast);
            
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
     * Reset interpreter state
     */
    reset() {
        this.steps = [];
        this.currentStep = 0;
        this.variables = new Map();
        this.callStack = [];
        this.dataStructures = new Map();
        this.consoleOutput = [];
        this.isRunning = false;
    }

    /**
     * Generate execution steps from AST
     */
    generateSteps(ast) {
        const self = this;
        
        // Create execution context
        const context = {
            variables: new Map(),
            functions: new Map(),
            arrays: new Map(),
            linkedLists: new Map(),
            trees: new Map(),
            stacks: new Map(),
            queues: new Map(),
            graphs: new Map(),
            heaps: new Map()
        };

        // Walk the AST and generate steps
        this.walkAST(ast.body, context);
    }

    /**
     * Walk AST nodes and generate execution steps
     */
    walkAST(nodes, context, parentFunction = null) {
        for (const node of nodes) {
            this.processNode(node, context, parentFunction);
        }
    }

    /**
     * Process individual AST node
     */
    processNode(node, context, parentFunction = null) {
        switch (node.type) {
            case 'VariableDeclaration':
                this.processVariableDeclaration(node, context);
                break;
            case 'FunctionDeclaration':
                this.processFunctionDeclaration(node, context);
                break;
            case 'ExpressionStatement':
                this.processExpressionStatement(node, context);
                break;
            case 'ForStatement':
                this.processForStatement(node, context);
                break;
            case 'WhileStatement':
                this.processWhileStatement(node, context);
                break;
            case 'IfStatement':
                this.processIfStatement(node, context);
                break;
            case 'ReturnStatement':
                this.processReturnStatement(node, context, parentFunction);
                break;
            case 'BlockStatement':
                this.walkAST(node.body, context, parentFunction);
                break;
        }
    }

    /**
     * Process variable declarations
     */
    processVariableDeclaration(node, context) {
        for (const declarator of node.declarations) {
            const varName = declarator.id.name;
            const initValue = declarator.init ? this.evaluateExpression(declarator.init, context) : undefined;
            
            // Detect data structure type
            const dsType = this.detectDataStructure(declarator.init, initValue);
            
            // Add step
            this.steps.push({
                type: 'variable-declaration',
                line: node.loc.start.line,
                lineEnd: node.loc.end.line,
                description: `Declare ${node.kind} ${varName}${initValue !== undefined ? ` = ${this.formatValue(initValue)}` : ''}`,
                action: () => {
                    context.variables.set(varName, {
                        value: this.cloneValue(initValue),
                        type: typeof initValue,
                        dsType: dsType
                    });
                    
                    // Register data structure if detected
                    if (dsType) {
                        this.registerDataStructure(varName, dsType, initValue, context);
                    }
                },
                getState: () => this.captureState(context)
            });
        }
    }

    /**
     * Process function declarations
     */
    processFunctionDeclaration(node, context) {
        const funcName = node.id.name;
        const params = node.params.map(p => p.name);
        
        // Store function in context
        context.functions.set(funcName, {
            params: params,
            body: node.body,
            node: node
        });

        this.steps.push({
            type: 'function-declaration',
            line: node.loc.start.line,
            lineEnd: node.loc.end.line,
            description: `Define function ${funcName}(${params.join(', ')})`,
            action: () => {},
            getState: () => this.captureState(context)
        });
    }

    /**
     * Process expression statements
     */
    processExpressionStatement(node, context) {
        const expr = node.expression;
        
        switch (expr.type) {
            case 'AssignmentExpression':
                this.processAssignment(expr, node, context);
                break;
            case 'UpdateExpression':
                this.processUpdate(expr, node, context);
                break;
            case 'CallExpression':
                this.processCallExpression(expr, node, context);
                break;
        }
    }

    /**
     * Process assignment expressions
     */
    processAssignment(expr, node, context) {
        const target = this.getAssignmentTarget(expr.left);
        const description = this.generateAssignmentDescription(expr, context);
        
        this.steps.push({
            type: 'assignment',
            line: node.loc.start.line,
            lineEnd: node.loc.end.line,
            description: description,
            action: () => {
                const value = this.evaluateExpression(expr.right, context);
                this.performAssignment(expr.left, value, expr.operator, context);
            },
            highlight: target,
            getState: () => this.captureState(context)
        });
    }

    /**
     * Process for loops
     */
    processForStatement(node, context) {
        // Init step
        if (node.init) {
            if (node.init.type === 'VariableDeclaration') {
                this.processVariableDeclaration(node.init, context);
            }
        }

        // Create loop step structure
        const loopBodySteps = [];
        
        // Process body (will be executed multiple times during simulation)
        this.steps.push({
            type: 'for-loop-start',
            line: node.loc.start.line,
            description: 'Enter for loop',
            isLoop: true,
            testNode: node.test,
            updateNode: node.update,
            bodyNode: node.body,
            action: () => {},
            getState: () => this.captureState(context)
        });

        // Process the body
        if (node.body.type === 'BlockStatement') {
            this.walkAST(node.body.body, context);
        } else {
            this.processNode(node.body, context);
        }

        // Loop update and check
        if (node.update) {
            this.steps.push({
                type: 'for-loop-update',
                line: node.loc.start.line,
                description: 'Loop iteration',
                action: () => {
                    this.evaluateExpression(node.update, context);
                },
                getState: () => this.captureState(context)
            });
        }
    }

    /**
     * Process while loops
     */
    processWhileStatement(node, context) {
        this.steps.push({
            type: 'while-loop-start',
            line: node.loc.start.line,
            description: 'Check while condition',
            isLoop: true,
            testNode: node.test,
            action: () => {},
            getState: () => this.captureState(context)
        });

        if (node.body.type === 'BlockStatement') {
            this.walkAST(node.body.body, context);
        } else {
            this.processNode(node.body, context);
        }
    }

    /**
     * Process if statements
     */
    processIfStatement(node, context) {
        this.steps.push({
            type: 'if-condition',
            line: node.loc.start.line,
            description: 'Evaluate if condition',
            testNode: node.test,
            action: () => {},
            getState: () => this.captureState(context)
        });

        // Process consequent
        if (node.consequent.type === 'BlockStatement') {
            this.walkAST(node.consequent.body, context);
        } else {
            this.processNode(node.consequent, context);
        }

        // Process alternate (else)
        if (node.alternate) {
            if (node.alternate.type === 'BlockStatement') {
                this.walkAST(node.alternate.body, context);
            } else if (node.alternate.type === 'IfStatement') {
                this.processIfStatement(node.alternate, context);
            } else {
                this.processNode(node.alternate, context);
            }
        }
    }

    /**
     * Process return statements
     */
    processReturnStatement(node, context, parentFunction) {
        this.steps.push({
            type: 'return',
            line: node.loc.start.line,
            description: `Return ${node.argument ? 'value' : ''}`,
            action: () => {
                return node.argument ? this.evaluateExpression(node.argument, context) : undefined;
            },
            getState: () => this.captureState(context)
        });
    }

    /**
     * Process function calls
     */
    processCallExpression(expr, node, context) {
        let description = '';
        let arrayOp = null;
        
        // Check for console.log
        if (expr.callee.type === 'MemberExpression' && 
            expr.callee.object.name === 'console') {
            description = `console.${expr.callee.property.name}(...)`;
        }
        // Check for array methods
        else if (expr.callee.type === 'MemberExpression') {
            const objName = expr.callee.object.name;
            const methodName = expr.callee.property.name;
            arrayOp = { array: objName, method: methodName };
            description = `${objName}.${methodName}(...)`;
        }
        // Regular function call
        else if (expr.callee.type === 'Identifier') {
            description = `Call ${expr.callee.name}(...)`;
        }

        this.steps.push({
            type: 'function-call',
            line: node.loc.start.line,
            description: description,
            arrayOperation: arrayOp,
            action: () => {
                this.evaluateExpression(expr, context);
            },
            getState: () => this.captureState(context)
        });
    }

    /**
     * Evaluate an expression and return its value
     */
    evaluateExpression(node, context) {
        if (!node) return undefined;

        switch (node.type) {
            case 'Literal':
                return node.value;
            
            case 'Identifier':
                const variable = context.variables.get(node.name);
                return variable ? variable.value : undefined;
            
            case 'ArrayExpression':
                return node.elements.map(el => this.evaluateExpression(el, context));
            
            case 'ObjectExpression':
                const obj = {};
                for (const prop of node.properties) {
                    const key = prop.key.name || prop.key.value;
                    obj[key] = this.evaluateExpression(prop.value, context);
                }
                return obj;
            
            case 'BinaryExpression':
                return this.evaluateBinaryExpression(node, context);
            
            case 'UnaryExpression':
                return this.evaluateUnaryExpression(node, context);
            
            case 'UpdateExpression':
                return this.evaluateUpdateExpression(node, context);
            
            case 'MemberExpression':
                return this.evaluateMemberExpression(node, context);
            
            case 'CallExpression':
                return this.evaluateCallExpression(node, context);
            
            case 'AssignmentExpression':
                const value = this.evaluateExpression(node.right, context);
                this.performAssignment(node.left, value, node.operator, context);
                return value;
            
            case 'ConditionalExpression':
                const test = this.evaluateExpression(node.test, context);
                return test ? 
                    this.evaluateExpression(node.consequent, context) : 
                    this.evaluateExpression(node.alternate, context);
            
            case 'LogicalExpression':
                return this.evaluateLogicalExpression(node, context);
            
            case 'NewExpression':
                return this.evaluateNewExpression(node, context);
            
            default:
                return undefined;
        }
    }

    /**
     * Evaluate binary expressions
     */
    evaluateBinaryExpression(node, context) {
        const left = this.evaluateExpression(node.left, context);
        const right = this.evaluateExpression(node.right, context);
        
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
            case '>>>': return left >>> right;
            default: return undefined;
        }
    }

    /**
     * Evaluate unary expressions
     */
    evaluateUnaryExpression(node, context) {
        const arg = this.evaluateExpression(node.argument, context);
        
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
     * Evaluate update expressions (++, --)
     */
    evaluateUpdateExpression(node, context) {
        const varName = node.argument.name;
        const variable = context.variables.get(varName);
        
        if (!variable) return undefined;
        
        const oldValue = variable.value;
        const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
        
        variable.value = newValue;
        
        return node.prefix ? newValue : oldValue;
    }

    /**
     * Evaluate member expressions (obj.prop, arr[i])
     */
    evaluateMemberExpression(node, context) {
        const obj = this.evaluateExpression(node.object, context);
        
        if (obj === undefined || obj === null) return undefined;
        
        let prop;
        if (node.computed) {
            prop = this.evaluateExpression(node.property, context);
        } else {
            prop = node.property.name;
        }
        
        return obj[prop];
    }

    /**
     * Evaluate call expressions
     */
    evaluateCallExpression(node, context) {
        // Handle console methods
        if (node.callee.type === 'MemberExpression' && 
            node.callee.object.name === 'console') {
            const args = node.arguments.map(arg => this.evaluateExpression(arg, context));
            const method = node.callee.property.name;
            
            this.consoleOutput.push({
                type: method,
                args: args,
                message: args.map(a => this.formatValue(a)).join(' ')
            });
            
            return undefined;
        }
        
        // Handle array methods
        if (node.callee.type === 'MemberExpression') {
            const obj = this.evaluateExpression(node.callee.object, context);
            const method = node.callee.property.name;
            const args = node.arguments.map(arg => this.evaluateExpression(arg, context));
            
            if (Array.isArray(obj) && typeof obj[method] === 'function') {
                return obj[method](...args);
            }
            
            if (obj && typeof obj[method] === 'function') {
                return obj[method](...args);
            }
        }
        
        // Handle user-defined functions
        if (node.callee.type === 'Identifier') {
            const funcName = node.callee.name;
            const func = context.functions.get(funcName);
            
            if (func) {
                // Create new scope for function
                const funcContext = {
                    variables: new Map(context.variables),
                    functions: context.functions,
                    arrays: context.arrays
                };
                
                // Bind parameters
                const args = node.arguments.map(arg => this.evaluateExpression(arg, context));
                func.params.forEach((param, i) => {
                    funcContext.variables.set(param, {
                        value: args[i],
                        type: typeof args[i]
                    });
                });
                
                // Note: Simplified - in real implementation would need proper execution
                return undefined;
            }
            
            // Handle built-in functions
            if (funcName === 'Math') {
                // Handle Math functions
            }
        }
        
        return undefined;
    }

    /**
     * Evaluate logical expressions
     */
    evaluateLogicalExpression(node, context) {
        const left = this.evaluateExpression(node.left, context);
        
        if (node.operator === '&&') {
            return left ? this.evaluateExpression(node.right, context) : left;
        } else if (node.operator === '||') {
            return left ? left : this.evaluateExpression(node.right, context);
        } else if (node.operator === '??') {
            return left !== null && left !== undefined ? left : this.evaluateExpression(node.right, context);
        }
        
        return undefined;
    }

    /**
     * Evaluate new expressions
     */
    evaluateNewExpression(node, context) {
        const className = node.callee.name;
        const args = node.arguments.map(arg => this.evaluateExpression(arg, context));
        
        // Handle common data structure classes
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
                return { __class__: className, ...args };
        }
    }

    /**
     * Perform assignment operation
     */
    performAssignment(left, value, operator, context) {
        if (left.type === 'Identifier') {
            const varName = left.name;
            let variable = context.variables.get(varName);
            
            if (!variable) {
                variable = { value: undefined, type: 'undefined' };
                context.variables.set(varName, variable);
            }
            
            switch (operator) {
                case '=': variable.value = value; break;
                case '+=': variable.value += value; break;
                case '-=': variable.value -= value; break;
                case '*=': variable.value *= value; break;
                case '/=': variable.value /= value; break;
                case '%=': variable.value %= value; break;
            }
            
            variable.type = typeof variable.value;
            
            // Update data structure type detection
            const dsType = this.detectDataStructure(null, variable.value);
            if (dsType) {
                variable.dsType = dsType;
                this.registerDataStructure(varName, dsType, variable.value, context);
            }
        } else if (left.type === 'MemberExpression') {
            const obj = this.evaluateExpression(left.object, context);
            let prop;
            
            if (left.computed) {
                prop = this.evaluateExpression(left.property, context);
            } else {
                prop = left.property.name;
            }
            
            if (obj !== undefined && obj !== null) {
                switch (operator) {
                    case '=': obj[prop] = value; break;
                    case '+=': obj[prop] += value; break;
                    case '-=': obj[prop] -= value; break;
                    case '*=': obj[prop] *= value; break;
                    case '/=': obj[prop] /= value; break;
                    case '%=': obj[prop] %= value; break;
                }
            }
        }
    }

    /**
     * Detect data structure type from expression or value
     */
    detectDataStructure(node, value) {
        // Array detection
        if (Array.isArray(value)) {
            return 'array';
        }
        
        // Object-based detection
        if (value && typeof value === 'object') {
            // Linked List node
            if ('val' in value && 'next' in value) {
                return 'linkedlist';
            }
            // Tree node
            if ('val' in value && ('left' in value || 'right' in value)) {
                return 'tree';
            }
            // Graph (adjacency list)
            if (Object.values(value).every(v => Array.isArray(v))) {
                return 'graph';
            }
        }
        
        return null;
    }

    /**
     * Register a data structure for visualization
     */
    registerDataStructure(name, type, value, context) {
        switch (type) {
            case 'array':
                context.arrays.set(name, value);
                break;
            case 'linkedlist':
                context.linkedLists.set(name, value);
                break;
            case 'tree':
                context.trees.set(name, value);
                break;
            case 'graph':
                context.graphs.set(name, value);
                break;
        }
    }

    /**
     * Capture current state for visualization
     */
    captureState(context) {
        const state = {
            variables: {},
            arrays: {},
            linkedLists: {},
            trees: {},
            stacks: {},
            queues: {},
            graphs: {},
            heaps: {},
            console: [...this.consoleOutput]
        };

        // Copy variables
        for (const [name, data] of context.variables) {
            state.variables[name] = {
                value: this.cloneValue(data.value),
                type: data.type,
                dsType: data.dsType
            };
            
            // Also add to appropriate data structure category
            if (data.dsType === 'array') {
                state.arrays[name] = this.cloneValue(data.value);
            }
        }

        // Copy registered data structures
        for (const [name, value] of context.arrays) {
            state.arrays[name] = this.cloneValue(value);
        }
        for (const [name, value] of context.linkedLists) {
            state.linkedLists[name] = this.cloneValue(value);
        }
        for (const [name, value] of context.trees) {
            state.trees[name] = this.cloneValue(value);
        }
        for (const [name, value] of context.graphs) {
            state.graphs[name] = this.cloneValue(value);
        }

        return state;
    }

    /**
     * Get assignment target name
     */
    getAssignmentTarget(node) {
        if (node.type === 'Identifier') {
            return { type: 'variable', name: node.name };
        } else if (node.type === 'MemberExpression') {
            return { 
                type: 'member', 
                object: node.object.name,
                property: node.computed ? 'computed' : node.property.name
            };
        }
        return null;
    }

    /**
     * Generate description for assignment
     */
    generateAssignmentDescription(expr, context) {
        const left = this.formatNode(expr.left);
        const right = this.formatNode(expr.right);
        return `${left} ${expr.operator} ${right}`;
    }

    /**
     * Format AST node for display
     */
    formatNode(node) {
        if (!node) return '';
        
        switch (node.type) {
            case 'Identifier':
                return node.name;
            case 'Literal':
                return String(node.value);
            case 'MemberExpression':
                if (node.computed) {
                    return `${this.formatNode(node.object)}[${this.formatNode(node.property)}]`;
                }
                return `${this.formatNode(node.object)}.${node.property.name}`;
            case 'BinaryExpression':
                return `${this.formatNode(node.left)} ${node.operator} ${this.formatNode(node.right)}`;
            case 'ArrayExpression':
                return `[${node.elements.map(e => this.formatNode(e)).join(', ')}]`;
            default:
                return '...';
        }
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
            clone[key] = this.cloneValue(value[key]);
        }
        return clone;
    }

    /**
     * Execute all steps and return final state
     */
    executeAll(context) {
        const states = [];
        
        for (const step of this.steps) {
            step.action();
            states.push(step.getState());
        }
        
        return states;
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

// Export for use in visualizer
window.DSAInterpreter = DSAInterpreter;
