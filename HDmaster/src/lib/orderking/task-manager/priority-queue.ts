export class PriorityQueue<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  enqueue(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.siftDown(0);
    return root;
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
        this.swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * current + 1;
      const rightChild = 2 * current + 2;
      let smallest = current;

      if (leftChild < length && this.comparator(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < length && this.comparator(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest !== current) {
        this.swap(current, smallest);
        current = smallest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
