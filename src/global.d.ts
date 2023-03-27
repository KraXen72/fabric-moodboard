import { IObjectFit } from "fabricjs-object-fit"

declare global {
	interface appSettings {
		pasteDirection: 'right' | 'left' | 'above' | 'below',
		defaultFitMode: 'cover' | 'contain',
		defaultImageCellSize: number,
		allowResizeSelection: boolean,
		autoSnapOnResizeSelection: boolean,
		maxImagesAtOnce: number,
		/** if true, Snap to Aspect Ratio (Keep Width/Height) buttons will also snap to nearest grid cell */
		snapWhenProgramaticResizing: boolean,
		zoom: {
			requireCtrl: boolean,
			zoomOut: number,
			zoomIn: number
		}
	}
	
	type scalingEvent = {
		transform: {
			corner: string,
			[key: string]: any
		},
		[key: string]: any
	}

	type coverContain = 'cover' | 'contain'
	type IObjectFitFull = IObjectFit & { 
		handleRecomputeOnScaled?: Function, 
		handleRecomputeOnScaling?: Function
		// added by me
		originalImageDimensions?: {
			width: number,
			height: number
		}
	}

	// active object

	/** range of numbers from -1 to 1. used for tweakPane granual controls, so whole 2D point area is used */
	type BigRange = number & { readonly __rangeType: '(-1, 1)' }
	/** range of numbers from 0 to 1. used for converting Bigrange into percentage (* 100) for setting x and y with Point.fromPercentage */
	type SmallRange = number & { readonly __rangeType: '(0, 1)' }

	// canvas
	type postProcessOptions = { cleanup?: boolean, setDefaults?: boolean }
	type selectionShimOrTwin = { top: number, left: number, width: number, height: number, scaleX: number, scaleY: number, [key: string]: any }

	// ui-toolbar
	type HotkeyConstraints = { 
		exclusive?: boolean, 
		ctrlKey?: boolean, 
		shiftKey?: boolean,
		altKey?: boolean,
		preventDefault?: boolean
	}
	type Hotkey = { 
		code: KeyboardEvent['code'],
		button: HTMLButtonElement, 
		constraints?: HotkeyConstraints
	}

	/** object fed to tweakpane for granular image position */
	type WrappedIPositionNumbers = { position: { x: number, y: number } }

	interface Window {
		refreshActiveObjectButton: HTMLButtonElement
	}
}

export {};