import { fabric } from 'fabric';

interface ImageOptions extends fabric.IImageOptions {
  objectFit: 'contain' | 'cover';
  offsetLeft?: number;
  offsetTop?: number;
}

interface ResizedImage extends HTMLImageElement {
  resizedImageWidth: number;
  resizedImageHeight: number;
}

interface Image extends fabric.Image {
  objectFit: 'contain' | 'cover';
  offsetLeft: number;
  offsetTop: number;
  resizedImageEl: ResizedImage;
}

fabric.Image.prototype._render = function(ctx: CanvasRenderingContext2D): void {
  let x: number;
  let y: number;
  let imageWidth: number;
  let imageHeight: number;
  let scaleFactor: number;

  if (this.objectFit === 'contain') {
    scaleFactor = Math.min(this.width / this.resizedImageWidth, this.height / this.resizedImageHeight);
    imageWidth = this.resizedImageWidth * scaleFactor;
    imageHeight = this.resizedImageHeight * scaleFactor;
  } else if (this.objectFit === 'cover') {
    scaleFactor = Math.max(this.width / this.resizedImageWidth, this.height / this.resizedImageHeight);
    imageWidth = this.resizedImageWidth * scaleFactor;
    imageHeight = this.resizedImageHeight * scaleFactor;
  }

  x = -(imageWidth / 2) + (this.offsetLeft || 0);
  y = -(imageHeight / 2) + (this.offsetTop || 0);

  this._setShadow(ctx);
  this._applyOpacity(ctx);

  ctx.drawImage(this.resizedImageEl, x, y, imageWidth, imageHeight);

  this._renderStroke(ctx);
};

const image: Image = new fabric.Image(new Image(), {
  objectFit: 'contain',
  offsetLeft: 10,
  offsetTop: 10,
  resizedImageEl: new Image()
});