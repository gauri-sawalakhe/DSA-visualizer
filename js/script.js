import { SORTS, getSort } from "./algorithms/sorting.js";
import {
    renderLinear,
    applyLinearOperation
} from "./algorithms/linear.js";
import {
    buildBST,
    buildBinaryTree,
    deleteNode,
    searchNode,
    searchBinaryTree,
    traversals,
    renderTree,
    renderThreadedTree,
    insertAVL
} from "./algorithms/trees.js";
import {
    buildGraph,
    traverseGraph,
    renderGraph
} from "./algorithms/graphs.js";

// ==========================================
// 1. DOM ELEMENTS
// ==========================================

const $ = id => document.getElementById(id);

const category = $("category");
const algorithm = $("algorithm");
const count = $("count");
const valuesInput = $("values");
const inputsArea = $("inputsArea");
const viz = $("visualization");
const status = $("status");

const names = {
    sorting: SORTS,
    array: ["Array"],
    singly: ["Singly linked list"],
    doubly: ["Doubly linked list"],
    stack: ["Stack"],
    queue: ["Queue"],
    binary: ["Binary tree"],
    bst: ["Binary search tree"],
    threaded: ["Threaded BST"],
    avl: ["AVL tree"],
    directed: ["Directed graph"],
    undirected: ["Undirected graph"]
};

let data = [];
let original = [];
let timer = null;
let paused = false;
let frames = [];
let frameIndex = 0;
let tree = null;
let graph = null;
let loaded = false;

// ==========================================
// 2. CATEGORY HELPERS
// ==========================================

function isTree() {
    return ["binary", "bst", "threaded", "avl"]
        .includes(category.value);
}

function isGraph() {
    return ["directed", "undirected"]
        .includes(category.value);
}

function isLinear() {
    return ["array", "singly", "doubly", "stack", "queue"]
        .includes(category.value);
}

function label() {
    return algorithm.value ||
        category.options[category.selectedIndex].text;
}

function buildSelectedTree(values) {
    if (category.value === "binary") return buildBinaryTree(values);
    if (category.value === "avl") {
        return values.reduce(
            (root, value) => insertAVL(root, value),
            null
        );
    }

    return buildBST(values);
}

function searchSelectedTree(value) {
    return category.value === "binary"
        ? searchBinaryTree(tree, value)
        : searchNode(tree, value);
}

// ==========================================
// 3. STATUS AND VALIDATION
// ==========================================

function msg(message, error = false) {
    status.textContent = message;
    status.classList.toggle("error", error);

    if (error) {
        alert(message);
    }
}

function parse(text) {
    const parts = text.trim()
        .split(/[,\s]+/)
        .filter(Boolean);

    if (!parts.length) {
        throw Error("Please enter at least one integer.");
    }

    if (parts.length > 30) {
        throw Error("Maximum 30 elements are allowed.");
    }

    return parts.map(value => {
        if (
            !/^-?\d+$/.test(value) ||
            !Number.isSafeInteger(Number(value))
        ) {
            throw Error(`"${value}" is not a valid integer.`);
        }

        return Number(value);
    });
}

// ==========================================
// 4. DYNAMIC INPUT BOXES
// ==========================================

function makeInputBoxes() {
    const n = Number(count.value);

    if (!Number.isInteger(n) || n < 1 || n > 30) {
        msg("Enter an element count from 1 to 30.", true);
        return;
    }

    inputsArea.innerHTML = "";

    for (let i = 0; i < n; i++) {
        const field = document.createElement("div");
        const labelElement = document.createElement("label");
        const input = document.createElement("input");

        field.className = "field";

        labelElement.textContent = `Element ${i + 1}`;

        input.type = "number";
        input.id = `el${i}`;
        input.placeholder = `Value ${i + 1}`;

        field.append(labelElement, input);
        inputsArea.append(field);
    }
}

// ==========================================
// 5. CATEGORY AND ALGORITHM SELECTION
// ==========================================

function setChoices() {
    algorithm.innerHTML = "";

    const choices = names[category.value] || [];

    for (const name of choices) {
        const option = document.createElement("option");
        option.textContent = name;
        option.value = name;
        algorithm.appendChild(option);
    }

    if (choices.length > 0) algorithm.selectedIndex = 0;

    $("modePill").textContent =
        category.options[category.selectedIndex].text;

    $("operationPanel").classList.toggle(
        "hidden",
        category.value === "sorting"
    );

    $("threadingField").classList.toggle(
        "hidden",
        category.value !== "threaded"
    );

    $("traversals").classList.toggle("hidden", !isTree());

    $("indexField").classList.toggle("hidden", !isLinear());

    preview();
    resetState();
}

// ==========================================
// 6. SMALL ANIMATED PREVIEW
// ==========================================

function preview() {
    const previewElement = $("preview");

    previewElement.innerHTML = "";

    if (category.value === "sorting") {
        [35, 65, 45, 82, 54, 25].forEach((height, index) => {
            const bar = document.createElement("i");
            bar.className = "mini-bar";
            bar.style.height = `${height}%`;
            bar.style.animationDelay = `${index * 0.13}s`;
            previewElement.append(bar);
        });
    } else if (isTree()) {
        ["30", "20", "45", "10", "25"].forEach((value, index) => {
            const node = document.createElement("i");
            node.className = "mini-node";
            node.textContent = value;
            node.style.animationDelay = `${index * 0.1}s`;
            previewElement.append(node);
        });
    } else if (isGraph()) {
        ["●", "●", "●", "●"].forEach((value, index) => {
            const node = document.createElement("i");
            node.className = "mini-node mini-graph-node";
            node.textContent = value;
            node.style.animationDelay = `${index * 0.1}s`;
            previewElement.append(node);
        });
    } else {
        [35, 60, 45, 75].forEach((height, index) => {
            const node = document.createElement("i");
            node.className = "mini-node mini-linear-node";
            node.style.height = `${height}%`;
            node.style.animationDelay = `${index * 0.1}s`;
            previewElement.append(node);
        });
    }

    $("previewCaption").textContent =
        `Animated preview · ${algorithm.value || category.value}`;
}

// ==========================================
// 7. HISTOGRAM BAR RENDERER
// ==========================================
// Each bar has its own column.
// The column aligns every bar to a shared baseline.
// The number is displayed below the bar.
// Active elements are highlighted during comparison.

function drawBars(arr, active = [], done = false) {
    viz.innerHTML = "";

    if (!arr.length) {
        viz.innerHTML =
            '<p class="empty">Structure is empty.</p>';
        return;
    }

    const chart = document.createElement("div");
    chart.className = "bar-chart";

    const stage = document.createElement("div");
    stage.className = "bar-stage";

    // Calculate a common scale for all bars.
    const maxValue = Math.max(
        1,
        ...arr.map(value => Math.abs(value))
    );

    arr.forEach((value, index) => {
        const item = document.createElement("div");
        item.className = "bar-item";

        // Create the bar.
        const bar = document.createElement("div");
        bar.className = "bar";

        if (active.includes(index)) {
            bar.classList.add("active");
        }

        if (done) {
            bar.classList.add("done");
        }

        // Scale each bar relative to the largest value.
        // Keep negative values visible using their absolute size.
        const height = Math.max(
            5,
            (Math.abs(value) / maxValue) * 190
        );

        bar.style.height = `${height}px`;

        // Add the value below the bar.
        const number = document.createElement("div");
        number.className = "bar-value";
        number.textContent = value;

        item.append(bar, number);
        stage.append(item);
    });

    chart.append(stage);
    viz.append(chart);
}

// ==========================================
// 8. RENDER CURRENT DATA STRUCTURE
// ==========================================

function render() {
    if (isTree()) {
        if (category.value === "threaded") {
            renderThreadedTree(
                viz,
                tree,
                $("threadingType").value
            );
        } else {
            renderTree(viz, tree);
        }
        showTraversals();
    } else if (isGraph()) {
        renderGraph(viz, graph);
        $("traversals").classList.add("hidden");
    } else if (category.value === "sorting") {
        drawBars(data);
    } else {
        renderLinear(viz, data, label());
    }
}

// ==========================================
// 9. TREE TRAVERSALS
// ==========================================

function showTraversals() {
    const result = traversals(tree);

    $("traversals").classList.remove("hidden");
    $("traversalResults").innerHTML = "";

    const traversalTypes = [
        ["level", "Level order"],
        ["pre", "Preorder"],
        ["in", "Inorder"],
        ["post", "Postorder"]
    ];

    for (const [key, title] of traversalTypes) {
        const element = document.createElement("div");

        element.className = "traversal-row";

        const heading = document.createElement("strong");
        heading.textContent = `${title}: `;

        element.append(
            heading,
            document.createTextNode(
                result[key].join(" → ") || "—"
            )
        );

        $("traversalResults").append(element);
    }
}

// ==========================================
// 10. RESET PROJECT STATE
// ==========================================

function stopAnimation() {
    if (timer !== null) {
        clearTimeout(timer);
    }

    timer = null;
    paused = false;

    $("pauseBtn").disabled = true;
    $("pauseBtn").textContent = "Pause";
}

function resetState() {
    stopAnimation();

    loaded = false;
    data = [];
    original = [];
    frames = [];
    frameIndex = 0;
    tree = null;
    graph = null;

    viz.innerHTML =
        '<p class="empty">Enter values and click Load & visualize.</p>';

    status.textContent =
        "Choose a topic and load your input.";

    status.classList.remove("error");

    $("stepLabel").textContent = "Ready";
    $("traversalResults").innerHTML = "";
}

// ==========================================
// 11. LOAD AND VISUALIZE INPUT
// ==========================================

function load() {
    try {
        let values;

        const boxes = [
            ...inputsArea.querySelectorAll("input")
        ];

        const hasBoxValues = boxes.some(
            input => input.value.trim() !== ""
        );

        const allBoxesFilled = boxes.length > 0 &&
            boxes.every(input => input.value.trim() !== "");

        if (hasBoxValues && !allBoxesFilled) {
            throw Error(
                "Please fill every generated input box or clear the boxes and use the direct input area."
            );
        }

        if (allBoxesFilled) {
            values = parse(
                boxes.map(input => input.value).join(",")
            );
        } else {
            values = parse(valuesInput.value);
        }

        if (
            category.value === "sorting" &&
            values.length < 2
        ) {
            throw Error("Sorting needs at least 2 elements.");
        }

        if (
            isTree() &&
            new Set(values).size !== values.length
        ) {
            throw Error(
                "Tree values must be unique. Remove duplicate values."
            );
        }

        data = [...values];
        original = [...values];

        frames = [];
        frameIndex = 0;

        if (isTree()) {
            tree = buildSelectedTree(values);

            if (category.value === "threaded") {
                renderThreadedTree(
                    viz,
                    tree,
                    $("threadingType").value
                );
            } else {
                renderTree(viz, tree);
            }
            showTraversals();

        } else if (isGraph()) {
            graph = buildGraph(
                values,
                category.value === "directed"
            );

            renderGraph(viz, graph);

        } else if (category.value === "sorting") {
            // Draw histogram before starting the animation.
            drawBars(data);

        } else {
            renderLinear(viz, data, label());
        }

        loaded = true;

        stopAnimation();

        $("stepLabel").textContent = "Loaded";

        msg(`${values.length} values loaded successfully.`);

    } catch (error) {
        msg(error.message, true);
    }
}

// ==========================================
// 12. PREPARE SORTING ANIMATION FRAMES
// ==========================================

function prepareSort() {
    const iterator = getSort(algorithm.value, data);

    frames = [];

    for (
        let result = iterator.next();
        !result.done;
        result = iterator.next()
    ) {
        frames.push(result.value);
    }

    frameIndex = 0;
}

// ==========================================
// 13. DISPLAY ONE SORTING FRAME
// ==========================================

function showFrame() {
    const frame = frames[frameIndex];

    if (!frame) return;

    // Every animation frame uses the histogram renderer.
    drawBars(
        frame.array,
        frame.active || [],
        Boolean(frame.done)
    );

    $("stepLabel").textContent =
        `Step ${frameIndex + 1}/${frames.length}`;

    msg(frame.message);

    if (frame.done) {
        stopAnimation();
    }
}

// ==========================================
// 14. NEXT STEP BUTTON
// ==========================================

function step() {
    if (!loaded) {
        msg("Load your input first.", true);
        return;
    }

    try {
        if (category.value !== "sorting") {
            msg(
                "Use Apply operation & animate for this structure."
            );
            return;
        }

        if (!frames.length) {
            prepareSort();
        }

        if (frameIndex < frames.length) {
            showFrame();
            frameIndex++;
        } else {
            msg("Sorting animation has finished.");
        }

    } catch (error) {
        msg(error.message, true);
    }
}

// ==========================================
// 15. START SORTING ANIMATION
// ==========================================

function animate() {
    if (!loaded) {
        msg("Load your input first.", true);
        return;
    }

    if (category.value !== "sorting") {
        msg("Choose an operation below to animate changes.");
        return;
    }

    try {
        if (!frames.length) {
            prepareSort();
        }

        // Avoid starting a second animation timer.
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }

        paused = false;

        $("pauseBtn").disabled = false;
        $("pauseBtn").textContent = "Pause";

        const run = () => {
            if (paused) return;

            if (frameIndex >= frames.length) {
                stopAnimation();
                return;
            }

            showFrame();
            frameIndex++;

            if (frameIndex < frames.length) {
                timer = setTimeout(
                    run,
                    Number($("speed").value)
                );
            } else {
                timer = null;
                $("pauseBtn").disabled = true;
                msg("Sorting animation finished.");
            }
        };

        run();

    } catch (error) {
        stopAnimation();
        msg(error.message, true);
    }
}

// ==========================================
// 16. INSERT, UPDATE, DELETE AND SEARCH
// ==========================================

function applyOp() {
    if (!loaded) {
        msg("Load your input first.", true);
        return;
    }

    const operation = $("operation").value;
    const valueText = $("opValue").value.trim();
    const indexText = $("opIndex").value.trim();

    let value;
    let index;

    try {
        if (
            operation !== "delete" &&
            operation !== "search" &&
            valueText === ""
        ) {
            throw Error("Enter a value for this operation.");
        }

        if (
            valueText !== "" &&
            (
                !/^-?\d+$/.test(valueText) ||
                !Number.isSafeInteger(Number(valueText))
            )
        ) {
            throw Error("Value must be a valid integer.");
        }

        value = Number(valueText);

        index = indexText === ""
            ? (operation === "insert" ? data.length : -1)
            : Number(indexText);

        if (
            indexText !== "" &&
            (!Number.isInteger(index) || index < 0)
        ) {
            throw Error(
                "Index must be a non-negative integer."
            );
        }

        // TREE OPERATIONS
        if (isTree()) {
            if (operation === "insert") {
                if (data.includes(value)) {
                    throw Error(
                        `Duplicate tree value ${value} is not allowed.`
                    );
                }

                data = [...data, value];
                tree = buildSelectedTree(data);

            } else if (operation === "delete") {
                if (!searchSelectedTree(value).found) {
                    throw Error(
                        `${value} does not exist in the tree.`
                    );
                }

                data = data.filter(item => item !== value);
                tree = category.value === "binary"
                    ? buildBinaryTree(data)
                    : deleteNode(tree, value);

            } else if (operation === "update") {
                throw Error(
                    "Updating a tree node is not supported. Delete the old value and insert the new value."
                );

            } else {
                const result = searchSelectedTree(value);

                if (category.value === "threaded") {
                    renderThreadedTree(
                        viz,
                        tree,
                        $("threadingType").value,
                        result.found ? value : null
                    );
                } else {
                    renderTree(
                        viz,
                        tree,
                        result.found ? value : null
                    );
                }

                msg(
                    result.found
                        ? `Found ${value}. Path: ${result.path.join(" → ")}`
                        : `${value} not found. Path: ${result.path.join(" → ")}`
                );

                showTraversals();
                return;
            }

            if (category.value === "threaded") {
                renderThreadedTree(
                    viz,
                    tree,
                    $("threadingType").value,
                    value
                );
            } else {
                renderTree(viz, tree, value);
            }
            showTraversals();

            msg(
                `${operation} completed. Tree traversals refreshed.`
            );

            return;
        }

        // GRAPH OPERATIONS
        if (isGraph()) {
            if (operation === "search") {
                if (!graph.nodes.includes(value)) {
                    throw Error(
                        `${value} is not a graph node.`
                    );
                }

                const path = traverseGraph(
                    graph,
                    graph.nodes[0],
                    "BFS"
                );

                renderGraph(viz, graph, [value]);

                msg(
                    `Node ${value} exists. BFS from ${graph.nodes[0]}: ${path.join(" → ")}`
                );

                return;
            }

            throw Error(
                "Graph demo supports search. Load a new input set to change graph nodes."
            );
        }

        // ARRAY, LINKED LIST, STACK AND QUEUE
        const result = applyLinearOperation(
            data,
            label(),
            operation,
            value,
            index
        );

        data = result.values;

        renderLinear(
            viz,
            data,
            label(),
            result.active
        );

        msg(result.message);

    } catch (error) {
        msg(error.message, true);
    }
}

// ==========================================
// 17. EVENT LISTENERS
// ==========================================

$("makeInputs").addEventListener(
    "click",
    makeInputBoxes
);

$("loadBtn").addEventListener(
    "click",
    load
);

$("randomBtn").addEventListener("click", () => {
    const n = Math.min(
        8,
        Math.max(2, Number(count.value) || 5)
    );

    count.value = n;

    const values = Array.from(
        { length: n },
        () => Math.floor(Math.random() * 90) + 1
    );

    valuesInput.value = values.join(", ");
    inputsArea.innerHTML = "";

    load();
});

$("clearBtn").addEventListener("click", () => {
    valuesInput.value = "";
    inputsArea.innerHTML = "";
    count.value = 5;

    resetState();
});

$("startBtn").addEventListener(
    "click",
    animate
);

$("stepBtn").addEventListener(
    "click",
    step
);

$("applyOpBtn").addEventListener(
    "click",
    applyOp
);

// PAUSE AND RESUME
$("pauseBtn").addEventListener("click", () => {
    if (timer === null && !paused) {
        return;
    }

    paused = !paused;

    $("pauseBtn").textContent =
        paused ? "Resume" : "Pause";

    if (paused && timer !== null) {
        clearTimeout(timer);
        timer = null;
    } else if (!paused) {
        animate();
    }
});

// RESET TO ORIGINAL VALUES
document.getElementById("resetBtn").addEventListener("click", () => {
    stopAnimation();

    if (!loaded) {
        msg("Load your input first.", true);
        return;
    }

    // Restore original data
    data = [...original];

    // Clear animation frames and reset index
    frames = [];
    frameIndex = 0;

    if (isTree()) {
        tree = buildSelectedTree(data);

        render();

    } else if (isGraph()) {
        // Rebuild the graph
        graph = buildGraph(
            data,
            category.value === "directed"
        );

        render();
    }
});

category.addEventListener("change", setChoices);
algorithm.addEventListener("change", preview);
$("threadingType").addEventListener("change", () => {
    if (category.value === "threaded" && loaded) render();
});
setChoices();