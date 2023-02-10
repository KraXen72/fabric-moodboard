import { IObjectFit } from "fabricjs-object-fit"

declare global {
	interface appSettings {
		pasteDirection: 'right' | 'left' | 'above' | 'below',
		defaultFitMode: 'cover' | 'contain',
		defaultImageCellSize: number,
		allowResizeSelection: boolean
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
}

export {};