export class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  getLeftChildIndex(i) {
    return 2 * i + 1;
  }

  getRightChildIndex(i) {
    return 2 * i + 2;
  }

  swap(i1, i2) {
    const temp = this.heap[i1];
    this.heap[i1] = this.heap[i2];
    this.heap[i2] = temp;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap[0] || null;
  }

  size() {
    return this.heap.length;
  }

  insert(item) {
    // item is expected to have 'sendAt' (Date or timestamp) and other properties
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    let currentIndex = index;
    let parentIndex = this.getParentIndex(currentIndex);

    while (
      currentIndex > 0 &&
      new Date(this.heap[currentIndex].sendAt).getTime() <
        new Date(this.heap[parentIndex].sendAt).getTime()
    ) {
      this.swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
      parentIndex = this.getParentIndex(currentIndex);
    }
  }

  extractMin() {
    if (this.isEmpty()) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return min;
  }

  heapifyDown(index) {
    let currentIndex = index;
    let leftIndex = this.getLeftChildIndex(currentIndex);
    let rightIndex = this.getRightChildIndex(currentIndex);
    let smallestIndex = currentIndex;

    const length = this.heap.length;

    if (
      leftIndex < length &&
      new Date(this.heap[leftIndex].sendAt).getTime() <
        new Date(this.heap[smallestIndex].sendAt).getTime()
    ) {
      smallestIndex = leftIndex;
    }

    if (
      rightIndex < length &&
      new Date(this.heap[rightIndex].sendAt).getTime() <
        new Date(this.heap[smallestIndex].sendAt).getTime()
    ) {
      smallestIndex = rightIndex;
    }

    if (smallestIndex !== currentIndex) {
      this.swap(currentIndex, smallestIndex);
      this.heapifyDown(smallestIndex);
    }
  }

  // Returns data for heap visualization (tree & linear array)
  getVisualizationData() {
    const nodes = this.heap.map((item, index) => ({
      index,
      id: `heap-${index}`,
      label: item.content ? (item.content.length > 15 ? item.content.substring(0, 12) + '...' : item.content) : 'Msg',
      sendAt: new Date(item.sendAt).toLocaleTimeString(),
      timestamp: new Date(item.sendAt).getTime(),
      recipient: item.recipientName || 'User'
    }));

    const links = [];
    for (let i = 0; i < this.heap.length; i++) {
      const left = this.getLeftChildIndex(i);
      const right = this.getRightChildIndex(i);
      if (left < this.heap.length) {
        links.push({ source: `heap-${i}`, target: `heap-${left}` });
      }
      if (right < this.heap.length) {
        links.push({ source: `heap-${i}`, target: `heap-${right}` });
      }
    }

    return { nodes, links, array: this.heap };
  }
}
