// TODO: add these to roseboxlib
export function debounce(this: any, func: Function, timeout = 150){
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// https://decipher.dev/30-seconds-of-typescript/docs/throttle/
export function throttle(fn: Function, wait: number = 300) {
  let inThrottle: boolean,
    lastFn: ReturnType<typeof setTimeout>,
    lastTime: number;
  return function (this: any) {
    const context = this,
      args = arguments;
    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
};

/** assign all attributes in an object to provided element */
export function assignAttributes(node: HTMLElement, attributes: Record<string, any>) {
	Object.entries(attributes).forEach(([key, value]: [string, any]) => {
		node.setAttribute(key, value)
	});
}

/** assign all attributes in an object to provided svg */
export function assignAttributesSVG(svgNode: SVGSVGElement, attributes: Record<string, any>) {
	Object.entries(attributes).forEach(([key, value]: [string, any]) => {
		svgNode.setAttributeNS(null, key, value)
	});
}

export function randomNumberBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

// credit: https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript#51365037
export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

/**
 * Math.round but behaves correctly when rounding floating point numbers
 * it does this by first converting the numbers to integers, rounding them and then dividing them back to floating points.
 * @param {number} number number to round
 * @param {number} precision the decimal points precision. default it 2
 * @returns {number} the rounded number with correct decimal points
 */
export function precisionRound(number: number, precision = 2) {
	let factor = Math.pow(10, precision);
	return Math.round(number * factor) / factor;
}