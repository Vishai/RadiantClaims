/**
 * Minimal DOM polyfills required for running pdfjs-dist in a Node.js environment.
 *
 * pdfjs-dist expects several browser APIs (DOMMatrix, Path2D, ImageData).
 * In the context of server-side OCR we only need lightweight implementations
 * that satisfy the interfaces used during text extraction. These polyfills
 * implement enough of the API surface to keep pdfjs-dist happy without
 * introducing heavy native dependencies like node-canvas.
 */

type MatrixPrimitive =
  | number[]
  | Float32Array
  | Float64Array
  | DOMMatrixInit
  | string
  | undefined;

const identityMatrix: [number, number, number, number, number, number] = [
  1, 0, 0, 1, 0, 0,
];

function toSixValues(
  init?: MatrixPrimitive | SimpleDOMMatrix
): [number, number, number, number, number, number] {
  if (!init) {
    return [...identityMatrix];
  }

  if (init instanceof SimpleDOMMatrix) {
    return [init.a, init.b, init.c, init.d, init.e, init.f];
  }

  if (
    Array.isArray(init) ||
    init instanceof Float32Array ||
    init instanceof Float64Array
  ) {
    if (init.length === 6) {
      return [
        Number(init[0]),
        Number(init[1]),
        Number(init[2]),
        Number(init[3]),
        Number(init[4]),
        Number(init[5]),
      ];
    }

    if (init.length === 16) {
      // 4x4 matrix coming from DOMMatrixReadOnly
      return [
        Number(init[0]),
        Number(init[1]),
        Number(init[4]),
        Number(init[5]),
        Number(init[12]),
        Number(init[13]),
      ];
    }
  }

  if (init && typeof init === "object") {
    const candidate = init as Partial<DOMMatrixInit>;
    if (
      "a" in candidate ||
      "b" in candidate ||
      "c" in candidate ||
      "d" in candidate ||
      "e" in candidate ||
      "f" in candidate
    ) {
      const matrix = candidate as DOMMatrixInit;
      return [
        Number((matrix.a as number | undefined) ?? 1),
        Number((matrix.b as number | undefined) ?? 0),
        Number((matrix.c as number | undefined) ?? 0),
        Number((matrix.d as number | undefined) ?? 1),
        Number((matrix.e as number | undefined) ?? 0),
        Number((matrix.f as number | undefined) ?? 0),
      ];
    }
  }

  if (typeof init === "string") {
    const match = init.replace(/\s+/g, "").match(/matrix\(([-0-9.,e]+)\)/i);

    if (match) {
      const rawValues = match[1];
      if (typeof rawValues === "string") {
        const parts = rawValues.split(",").map((p) => Number.parseFloat(p));

        if (parts.length === 6) {
          return [
            parts[0] ?? 1,
            parts[1] ?? 0,
            parts[2] ?? 0,
            parts[3] ?? 1,
            parts[4] ?? 0,
            parts[5] ?? 0,
          ];
        }
      }
    }
  }

  // Fall back to identity if parsing fails
  return [...identityMatrix];
}

class SimpleDOMMatrix {
  private _a: number;
  private _b: number;
  private _c: number;
  private _d: number;
  private _e: number;
  private _f: number;

  constructor(init?: MatrixPrimitive | SimpleDOMMatrix) {
    const [a, b, c, d, e, f] = toSixValues(init);
    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
    this._e = e;
    this._f = f;
  }

  private setFromArray(
    values: [number, number, number, number, number, number]
  ) {
    [this._a, this._b, this._c, this._d, this._e, this._f] = values;
  }

  private static multiply(
    left: [number, number, number, number, number, number],
    right: [number, number, number, number, number, number]
  ): [number, number, number, number, number, number] {
    const [a1, b1, c1, d1, e1, f1] = left;
    const [a2, b2, c2, d2, e2, f2] = right;

    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }

  multiplySelf(other: MatrixPrimitive | SimpleDOMMatrix): this {
    const product = SimpleDOMMatrix.multiply(
      [this._a, this._b, this._c, this._d, this._e, this._f],
      toSixValues(other)
    );
    this.setFromArray(product);
    return this;
  }

  preMultiplySelf(other: MatrixPrimitive | SimpleDOMMatrix): this {
    const product = SimpleDOMMatrix.multiply(toSixValues(other), [
      this._a,
      this._b,
      this._c,
      this._d,
      this._e,
      this._f,
    ]);
    this.setFromArray(product);
    return this;
  }

  translate(tx = 0, ty = 0): this {
    return this.multiplySelf([1, 0, 0, 1, tx, ty]);
  }

  scale(
    scaleX = 1,
    scaleY = scaleX,
    _scaleZ?: number,
    originX = 0,
    originY = 0
  ): this {
    if (originX || originY) {
      this.translate(originX, originY);
    }
    this.multiplySelf([scaleX, 0, 0, scaleY, 0, 0]);
    if (originX || originY) {
      this.translate(-originX, -originY);
    }
    return this;
  }

  invertSelf(): this {
    const det = this._a * this._d - this._b * this._c;
    if (det === 0) {
      // Non-invertible; reset to identity to avoid NaN propagation
      this.setFromArray([...identityMatrix]);
      return this;
    }

    const invDet = 1 / det;
    const a = this._d * invDet;
    const b = -this._b * invDet;
    const c = -this._c * invDet;
    const d = this._a * invDet;
    const e = -(a * this._e + c * this._f);
    const f = -(b * this._e + d * this._f);

    this.setFromArray([a, b, c, d, e, f]);
    return this;
  }

  clone(): SimpleDOMMatrix {
    return new SimpleDOMMatrix([
      this._a,
      this._b,
      this._c,
      this._d,
      this._e,
      this._f,
    ]);
  }

  get is2D(): boolean {
    return true;
  }

  get isIdentity(): boolean {
    return (
      this._a === 1 &&
      this._b === 0 &&
      this._c === 0 &&
      this._d === 1 &&
      this._e === 0 &&
      this._f === 0
    );
  }

  // Accessors to match DOMMatrix interface
  get a() {
    return this._a;
  }
  set a(value: number) {
    this._a = value;
  }
  get b() {
    return this._b;
  }
  set b(value: number) {
    this._b = value;
  }
  get c() {
    return this._c;
  }
  set c(value: number) {
    this._c = value;
  }
  get d() {
    return this._d;
  }
  set d(value: number) {
    this._d = value;
  }
  get e() {
    return this._e;
  }
  set e(value: number) {
    this._e = value;
  }
  get f() {
    return this._f;
  }
  set f(value: number) {
    this._f = value;
  }

  get m11() {
    return this._a;
  }
  set m11(value: number) {
    this._a = value;
  }
  get m12() {
    return this._b;
  }
  set m12(value: number) {
    this._b = value;
  }
  get m21() {
    return this._c;
  }
  set m21(value: number) {
    this._c = value;
  }
  get m22() {
    return this._d;
  }
  set m22(value: number) {
    this._d = value;
  }
  get m41() {
    return this._e;
  }
  set m41(value: number) {
    this._e = value;
  }
  get m42() {
    return this._f;
  }
  set m42(value: number) {
    this._f = value;
  }
}

class SimplePath2D {
  constructor(_path?: string | SimplePath2D) {
    // No-op stub; we only need the constructor to exist
  }
  rect(_x: number, _y: number, _w: number, _h: number) {
    return this;
  }
  moveTo(_x: number, _y: number) {
    return this;
  }
  lineTo(_x: number, _y: number) {
    return this;
  }
  closePath() {
    return this;
  }
  addPath(_path: SimplePath2D, _matrix?: SimpleDOMMatrix) {
    return this;
  }
}

class SimpleImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(
    dataOrWidth: number | Uint8ClampedArray | number[],
    width?: number,
    height?: number
  ) {
    if (typeof dataOrWidth === "number") {
      const actualWidth = dataOrWidth;
      const actualHeight = typeof width === "number" ? width : 0;
      this.width = actualWidth;
      this.height = actualHeight;
      this.data = new Uint8ClampedArray(actualWidth * actualHeight * 4);
    } else {
      const dataArray =
        dataOrWidth instanceof Uint8ClampedArray
          ? dataOrWidth
          : new Uint8ClampedArray(dataOrWidth);
      this.width = width ?? 0;
      this.height = height ?? 0;
      this.data = dataArray;
    }
  }
}

/**
 * Ensure the minimal DOM APIs pdfjs-dist expects are available.
 */
export function ensurePdfjsPolyfills(): void {
  if (typeof globalThis.DOMMatrix === "undefined") {
    (globalThis as unknown as { DOMMatrix: typeof SimpleDOMMatrix }).DOMMatrix =
      SimpleDOMMatrix;
  }

  if (typeof globalThis.Path2D === "undefined") {
    (globalThis as unknown as { Path2D: typeof SimplePath2D }).Path2D =
      SimplePath2D;
  }

  if (typeof globalThis.ImageData === "undefined") {
    (globalThis as unknown as { ImageData: typeof SimpleImageData }).ImageData =
      SimpleImageData;
  }
}
