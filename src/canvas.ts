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
	transparentCorners: false,
	strokeWidth: 0,
	cornerStyle: 'circle',
	cornerSize: 12
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
 
/** remove the current activeObject or even selection */
export function removeActiveObject(canvas: fabricCanvasExtended) {
	const activeObjLength = canvas.getActiveObjects().length
	canvas.getActiveObjects().forEach(object => canvas.remove(object)) 
	if (activeObjLength > 1) canvas.discardActiveObject()
}

type postProcessOptions = { cleanup: boolean, setDefaults: boolean }

/** do some post / pre processing on an object. like set rounded corners, default, values, cleanup, etc... */
function _postprocessObject(object: fabric.Object, opts: postProcessOptions = { cleanup: false, setDefaults: false }) {
	if (opts.setDefaults) object.set(DEFAULT_RECT_OPTS) //@ts-ignore-next-line, ts doesen't like untyped deleting of props from objects
	if (opts.cleanup) [0, 1, 2, 3, 4, 'globalCompositeOperation'].forEach((key: any) => delete object[key]) 
	// if (typeof object.canvas !== "undefined" && 'ensureObjectScaleSnapped' in object.canvas) {
	// 	const canvas: any = object.canvas
	// 	canvas.ensureObjectScaleSnapped(object)
	// }
	object.setControlsVisibility({ mtr: false })
	return object
}

export function duplicateSelection(canvas: GridSnapCanvas) {
	const toClone = canvas.getActiveObjects()

	const promises: Promise<fabric.Object>[] = toClone.map((object) => {
		return new Promise((resolve) => {
			// Only copy essential properties
			const cloneProps = ['left', 'top', 'width', 'height', 'fill', 'backgroundColor', 'originX', 'originY', 'selectable']
			const postProcessOpts = { cleanup: true, setDefaults: true }
			object.clone((object: fabric.Object) => resolve(_postprocessObject(object, postProcessOpts)), cloneProps)
		});
	});

	Promise.all(promises)
		.then((clonedObjects: fabric.Object[]) => {
			const group = new fabric.Group(clonedObjects);
			group.set({ originX: 'left', originY: 'top' });
			group.set({ left: 32, top: 32})
			group.setCoords()

			// Add the group to the canvas
			canvas.add(group);
			canvas.requestRenderAll()

			// Split the group into individual objects and re-render the canvas
			canvas.remove(group);
			group.getObjects().forEach((obj: fabric.Object) => {
				//@ts-ignore cloned objects have an ownCaching boolean. tried to union it but didn't work
				obj.set({...DEFAULT_RECT_COLORS, ownMatrixCache: undefined, matrixCache: undefined, ownCaching: false})
				obj.setCoords()
				console.log("transforms", fabric.util.saveObjectTransform(obj)) // TODO restore transforms from old objects and .setCoords
				canvas.add(obj)
			});
			canvas.requestRenderAll();
		})
		.catch((error) => console.error(error) );
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
	//@ts-ignore, setBackgroundColor's not supposed to work but it's the only way
	canvas.setBackgroundColor({ source: inlineSVGString(tileSvgString) }, canvasBgCallback)
}


// credit to https://codepen.io/G470/pen/PLbMLL, modified by KraXen72
export function readAndAddImage(canvas: GridSnapCanvas, file: File) {
	const fileReader = new FileReader();

	fileReader.onload = () => {
		var imgElement = new Image();
		imgElement.src = fileReader.result as string;

		imgElement.onload = () => {
			const fabricImage = createImage(imgElement)

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
			// const rect = createRect(canvas.gridGranularity)
		};
	};
	fileReader.readAsDataURL(file);
};

/** have to be assignable to image and rect */
interface newObjectSharedOptions {
	canvas?: GridSnapCanvas
}

interface newRectOptions extends newObjectSharedOptions { 
	width?: number,
	height?: number
}

// todo refactor these two
export function createRect(size: number, options?: newRectOptions) {
	const backgroundColor = "#" + DEFAULT_RECT_COLORS[randomNumberBetween(0, DEFAULT_RECT_COLORS.length - 1)]
	const rectOptions: fabric.IRectOptions = {
		...DEFAULT_RECT_OPTS,
		left: size,
		top: size,
		width: (options?.width ?? randomNumberBetween(2, 5)) * size,
		height: (options?.width ?? randomNumberBetween(2, 5)) * size,
		fill: backgroundColor,
		backgroundColor: backgroundColor,
	}
	if (options?.canvas) rectOptions.canvas = options.canvas

	return _postprocessObject(new fabric.Rect(rectOptions));
}
// todo remove this abstraction / de-extract, put back in place
export function createImage(imgElement: HTMLImageElement | HTMLVideoElement, options?: newObjectSharedOptions) {
	return _postprocessObject(new fabric.Image(imgElement, { ...DEFAULT_RECT_OPTS, ...options }));
}