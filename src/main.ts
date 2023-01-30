import './style.css'
import { debounce } from './utils';
import { fabric } from "fabric";
import { IEvent } from 'fabric/fabric-impl';

// 
// https://github.com/Mstrdav/infinitegrid
// https://github.com/naver/egjs-infinitegrid

const GRID_SIZE = 32 //grid size in px
const DEFAULT_RECT_OPTS = {
	originX: 'left',
	originY: 'top',
	fill: "red",
	width: 3 * GRID_SIZE,
	height: 2 * GRID_SIZE
}

// create a wrapper around native canvas element (with id="c")
const canvas = new fabric.Canvas('c');

function resizeMainCanvas() {
	//https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions#8876069
	const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
	const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
	canvas.setWidth(vw);
	canvas.setHeight(vh);
}
resizeMainCanvas()
window.addEventListener('resize', debounce(resizeMainCanvas))
document.body.style.setProperty("--dot-spacing", `${GRID_SIZE}px`)

canvas.on('object:moving', function(options: IEvent<MouseEvent>) {
	options.target.set({
		left: Math.round(options.target.left / GRID_SIZE) * GRID_SIZE,
		top: Math.round(options.target.top / GRID_SIZE) * GRID_SIZE
	});
});

// create a rectangle object
const rect = new fabric.Rect({
	left: 0,
	top: 0, ...DEFAULT_RECT_OPTS
});

// "add" rectangle onto canvas
canvas.add(rect);
