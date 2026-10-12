export function buildBinaryTree(values) {
    const nodes = values.map(value => ({
        value,
        left: null,
        right: null
    }));

    for (let i = 0; i < nodes.length; i++) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < nodes.length) nodes[i].left = nodes[left];
        if (right < nodes.length) nodes[i].right = nodes[right];
    }

    return nodes[0] || null;
}

export function buildBST(values) {
    let root = null;

    for (const value of values) root = insert(root, value);

    return root;
}

export function insert(root, value) {
    if (!root) return { value, left: null, right: null };
    if (value === root.value) {
        throw Error(`Duplicate tree value ${value} is not allowed.`);
    }

    if (value < root.value) root.left = insert(root.left, value);
    else root.right = insert(root.right, value);

    return root;
}

export function deleteNode(root, value) {
    if (!root) return null;

    if (value < root.value) root.left = deleteNode(root.left, value);
    else if (value > root.value) root.right = deleteNode(root.right, value);
    else {
        if (!root.left) return root.right;
        if (!root.right) return root.left;

        let successor = root.right;
        while (successor.left) successor = successor.left;

        root.value = successor.value;
        root.right = deleteNode(root.right, successor.value);
    }

    return root;
}

export function searchNode(root, value, path = []) {
    if (!root) return { found: false, path };

    path.push(root.value);
    if (root.value === value) return { found: true, path };

    return searchNode(
        value < root.value ? root.left : root.right,
        value,
        path
    );
}

export function searchBinaryTree(root, value, path = []) {
    if (!root) return { found: false, path };

    const nextPath = [...path, root.value];
    if (root.value === value) return { found: true, path: nextPath };

    const left = searchBinaryTree(root.left, value, nextPath);
    if (left.found) return left;

    return searchBinaryTree(root.right, value, nextPath);
}

export function traversals(root) {
    const out = { level: [], pre: [], in: [], post: [] };

    function pre(node) {
        if (!node) return;
        out.pre.push(node.value);
        pre(node.left);
        pre(node.right);
    }

    function ino(node) {
        if (!node) return;
        ino(node.left);
        out.in.push(node.value);
        ino(node.right);
    }

    function post(node) {
        if (!node) return;
        post(node.left);
        post(node.right);
        out.post.push(node.value);
    }

    pre(root);
    ino(root);
    post(root);

    const queue = root ? [root] : [];
    while (queue.length) {
        const node = queue.shift();
        out.level.push(node.value);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }

    return out;
}

function layoutTree(root) {
    const nodes = [];
    let nextX = 40;

    function layout(node, depth = 0) {
        if (!node) return;

        layout(node.left, depth + 1);
        node._x = nextX;
        node._y = 36 + depth * 75;
        nextX += 58;
        nodes.push(node);
        layout(node.right, depth + 1);
    }

    layout(root);

    return {
        nodes,
        width: Math.max(300, nextX),
        height: Math.max(130, ...nodes.map(node => node._y + 40))
    };
}

export function renderTree(container, root, highlight = null) {
    container.innerHTML = "";
    if (!root) {
        container.textContent = "Tree is empty";
        return;
    }

    const layout = layoutTree(root);
    let svg = `<svg class="tree-svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="Tree diagram">`;

    function edges(node) {
        if (!node) return;

        for (const child of [node.left, node.right]) {
            if (child) {
                svg += `<line x1="${node._x}" y1="${node._y}" x2="${child._x}" y2="${child._y}" stroke="#9aa9c3" stroke-width="2"/>`;
            }
        }

        edges(node.left);
        edges(node.right);
    }

    edges(root);

    for (const node of layout.nodes) {
        const found = node.value === highlight;
        svg += `<circle cx="${node._x}" cy="${node._y}" r="20" fill="${found ? "#8be0b9" : "#e8edff"}" stroke="${found ? "#159765" : "#6384ff"}" stroke-width="2"/><text x="${node._x}" y="${node._y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#182338">${node.value}</text>`;
    }

    svg += "</svg>";
    container.innerHTML = svg;
}

export function renderThreadedTree(
    container,
    root,
    mode = "double",
    highlight = null
) {
    container.innerHTML = "";
    if (!root) {
        container.textContent = "Tree is empty";
        return;
    }

    const layout = layoutTree(root);
    const ordered = [...layout.nodes].sort((a, b) => a._x - b._x);
    const previous = new Map();
    const next = new Map();

    ordered.forEach((node, index) => {
        previous.set(node, ordered[index - 1]);
        next.set(node, ordered[index + 1]);
    });

    let svg = `<svg class="tree-svg" viewBox="0 0 ${layout.width} ${layout.height + 35}" role="img" aria-label="${mode}-threaded binary search tree diagram">`;
    svg += '<defs><marker id="thread-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#d47721"/></marker></defs>';

    function edges(node) {
        if (!node) return;

        if (node.left) {
            svg += `<line x1="${node._x}" y1="${node._y}" x2="${node.left._x}" y2="${node.left._y}" stroke="#9aa9c3" stroke-width="2"/>`;
        } else if (mode === "left" || mode === "double") {
            const predecessor = previous.get(node);
            if (predecessor) {
                svg += `<line class="thread-edge" x1="${node._x}" y1="${node._y + 14}" x2="${predecessor._x}" y2="${predecessor._y + 14}" stroke="#e59b13" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#thread-arrow)"/>`;
            }
        }

        if (node.right) {
            svg += `<line x1="${node._x}" y1="${node._y}" x2="${node.right._x}" y2="${node.right._y}" stroke="#9aa9c3" stroke-width="2"/>`;
        } else if (mode === "right" || mode === "double") {
            const successor = next.get(node);
            if (successor) {
                svg += `<line class="thread-edge" x1="${node._x}" y1="${node._y - 14}" x2="${successor._x}" y2="${successor._y - 14}" stroke="#d47721" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#thread-arrow)"/>`;
            }
        }

        edges(node.left);
        edges(node.right);
    }

    edges(root);

    for (const node of layout.nodes) {
        const found = node.value === highlight;
        svg += `<circle cx="${node._x}" cy="${node._y}" r="20" fill="${found ? "#8be0b9" : "#e8edff"}" stroke="${found ? "#159765" : "#6384ff"}" stroke-width="2"/><text x="${node._x}" y="${node._y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#182338">${node.value}</text>`;
    }

    const description = mode === "double"
        ? "predecessor and successor"
        : `${mode} threads`;
    svg += `<text x="10" y="${layout.height + 25}" font-size="12" fill="#b36b16">Dashed arrows: ${description}</text></svg>`;
    container.innerHTML = svg;
}

export function balanceFactor(node) {
    if (!node) return 0;
    return height(node.left) - height(node.right);
}

function height(node) {
    return node ? 1 + Math.max(height(node.left), height(node.right)) : 0;
}

export function insertAVL(root, value) {
    if (!root) return { value, left: null, right: null };
    if (value === root.value) {
        throw Error(`Duplicate tree value ${value} is not allowed.`);
    }

    if (value < root.value) root.left = insertAVL(root.left, value);
    else root.right = insertAVL(root.right, value);

    const factor = balanceFactor(root);
    if (factor > 1 && value < root.left.value) return rotateRight(root);
    if (factor < -1 && value > root.right.value) return rotateLeft(root);
    if (factor > 1 && value > root.left.value) {
        root.left = rotateLeft(root.left);
        return rotateRight(root);
    }
    if (factor < -1 && value < root.right.value) {
        root.right = rotateRight(root.right);
        return rotateLeft(root);
    }

    return root;
}

function rotateRight(node) {
    const child = node.left;
    const transfer = child.right;
    child.right = node;
    node.left = transfer;
    return child;
}

function rotateLeft(node) {
    const child = node.right;
    const transfer = child.left;
    child.left = node;
    node.right = transfer;
    return child;
}
