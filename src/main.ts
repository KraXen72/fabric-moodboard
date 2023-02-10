import './css/material-icons.css'
import './css/style.css'

import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';
import { debounce } from './utils';
import { GridSnapCanvas } from './grid-snap-canvas';
import { resizeCanvas, initDotMatrix, drawViewportBorders, fabricCanvasExtended, createRect } from './canvas';
import { initToolbar } from './ui-toolbar';

const GRID_SIZE = 32 //grid size in px
if (GRID_SIZE % 2 !== 0) throw "GRID_SIZE must be an even number"

export const APP_SETTINGS: appSettings = {
	pasteDirection: 'right',
	allowResizeSelection: false,
	defaultFitMode: 'cover',
	defaultImageCellSize: 10
}

const canvas = new GridSnapCanvas(document.getElementById("c") as HTMLCanvasElement)
canvas.fireMiddleClick = true
canvas.selectionKey = 'shiftKey'	

canvas.gridGranularity = GRID_SIZE
canvas.cfg_smoothSnapping = false

document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)
initDotMatrix(canvas, GRID_SIZE) // initialize dotmatrix background through svg's
const viewportBorders = drawViewportBorders(canvas) // draw current viewport with lines originating in [0, 0]

// enable resizing canvas with viewport. initially resize and also resize on any "resize" events
resizeCanvas(canvas, viewportBorders)
window.addEventListener('resize', debounce(() => { resizeCanvas(canvas, viewportBorders) }))

// panning of canvas with middleclick or ctrl+leftclick
canvas.on('mouse:down', function(this: fabricCanvasExtended, opt: IEvent<MouseEvent>) {
  const evt = opt.e;
  if ((evt.button === 0 && evt.ctrlKey) || evt.button === 1) {
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


// remove most controls from selections, because we don't want users to be able to resize them - it messes with the grid
const selectionControls = { bl: false, br: false, tl: false, tr: false, mtr: false}
function selectionCallback(e: fabric.IEvent<MouseEvent>) {
	const active = canvas.getActiveObject()
	if (!(e.selected.length !== 1 || active.hasOwnProperty('_objects'))) return;
	if (active.type === "objectFit" && e.selected.length === 1) return;
	if (!canvas.cfg_snapOnResize) return;

	if (APP_SETTINGS.allowResizeSelection) {
		active.setControlsVisibility(selectionControls)
	} else {
		active.hasControls = false
	}
}

function selectionUpdatedCallback() {
	if (canvas.getActiveObject().type !== 'activeSelection') return;
	if (!canvas.cfg_snapOnResize) return;

	const selected = canvas.getActiveObjects()

	canvas.discardActiveObject()
	const selection = new fabric.ActiveSelection(selected, { canvas: canvas })
	if (APP_SETTINGS.allowResizeSelection) {
		selection.setControlsVisibility(selectionControls)
	} else {
		selection.hasControls = false
	}
	canvas.setActiveObject(selection)
	canvas.requestRenderAll()
}

// TODO reneable selection
canvas.on("selection:created", selectionCallback)
canvas.on("selection:updated", selectionUpdatedCallback)
initToolbar(canvas, APP_SETTINGS)
canvas.add(createRect(GRID_SIZE, { canvas }))