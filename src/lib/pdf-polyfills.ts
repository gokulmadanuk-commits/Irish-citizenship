// pdf.js is built for very new browsers. These small stand-ins let it run on
// Safari and on any browser that is a version or two behind, instead of failing
// silently when a page has to be turned into a picture for scanning.

type MapWithInsert = Map<unknown, unknown> & {
  getOrInsert?: (key: unknown, value: unknown) => unknown
  getOrInsertComputed?: (key: unknown, make: (key: unknown) => unknown) => unknown
}

export function installPdfPolyfills() {
  const M = Math as unknown as { sumPrecise?: (values: Iterable<number>) => number }
  if (typeof M.sumPrecise !== 'function') {
    // Neumaier summation: adds up a list of numbers with very little rounding drift.
    M.sumPrecise = (values: Iterable<number>) => {
      let sum = 0
      let correction = 0
      for (const value of values) {
        const next = sum + value
        correction += Math.abs(sum) >= Math.abs(value)
          ? sum - next + value
          : value - next + sum
        sum = next
      }
      return sum + correction
    }
  }

  const proto = Map.prototype as MapWithInsert
  if (typeof proto.getOrInsert !== 'function') {
    proto.getOrInsert = function (key: unknown, value: unknown) {
      if (!this.has(key)) this.set(key, value)
      return this.get(key)
    }
  }
  if (typeof proto.getOrInsertComputed !== 'function') {
    proto.getOrInsertComputed = function (key: unknown, make: (key: unknown) => unknown) {
      if (!this.has(key)) this.set(key, make(key))
      return this.get(key)
    }
  }
}
