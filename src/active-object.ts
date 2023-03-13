import { fabricCanvasExtended } from './canvas';
import { IPosition, IPoint, Point } from 'fabricjs-object-fit';
import { fabric } from 'fabric';
// import { inlineSVGString } from './canvas';
import halfCircleIcon from './icons/halfCircleTop.svg';
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

export function updateActiveObjPosRel(canvas: fabricCanvasExtended, key: keyof Partial<IPosition>, value: IPoint) {
	const _active = canvas.getActiveObject() as IObjectFitFull
	if (_active.type !== "objectFit") return;
	_active.position[key] = value
	_active.recompute()
	canvas.requestRenderAll()
}

function renderIcon(iconInlineString: string, rotateDeg: number = 0) {
	const iconSvg = document.createElement("img")
	iconSvg.src = iconInlineString
	return function renderIcon(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object) {
		const size = __.cornerSize;
		ctx.save();
		ctx.translate(left, top);
		ctx.rotate(fabric.util.degreesToRadians(rotateDeg));
		ctx.drawImage(iconSvg, -size/2, -size/2, size, size);
		ctx.restore();
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
		render: renderIcon(halfCircleIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.TOP)
			return true;
		}
	})
	const MiddleYControl = new fabric.Control({
		...yControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.CENTER)
			return true;
		}
	})
	const BottomYControl = new fabric.Control({
		...yControlOpts,
		offsetY: offset*1.5,
		render: renderIcon(halfCircleIcon, 180),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.BOTTOM)
			return true;
		}
	})

	const xControlOpts = { x: 0, y: -0.5, offsetY: -offset }
	const LeftXControl = new fabric.Control({
		...xControlOpts,
		offsetX: -offset*1.5,
		render: renderIcon(halfCircleIcon, 270),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'x', Point.X.LEFT)
			return true;
		}
	})
	const MiddleXControl = new fabric.Control({
		...xControlOpts,
		// render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'x', Point.X.CENTER)
			return true;
		}
	})
	const RightXControl = new fabric.Control({
		...xControlOpts,
		offsetX: offset*1.5,
		render: renderIcon(halfCircleIcon, 90),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'x', Point.X.RIGHT)
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