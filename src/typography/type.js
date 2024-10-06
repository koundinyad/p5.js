
import p5 from '../core/main';
import Renderer2D from '../core/p5.Renderer2D';
import * as constants from '../core/constants';

/*
  Questions:
    - How to handle font size units? do we support values other than px?
    - How to handle variable font properties?
    - The 2.x way to deal with async load font ? 
    - Do we need to inject loaded fonts into dom for dom module? yes
*/

/*
  Renderer.states = {
      doStroke: true,
      strokeSet: false,
      doFill: true,
      fillSet: false,
      rectMode: constants.CORNER,
      textFont: 'sans-serif',
      textLeading: 15,
      leadingSet: false,
      textSize: 12,
      textAlign: constants.LEFT,
      textBaseline: constants.BASELINE,
      textStyle: constants.NORMAL,
      textWrap: constants.WORD,
      textAscent: undefined,
      textDescent: undefined, // 


      textWeight: 400, // ADDED DCH
      textVariant: 'normal', // ADDED DCH
       // textStretch, lineHeight ?
    };
*/
/* 
  Properties of the context2d and context2d.font objects:
  
    font.fontFamily: "cursive",
    font.fontSize: 16,
    font.fontStyle: "italic",
    font.fontWeight: 500,
    font.fontVariant: "small-caps",  // missing from font string-spec?
    font.lineHeight: 2               // missing from font string-spec?

    context.fontKerning = "auto";
    context.fontStretch = "normal";
    context.fontVariantCaps = "normal";
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.textRendering = "auto";
    context.wordSpacing = 0;
    context.letterSpacing = 0;
    context.direction = 'ltr';

    // existing font props proposed to move to context2d in HTML spec
    attribute DOMString fontFamily;
    attribute DOMString fontWeight;
    attribute DOMString fontStyle;
    attribute DOMString fontSize;
    
    // additional context2d props proposed to be added in HTML spec
    attribute DOMString fontVariant;
    attribute DOMString fontSynthesis;
    attribute DOMString fontFeatureSettings;
    attribute DOMString fontVariationSettings;
    attribute DOMString fontLanguageOverride;
    attribute DOMString fontOpticalSizing;
    attribute DOMString fontPalette;
    attribute DOMString fontSizeAdjust;
*/


// API methods /////////////////////////////
// text, textFont, textSize, textWidth, textAscent, textDescent, 
// textAlign, textLeading, textWrap, textBounds

p5.prototype.loadFont = async function (...args) {

  console.log('Renderer2D.prototype.loadFont');

  // TODO: need to accept a name and path

  //p5._validateParameters('loadFont', args);
  const name = args[0];
  const path = args[1];
  if (typeof name !== 'string' || typeof path !== 'string') {
    throw new Error('loadFont() requires a name and path');
  }

  let callback, errorCallback, options;

  // check for callbacks
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg === 'function') {
      if (!callback) {
        callback = arg;
      } else {
        errorCallback = arg;
      }
    }
    else if (typeof arg === 'object') {
      options = arg;
    }
  }

  const fontFile = new FontFace(name, `url(${path})`, options);
  document.fonts.add(fontFile);

  return await new Promise(resolve =>
    fontFile.load().then(() => {
      if (typeof callback !== 'undefined') {
        callback(fontFile);
      }
      resolve(fontFile)
    },
      err => {
        // Error handling
        //p5._friendlyFileLoadError(5, path);
        if (errorCallback) {
          errorCallback(err);
        } else {
          throw err;
        }
      }
    ));
};

Renderer2D.prototype.textStyle = function (s) {
  if (s) {
    if (
      s === constants.NORMAL ||
      s === constants.ITALIC ||
      s === constants.BOLD ||
      s === constants.BOLDITALIC
    ) {
      this.states.textStyle = s;
    }
    return this._applyTextProperties();
  }

  return this.states.textStyle;
}


Renderer2D.prototype.textAlign = function (h, v) {
  if (typeof h !== 'undefined') {
    this.states.textAlign = h;
    if (typeof v !== 'undefined') {
      this.states.textBaseline = v;
    }
    return this._applyTextProperties();
  } else {
    return {
      horizontal: this.states.textAlign,
      vertical: this.states.textBaseline
    };
  }
};

Renderer2D.prototype.textAscent = function () {
  const ctx = this.drawingContext;  
  // const previousTextBaseline = ctx.textBaseline;
  // const previousVerticalAlign = ctx.verticalAlign;
  // ctx.textBaseline = 'bottom';
  // ctx.verticalAlign = 'bottom';
  const { fontBoundingBoxAscent } = ctx.measureText('');
  // console.log('fontBoundingBoxAscent', fontBoundingBoxAscent);
  // ctx.textBaseline = previousTextBaseline;// Reset baseline
  // ctx.verticalAlign = previousVerticalAlign;// Reset verticalAlign
  return fontBoundingBoxAscent;
}

Renderer2D.prototype.textDescent = function () {
  const ctx = this.drawingContext;
  const { fontBoundingBoxDescent } = ctx.measureText('');
  // console.log('fontBoundingBoxDescent', fontBoundingBoxDescent);
  return Math.abs(fontBoundingBoxDescent);
}

Renderer2D.prototype.textWidth = function (s) {
  let metrics = this.drawingContext.measureText(s);
  // this should be more accurate than width
  return Math.abs(metrics.actualBoundingBoxLeft)
    + Math.abs(metrics.actualBoundingBoxRight);
}

Renderer2D.prototype.textBounds = function (s, x = 0, y = 0) {
  //console.log('type.textBounds', s, x, y);
  let metrics = this.drawingContext.measureText(s);
  let w = metrics.actualBoundingBoxLeft
    + metrics.actualBoundingBoxRight;
  let h = metrics.actualBoundingBoxAscent
    + Math.abs(metrics.actualBoundingBoxDescent);
  return { x, y: y + metrics.actualBoundingBoxDescent, w, h };
}

p5.prototype.textFont = function (theFont, theSize, theWeight, theStyle, theVariant) {

  //console.log('type.textFont:', theFont, theSize, theWeight || "", theStyle || "", theVariant || "");

  let { drawingContext, states } = this._renderer;

  if (arguments.length) {
    if (!theFont) {
      throw new Error('null font passed to textFont');
    }
    if (typeof theSize === 'string') { // default to px
      //      theSize = `${theSize}px`;
      theSize = Number.parseFloat(theSize);
    }

    this._renderer.states.textFont = theFont;

    if (typeof theSize !== 'undefined') {
      this._renderer.states.textSize = theSize;
    }

    if (typeof theWeight !== 'undefined') {
      this._renderer.states.textWeight = theWeight;
    }
    if (typeof theStyle !== 'undefined') {
      this._renderer.states.textStyle = theStyle;
    }
    if (typeof theVariant !== 'undefined') {
      this._renderer.states.textVariant = theVariant;
    }

    return this._renderer._applyTextProperties();
  }

  return getFontString(drawingContext, states);
}

Renderer2D.prototype.textSize = function (theSize) {
  if (typeof theSize !== 'undefined') {
    this.states.textSize = Number.parseFloat(theSize);
    return this._applyTextProperties();
  }
  return this.states.textSize;
}

Renderer2D.prototype._applyTextProperties = function () {
  let { drawingContext, states } = this;
  drawingContext.font = getFontString(drawingContext, states);
  drawingContext.textAlign = states.textAlign;
  if (states.textBaseline === constants.CENTER) {
    drawingContext.textBaseline = constants._CTX_MIDDLE;
  } else {
    drawingContext.textBaseline = states.textBaseline;
  }
  return this._pInst;
}


// text() calls this method to render text
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

// Helper functions ////////////////////////

function getFontString(context, states) {
  let { textStyle, textVariant, textWeight, textSize, textFont } = states; // textStretch, lineHeight ?
  let style = (textStyle === 'normal') ? '' : textStyle;
  let weight = (textWeight === 'normal' || textWeight === 400) ? '' : textWeight;
  let variant = (textVariant === 'normal') ? '' : textVariant;
  let css = `${style} ${weight} ${variant} ${textSize}px ${textFont}`;
  //console.log('getFontString:', css);
  return css;
}

function fontContextProps(context) {
  let { fontKerning, fontStretch, fontVariantCaps, textAlign, textBaseline, textRendering, wordSpacing, letterSpacing } = context;
  return { fontKerning, fontStretch, fontVariantCaps, textAlign, textBaseline, textRendering, wordSpacing, letterSpacing };
}

function fontObjectProps(context) {
  // properties of context.font
  let { font, fontSize, fontStyle, fontWeight, fontVariant, lineHeight } = context.font;
  return { font, fontSize, fontStyle, fontWeight, fontVariant, lineHeight };
}

function getFontProps(context) {
  return { ...fontObjectProps(context), ...fontContextProps(context) };
}

function setFontProps(context, props) {
  let keys = Object.keys(getFontProps(context));
  keys.forEach(key => {
    if (props[key]) {
      context[key] = props[key];
    }
  });
}

function setFont(context, fontFace, fontSize) {
  let current = getFontObjectProps(context);
  if (fontFace) {
    this._renderer.states.textFont = fontFace;
  }
  let { textSize, textFont } = this._renderer.states;
  context.font = `${textSize} ${textFont}`;
  for (let key in contextOpts) {
    context[key] = contextOpts[key];
  }
}

function setFontFromStates(context, fontFace, fontSize) {
  if (fontSize) {
    if (typeof fontSize === 'number') size += 'px'; // default
    this._renderer.states.textSize = fontSize;
  }
  if (fontFace) {
    this._renderer.states.textFont = fontFace;
  }
  let { textSize, textFont } = this._renderer.states;
  context.font = `${textSize} ${textFont}`;
  for (let key in contextOpts) {
    context[key] = contextOpts[key];
  }
}



/*const computedStyleCache = new WeakMap();

function fontSizePx(context) {
  const [el, metrics] = fontDelegate(context);
  return metrics.fontSize;
}

function fontBounds(context) {
  const [el, metrics] = fontDelegate(context);
  return {
    x: -metrics.actualBoundingBoxLeft,
    y: -metrics.actualBoundingBoxAscent,
    w: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    h: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
}

function updateCachedFont(context) {
  fontMetrics(context);
  const [el, metrics] = computedStyleCache.get(context.canvas);
  if (!el) throw new Error('invalid fontMetrics delegate');
  el.style.font = context.font;
}

function fontMetrics(context, string) {

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
*/
// function getFontProps(context) {
//   let [size, name] = context.font.split(' ');
//   if (size.endsWith('px')) {
//     size = Number.parseFloat(size);
//   }
//   else {
//     // TODO: handle non-pixel font sizes
//   }
//   return { size, name };
// }

/*function parsedStyleForCSS(cssString) {
  let el = document.createElement("span");
  el.setAttribute("style", cssString);
  return el.style; // CSSStyleDeclaration object
}
let parsedStyle = parsedStyleForCSS("font: bold italic small-caps 1em/1.5em verdana,sans-serif");
console.log(parsedStyle["fontWeight"]); // bold
console.log(parsedStyle["fontStyle"]); // italic
console.log(parsedStyle["fontVariant"]); // small-caps
console.log(parsedStyle["fontSize"]); // 1em
console.log(parsedStyle["lineHeight"]); // 1.5em
console.log(parsedStyle["fontFamily"]); // verdana, sans-serif 
*/