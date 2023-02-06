// TODO: add these to roseboxlib
export function debounce(this: any, func: Function, timeout = 150){
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

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