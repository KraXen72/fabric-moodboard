import { fabricCanvasExtended } from './canvas';
import { IPosition, IPoint, Point } from 'fabricjs-object-fit';
import { fabric } from 'fabric';
// import { inlineSVGString } from './canvas';
import upArrow from './icons/upArrow.svg';
import { precisionRound } from './utils';
// import centerIcon from './icons/alignCenter.svg';

// helper functions for the active object

export function scaleToAspectRatio(canvas: fabricCanvasExtended, adjust: 'width' | 'height') {
	const _active = canvas.getActiveObject() as IObjectFitFull
	if (adjust === 'width') {
		const factor = _active.height / _active.originalImageDimensions.height
		_active.set({ width: _active.originalImageDimensions.width * factor })
	} else {
		const factor = _active.width / _active.originalImageDimensions.width
		_active.set({ height: _active.originalImageDimensions.height * factor })
	}
	_active.recompute()
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
	console.log(point, strPoint)
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
		console.log(value, finalVal)
		return finalVal as SmallRange;
	} else {
		throw new Error(`resolvePointToDecimal: unhandled '${strPoint}'`);
	}
}

/** range of numbers from -1 to 1. used for tweakPane granual controls, so whole 2D point area is used */
type BigRange = number & { readonly __rangeType: '(-1, 1)' }
/** range of numbers from 0 to 1. used for converting Bigrange into percentage (* 100) for setting x and y with Point.fromPercentage */
type SmallRange = number & { readonly __rangeType: '(0, 1)' }
 
/** converts from (-1 to 1) range into (0 to 1) range */
export function convertBigRangeToSmall(num: BigRange | number, precision = 2): SmallRange {
	return precisionRound(precisionRound((num as number)+ 1, precision) / 2, precision) as SmallRange
}

/** converts from (0 to 1) range into (-1 to 1) range */
export function convertSmallRangeToBig(num: SmallRange, precision = 2): BigRange {
	return precisionRound(precisionRound((num as number) * 2, precision) - 1, precision) as BigRange 
}

function renderIcon(iconInlineString: string, rotateDeg: number = 0) {
	const iconSvg = document.createElement("img")
	iconSvg.src = iconInlineString
	return function(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object) {
		const size = __.cornerSize;
		ctx.save();
		ctx.translate(left, top);
		ctx.rotate(fabric.util.degreesToRadians(rotateDeg));
		ctx.drawImage(iconSvg, -size/2, -size/2, size, size);
		ctx.restore();
	}
}

// function mouseUpHandler(key: 'x' | 'y', point: IPoint) {
// 	return function 
// }

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
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'y', Point.Y.TOP)
			return true;
		}
	})
	const MiddleYControl = new fabric.Control({
		...yControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'y', Point.Y.CENTER)
			return true;
		}
	})
	const BottomYControl = new fabric.Control({
		...yControlOpts,
		offsetY: offset*1.5,
		render: renderIcon(upArrow, 180),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'y', Point.Y.BOTTOM)
			return true;
		}
	})

	const xControlOpts = { x: 0, y: -0.5, offsetY: -offset }
	const LeftXControl = new fabric.Control({
		...xControlOpts,
		offsetX: -offset*1.5,
		render: renderIcon(upArrow, 270),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'x', Point.X.LEFT)
			return true;
		}
	})
	const MiddleXControl = new fabric.Control({
		...xControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'x', Point.X.CENTER)
			return true;
		}
	})
	const RightXControl = new fabric.Control({
		...xControlOpts,
		offsetX: offset*1.5,
		render: renderIcon(upArrow, 90),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPos(target.canvas, 'x', Point.X.RIGHT)
			return true;
		}
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