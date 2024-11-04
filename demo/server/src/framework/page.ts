export class Page<T> {
  constructor(
    readonly page: number,
    readonly limit: number,
    readonly elements: T[],
    readonly total: number,
  ) {}
}
