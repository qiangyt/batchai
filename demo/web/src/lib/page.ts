"use client";


export class Page<T> {
  constructor(
    readonly limit: number = 10,
    readonly elements: T[] = [],
    readonly page?: number,
    readonly total?: number,
  ) {}

  static with<T> (obj: any): Page<T> {
    if (!obj) return obj;
    Object.setPrototypeOf(obj, Page.prototype);
    return obj;
  }

}
