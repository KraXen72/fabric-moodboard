declare global {
	export interface appSettings {
		pasteDirection: 'right' | 'left' | 'above' | 'below',
		allowResizeSelection: boolean
	}
}
export {};