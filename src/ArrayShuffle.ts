export function ArrayShuffle<T>(nodesinsidecircle: T[]): T[] {
    return Array.from(nodesinsidecircle).sort(() => Math.random() - 0.5);
}
