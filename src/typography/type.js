import Renderer2D from '../core/p5.Renderer2D';
import * as constants from '../core/constants';

const computedStyleCache = new WeakMap();

function fontSizePx(context) {
  const [el, metrics] = fontDelegate(context);
  return metrics.fontSize;
}

function fontBounds(context) {
  const [el, metrics] = fontDelegate(context);
  return [
    -metrics.actualBoundingBoxLeft,
    -metrics.actualBoundingBoxAscent,
    metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  ];
}

function updateCachedFont(context) {
  fontMetrics(context);
  const [el, metrics] = computedStyleCache.get(context.canvas);
  if (!el) throw new Error('invalid fontMetrics delegate');
  el.style.font = context.font;
}

function fontMetrics(context) {

  const root = context.canvas;
  let cached = computedStyleCache.get(root);

  if (!cached) {
    // create a child of canvas to inherit font styles
    const el = document.createElement('div');
    el.ariaHidden = 'true';
    el.style.display = 'none';
    root.appendChild(el);
    cached = [el, window.getComputedStyle(el)];
    computedStyleCache.set(root, cached);
  }

  return cached[1];
}



function getFontProps(context) {
  let [size, name] = context.font.split(' ');
  if (size.endsWith('px')) {
    size = Number.parseFloat(size);
  }
  else {
    // TODO: handle non-pixel font sizes
  }
  return { size, name };
}

function setFontProps(context, fontSize, fontFace) {
  let { size, name } = getFontProps(context);
  if (typeof fontSize === 'number') size = fontSize + 'px';
  if (typeof fontSize === 'string') size = fontSize;
  if (typeof fontFace === 'string') name = fontFace;
  context.font = `${size} ${name}`;
  updateCachedFont(context);
}

Renderer2D.prototype.textWidth = function (s) {
  return this.drawingContext.measureText(s).width;
}

Renderer2D.prototype.textSize = function (s) {
  //console.log('type.textSize', '"' + this.drawingContext.font + '"', getFontProps(this.drawingContext));
  if (typeof s === 'number' || typeof s === 'string') {
    setFontProps(this.drawingContext, s);
    return this._pInst;
  }
  return getFontProps(this.drawingContext).size;
}

Renderer2D.prototype.textFont = function (theFont, theSize) {
  if (arguments.length) {
    if (!theFont) {
      throw new Error('null font passed to textFont');
    }

    setFontProps(this.drawingContext, theSize, theFont);
    //this._renderer.states.textFont = theFont;

    if (theSize) {

      // TODO: handle leading

      //   // only use a default value if not previously set (#5181)
      //   this._renderer.states._textLeading = theSize * constants._DEFAULT_LEADMULT;
    }

    return this._pInst;//._renderer._applyTextProperties();
  }

  return getFontProps(this.drawingContext).name; // or this.drawContext.font ?
}

Renderer2D.prototype._renderText = function (p, line, x, y, maxY, minY) {
  //console.log('type._renderText', line, x, y, maxY, minY);

  if (y < minY || y >= maxY) {
    return; // don't render lines beyond minY/maxY
  }

  p.push(); // fix to #803

  // no stroke unless specified by user
  if (this.states.doStroke && this.states.strokeSet) {
    this.drawingContext.strokeText(line, x, y);
  }

  if (!this._clipping && this.states.doFill) {
    // if fill hasn't been set by user, use default text fill
    if (!this.states.fillSet) {
      this._setFill(constants._DEFAULT_TEXT_FILL);
    }

    this.drawingContext.fillText(line, x, y);
  }
  p.pop();
  return p;
};