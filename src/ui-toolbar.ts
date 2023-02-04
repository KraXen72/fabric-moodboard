import { GridSnapCanvas } from './grid-snap-canvas';
import { createRect, readAndAddImage, resetViewportTransform,  } from './canvas';
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
	const pane = new Pane();
	const topTabs = pane.addTab({
		pages: [
			{title: 'Settings'},
			{title: 'Current Object'}
		],
		index: 0
	})

	// const activeObjectShim = { width: 0, height: 0 }
	// function updateActiveObjectShim() {
	// 	const act = canvas.getActiveObject()
	// 	Object.keys(activeObjectShim).forEach(key => {
	// 		//@ts-ignore
	// 		activeObjectShim[key] = act[key]
	// 	})
	// }

	const snapToGridFolder = topTabs.pages[0].addFolder({ title: "Snap to Grid" })
	snapToGridFolder.addInput(canvas, 'cfg_snapOnMove', {label: "on move"})
	snapToGridFolder.addInput(canvas, 'cfg_snapOnResize', {label: "on resize"})
	snapToGridFolder.addInput(canvas, 'cfg_smoothSnapping', {label: "smooth"})

	topTabs.pages[0].addButton({ title: 'Focus content', label: 'Camera' }).on('click', () => { resetViewportTransform(canvas) });

	// updateActiveObjectShim(), ev.target.value = activeObjectShim.width
	// topTabs.pages[1].addInput(activeObjectShim, 'width').on('change', (ev) => { canvas.getActiveObject().set({'width': ev.target.value, scaleX: 1, scaleY: 1}); canvas.requestRenderAll() })
	// topTabs.pages[1].addInput(activeObjectShim, 'height').on('change', (ev) => { canvas.getActiveObject().set({'height': ev.target.value, scaleX: 1, scaleY: 1}); canvas.requestRenderAll() })
	topTabs.pages[1].addButton({ title: 'Log to console' }).on('click', () => console.log(canvas.getActiveObject()))
	
	addButton('add', () => { canvas.add(createRect(canvas.gridGranularity)) }, 'Add new rect')
	document.getElementById('filereader').addEventListener('change', (event: Event) => { 
		const input = event.target as HTMLInputElement
		if (input.files.length === 0) return;
		readAndAddImage(canvas, input.files[0]) 
	})

	// return activeObjectTab
	// topTabs.pages[1].addButton({ title: 'Update Coords' }).on('click', () => { canvas.getActiveObject().set })

}