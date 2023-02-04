// import './css/pico.min.css'
import './css/material-icons.css'
import './css/style.css'

import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';
import { debounce } from './utils';
import { GridSnapFabric } from './grid-snap-canvas';
import { resizeCanvas, initDotMatrix, drawViewportBorders, fabricCanvasExtended } from './canvas';
import { initToolbar } from './ui-toolbar';

const GRID_SIZE = 32 //grid size in px
if (GRID_SIZE % 2 !== 0) throw "GRID_SIZE must be an even number"

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

const canvas = new GridSnapFabric(document.getElementById("c") as HTMLCanvasElement)
canvas.gridGranularity = GRID_SIZE
canvas.cfg_smoothSnapping = false
canvas.fireMiddleClick = true

document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)
initDotMatrix(canvas, GRID_SIZE) // initialize dotmatrix background through svg's
const viewportBorders = drawViewportBorders(canvas) // draw current viewport with lines originating in [0, 0]

// enable resizing canvas with viewport. initially resize and also resize on any "resize" events
resizeCanvas(canvas, viewportBorders)
window.addEventListener('resize', debounce(() => { resizeCanvas(canvas, viewportBorders) }))

// panning of canvas with middleclick or ctrl+leftclick
canvas.on('mouse:down', function(this: fabricCanvasExtended, opt: IEvent<MouseEvent>) {
  const evt = opt.e;
  if ((evt.button === 0 && evt.ctrlKey) || (evt.button === 1 && !evt.ctrlKey)) {
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  }
});
canvas.on('mouse:move', function(this: fabricCanvasExtended, opt: IEvent<MouseEvent>) {
  if (this.isDragging) {
    const evt = opt.e;
    let vpt = this.viewportTransform;
    vpt[4] += evt.clientX - this.lastPosX;
    vpt[5] += evt.clientY - this.lastPosY;
    this.requestRenderAll();
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
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
rect.setControlsVisibility({ mtr: false })

// "add" rectangle onto canvas
canvas.add(rect);

initToolbar(canvas)

