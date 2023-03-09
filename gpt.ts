import { fabric } from 'fabric';
import materialIconsFont from './material-icons.woff2';

const MATERIAL_ICONS_FONT_FAMILY = 'Material Icons';
const MATERIAL_ICONS_FONT_FACE = `@font-face {
  font-family: "${MATERIAL_ICONS_FONT_FAMILY}";
  src: url("${materialIconsFont}") format("woff2");
  font-weight: normal;
  font-style: normal;
}`;
const fontFaceRule = document.createElement('style');
fontFaceRule.innerHTML = MATERIAL_ICONS_FONT_FACE;
document.head.appendChild(fontFaceRule);

function getMaterialIconSVG(iconName: string, options?: { width?: number, height?: number }): string {
  const { width = 16, height = 16 } = options ?? {};
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <text x="0" y="50%" font-family="${MATERIAL_ICONS_FONT_FAMILY}" font-size="${height}px">${iconName}</text>
    </svg>
  `;
}

function addControls(object: fabric.Object): void {
  const logControlClick = (iconName: string) => {
    console.log(`Clicked ${iconName} control!`);
  };

  if (!object.addControl) {
    fabric.Object.prototype.controls = fabric.Object.prototype.controls || {};
    fabric.Object.prototype.addControl = function(control: fabric.Control, options?: fabric.IObjectOptions) {
      if (!this.controls) {
        this.controls = {};
      }
      this.controls[control.corner] = new control(options);
      return this;
    };
  }

  object.addControl(new fabric.Control({
    cornerSize: 16,
    cornerColor: '#333',
    mouseUpHandler: (eventData: fabric.IEvent) => {
      logControlClick('play');
    },
    render: (ctx: CanvasRenderingContext2D, left: number, top: number) => {
      if (!this.isVisible()) {
        return;
      }

      ctx.save();
      ctx.translate(left, top);

      const sizeX = this.sizeX;
      const sizeY = this.sizeY;
      const cornerSize = this.cornerSize;
      const centerX = sizeX / 2;
      const centerY = sizeY / 2;

      ctx.fillStyle = this.cornerColor;
      ctx.fillRect(-cornerSize / 2, -cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(sizeX - cornerSize / 2, -cornerSize / 2, cornerSize, cornerSize);
     
