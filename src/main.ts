import './style.css'
import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';
import { debounce } from './utils';
import { GridSnapFabric } from './grid-snap-canvas';
import { resizeCanvas, initDotMatrix, drawViewportBorders, fabricCanvasExtended } from './canvas';

const GRID_SIZE = 32 //grid size in px
if (GRID_SIZE % 2 !== 0) throw "GRID_SIZE must be an even number"

// const CANVASBG_X_TILES = Math.round(1920 / GRID_SIZE)
// const CANVASBG_Y_TILES = Math.round(1080 / GRID_SIZE)

const DEFAULT_RECT_OPTS: fabric.IRectOptions = {
	originX: 'left',
	originY: 'top',
	backgroundColor: "#529d8a",
	fill: "#529d8a",
	width: 3 * GRID_SIZE,
	height: 2 * GRID_SIZE,
	lockRotation: true,
	hasRotatingPoint: false,
}


// create a wrapper around native canvas element (with id="c")
// const _canvas = new fabric.Canvas('c');
const canvas = new GridSnapFabric(document.getElementById("c") as HTMLCanvasElement)
canvas.gridGranularity = GRID_SIZE
canvas.cfg_smoothSnapping = false

const viewportBorders = drawViewportBorders(canvas)

// enable resizing canvas with viewport. initially resize and also resize on any "resize" events
resizeCanvas(canvas, viewportBorders)
window.addEventListener('resize', debounce(() => { resizeCanvas(canvas, viewportBorders) }))

document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)
// TODO rewrite params of this as opts object with interface
initDotMatrix(canvas, GRID_SIZE) // initialize dotmatrix background through svg's

// todo optimize
canvas.on('mouse:down', function(this: fabricCanvasExtended, opt: IEvent<MouseEvent>) {
  const evt = opt.e;
  if (evt.ctrlKey === true) {
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  }
});
canvas.on('mouse:move', function(this: fabricCanvasExtended, opt: IEvent<MouseEvent>) {
  if (this.isDragging) {
    var e = opt.e;
    var vpt = this.viewportTransform;
    vpt[4] += e.clientX - this.lastPosX;
    vpt[5] += e.clientY - this.lastPosY;
    this.requestRenderAll();
    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
  }
});
canvas.on('mouse:up', function(this: fabricCanvasExtended) {
  // on mouse up we want to recalculate new interaction
  // for all objects, so we call setViewportTransform
  this.setViewportTransform(this.viewportTransform);
  this.isDragging = false;
  this.selection = true;
});

// create a rectangle object
const rect = new fabric.Rect({
	left: 0,
	top: 0,
	...DEFAULT_RECT_OPTS
});
rect.setControlsVisibility({
	mtr: false
})

// "add" rectangle onto canvas
canvas.add(rect);

setTimeout(() => document.getElementById("c"), 100)

