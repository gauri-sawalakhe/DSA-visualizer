export const SORTS = [
    "Bubble Sort",
    "Selection Sort",
    "Insertion Sort",
    "Merge Sort",
    "Quick Sort",
    "Heap Sort"
];

// BUBBLE SORT
export function* bubbleSort(input) {
    const a = [...input];

    for (let i = 0; i < a.length - 1; i++) {
        let changed = false;

        for (let j = 0; j < a.length - i - 1; j++) {
            yield {
                array: [...a],
                active: [j, j + 1],
                message: `Comparing ${a[j]} and ${a[j + 1]}`
            };

            if (a[j] > a[j + 1]) {
                [a[j], a[j + 1]] = [a[j + 1], a[j]];

                changed = true;

                yield {
                    array: [...a],
                    active: [j, j + 1],
                    message: `Swapping ${a[j]} and ${a[j + 1]}`
                };
            }
        }

        if (!changed) break;
    }

    yield {
        array: [...a],
        active: [],
        message: "Bubble Sort completed!",
        done: true
    };
}

// SELECTION SORT
export function* selectionSort(input) {
    const a = [...input];

    for (let i = 0; i < a.length - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < a.length; j++) {
            yield {
                array: [...a],
                active: [minIndex, j],
                message: `Comparing ${a[minIndex]} and ${a[j]}`
            };

            if (a[j] < a[minIndex]) {
                minIndex = j;

                yield {
                    array: [...a],
                    active: [i, minIndex],
                    message: `New minimum: ${a[minIndex]}`
                };
            }
        }

        if (minIndex !== i) {
            [a[i], a[minIndex]] = [a[minIndex], a[i]];
        }

        yield {
            array: [...a],
            active: [i, minIndex],
            message: `Placing ${a[i]} in its correct position`
        };
    }

    yield {
        array: [...a],
        active: [],
        message: "Selection Sort completed!",
        done: true
    };
}

// INSERTION SORT
export function* insertionSort(input) {
    const a = [...input];

    for (let i = 1; i < a.length; i++) {
        const value = a[i];
        let j = i - 1;

        yield {
            array: [...a],
            active: [i],
            message: `Selecting ${value} for insertion`
        };

        while (j >= 0 && a[j] > value) {
            yield {
                array: [...a],
                active: [j, j + 1],
                message: `Comparing ${a[j]} with ${value}`
            };

            a[j + 1] = a[j];

            yield {
                array: [...a],
                active: [j, j + 1],
                message: `Moving ${a[j + 1]} one position right`
            };

            j--;
        }

        a[j + 1] = value;

        yield {
            array: [...a],
            active: [j + 1],
            message: `Inserted ${value} into the sorted section`
        };
    }

    yield {
        array: [...a],
        active: [],
        message: "Insertion Sort completed!",
        done: true
    };
}

// MERGE SORT
export function* mergeSort(input) {
    const a = [...input];

    function* merge(left, mid, right) {
        const leftPart = a.slice(left, mid + 1);
        const rightPart = a.slice(mid + 1, right + 1);

        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftPart.length && j < rightPart.length) {
            yield {
                array: [...a],
                active: [k],
                message: `Comparing ${leftPart[i]} and ${rightPart[j]}`
            };

            if (leftPart[i] <= rightPart[j]) {
                a[k] = leftPart[i];
                i++;
            } else {
                a[k] = rightPart[j];
                j++;
            }

            yield {
                array: [...a],
                active: [k],
                message: `Merging value ${a[k]}`
            };

            k++;
        }

        while (i < leftPart.length) {
            a[k] = leftPart[i];

            yield {
                array: [...a],
                active: [k],
                message: `Merging value ${a[k]}`
            };

            i++;
            k++;
        }

        while (j < rightPart.length) {
            a[k] = rightPart[j];

            yield {
                array: [...a],
                active: [k],
                message: `Merging value ${a[k]}`
            };

            j++;
            k++;
        }
    }

    function* divide(left, right) {
        if (left >= right) return;

        const mid = Math.floor((left + right) / 2);

        yield {
            array: [...a],
            active: [left, right],
            message: `Dividing range ${left} to ${right}`
        };

        yield* divide(left, mid);
        yield* divide(mid + 1, right);
        yield* merge(left, mid, right);
    }

    yield* divide(0, a.length - 1);

    yield {
        array: [...a],
        active: [],
        message: "Merge Sort completed!",
        done: true
    };
}

// QUICK SORT
export function* quickSort(input) {
    const a = [...input];

    function* partitionSort(left, right) {
        if (left >= right) return;

        const pivot = a[right];
        let i = left;

        yield {
            array: [...a],
            active: [right],
            message: `Selected pivot: ${pivot}`
        };

        for (let j = left; j < right; j++) {
            yield {
                array: [...a],
                active: [j, right],
                message: `Comparing ${a[j]} with pivot ${pivot}`
            };

            if (a[j] < pivot) {
                if (i !== j) {
                    [a[i], a[j]] = [a[j], a[i]];

                    yield {
                        array: [...a],
                        active: [i, j],
                        message: "Swapping smaller value to the left"
                    };
                }

                i++;
            }
        }

        [a[i], a[right]] = [a[right], a[i]];

        yield {
            array: [...a],
            active: [i],
            message: `Pivot ${a[i]} placed in its correct position`
        };

        yield* partitionSort(left, i - 1);
        yield* partitionSort(i + 1, right);
    }

    yield* partitionSort(0, a.length - 1);

    yield {
        array: [...a],
        active: [],
        message: "Quick Sort completed!",
        done: true
    };
}

// HEAP SORT
export function* heapSort(input) {
    const a = [...input];
    const n = a.length;

    function* heapify(size, root) {
        let largest = root;
        const left = 2 * root + 1;
        const right = 2 * root + 2;

        if (left < size && a[left] > a[largest]) {
            largest = left;
        }

        if (right < size && a[right] > a[largest]) {
            largest = right;
        }

        yield {
            array: [...a],
            active: [root, left < size ? left : root],
            message: `Checking heap at index ${root}`
        };

        if (largest !== root) {
            [a[root], a[largest]] = [a[largest], a[root]];

            yield {
                array: [...a],
                active: [root, largest],
                message: "Swapping to restore max heap"
            };

            yield* heapify(size, largest);
        }
    }

    // Build the max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(n, i);
    }

    // Move the largest value to the end
    for (let end = n - 1; end > 0; end--) {
        [a[0], a[end]] = [a[end], a[0]];

        yield {
            array: [...a],
            active: [0, end],
            message: `Moving maximum ${a[end]} to its final position`
        };

        yield* heapify(end, 0);
    }

    yield {
        array: [...a],
        active: [],
        message: "Heap Sort completed!",
        done: true
    };
}

// SELECT THE REQUIRED ALGORITHM
export function getSort(name, input) {
    switch (name) {
        case "Bubble Sort":
            return bubbleSort(input);

        case "Selection Sort":
            return selectionSort(input);

        case "Insertion Sort":
            return insertionSort(input);

        case "Merge Sort":
            return mergeSort(input);

        case "Quick Sort":
            return quickSort(input);

        case "Heap Sort":
            return heapSort(input);

        default:
            throw new Error("Please select a valid sorting algorithm.");
    }
}