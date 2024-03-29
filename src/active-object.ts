import { fabricCanvasExtended } from './canvas';
import { IPosition, IPoint, Point } from 'fabricjs-object-fit';
import { fabric } from 'fabric';
import upArrow from './icons/upArrow.svg';
import { precisionRound } from './utils';
import { GridSnapCanvas, snapGrid } from './grid-snap-canvas';

// helper functions for the active object

export function scaleToAspectRatio(canvas: GridSnapCanvas, adjust: 'width' | 'height', snapToGrid: boolean) {
	const _active = canvas.getActiveObject() as IObjectFitFull

	// apparently, user scaling images only changes their width & height, not scaleX and scale Y
	// to get the factor, we divide current other dimension (* scale, if any) with the original other dimension
	if (adjust === 'width') {
		const factor = _active.height * _active.scaleY / _active.originalImageDimensions.height
		const width = _active.originalImageDimensions.width * factor
		_active.set({ width: snapToGrid ? snapGrid(width, canvas.gridGranularity) : width })
	} else {
		const factor = _active.width * _active.scaleX / _active.originalImageDimensions.width
		const height = _active.originalImageDimensions.height * factor
		_active.set({ height: snapToGrid ? snapGrid(height, canvas.gridGranularity) : height  })
	}
	_active.recompute()
	canvas.requestRenderAll()
}

/** scale image to it's original dimensions (possibly snap to grid) */
export function scaleImageToTrueDims(canvas: GridSnapCanvas, object: IObjectFitFull, snap: boolean) {
	const dims = snap ? { 
		width: snapGrid(object.originalImageDimensions.width, canvas.gridGranularity),
		height: snapGrid(object.originalImageDimensions.height, canvas.gridGranularity),
	} : object.originalImageDimensions
	object.set({ ...dims, scaleX: 1, scaleY: 1 })
	object.recompute()
	canvas.requestRenderAll()
}

/** update active ObjectFIt's position  */
export function updateActiveObjPos(canvas: fabricCanvasExtended, key: keyof Partial<IPosition>, value: IPoint) {
	const _active = canvas.getActiveObject() as IObjectFitFull
	if (_active.type !== "objectFit") return;
	_active.position[key] = value
	_active.recompute()
	canvas.requestRenderAll()
}

/** resolve fabric-object-fit's points into a 0-1 decimal scale: 0 top, 0.5 middle, 1 bottom, etc. */
export function resolvePointToDecimal(point: IPoint): SmallRange {
	const strPoint = point.toString()
	// console.log(point, strPoint)
	if (strPoint.startsWith("Point.Y")) {
		switch (strPoint) {
			case "Point.Y.TOP": return 0 as SmallRange;
			case "Point.Y.CENTER": return 0.5 as SmallRange;
			case "Point.Y.BOTTOM": return 1 as SmallRange;
			default: throw new Error(`resolvePointToDecimal: unhandled '${strPoint}'`);;
		}
	} else if (strPoint.startsWith("Point.X")) {
		switch (strPoint) {
			case "Point.X.LEFT": return 0 as SmallRange;
			case "Point.X.CENTER": return 0.5 as SmallRange;
			case "Point.X.RIGHT": return 1 as SmallRange;
			default: throw new Error(`resolvePointToDecimal: unhandled '${strPoint}'`);
		}
	} else if (strPoint.startsWith("Point.fromPercentage")) {
		let value = point.toJSON().args[0] // in percentage string | number
		if (typeof value === "string") value = parseInt(value.trim()) // in percentage, number
		const finalVal = precisionRound(value / 100, 2) // 1way value: 100 => 1, 50 => 0.5, 22 => 0.22
		return finalVal as SmallRange;
	} else {
		throw new Error(`resolvePointToDecimal: unhandled '${strPoint}'`);
	}
}
 
/** converts from (-1 to 1) range into (0 to 1) range */
export function convertBigRangeToSmall(num: BigRange | number, precision = 2): SmallRange {
	return precisionRound(precisionRound((num as number) + 1, precision) / 2, precision) as SmallRange
}

/** converts from (0 to 1) range into (-1 to 1) range */
export function convertSmallRangeToBig(num: SmallRange, precision = 2): BigRange {
	return precisionRound(precisionRound((num as number) * 2, precision) - 1, precision) as BigRange 
}

function renderIcon(iconInlineString: string, rotateDeg: number = 0) {
	const iconSvg = document.createElement("img")
	iconSvg.src = iconInlineString
	return function(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, obj: fabric.Object) {
		const size = obj.cornerSize;
		ctx.save();
		ctx.translate(left, top);
		ctx.rotate(fabric.util.degreesToRadians(rotateDeg));
		ctx.drawImage(iconSvg, -size/2, -size/2, size, size);
		ctx.restore();
	}
}

function clickHandler(key: 'x' | 'y', point: IPoint) {
	return function(_eventData: MouseEvent, { target }: fabric.Transform) {
		updateActiveObjPos(target.canvas, key, point)
		window.refreshActiveObjectButton.click()
		return true;
	}
}

export const customControls = [
	"TopYControl",
	"BottomYControl", 
	"MiddleYControl",
	"LeftXControl",
	"MiddleXControl", 
	"RightXControl"
]

export function customObjectFitControls() {
	const offset = 24
	const yControlOpts = { x: -0.5, y: 0, offsetX: -offset }

	const TopYControl = new fabric.Control({
		...yControlOpts,
		offsetY: -offset*1.5,
		render: renderIcon(upArrow),
		mouseUpHandler: clickHandler('y', Point.Y.TOP)
	})
	const MiddleYControl = new fabric.Control({
		...yControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: clickHandler('y', Point.Y.CENTER)
	})
	const BottomYControl = new fabric.Control({
		...yControlOpts,
		offsetY: offset*1.5,
		render: renderIcon(upArrow, 180),
		mouseUpHandler: clickHandler('y', Point.Y.BOTTOM)
	})

	const xControlOpts = { x: 0, y: -0.5, offsetY: -offset }
	const LeftXControl = new fabric.Control({
		...xControlOpts,
		offsetX: -offset*1.5,
		render: renderIcon(upArrow, 270),
		mouseUpHandler: clickHandler('x', Point.X.LEFT)
	})
	const MiddleXControl = new fabric.Control({
		...xControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: clickHandler('x', Point.X.CENTER)
	})
	const RightXControl = new fabric.Control({
		...xControlOpts,
		offsetX: offset*1.5,
		render: renderIcon(upArrow, 90),
		mouseUpHandler: clickHandler('x', Point.X.RIGHT)
	})
	return {
		TopYControl,
		MiddleYControl,
		BottomYControl,
		LeftXControl,
		MiddleXControl,
		RightXControl
	}
}