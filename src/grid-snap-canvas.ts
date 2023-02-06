// import { RecursivePartial } from './utils';
import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';

/** calculate the nearest position that will follow grid */
export function snapGrid(cord: number, gridGranularity: number): number {
	return Math.round(cord / gridGranularity) * gridGranularity;
}

type scalingEvent = {
	transform: {
		corner: string
		[key: string]: any
	}
	[key: string]: any
}

// resize grid snapping implementation credit to https://stackoverflow.com/a/70673823, rest is extended & modified by KraXen72
export class GridSnapCanvas extends fabric.Canvas {
  gridGranularity = 20;

	cfg_snapOnResize = true;
	cfg_snapOnMove = true;
	/** determines if objects should snap only when let go (true), or always when moved (false) */
	cfg_smoothSnapping = false;
	cfg_pasteLocation: 'right' | 'left' | 'above' | 'below' = 'right';

  constructor(canvas: HTMLCanvasElement, options?: fabric.ICanvasOptions) {
    super(canvas, options);
		//@ts-ignore because i want to keep 'active' prameter undefined by default. i'm handling it in the function
    this.on('object:scaling', this.handleObjectScaling.bind(this));
		this.on('object:moving', this.handleObjectMoving.bind(this));
		this.on('object:modified', this.handleObjectModified.bind(this));
  }

	/** given a fabric.Object, snap it to nearest grid position */
	private snapObjectToGrid(target: fabric.Object) {
		target.set({ left: snapGrid(target.left, this.gridGranularity), top: snapGrid(target.top, this.gridGranularity) });
	}

	/** 
	 * snap to grid on object scaling if cfg_snapOnResize is true 
	 * @param e fabric event for transform
	 * @param [active] substitute the object this is applied to. default is activeObject
	*/
  private handleObjectScaling(e: scalingEvent, active: fabric.Object) {
		if (!this.cfg_snapOnResize) return;
		if (typeof active === "undefined") active = this.getActiveObject()
    const [width, height] = [active.getScaledWidth(), active.getScaledHeight()];

    // X
    if (['tl', 'ml', 'bl'].indexOf(e.transform.corner) !== -1) {
      const tl = snapGrid(active.left, this.gridGranularity);
      active.scaleX = (width + active.left - tl) / (active.width + active.strokeWidth);
      active.left = tl;
    } else if (['tr', 'mr', 'br'].indexOf(e.transform.corner) !== -1) {
      const tl = snapGrid(active.left + width, this.gridGranularity);
      active.scaleX = (tl - active.left) / (active.width + active.strokeWidth);
    }

    // Y
    if (['tl', 'mt', 'tr'].indexOf(e.transform.corner) !== -1) {
      const tt = snapGrid(active.top, this.gridGranularity);
      active.scaleY = (height + active.top - tt) / (active.height + active.strokeWidth);
      active.top = tt;
    } else if (['bl', 'mb', 'br'].indexOf(e.transform.corner) !== -1) {
      const tt = snapGrid(active.top + height, this.gridGranularity);
      active.scaleY = (tt - active.top) / (active.height + active.strokeWidth);
    }

    // Avoid singularities
    active.scaleX = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleX), 0.001);
    active.scaleY = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleY), 0.001);
  }

	private handleObjectMoving(e: IEvent<MouseEvent>) {
		if (this.cfg_snapOnMove && !this.cfg_smoothSnapping) this.snapObjectToGrid(e.target)
	}

	private handleObjectModified(e: IEvent<MouseEvent>) {
		if (this.cfg_snapOnMove && this.cfg_smoothSnapping) this.snapObjectToGrid(e.target)
	}

	// /** ensures the object's scale precisely matches the  */
	// ensureObjectScaleSnapped(object: fabric.Object) {
	// 	if (this.cfg_snapOnMove) this.snapObjectToGrid(object) // snap if we snap on move
	// 	// @ts-ignore
	// 	if (this.cfg_snapOnResize) this.handleObjectScaling({ transform: { corner: 'bl' } }, object) // simulate a bottom-left resize
	// }
}
