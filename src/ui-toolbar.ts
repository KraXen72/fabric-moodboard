import { IObjectFit, FitMode, IFitMode, Point } from 'fabricjs-object-fit';
import { Pane, BladeApi, TpChangeEvent } from 'tweakpane';
import { GridSnapCanvas } from './grid-snap-canvas';
import { createRect, duplicateSelection, readAndAddImages, removeActiveObject, resetViewportTransform, selectAllInCanvas } from './canvas';
import { convertBigRangeToSmall, convertSmallRangeToBig, resolvePointToDecimal, scaleToAspectRatio, updateActiveObjPos } from './active-object';
import { precisionRound, throttle } from './utils';

const toolbar = document.getElementById("toolbar")
const hotkeyController = new AbortController()
const { signal } = hotkeyController

function addButton(
	materialIcon: string,
	callback: (this: GlobalEventHandlers, ev: MouseEvent) => any,
	options?: { title?: string, hidden?: boolean },
	styleOverride?: Record<string, any>
) {
	const btn = document.createElement('button')
	btn.onclick = callback
	btn.innerHTML = `<span class="material-symbols-rounded">${materialIcon}</span>`
	if (styleOverride) Object.entries(styleOverride).forEach(([ key, value ]) => btn.style[key as any] = value)
	if (options?.title && typeof options.title === "string" ) btn.title = options.title
	if (options?.hidden && options.hidden == true) {
		document.getElementById("hidden-toolbar").appendChild(btn)
	}	else {
		toolbar.appendChild(btn)
	}
	return btn
}

const registeredHotkeys: Hotkey[] = []

document.addEventListener('keyup', (ev: KeyboardEvent) => {
	for (let i = 0; i < registeredHotkeys.length; i++) {
		const hotkey = registeredHotkeys[i];
		const executeHotkey = () => {
			if (hotkey?.constraints?.preventDefault === true ?? false) { 
				ev.preventDefault()
				window.getSelection().removeAllRanges()
			}
			hotkey.button.click()
		}
		if (ev.code.toLowerCase() === hotkey.code.toLowerCase() && document.activeElement === document.body) {
			if (typeof hotkey.constraints !== "undefined" && hotkey.constraints) {
				if (hotkey.constraints.exclusive) {
					if (![ev.ctrlKey, ev.shiftKey, ev.altKey].includes(true)) executeHotkey()
				} else {
					let valid = true
					if (hotkey.constraints.ctrlKey && hotkey.constraints.ctrlKey !== ev.ctrlKey) valid = false
					if (hotkey.constraints.altKey && hotkey.constraints.altKey !== ev.altKey) valid = false
					if (hotkey.constraints.shiftKey && hotkey.constraints.shiftKey !== ev.shiftKey) valid = false
					if (valid) executeHotkey()
				}
			} else {
				executeHotkey()
			}
		}
	}
}, { signal })

function registerHotkey(keycode: KeyboardEvent['code'], button: HTMLButtonElement, constraints?: HotkeyConstraints) {
	const htk: Hotkey = { code: keycode, button}
	if (typeof constraints !== "undefined" && constraints) htk.constraints = constraints
	registeredHotkeys.push(htk)
}

export function initToolbar(canvas: GridSnapCanvas, appSettings: appSettings ) {
	const pane = new Pane();
	const topTabs = pane.addTab({
		pages: [
			{title: 'Settings'},
			{title: 'Current Object'}
		], index: 0
	})
	const fitOptions = { cover: FitMode.COVER, contain: FitMode.CONTAIN, 'default (stretch)': FitMode.FILL }
	const defaultGranularPosition: WrappedIPositionNumbers = { position: { x: 1, y: 1 } } // in 2-way range

	let activeObjControls: BladeApi<any>[] = [] /** reference so they can be disposed of later */
	let activeObjGranularPosition: WrappedIPositionNumbers = defaultGranularPosition
	
	// settings - tab 0
	const snapToGridFolder = topTabs.pages[0].addFolder({ title: "Snap to Grid" })
	snapToGridFolder.addInput(canvas, 'cfg_snapOnMove', {label: "on move"})
	snapToGridFolder.addInput(canvas, 'cfg_snapOnResize', {label: "on resize"})
	snapToGridFolder.addInput(canvas, 'cfg_smoothSnapping', {label: "smooth"})
	topTabs.pages[0].addSeparator()

	const imageFolder = topTabs.pages[0].addFolder({ title: 'Images (defaults)' })
	imageFolder.addInput(appSettings, 'defaultFitMode', { label: 'fit-mode', options: fitOptions})
	imageFolder.addInput(appSettings, 'defaultImageCellSize', { label: 'size(cell)', min: 3, max: 20, step: 1 })
	topTabs.pages[0].addSeparator()

	const imageAddFolder = topTabs.pages[0].addFolder({ title: 'Loading multiple images at once' })
	imageAddFolder.addInput(appSettings, 'maxImagesAtOnce', { label: 'max', min: 1, max: 20, step: 1 })
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

	// current object - tab 1

	function refreshActiveObjectControls() {
		let _activeObj: fabric.Object | IObjectFit | { mode: string } = canvas.getActiveObject()
		const isObjFit = _activeObj?.type === 'objectFit' ? true : false

		activeObjControls.forEach(control => control.dispose())
		activePartSeparator.hidden = !isObjFit
		if (isObjFit) {
			const __ = _activeObj as IObjectFitFull
			activeObjGranularPosition = { position: { 
				x: convertSmallRangeToBig(resolvePointToDecimal(__.position.x)),
				y: convertSmallRangeToBig(resolvePointToDecimal(__.position.y))
			}};
			setUpActiveObjectControls(_activeObj as IObjectFitFull)
		}
		pane.refresh();
	}

	/** set up tweakpane controls for the current active object */
	function setUpActiveObjectControls(active: IObjectFitFull) {
		const activeImageFolder = topTabs.pages[1].addFolder({ title: "Selected Image" })
		activeImageFolder.addInput(active, 'mode', {
			label: "fitMode",
			options: fitOptions
		}).on("change", (ev) => {
			const _active = canvas.getActiveObject() as IObjectFitFull
			_active.mode = ev.value as IFitMode
			_active.recompute()
			canvas.requestRenderAll()
		})

		activeImageFolder.addButton({ title: 'Reset original size' }).on("click", () => {
			const _active = canvas.getActiveObject() as IObjectFitFull
			const dims = _active.originalImageDimensions
			_active.set({ width: dims.width, height: dims.height })
			_active.recompute()
			canvas.requestRenderAll()
		})

		const staFolder = topTabs.pages[1].addFolder({ title: 'Scale Image to aspect ratio' })
		staFolder.addButton({ title: "Keep width" }).on("click", () => { scaleToAspectRatio(canvas, "height") })
		staFolder.addButton({ title: "Keep height" }).on("click", () => { scaleToAspectRatio(canvas, "width") })

		const posSeparator = topTabs.pages[1].addSeparator()
		const granularPositionControls = topTabs.pages[1].addFolder({ title: "Granular Image Position" })
		granularPositionControls.addInput(activeObjGranularPosition, 'position', {
			label: 'x, y',
			x: { min: -1, max: 1}, y: { min: -1, max: 1 },
			picker: 'inline',
			expanded: true
		}).on('change', throttle((ev: TpChangeEvent<{x: number, y: number}>) => {
			const value = { x: precisionRound(ev.value.x, 2), y: precisionRound(ev.value.y, 2) }
			updateActiveObjPos(canvas, 'x', Point.fromPercentage(convertBigRangeToSmall(value.x) * 100))
			updateActiveObjPos(canvas, 'y', Point.fromPercentage(convertBigRangeToSmall(value.y) * 100))
		}, 16))
		granularPositionControls.addButton({ title: 'Reset original position' }).on('click', () => {
			const _active = canvas.getActiveObject() as IObjectFitFull
			_active.set({ position: { x: Point.X.CENTER, y: Point.Y.CENTER } })
			_active.recompute()
			activeObjGranularPosition = defaultGranularPosition
			canvas.requestRenderAll()
			refreshActiveObjectControls()
		})

		activeObjControls = [ activeImageFolder, staFolder, posSeparator, granularPositionControls ]
	}

	topTabs.pages[1].addButton({ title: 'Log to console' }).on('click', () => console.log(canvas.getActiveObject()))
	topTabs.pages[1].addButton({ title: 'Refresh' }).on('click', refreshActiveObjectControls)
	const activePartSeparator = topTabs.pages[1].addSeparator()

	topTabs.on('select', (ev) => { if (ev.index === 1) refreshActiveObjectControls() })

	// big buttons' toolbar
	const newRectBtn = addButton('add', () => { canvas.add(createRect(canvas.gridGranularity)) }, {title:'Add new rect'})
	const delBtn = addButton('delete', () => { removeActiveObject(canvas) }, {title:'Remove current object or selection'})
	const cloneBtn = addButton('content_copy', () => { duplicateSelection(canvas, appSettings) }, {title:'Duplicate current object or selection'})

	window.refreshActiveObjectButton = addButton('refresh', refreshActiveObjectControls, {title:"refresh", hidden: true})
	const selectAllButton = addButton("checklist", () => selectAllInCanvas(canvas), {title:"select all", hidden: true})
	
	registerHotkey('keya', newRectBtn, { exclusive: true })
	registerHotkey('keyd', cloneBtn, { exclusive: true })
	registerHotkey('delete', delBtn)
	registerHotkey('keya', selectAllButton, { ctrlKey: true, preventDefault: true })
	console.log(registeredHotkeys)

	
	document.getElementById('filereader').addEventListener('change', (event: Event) => { 
		const input = event.target as HTMLInputElement
		if (input.files.length === 0) return;
		readAndAddImages(canvas, input.files, appSettings.defaultFitMode, appSettings.defaultImageCellSize);
		(document.getElementById('filereader') as HTMLInputElement).value = null 
	})

	return refreshActiveObjectControls
}

