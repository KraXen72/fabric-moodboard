import { GridSnapCanvas } from './grid-snap-canvas';
import { createRect, duplicateSelection, readAndAddImage, removeActiveObject, resetViewportTransform } from './canvas';
import { Pane } from 'tweakpane';
import { IObjectFit } from 'fabricjs-object-fit';
import { FitMode } from 'fabricjs-object-fit';

const toolbar = document.getElementById("toolbar")

function addButton(materialIcon: string, callback: (this: GlobalEventHandlers, ev: MouseEvent) => any, title?: string) {
	const btn = document.createElement('button')
	btn.onclick = callback
	btn.innerHTML = `<span class="material-symbols-rounded">${materialIcon}</span>`
	if (title) btn.title = title
	toolbar.appendChild(btn)
}

export function initToolbar(canvas: GridSnapCanvas, appSettings: appSettings ) {
	const pane = new Pane();
	const topTabs = pane.addTab({
		pages: [
			{title: 'Settings'},
			{title: 'Current Object'}
		],
		index: 0
	})
	const dummy = { key: 'key' }
	let _activeObj: fabric.Object | IObjectFit | null = null

	const snapToGridFolder = topTabs.pages[0].addFolder({ title: "Snap to Grid" })
	snapToGridFolder.addInput(canvas, 'cfg_snapOnMove', {label: "on move"})
	snapToGridFolder.addInput(canvas, 'cfg_snapOnResize', {label: "on resize"})
	snapToGridFolder.addInput(canvas, 'cfg_smoothSnapping', {label: "smooth"})
	topTabs.pages[0].addSeparator()

	const cloneFolder = topTabs.pages[0].addFolder({ title: 'When duplicating, the new object'})
	cloneFolder.addInput(appSettings, 'pasteDirection', {
		label: "appears:",
		options: { 'right of original': 'right', 'left of original': 'left', 'above original': 'above', 'below original': 'below' }
	})
	topTabs.pages[0].addSeparator()

	const selectionFolder = topTabs.pages[0].addFolder({ title: 'Selection: resize'})
	selectionFolder.addInput(appSettings, 'allowResizeSelection', { label: 'allow' })
	topTabs.pages[0].addSeparator()

	topTabs.pages[0].addButton({ title: 'Focus content', label: 'Camera' }).on('click', () => { resetViewportTransform(canvas) });
	// current object
	function refreshActiveObjectControls() {
		_activeObj = canvas.getActiveObject()
		activeObjectControls.coverContain.hidden = _activeObj?.type === 'objectFit' ? false : true
		pane.refresh();
	}
	topTabs.pages[1].addButton({ title: 'Log to console' }).on('click', () => console.log(canvas.getActiveObject()))
	topTabs.pages[1].addButton({ title: 'Log type to console' }).on('click', () => console.log(canvas.getActiveObject().type))
	topTabs.pages[1].addButton({ title: 'Refresh' }).on('click', refreshActiveObjectControls)
	topTabs.pages[1].addSeparator()

	//FIXME doesen't update objectfit's mode
	const activeObjectControls = {
		coverContain: topTabs.pages[1].addInput(dummy, 'key', {
			label: "coverContain", 
			options: { 'cover': FitMode.COVER, 'contain': FitMode.COVER }
		}).on("change", ({ value }) => _activeObj!.set({ mode: value }))
	}
	
	addButton('add', () => { canvas.add(createRect(canvas.gridGranularity)) }, 'Add new rect')
	addButton('delete', () => { removeActiveObject(canvas) }, 'Remove current object or selection')
	addButton('content_copy', () => { duplicateSelection(canvas, appSettings) }, 'Duplicate current object or selection')
	
	document.getElementById('filereader').addEventListener('change', (event: Event) => { 
		const input = event.target as HTMLInputElement
		if (input.files.length === 0) return;
		readAndAddImage(canvas, input.files[0], 'cover') 
	})

	//TODO reset size

	refreshActiveObjectControls()
}