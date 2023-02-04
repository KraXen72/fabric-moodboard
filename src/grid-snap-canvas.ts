import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';

/** calculate the nearest position that will follow grid */
export function snapGrid(cord: number, gridGranularity: number): number {
	return Math.round(cord / gridGranularity) * gridGranularity;
}

// resize grid snapping implementation credit to https://stackoverflow.com/a/70673823, rest is extended & modified by KraXen72
export class GridSnapFabric extends fabric.Canvas {
  gridGranularity = 20;

	cfg_snapOnResize = true;
	cfg_snapOnMove = true;
	/** determines if objects should snap only when let go (true), or always when moved (false) */
	cfg_smoothSnapping = false;

  constructor(canvas: HTMLCanvasElement, options?: fabric.ICanvasOptions) {
    super(canvas, options);
    this.on('object:scaling', this.handleObjectScaling.bind(this));
		this.on('object:moving', this.handleObjectMoving.bind(this));
		this.on('object:modified', this.handleObjectModified.bind(this));
  }

	/** given a fabric.Object, snap it to nearest grid position */
	private snapObjectToGrid(target: fabric.Object) {
		target.set({ left: snapGrid(target.left, this.gridGranularity), top: snapGrid(target.top, this.gridGranularity) });
	}

	/** snap to grid on object scaling if cfg_snapOnResize is true */
  private handleObjectScaling(e: fabric.IEvent) {
		if (!this.cfg_snapOnResize) return

    const active = this.getActiveObject();
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
}
export type GridSnapCanvas = GridSnapFabric