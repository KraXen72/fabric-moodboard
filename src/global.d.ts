declare global {
	interface appSettings {
		pasteDirection: 'right' | 'left' | 'above' | 'below',
		allowResizeSelection: boolean
	}
	
	type scalingEvent = {
		transform: {
			corner: string
			[key: string]: any
		}
		[key: string]: any
	}
}

export {};