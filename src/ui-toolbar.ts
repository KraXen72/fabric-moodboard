import { fabricCanvasExtended, resetViewportTransform } from './canvas';
const toolbar = document.getElementById("toolbar")

function addButton(materialIcon: string, callback: (this: GlobalEventHandlers, ev: MouseEvent) => any) {
	const btn = document.createElement('button')
	btn.onclick = callback
	btn.innerHTML = `<span class="material-symbols-rounded">${materialIcon}</span>`
	toolbar.appendChild(btn)
}

export function initToolbar(canvas: fabricCanvasExtended) {
	addButton('view_in_ar_new', () => { resetViewportTransform(canvas) })
}