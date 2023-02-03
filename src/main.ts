import './style.css'
import { debounce } from './utils';
import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';
import { GridSnapFabric } from './grid-snap-fabric';
import { resizeCanvas, initDotMatrix } from './canvas';

const GRID_SIZE = 32 //grid size in px
if (GRID_SIZE % 2 !== 0) throw "GRID_SIZE must be an even number"

const CANVASBG_X_TILES = Math.round(1920 / GRID_SIZE)
const CANVASBG_Y_TILES = Math.round(1080 / GRID_SIZE)

const DEFAULT_RECT_OPTS: fabric.IRectOptions = {
	originX: 'left',
	originY: 'top',
	backgroundColor: "#529d8a",
	fill: "#529d8a",
	width: 3 * GRID_SIZE,
	height: 2 * GRID_SIZE,
	lockRotation: true
}

/** canvas state: possibly migrate this to a store? */
let cState = {
	snapping: true,
	smoothSnap: false
}

// create a wrapper around native canvas element (with id="c")
// const _canvas = new fabric.Canvas('c');
const canvas = new GridSnapFabric(document.getElementById("c") as HTMLCanvasElement)
canvas.gridGranularity = GRID_SIZE

// patch 1: enable resizing canvas with viewport. initially resize and also resize on any "resize" events
resizeCanvas(canvas)
window.addEventListener('resize', debounce(() => { resizeCanvas(canvas) }))

document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)

// patch 2: initialize dotmatrix background through svg's
// TODO rewrite this as opts object with interface
initDotMatrix(canvas, CANVASBG_X_TILES, CANVASBG_Y_TILES, GRID_SIZE)


// canvas object extensions
canvas.on('object:moving', function (options: IEvent<MouseEvent>) {
	if (cState.snapping && !cState.smoothSnap) {
		options.target.set({
			left: Math.round(options.target.left / GRID_SIZE) * GRID_SIZE,
			top: Math.round(options.target.top / GRID_SIZE) * GRID_SIZE
		});
	}
});

canvas.on('object:modified', function (options: IEvent<MouseEvent>) {
	if (cState.snapping && cState.smoothSnap) {
		options.target.set({
			left: Math.round(options.target.left / GRID_SIZE) * GRID_SIZE,
			top: Math.round(options.target.top / GRID_SIZE) * GRID_SIZE
		});
	}
});


// canvas.on('mouse:down', function(this: any, opt: IEvent<MouseEvent>) {
//   const evt = opt.e;
//   if (evt.altKey === true) {
//     this.isDragging = true;
//     this.selection = false;
//     this.lastPosX = evt.clientX;
//     this.lastPosY = evt.clientY;
//   }
// });
// canvas.on('mouse:move', function(this: any, opt: IEvent<MouseEvent>) {
//   if (this.isDragging) {
//     var e = opt.e;
//     var vpt = this.viewportTransform;
//     vpt[4] += e.clientX - this.lastPosX;
//     vpt[5] += e.clientY - this.lastPosY;
//     this.requestRenderAll();
//     this.lastPosX = e.clientX;
//     this.lastPosY = e.clientY;
//   }
// });
// canvas.on('mouse:up', function(this: any) {
//   // on mouse up we want to recalculate new interaction
//   // for all objects, so we call setViewportTransform
//   this.setViewportTransform(this.viewportTransform);
// 	console.log(this.viewportTransform)
//   this.isDragging = false;
//   this.selection = true;
// });

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
