import { fabric } from "fabric";
export class GridSnapFabric extends fabric.Canvas {

  gridGranularity = 20;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.on('object:scaling', this.onFabricObjectScaling.bind(this));
  }

  private snapGrid(cord: number): number {
    return Math.round(cord / this.gridGranularity) * this.gridGranularity;
  }

  private onFabricObjectScaling(e: fabric.IEvent) {
    const active = this.getActiveObject();
    const [width, height] = [active.getScaledWidth(), active.getScaledHeight()];

    // X
    if (['tl', 'ml', 'bl'].indexOf(e.transform.corner) !== -1) {
      const tl = this.snapGrid(active.left);
      active.scaleX = (width + active.left - tl) / (active.width + active.strokeWidth);
      active.left = tl;
    } else if (['tr', 'mr', 'br'].indexOf(e.transform.corner) !== -1) {
      const tl = this.snapGrid(active.left + width);
      active.scaleX = (tl - active.left) / (active.width + active.strokeWidth);
    }

    // Y
    if (['tl', 'mt', 'tr'].indexOf(e.transform.corner) !== -1) {
      const tt = this.snapGrid(active.top);
      active.scaleY = (height + active.top - tt) / (active.height + active.strokeWidth);
      active.top = tt;
    } else if (['bl', 'mb', 'br'].indexOf(e.transform.corner) !== -1) {
      const tt = this.snapGrid(active.top + height);
      active.scaleY = (tt - active.top) / (active.height + active.strokeWidth);
    }

    // Avoid singularities
    active.scaleX = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleX), 0.001);
    active.scaleY = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleY), 0.001);
  }
}
export type GridSnapCanvas = fabric.Canvas & { gridGranularity: number }