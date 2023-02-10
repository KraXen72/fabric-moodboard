import { GridSnapCanvas } from './grid-snap-canvas';
import { createRect, duplicateSelection, readAndAddImage, removeActiveObject, resetViewportTransform } from './canvas';
import { Pane } from 'tweakpane';
import { IObjectFit, FitMode, IFitMode } from 'fabricjs-object-fit';

const toolbar = document.getElementById("toolbar")
const hotkeyController = new AbortController()
const { signal } = hotkeyController

function addButton(materialIcon: string, callback: (this: GlobalEventHandlers, ev: MouseEvent) => any, title?: string) {
	const btn = document.createElement('button')
	btn.onclick = callback
	btn.innerHTML = `<span class="material-symbols-rounded">${materialIcon}</span>`
	if (title) btn.title = title
	toolbar.appendChild(btn)
	return btn
}

function registerHotkey(keycode: KeyboardEvent['code'], button: HTMLButtonElement) {
	document.addEventListener('keyup', (ev) => { 
		if (ev.code.toLowerCase() === keycode.toLowerCase() && document.activeElement === document.body) button.click()
	}, { signal })
}

export function initToolbar(canvas: GridSnapCanvas, appSettings: appSettings ) {
	const pane = new Pane();
	const topTabs = pane.addTab({
		pages: [
			{title: 'Settings'},
			{title: 'Current Object'}
		], index: 0
	})
	const dummy = { key: 'key' }
	const fitOptions = { 'cover': FitMode.COVER, 'contain': FitMode.CONTAIN }
	let _activeObj: fabric.Object | IObjectFit | null = null

	const snapToGridFolder = topTabs.pages[0].addFolder({ title: "Snap to Grid" })
	snapToGridFolder.addInput(canvas, 'cfg_snapOnMove', {label: "on move"})
	snapToGridFolder.addInput(canvas, 'cfg_snapOnResize', {label: "on resize"})
	snapToGridFolder.addInput(canvas, 'cfg_smoothSnapping', {label: "smooth"})
	topTabs.pages[0].addSeparator()

	const imageFolder = topTabs.pages[0].addFolder({ title: 'Images' })
	imageFolder.addInput(appSettings, 'defaultFitMode', { label: 'fit-mode', options: fitOptions})
	topTabs.pages[0].addSeparator()

	const cloneFolder = topTabs.pages[0].addFolder({ title: 'When duplicating, the new object'})
	cloneFolder.addInput(appSettings, 'pasteDirection', {
		label: "appears:",
		options: { 'right of original': 'right', 'left of original': 'left', 'above original': 'above', 'below original': 'below' }
	})
	topTabs.pages[0].addSeparator()

	const selectionFolder = topTabs.pages[0].addFolder({ title: 'Selection: resize' })
	selectionFolder.addInput(appSettings, 'allowResizeSelection', { label: 'allow' })
	topTabs.pages[0].addSeparator()

	topTabs.pages[0].addButton({ title: 'Focus content', label: 'Camera' }).on('click', () => { resetViewportTransform(canvas) });

	// current object
	function refreshActiveObjectControls() {
		_activeObj = canvas.getActiveObject() 
		const isObjFit = _activeObj?.type === 'objectFit' ? false : true
		activeImageFolder.hidden = isObjFit
		staFolder.hidden = isObjFit
		pane.refresh();
	}
	function scaleToAspectRatio(adjust: 'width' | 'height') {
		const _active = _activeObj as IObjectFitFull
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

	topTabs.on('select', (ev) => { if (ev.index === 1) refreshActiveObjectControls() })
	topTabs.pages[1].addButton({ title: 'Log to console' }).on('click', () => console.log(canvas.getActiveObject()))
	topTabs.pages[1].addButton({ title: 'Log type to console' }).on('click', () => console.log(canvas.getActiveObject().type))
	topTabs.pages[1].addButton({ title: 'Refresh' }).on('click', refreshActiveObjectControls)
	topTabs.pages[1].addSeparator()

	const activeImageFolder = topTabs.pages[1].addFolder({ title: "Selected Image" })
	activeImageFolder.addInput(dummy, 'key', {
		label: "fitMode", 
		options: fitOptions
	}).on("change", (ev) => {
		const _active = _activeObj as IObjectFitFull
		_active.mode = ev.value as IFitMode
		_active.recompute()
		canvas.requestRenderAll()
	})

	activeImageFolder.addButton({ title: 'Reset original size' }).on("click", () => {
		const _active = _activeObj as IObjectFitFull
		const dims = _active.originalImageDimensions
		_active.set({ width: dims.width, height: dims.height })
		_active.recompute()
		canvas.requestRenderAll()
	})
	const staFolder =  topTabs.pages[1].addFolder({ title: 'Scale Image to aspect ratio' })
	staFolder.addButton({ title: "Keeping width, adjust height" }).on("click", () => { scaleToAspectRatio("height") })
	staFolder.addButton({ title: "Keeping height, adjust width" }).on("click", () => { scaleToAspectRatio("width") })

	const newRectBtn = addButton('add', () => { canvas.add(createRect(canvas.gridGranularity)) }, 'Add new rect')
	const delBtn = addButton('delete', () => { removeActiveObject(canvas) }, 'Remove current object or selection')
	const cloneBtn = addButton('content_copy', () => { duplicateSelection(canvas, appSettings) }, 'Duplicate current object or selection')

	registerHotkey('delete', delBtn)
	
	document.getElementById('filereader').addEventListener('change', (event: Event) => { 
		const input = event.target as HTMLInputElement
		if (input.files.length === 0) return;
		readAndAddImage(canvas, input.files[0], appSettings.defaultFitMode) 
	})

	//TODO reset size
	refreshActiveObjectControls()
}

