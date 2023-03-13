import { fabricCanvasExtended } from './canvas';
import { IPosition, IPoint, Point } from 'fabricjs-object-fit';
import { fabric } from 'fabric';
// import { inlineSVGString } from './canvas';
import topArrowIcon from './icons/alignTop.svg';
import centerIcon from './icons/alignCenter.svg';

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

// custom controls - pain & suffering
// credit to after countless hours of trying to get this to work to Signal Desktop App
// - rendering a custom simple icon through canvas ctx (modified the x icon)
// - extending the Object.prototype of a class that already extends a fabric.Object
// https://github.com/signalapp/Signal-Desktop
// https://github.com/signalapp/Signal-Desktop/blob/main/ts/mediaEditor/util/customFabricObjectControls.ts

type ControlIconOpts = { xOffset?: number, yOffset?: number, size?: number, color?: string }

/**
 * class that houses methods for drawing icons with the low-level canvas ctx
 * modifies the context in-place
 */
class IconRenderer {
	// FIXME renderBgCircle is not clickable - possibly convert them to svgs
	// TODO invert icon that corresponds to currently selected x and y pos - for rect fallback to default icon, doesen't matter anyway

	/** render a background circle for the control */
	#renderBgCircle(ctx: CanvasRenderingContext2D, left: number, top: number, opts: ControlIconOpts) {
		const size = opts?.size ?? 12;
		const color = opts?.color ?? '#000' //'#667ead'//'#b2ccff' //#000

		ctx.save();
		ctx.fillStyle = color; //#000
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(left, top, size, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.stroke();
		ctx.closePath()
	}

	/** set up the ctx for drawing icons & begin path */
	#iconSetup(ctx: CanvasRenderingContext2D, left: number, top: number, opts: ControlIconOpts) {
		this.#renderBgCircle(ctx, left, top, opts)
		const color = "#fff"//"#000"
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 1

		ctx.beginPath();
	}
	#iconCleanup(ctx: CanvasRenderingContext2D) {
		ctx.stroke();
		ctx.restore();
	}

	topArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx, left, top, opts)
		
		const topLeft = new fabric.Point(left - size, top - size);
		// const topRight = new fabric.Point(left + size, top - size);
		const bottomRight = new fabric.Point(left + size, top + size);
		const bottomLeft = new fabric.Point(left - size, top + size);

		ctx.moveTo(topLeft.x + size, topLeft.y);
		ctx.lineTo(bottomRight.x, bottomRight.y)
		ctx.moveTo(topLeft.x + size, topLeft.y);
		ctx.lineTo(bottomLeft.x, bottomLeft.y);
		this.#iconCleanup(ctx)
	}

	bottomArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts) {
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx, left, top, opts)
		
		const topLeft = new fabric.Point(left - size, top - size);
		const topRight = new fabric.Point(left + size, top - size);
		// const bottomRight = new fabric.Point(left + size, top + size);
		const bottomLeft = new fabric.Point(left - size, top + size);

		ctx.moveTo(bottomLeft.x + size, bottomLeft.y);
		ctx.lineTo(topRight.x, topRight.y)
		ctx.moveTo(bottomLeft.x + size, bottomLeft.y);
		ctx.lineTo(topLeft.x, topLeft.y);
		this.#iconCleanup(ctx)
	}

	leftArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx, left, top, opts)
		
		const topLeft = new fabric.Point(left - size, top - size);
		const topRight = new fabric.Point(left + size, top - size);
		const bottomRight = new fabric.Point(left + size, top + size);
		// const bottomLeft = new fabric.Point(left - size, top + size);

		ctx.moveTo(topRight.x, topRight.y);
		ctx.lineTo(topLeft.x, topLeft.y + size)
		ctx.moveTo(bottomRight.x, bottomRight.y);
		ctx.lineTo(topLeft.x, topLeft.y + size)
		this.#iconCleanup(ctx)
	}

	rightArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx, left, top, opts)
		
		const topLeft = new fabric.Point(left - size, top - size);
		const topRight = new fabric.Point(left + size, top - size);
		// const bottomRight = new fabric.Point(left + size, top + size);
		const bottomLeft = new fabric.Point(left - size, top + size);

		ctx.moveTo(topLeft.x, topLeft.y);
		ctx.lineTo(topRight.x, topRight.y + size)
		ctx.moveTo(bottomLeft.x, bottomLeft.y);
		ctx.lineTo(topRight.x, topRight.y + size)
		this.#iconCleanup(ctx)
	}

	circle(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx, left, top, opts)
		ctx.beginPath();
		ctx.arc(left, top, size, 0, 2 * Math.PI, false);
		ctx.fill();
		this.#iconCleanup(ctx)
	}
}

function renderIcon(iconInlineString: string, rotateDeg: number = 0, size: number = 24) {
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
	//const iconRenderer = new IconRenderer()
	const offset = 24
	const yControlOpts = { x: -0.5, y: 0, offsetX: -offset }

	const TopYControl = new fabric.Control({
		...yControlOpts,
		offsetY: -offset*1.5,
		render: renderIcon(topArrowIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.TOP)
			return true;
		}
	})
	const MiddleYControl = new fabric.Control({
		...yControlOpts,
		render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.CENTER)
			return true;
		}
	})
	const BottomYControl = new fabric.Control({
		...yControlOpts,
		offsetY: offset*1.5,
		render: renderIcon(topArrowIcon, 180),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.BOTTOM)
			return true;
		}
	})

	const xControlOpts = { x: 0, y: -0.5, offsetY: -offset }
	const LeftXControl = new fabric.Control({
		...xControlOpts,
		offsetX: -offset*1.5,
		render: renderIcon(topArrowIcon, 270),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'x', Point.X.LEFT)
			return true;
		}
	})
	const MiddleXControl = new fabric.Control({
		...xControlOpts,
		render: renderIcon(centerIcon),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'x', Point.X.CENTER)
			return true;
		}
	})
	const RightXControl = new fabric.Control({
		...xControlOpts,
		offsetX: offset*1.5,
		render: renderIcon(topArrowIcon, 90),
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