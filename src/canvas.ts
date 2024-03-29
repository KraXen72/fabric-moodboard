import { fabric } from 'fabric';
import { ILineOptions } from "fabric/fabric-impl";
import { setup } from "fabricjs-object-fit";
import { APP_SETTINGS } from './main';
import { customObjectFitControls } from "./active-object";
import { GridSnapCanvas, snapGrid } from "./grid-snap-canvas";
import { blobToData, randomNumberBetween } from "./utils";

export type fabricCanvasExtended = (GridSnapCanvas | fabric.Canvas) & { isDragging?: boolean, lastPosX?: number, lastPosY?: number }
export type viewportBorders = {
	top: fabric.Line,
	right: fabric.Line,
	bottom: fabric.Line,
	left: fabric.Line
} | null

const DEFAULT_RECT_OPTS: fabric.IRectOptions = {
	originX: 'left',
	originY: 'top',
	lockSkewingX: true,
	lockSkewingY: true,
	lockRotation: true,
	hasRotatingPoint: false,
	transparentCorners: false,
	strokeWidth: 0,
	cornerStyle: 'circle',
	cornerSize: 14,
	lockScalingFlip: true
}
const DEFAULT_RECT_COLORS = ["f4f1de", "e07a5f", "3d405b", "81b29a", "f2cc8f"]

// TODO fork & overwrite fabric-object-fit to depend on 5.3.0 defs
const { ObjectFit } = setup(fabric)

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


// todo change to class or something so it keeps state of last tiled images
function AutoTileImages(objects: IObjectFitFull[], canvas: GridSnapCanvas) {
	const vpt = getViewportCorners()
	const cellSize = canvas.gridGranularity
	const gap = cellSize

	let currentY = gap
	let currentX = gap
	let rowHeight = Number.NEGATIVE_INFINITY

	objects.forEach(object => {
		const cHeight = object.height * object.scaleY
		const cWidth = object.width * object.scaleX
		
		if (currentX + cWidth > vpt.tr[0]) { // new row, reset x
			currentX = gap
			currentY += rowHeight + gap
			rowHeight = Number.NEGATIVE_INFINITY
		}

		object.set({ left: currentX, top: currentY })

		if (cHeight > rowHeight) rowHeight = cHeight // found new tallest image
		currentX += Math.round(cWidth) + gap // shift new image to the right
	})
	objects.forEach(o => o.recompute())
	canvas.setActiveObject(objects[objects.length - 1])
	canvas.requestRenderAll()
}

export function resetViewportTransform(canvas: fabricCanvasExtended) {
	const vpt = canvas.viewportTransform
	vpt[4] = 0;
	vpt[5] = 0;
	canvas.setViewportTransform(vpt)
	canvas.requestRenderAll();
}

export function resetZoom(canvas: fabricCanvasExtended) {
	canvas.setZoom(1)
}

const selectAllBlacklist = ['line']
export function selectAllInCanvas(canvas: fabricCanvasExtended) {
	canvas.discardActiveObject();
	canvas.setActiveObject(new fabric.ActiveSelection(canvas.getObjects().filter(o => !selectAllBlacklist.includes(o.type) ), { canvas }));
	canvas.requestRenderAll();
}

/** remove the current activeObject or even selection */
export function removeActiveObject(canvas: fabricCanvasExtended) {
	const activeObjLength = canvas.getActiveObjects().length
	canvas.getActiveObjects().forEach(object => canvas.remove(object))
	if (activeObjLength > 1) canvas.discardActiveObject()
}

/** do some post / pre processing on an object. like set rounded corners, default, values, cleanup, etc... */
function _postprocessObject(object: fabric.Object, opts: postProcessOptions = { cleanup: false, setDefaults: false }) {
	if (opts.setDefaults) object.set(DEFAULT_RECT_OPTS) //@ts-ignore-next-line, ts doesen't like untyped deleting of props from objects
	if (opts.cleanup) [0, 1, 2, 3, 4, 'globalCompositeOperation', 'version'].forEach((key: any) => delete object[key])

	object.setControlsVisibility({ mtr: false })
	return object
}

/** 
 * calculate the top & left depeding on selectionShim, object & paste direction
 * @param pastePosition the direction in which the new thing is supposed to be pasted
 * @param twin twin or selectionShim
 * @param obj the current object
 * @param gridGranularity the size of 1 grid cell
 * @param selection if we are dealing with a selection or not.
 */
function _newPastePosition(
	pastePosition: appSettings['pasteDirection'],
	twin: selectionShimOrTwin,
	obj: fabric.Object,
	gridGranularity: number,
	selection: boolean
) {
	if (!selection) {
		// single objects usually have a width, height + scaleX, scaleY
		const tw_w = twin.width * twin.scaleX
		const tw_h = twin.height * twin.scaleY
		switch (pastePosition) {
			case "above":
				return { top: twin.top - tw_h - gridGranularity, left: twin.left }
			case "below":
				return { top: twin.top + tw_h + gridGranularity, left: twin.left }
			case "left":
				return { top: twin.top, left: twin.left - tw_w - gridGranularity }
			case "right":
			default:
				return { top: twin.top, left: twin.left + tw_w + gridGranularity }
		}
	} else {
		// in this case the object's top is usually negative = relative to selection
		// and the selection is positive = real position, but also center based & not topleft
		// so we have to account for & normalize both
		const halfW = Math.round(twin.width / 2)
		const halfH = Math.round(twin.height / 2)
		switch (pastePosition) {
			case "above":
				return {
					top: obj.top + twin.top + halfH - twin.height - gridGranularity,
					left: obj.left + twin.left + halfW
				}
			case "below":
				return {
					top: obj.top + twin.top + halfH + twin.height + gridGranularity,
					left: obj.left + twin.left + halfW
				}
			case "left":
				return {
					top: obj.top + twin.top + halfH,
					left: obj.left + twin.left - twin.width + halfW - gridGranularity
				}
			case "right":
			default:
				return {
					top: obj.top + twin.top + halfH,
					left: obj.left + twin.left + twin.width + halfW + gridGranularity
				}
		}
	}
}

export function duplicateSelection(canvas: GridSnapCanvas, appSettings: appSettings) {
	const toClone = canvas.getActiveObjects()
	if (toClone.length === 0) return;

	const promises: Promise<fabric.Object>[] = toClone.map((object) => {
		return new Promise((resolve) => {
			// Only copy essential properties
			const cloneProps = ['left', 'top', 'width', 'height', 'fill', 'backgroundColor', 'originX', 'originY', 'selectable']
			const postProcessOpts = { cleanup: true, setDefaults: true, addControls: false }
			object.clone((object: fabric.Object) => resolve(_postprocessObject(object, postProcessOpts)), cloneProps)
		});
	});

	Promise.all(promises)
		.then((clonedObjects: fabric.Object[]) => {
			if (clonedObjects.length === 1) {
				const twin = toClone[0]
				const clone = clonedObjects[0]
				canvas.add(clone)
				clone.set(_newPastePosition(appSettings.pasteDirection, twin as selectionShimOrTwin, clone, canvas.gridGranularity, false))
				clone.setCoords()
				try { canvas.discardActiveObject() } catch (e) { }
				canvas.setActiveObject(clone)
			} else {
				const active = canvas.getActiveObject()
				active.set({ originX: 'left', originY: 'top' })
				active.setCoords()
				const { top, left, width, height } = active;
				const selectionShim = { top, left, width, height, scaleX: 1, scaleY: 1 };

				clonedObjects.forEach((obj: fabric.Object) => {
					canvas.add(obj)
					obj.set(_newPastePosition(appSettings.pasteDirection, selectionShim, obj, canvas.gridGranularity, true))
					obj.setCoords()
				});
				try { canvas.discardActiveObject() } catch (e) { }
				canvas.setActiveObject(new fabric.ActiveSelection(clonedObjects, { canvas }))
			}
			canvas.requestRenderAll();
		})
		.catch((error) => console.error(error));
}

/** resize canvas to viewport size */
export function resizeCanvas(canvas: fabricCanvasExtended, vptBorders: viewportBorders = null) {
	canvas.setWidth(getViewportWidth());
	canvas.setHeight(getViewportHeight());

	if (vptBorders !== null) {
		const v = getViewportCorners()

		vptBorders.top.set({ x1: v.tl[0], y1: v.tl[1], x2: v.tr[0], y2: v.tr[1] })
		vptBorders.right.set({ x1: v.tr[0], y1: v.tr[1], x2: v.br[0], y2: v.br[1] })
		vptBorders.bottom.set({ x1: v.bl[0], y1: v.bl[1], x2: v.br[0], y2: v.br[1] })
		vptBorders.left.set({ x1: v.tl[0], y1: v.tl[1], x2: v.bl[0], y2: v.bl[1] })
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

Object.assign(ObjectFit.prototype.controls, customObjectFitControls())

// credit to fileReader => canvas implementation to https://codepen.io/G470/pen/PLbMLL
// credit to object fit to https://legacybiel.github.io/fabricjs-object-fit/examples/#fit-modes
// both further modified by KraXen72
export function readAndAddImages(canvas: GridSnapCanvas, files: FileList, mode: coverContain = "cover", cellsSize = 10) {
	const _imgContainers = Array.from(files).slice(0, APP_SETTINGS.maxImagesAtOnce).map((file) => {
		return new Promise<IObjectFitFull>(async (resolve) => {
			let imgElement = new Image();
			imgElement.src = await blobToData(file)
			imgElement.onload = () => {
				const vw = imgElement.naturalWidth
				const vh = imgElement.naturalHeight
				const imageSize = canvas.gridGranularity * cellsSize
				const fImg = createImage(imgElement)

				// saving the computed image width & height so it remembers it's true aspect ratio after we scale it to fit the grid
				const originalComputedWidth = fImg.width * fImg.scaleX
				const originalComputedHeight = fImg.height * fImg.scaleY

				// scale the image so it's bigger dimension is cellSize, and that it is perfectly snapped to grid
				// scale can be derived from computedDimension / originalDimension
				if (vw > vh) { // landscape
					fImg.scaleToWidth(imageSize); // this only changes scaleX, not width
					const cHeight = fImg.height * fImg.scaleY // computed height (real)
					const newComputedHeight = snapGrid(cHeight, canvas.gridGranularity)
					fImg.set({ scaleY: newComputedHeight / fImg.height })
				} else { // portrait
					fImg.scaleToHeight(imageSize); // this only changes scaleY, not height
					const cWidth = fImg.width * fImg.scaleX // computed width (real)
					const newComputedWidth = snapGrid(cWidth, canvas.gridGranularity) 
					fImg.set({ scaleX: newComputedWidth / fImg.width })
				}
				
				const container = _postprocessObject(new ObjectFit(fImg, { mode, enableRecomputeOnScaled: true }), { setDefaults: true }) as IObjectFitFull
				canvas.add(container);
				
				// after scaling & placing image, remember it's dimensions
				container.set({ originalImageDimensions: { width: originalComputedWidth, height: originalComputedHeight } })
				resolve(container)
			};
		})
	});
	Promise.all(_imgContainers).then(containers => AutoTileImages(containers, canvas))
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
		backgroundColor: backgroundColor
	}
	if (options?.canvas) rectOptions.canvas = options.canvas
	const rect = _postprocessObject(new fabric.Rect(rectOptions));
	return rect
}
// todo remove this abstraction / de-extract, put back in place
export function createImage(imgElement: HTMLImageElement | HTMLVideoElement, options?: newObjectSharedOptions) {
	return _postprocessObject(new fabric.Image(imgElement, { ...DEFAULT_RECT_OPTS, ...options }));
}