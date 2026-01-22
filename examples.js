/**
 * Pre-built Algorithm Examples
 * Ready-to-use code examples for various algorithms
 */

const EXAMPLES = {
    // Sorting Algorithms
    bubbleSort: {
        name: 'Bubble Sort',
        category: 'Sorting',
        code: `// Bubble Sort Algorithm
let arr = [64, 34, 25, 12, 22, 11, 90];

for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
        // Compare adjacent elements
        if (arr[j] > arr[j + 1]) {
            // Swap elements
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}

console.log("Sorted array:", arr);`
    },

    quickSort: {
        name: 'Quick Sort',
        category: 'Sorting',
        code: `// Quick Sort Algorithm
let arr = [10, 7, 8, 9, 1, 5];

function partition(arr, low, high) {
    let pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    
    return i + 1;
}

function quickSort(arr, low, high) {
    if (low < high) {
        let pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

quickSort(arr, 0, arr.length - 1);
console.log("Sorted:", arr);`
    },

    mergeSort: {
        name: 'Merge Sort',
        category: 'Sorting',
        code: `// Merge Sort Algorithm
let arr = [38, 27, 43, 3, 9, 82, 10];

function merge(arr, left, mid, right) {
    let n1 = mid - left + 1;
    let n2 = right - mid;
    
    let L = [];
    let R = [];
    
    for (let i = 0; i < n1; i++) {
        L[i] = arr[left + i];
    }
    for (let j = 0; j < n2; j++) {
        R[j] = arr[mid + 1 + j];
    }
    
    let i = 0, j = 0, k = left;
    
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

function mergeSort(arr, left, right) {
    if (left < right) {
        let mid = Math.floor((left + right) / 2);
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

mergeSort(arr, 0, arr.length - 1);
console.log("Sorted:", arr);`
    },

    // Searching Algorithms
    binarySearch: {
        name: 'Binary Search',
        category: 'Searching',
        code: `// Binary Search Algorithm
let arr = [2, 3, 4, 10, 40, 50, 60, 70];
let target = 40;

let left = 0;
let right = arr.length - 1;
let result = -1;

while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
        result = mid;
        break;
    }
    
    if (arr[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}

if (result !== -1) {
    console.log("Found at index:", result);
} else {
    console.log("Not found");
}`
    },

    linearSearch: {
        name: 'Linear Search',
        category: 'Searching',
        code: `// Linear Search Algorithm
let arr = [10, 20, 80, 30, 60, 50, 110, 100, 130, 170];
let target = 110;

let result = -1;

for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
        result = i;
        break;
    }
}

if (result !== -1) {
    console.log("Found at index:", result);
} else {
    console.log("Not found");
}`
    },

    // Linked List Operations
    linkedListReverse: {
        name: 'Reverse Linked List',
        category: 'Linked List',
        code: `// Reverse a Linked List
class ListNode {
    constructor(val) {
        this.val = val;
        this.next = null;
    }
}

// Create: 1 -> 2 -> 3 -> 4 -> 5
let head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);
head.next.next.next = new ListNode(4);
head.next.next.next.next = new ListNode(5);

// Reverse the list
let prev = null;
let current = head;

while (current !== null) {
    let nextTemp = current.next;
    current.next = prev;
    prev = current;
    current = nextTemp;
}

head = prev;
console.log("Reversed!");`
    },

    linkedListCycle: {
        name: 'Detect Cycle in Linked List',
        category: 'Linked List',
        code: `// Detect Cycle using Floyd's Algorithm
class ListNode {
    constructor(val) {
        this.val = val;
        this.next = null;
    }
}

// Create a list with cycle
let head = new ListNode(1);
let node2 = new ListNode(2);
let node3 = new ListNode(3);
let node4 = new ListNode(4);

head.next = node2;
node2.next = node3;
node3.next = node4;
node4.next = node2; // Creates cycle

let slow = head;
let fast = head;
let hasCycle = false;

while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    
    if (slow === fast) {
        hasCycle = true;
        break;
    }
}

console.log("Has cycle:", hasCycle);`
    },

    // Tree Operations
    bstInsert: {
        name: 'BST Insert',
        category: 'Trees',
        code: `// Binary Search Tree Insertion
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

function insert(root, val) {
    if (root === null) {
        return new TreeNode(val);
    }
    
    if (val < root.val) {
        root.left = insert(root.left, val);
    } else {
        root.right = insert(root.right, val);
    }
    
    return root;
}

let root = null;
let values = [50, 30, 70, 20, 40, 60, 80];

for (let val of values) {
    root = insert(root, val);
    console.log("Inserted:", val);
}

console.log("BST created!");`
    },

    treeTraversal: {
        name: 'Tree Traversals',
        category: 'Trees',
        code: `// Tree Traversal Algorithms
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

// Build tree:     1
//               /   \\
//              2     3
//             / \\   / \\
//            4   5 6   7

let root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
root.right.left = new TreeNode(6);
root.right.right = new TreeNode(7);

// Inorder traversal (Left, Root, Right)
function inorder(node) {
    if (node === null) return;
    inorder(node.left);
    console.log("Visit:", node.val);
    inorder(node.right);
}

console.log("Inorder traversal:");
inorder(root);`
    },

    // Stack & Queue
    stackOps: {
        name: 'Stack Operations',
        category: 'Stack & Queue',
        code: `// Stack Operations (LIFO)
let stack = [];

// Push operations
stack.push(10);
console.log("Pushed: 10");

stack.push(20);
console.log("Pushed: 20");

stack.push(30);
console.log("Pushed: 30");

// Peek top element
let top = stack[stack.length - 1];
console.log("Top element:", top);

// Pop operations
let popped = stack.pop();
console.log("Popped:", popped);

popped = stack.pop();
console.log("Popped:", popped);

console.log("Stack size:", stack.length);`
    },

    queueOps: {
        name: 'Queue Operations',
        category: 'Stack & Queue',
        code: `// Queue Operations (FIFO)
let queue = [];

// Enqueue operations
queue.push(10);
console.log("Enqueued: 10");

queue.push(20);
console.log("Enqueued: 20");

queue.push(30);
console.log("Enqueued: 30");

// Front element
let front = queue[0];
console.log("Front element:", front);

// Dequeue operations
let dequeued = queue.shift();
console.log("Dequeued:", dequeued);

dequeued = queue.shift();
console.log("Dequeued:", dequeued);

console.log("Queue size:", queue.length);`
    },

    // Graph Algorithms
    bfs: {
        name: 'BFS Traversal',
        category: 'Graphs',
        code: `// Breadth-First Search
let graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
};

let visited = {};
let queue = ['A'];
visited['A'] = true;

console.log("BFS Traversal:");

while (queue.length > 0) {
    let node = queue.shift();
    console.log("Visit:", node);
    
    for (let neighbor of graph[node]) {
        if (!visited[neighbor]) {
            visited[neighbor] = true;
            queue.push(neighbor);
        }
    }
}

console.log("BFS Complete!");`
    },

    dfs: {
        name: 'DFS Traversal',
        category: 'Graphs',
        code: `// Depth-First Search
let graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
};

let visited = {};

function dfs(node) {
    visited[node] = true;
    console.log("Visit:", node);
    
    for (let neighbor of graph[node]) {
        if (!visited[neighbor]) {
            dfs(neighbor);
        }
    }
}

console.log("DFS Traversal:");
dfs('A');
console.log("DFS Complete!");`
    },

    // Two Pointers
    twoSum: {
        name: 'Two Sum (Sorted Array)',
        category: 'Two Pointers',
        code: `// Two Sum in Sorted Array
let arr = [2, 7, 11, 15, 20, 25];
let target = 22;

let left = 0;
let right = arr.length - 1;
let result = null;

while (left < right) {
    let sum = arr[left] + arr[right];
    
    if (sum === target) {
        result = [left, right];
        break;
    }
    
    if (sum < target) {
        left++;
    } else {
        right--;
    }
}

if (result) {
    console.log("Found at indices:", result);
    console.log("Values:", arr[result[0]], "+", arr[result[1]], "=", target);
} else {
    console.log("No solution found");
}`
    },

    // Sliding Window
    maxSubarray: {
        name: 'Max Subarray Sum (Sliding Window)',
        category: 'Sliding Window',
        code: `// Maximum Sum Subarray of Size K
let arr = [2, 1, 5, 1, 3, 2];
let k = 3;

let windowSum = 0;
let maxSum = 0;

// Calculate first window
for (let i = 0; i < k; i++) {
    windowSum = windowSum + arr[i];
}
maxSum = windowSum;

// Slide the window
for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    
    if (windowSum > maxSum) {
        maxSum = windowSum;
    }
}

console.log("Maximum sum:", maxSum);`
    }
};

// Export examples
window.EXAMPLES = EXAMPLES;
