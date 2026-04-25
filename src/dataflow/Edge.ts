export class Edge {
  constructor(
    public readonly id: string,
    public readonly fromNodeId: string,
    public readonly fromPort: string,
    public readonly toNodeId: string,
    public readonly toPort: string,
  ) {}
}
