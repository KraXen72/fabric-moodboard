import './css/material-icons.css'
import './css/style.css'

import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';
import { debounce, precisionRound } from './utils';
import { GridSnapCanvas, snapGrid } from './grid-snap-canvas';
import { resizeCanvas, initDotMatrix, drawViewportBorders, fabricCanvasExtended } from './canvas';
import { initToolbar } from './ui-toolbar';
import { customControls } from './active-object';

const GRID_SIZE = 32 //grid size in px
if (GRID_SIZE % 2 !== 0) throw "GRID_SIZE must be an even number"

export const APP_SETTINGS: appSettings = {
	pasteDirection: 'right',
	defaultFitMode: 'cover',
	defaultImageCellSize: 10,
	maxImagesAtOnce: 5,
	snapWhenProgramaticResizing: true,
	allowResizeSelection: false,
	autoSnapOnResizeSelection: true,
}

const canvas = new GridSnapCanvas(document.getElementById("c") as HTMLCanvasElement)
canvas.fireMiddleClick = true
canvas.selectionKey = 'shiftKey'	

canvas.gridGranularity = GRID_SIZE
canvas.cfg_smoothSnapping = false

document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)
window.refreshActiveObjectButton = Object.assign(document.createElement('button'), { 
	onclick: () => { console.warn("toolbar not initialized! can't refresh it") } 
})
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

/** show custom controls for Image, hide for Rect */
function _updateCustomControlsVisiblity(object: fabric.Object) {
	customControls.forEach(ctrlKey => {
		if (Object.keys(object.controls).includes(ctrlKey)) object.controls[ctrlKey].setVisibility(object.type === "objectFit")
	})
}

// remove most controls from selections, because we don't want users to be able to resize them - it messes with the grid
const selectionControls = { bl: false, br: false, tl: false, tr: false, mtr: false}
function selectionCallback(e: fabric.IEvent<MouseEvent>) {
	window.refreshActiveObjectButton.click()
	const active = canvas.getActiveObject()
	_updateCustomControlsVisiblity(active)
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
	window.refreshActiveObjectButton.click()
	_updateCustomControlsVisiblity(canvas.getActiveObject())
	if (canvas.getActiveObject().type !== 'activeSelection') return;
	if (!canvas.cfg_snapOnResize) return;

	const selected = canvas.getActiveObjects()
	canvas.discardActiveObject()

	// swap out the fabric's selection for our custom one that can't be resized unless allowed
	const selection = new fabric.ActiveSelection(selected, { canvas: canvas })
	if (APP_SETTINGS.allowResizeSelection) {
		selection.setControlsVisibility(selectionControls)
	} else {
		selection.hasControls = false
	}
	canvas.setActiveObject(selection)
	canvas.requestRenderAll()
}

function selectionClearedCallback(evt: fabric.IEvent<MouseEvent>) {
	// recompute all images on deselct if select resize is on
	if (evt.deselected && evt.deselected.length > 1) {
		evt.deselected.forEach((obj: fabric.Object) => {
			if (APP_SETTINGS.allowResizeSelection && APP_SETTINGS.autoSnapOnResizeSelection) {
				const cWidth = precisionRound(obj.width * obj.scaleX)
				const cHeight = precisionRound(obj.height * obj.scaleY)

				// snap width & height
				obj.set({ scaleX: 1, scaleY: 1, width: snapGrid(cWidth, canvas.gridGranularity), height: snapGrid(cHeight, canvas.gridGranularity) })

				// snap position
				obj.set({ top: snapGrid(obj.top, canvas.gridGranularity), left: snapGrid(obj.left, canvas.gridGranularity) })
			}
			if (obj.type === 'objectFit' && APP_SETTINGS.allowResizeSelection) (obj as IObjectFitFull).handleRecomputeOnScaled()
		})
	}
	window.refreshActiveObjectButton.click()
	canvas.requestRenderAll()
}

canvas.on("selection:created", selectionCallback)
canvas.on("selection:updated", selectionUpdatedCallback)
canvas.on("selection:cleared", selectionClearedCallback)

initToolbar(canvas, APP_SETTINGS)
// canvas.add(createRect(GRID_SIZE, { canvas }))