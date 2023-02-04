import { GridSnapCanvas } from './grid-snap-canvas';
import { addRect, resetViewportTransform } from './canvas';
import { Pane } from 'tweakpane';

const toolbar = document.getElementById("toolbar")

function addButton(materialIcon: string, callback: (this: GlobalEventHandlers, ev: MouseEvent) => any, title?: string) {
	const btn = document.createElement('button')
	btn.onclick = callback
	btn.innerHTML = `<span class="material-symbols-rounded">${materialIcon}</span>`
	if (title) btn.title = title
	toolbar.appendChild(btn)
}

export function initToolbar(canvas: GridSnapCanvas) {
	const pane = new Pane({title: 'Toolbar', expanded: true });

	pane.addButton({ title: 'Focus content', label: 'Camera' }).on('click', () => { resetViewportTransform(canvas) });

	const snapToGridFolder = pane.addFolder({ title: "Snap to Grid" })
	snapToGridFolder.addInput(canvas, 'cfg_snapOnMove', {label: "on move"})
	snapToGridFolder.addInput(canvas, 'cfg_snapOnResize', {label: "on resize"})
	snapToGridFolder.addInput(canvas, 'cfg_smoothSnapping', {label: "smooth"})

	addButton('add', () => { addRect(canvas, canvas.gridGranularity) }, 'Add new rect')
}