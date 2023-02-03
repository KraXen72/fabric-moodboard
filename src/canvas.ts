import { fabric } from "fabric";
import { GridSnapCanvas } from "./grid-snap-fabric";

export type fabricCanvasExtended = GridSnapCanvas | fabric.Canvas

//https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions#8876069
const getViewportWidth = () => Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const getViewportHeight = () => Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

/** resize canvas to viewport size */
export function resizeCanvas(canvas: fabricCanvasExtended) {
	canvas.setWidth(getViewportWidth());
	canvas.setHeight(getViewportHeight());
}

function inlineSVGString(svgString: string) {
	return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`
}
function urlSVGString(svgString: string) {
	return `url("${inlineSVGString(svgString)}")`
}

// function patternFromImage(element: fabric.Object) {
// 	const patternSourceCanvas = new fabric.StaticCanvas(document.createElement("canvas"));
// 	patternSourceCanvas.add(element);
// 	patternSourceCanvas.renderAll();
// 	// return new fabric.Pattern({
// 	// 	source: patternSourceCanvas.getElement(),
// 	// 	repeat: 'repeat',
// 	// });
// 	return new fabric.Image(patternSourceCanvas.getElement())
// }

export function initDotMatrix(canvas: fabricCanvasExtended, xTiles = 60, yTiles = 34, size = 32, r = 2) {
	const circlePositions = [[size, 0], [0, 0], [size, size], [0, size]]
	const circleStyle = `fill:#ffffff;stroke:#9d5867;stroke-width:0;`

	// const tileSvgElem = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	// assignAttributesSVG(tileSvgElem, { width: size, height: size, viewBox: `0 0 ${size} ${size}`, version: "1.1" })
	// tileSvgElem.innerHTML = `<defs/><g>${
	// 	circlePositions
	// 		.map(([cx, cy]) => `<circle style="${circleStyle}" cx="${cx}" cy="${cy}" r="${r}"/>`)
	// 		.join("\n")
	// }</g></svg>`

	// TODO: tbh just probably implement the linear gradient option as before & set css variables for 
	
	const tileSvgString = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs/><g>
		${circlePositions.map(([cx, cy]) => `<circle style="${circleStyle}" cx="${cx}" cy="${cy}" r="${r}"/>`).join("\n")}
	</g></svg>`
	const aaa = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='13' height='13' fill-opacity='0.1' fill='%23000000'/%3E%3C/svg%3E")`

	canvas.setBackgroundImage(aaa, () => {canvas.requestRenderAll()})
	// const bg = new fabric.Rect({ width: xTiles*size, height: yTiles*size, stroke: 'rgba(0,0,0,0)', strokeWidth: 0, fill: '', evented: false, selectable: false, top:0, left:0 });
	// bg.set("backgroundColor", {source: urlSVGString(tileSvgString), repeat: "repeat"})
	// console.log(bg)
	// // bg.fill = new fabric.Pattern({source: })
	// canvas.add(bg)
	// bg.dirty = true;
	// canvas.requestRenderAll()
	// bg.canvas = canvas;
  // canvas.setBackgroundImage(bg, () => {bg.dirty = true; canvas.requestRenderAll() });

	// fabric.loadSVGFromString(tileSvgString, function(objects, options) {
	// 	const group = fabric.util.groupSVGElements(objects, options)
	// 	const pattern = patternFromImage(group)
	// 	// canvas.setBackgroundColor({source: pattern, repeat: "repeat"}, () => canvas.renderAll())
		
	// 	// canvas.setBackgroundImage(group, () => canvas.renderAll())
	// 	// canvas.setBackgroundColor({source: svgg, repeat: "repeat"}, () => canvas.renderAll() )
	// });
	

	// const patternSourceCanvas = new fabric.StaticCanvas(document.createElement("canvas"));
	// patternSourceCanvas.add(fabric.util.groupSVGElements([tileSvgElem]));
	// patternSourceCanvas.setDimensions({ width: size, height: size });
	// const texture = patternSourceCanvas.getElement();
	
	// const dotMatrixPattern = new fabric.Pattern({
	// 	source: tileSvgElem,
	// 	repeat: "repeat"
	// })
	// canvas.setBackgroundColor(dotMatrixPattern, () => {}); 

	

	// canvas.setBackgroundImage(image, () => {})
}