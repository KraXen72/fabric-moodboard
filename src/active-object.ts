import { fabricCanvasExtended } from './canvas';
import { IPosition, IPoint, Point } from 'fabricjs-object-fit';
import { fabric } from 'fabric';
// import { inlineSVGString } from './canvas';

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
	if (_active.type !== "ObjectFit") return;
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

type ControlIconOpts = { xOffset?: number, yOffset?: number, size?: number }

/**
 * class that houses methods for drawing icons with the low-level canvas ctx
 * modifies the context in-place
 */
class IconRenderer {
	/** render a background circle for the control */
	#renderBgCircle(ctx: CanvasRenderingContext2D, left: number, top: number, opts: ControlIconOpts) {
		const size = opts.size ?? 12;
		const color = '#667ead'//'#b2ccff'

		ctx.save();
		ctx.fillStyle = color; //#000
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(left, top, size, 0, 2 * Math.PI, false);
		ctx.fill();
	}

	/** set up the ctx for drawing icons & begin path */
	#iconSetup(ctx: CanvasRenderingContext2D) {
		const color = "#000" //#fff
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 2

		ctx.beginPath();
	}
	#iconCleanup(ctx: CanvasRenderingContext2D) {
		ctx.stroke();
		ctx.restore();
	}


	topArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		this.#renderBgCircle(ctx, left, top, opts)
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx)
		
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

	bottomArrow(ctx: CanvasRenderingContext2D, left: number, top: number, _: any, __: fabric.Object, opts: ControlIconOpts ) {
		this.#renderBgCircle(ctx, left, top, opts)
		const size = opts?.size ? Math.round(opts.size / 3) : 4;
		this.#iconSetup(ctx)
		
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
	const iconRenderer = new IconRenderer()
	const offset = 24

	const TopYControl = new fabric.Control({
		x: -0.5,
  	y: -0.5,
		offsetX: -offset,
		offsetY: offset / 2,
		render: (...args) => iconRenderer.topArrow(...args, {}),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.TOP)
			return true;
		}
	})
	const BottomYControl = new fabric.Control({
		x: -0.5,
  	y: 0.5,
		offsetX: -offset,
		offsetY: -offset / 2,
		render: (...args) => iconRenderer.bottomArrow(...args, {}),
		mouseUpHandler: (_eventData, { target }) => {
			updateActiveObjPosRel(target.canvas, 'y', Point.Y.BOTTOM)
			return true;
		}
	})
	return {
		TopYControl,
		BottomYControl
	}
}