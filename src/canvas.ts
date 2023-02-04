import { fabric } from "fabric";
import { ILineOptions } from "fabric/fabric-impl";
import { GridSnapCanvas } from "./grid-snap-canvas";
import { randomNumberBetween } from "./utils";

export type fabricCanvasExtended = (GridSnapCanvas | fabric.Canvas) & { isDragging?: boolean, lastPosX?: number, lastPosY?: number}
export type viewportBorders = {
	top: fabric.Line,
	right: fabric.Line,
	bottom: fabric.Line,
	left: fabric.Line
} | null

const DEFAULT_RECT_OPTS: fabric.IRectOptions = {
	originX: 'left',
	originY: 'top',
	lockRotation: true,
	hasRotatingPoint: false,
	transparentCorners: false
}
const DEFAULT_RECT_COLORS = ["f4f1de","e07a5f","3d405b","81b29a","f2cc8f"]

//https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions#8876069
const getViewportWidth = () => Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const getViewportHeight = () => Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

const getDotColor = () => window.getComputedStyle(document.body).getPropertyValue('--dot-color')

function getViewportCorners() {
	const vh = getViewportHeight()
	const vw = getViewportWidth()

	return ({
		tl: [0, 0],
		tr: [vw, 0],
		bl: [0, vh],
		br: [vw, vh]
	})
}

export function resetViewportTransform(canvas: fabricCanvasExtended) {
	const vpt = canvas.viewportTransform
	vpt[4] = 0;
	vpt[5] = 0;
	canvas.setViewportTransform(vpt)
	canvas.requestRenderAll();
}

/** resize canvas to viewport size */
export function resizeCanvas(canvas: fabricCanvasExtended, vptBorders: viewportBorders = null) {
	canvas.setWidth(getViewportWidth());
	canvas.setHeight(getViewportHeight());

	if (vptBorders !== null) {
		console.log(vptBorders)
		const v = getViewportCorners()

		vptBorders.top.set({x1: v.tl[0], y1: v.tl[1], x2: v.tr[0], y2: v.tr[1]})
		vptBorders.right.set({x1: v.tr[0], y1: v.tr[1], x2: v.br[0], y2: v.br[1]})
		vptBorders.bottom.set({x1: v.bl[0], y1: v.bl[1], x2: v.br[0], y2: v.br[1]})
		vptBorders.left.set({x1: v.tl[0], y1: v.tl[1], x2: v.bl[0], y2: v.bl[1]})
		Object.values(vptBorders).forEach(v => v.setCoords())
		canvas.requestRenderAll()
	}
}
export function drawViewportBorders(canvas: fabricCanvasExtended): viewportBorders {
	const vh = getViewportHeight()
	const vw = getViewportWidth()

	if (canvas.height !== vh || canvas.width !== vw) resizeCanvas(canvas, null)
	
	const lineStyles: ILineOptions = {
		stroke: getDotColor(),
		hasControls: false,
		hasBorders: false,
		selectable: false,
		hoverCursor: "default",
		hasRotatingPoint: false,
		lockRotation: true,
		lockMovementX: true,
		lockMovementY: true
	}

	const v = getViewportCorners()

	const borders: viewportBorders = {
		top: new fabric.Line([...v.tl, ...v.tr], lineStyles),
		right: new fabric.Line([...v.tr, ...v.br], lineStyles),
		bottom: new fabric.Line([...v.bl, ...v.br], lineStyles),
		left: new fabric.Line([...v.tl, ...v.bl], lineStyles)
	}
	Object.values(borders).forEach(line => canvas.add(line))

	return borders
}

export function inlineSVGString(svgString: string) {
	return `data:image/svg+xml,${encodeURIComponent(svgString)}`
}
export function urlSVGString(svgString: string) {
	return `url("${inlineSVGString(svgString)}")`
}

export function initDotMatrix(canvas: fabricCanvasExtended, size = 32, r = 2) {
	const circlePositions = [[size, 0], [0, 0], [size, size], [0, size]]
	const circleStyle = `fill:${getDotColor()};stroke:#9d5867;stroke-width:0;`
	
	const tileSvgString = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs/><g>
		${circlePositions.map(([cx, cy]) => `<circle style="${circleStyle}" cx="${cx}" cy="${cy}" r="${r}"/>`).join("\n")}
	</g></svg>`
	
	//() => ({repeat: "repeat"}), {repeat: "repeat"} or () => {} works too
	// but it's best to force the canvas to render after setting of the bg color
	const canvasBgCallback = () => setTimeout(() => canvas.requestRenderAll(), 0) 
	//@ts-ignore
	canvas.setBackgroundColor({source: inlineSVGString(tileSvgString)}, canvasBgCallback)
}


// credit to https://codepen.io/G470/pen/PLbMLL, modified by KraXen72
export function readAndAddImage(canvas: GridSnapCanvas, file: File) {
	const fileReader = new FileReader();

	fileReader.onload = () => {
		var imgElement = new Image();
		imgElement.src = fileReader.result as string;

		imgElement.onload = () => {
			const fabricImage = new fabric.Image(imgElement, { canvas: canvas, ...DEFAULT_RECT_OPTS });   
			fabricImage.setControlsVisibility({ mtr: false })

			const vw = getViewportWidth()
			const vh = getViewportHeight()
			if (vw > vh) { //landscape
				fabricImage.scaleToWidth(vw - 200);
				fabricImage.scaleToHeight(vh - 200);
			} else { //portrait
				fabricImage.scaleToHeight(vh - 200);
				fabricImage.scaleToWidth(vw - 200);
			}
			canvas.add(fabricImage);
			canvas.centerObject(fabricImage);
			const rect = createRect(canvas.gridGranularity)
		};
	};
	fileReader.readAsDataURL(file);
};

export interface ICanvasRectOptions extends Object { 
	width?: number,
	height?: number
}

export function createRect(size: number, options?: ICanvasRectOptions) {
	const backgroundColor = "#" + DEFAULT_RECT_COLORS[randomNumberBetween(0, DEFAULT_RECT_COLORS.length - 1)]
	const rectOptions: fabric.IRectOptions = {
		left: size,
		top: size,
		width: (options?.width ?? randomNumberBetween(2, 5)) * size,
		height: (options?.width ?? randomNumberBetween(2, 5)) * size,
		fill: backgroundColor,
		backgroundColor: backgroundColor,
		...DEFAULT_RECT_OPTS
	}

	const rect = new fabric.Rect(rectOptions);
	rect.setControlsVisibility({ mtr: false })
	return rect
}