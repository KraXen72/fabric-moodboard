// const tileSvgElem = document.createElementNS("http://www.w3.org/2000/svg", "svg")
// assignAttributesSVG(tileSvgElem, { width: size, height: size, viewBox: `0 0 ${size} ${size}`, version: "1.1" })
// tileSvgElem.innerHTML = `<defs/><g>${
// 	circlePositions
// 		.map(([cx, cy]) => `<circle style="${circleStyle}" cx="${cx}" cy="${cy}" r="${r}"/>`)
// 		.join("\n")
// }</g></svg>`

// const aaa = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='13' height='13' fill-opacity='0.1' fill='%23000000'/%3E%3C/svg%3E`

// fabric.Image.fromURL(inlineSVGString(tileSvgString)/*aaa*//* 'https://picsum.photos/id/1083/200/300' */, (img) => {
// 	canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), { scaleX: canvas.width / img.width, scaleY: canvas.height / img.height });
// }, {crossOrigin: 'anonymous'});

//canvas.setBackgroundImage(inlineSVGString(tileSvgString), () => {canvas.requestRenderAll()})
// const bg = new fabric.Rect({ width: xTiles*size, height: yTiles*size, stroke: 'rgba(0,0,0,0)', strokeWidth: 0, fill: '', evented: false, selectable: false, top:0, left:0 });
// bg.set("backgroundColor", {source: urlSVGString(tileSvgString), repeat: "repeat"})
// console.log(bg)
// // bg.fill = new fabric.Pattern({source: })
// canvas.add(bg)
// bg.dirty = true;
// canvas.requestRenderAll()
// bg.canvas = canvas;
// canvas.setBackgroundImage(bg, () => {bg.dirty = true; canvas.requestRenderAll() });

// fabric.loadSVGFromString(tileSvgString, function(objects, options) {
// 	const group = fabric.util.groupSVGElements(objects, options)
// 	const pattern = patternFromImage(group)
// 	// canvas.setBackgroundColor({source: pattern, repeat: "repeat"}, () => canvas.renderAll())
	
// 	// canvas.setBackgroundImage(group, () => canvas.renderAll())
// 	// canvas.setBackgroundColor({source: svgg, repeat: "repeat"}, () => canvas.renderAll() )
// });


// const patternSourceCanvas = new fabric.StaticCanvas(document.createElement("canvas"));
// patternSourceCanvas.add(fabric.util.groupSVGElements([tileSvgElem]));
// patternSourceCanvas.setDimensions({ width: size, height: size });
// const texture = patternSourceCanvas.getElement();