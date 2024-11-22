import p5 from '../../../src/app.js';

suite('Loading Fonts', function () {
  var myp5;

  beforeEach(function () {
    myp5 = new p5(function (p) {
      p.setup = function () { };
      p.draw = function () { };
    });
  });

  afterEach(function () {
    myp5.remove();
  });

  // tests ////////////////////////////////////////////////
  const fontFile = '/unit/assets/acmesa.ttf';

  test('loadFont.await', async () => {
    const pFont = await myp5.loadFont(fontFile, 'fredTheFont');
    assert.ok(pFont, 'acmesa.ttf loaded');
    assert.equal(pFont.name, 'fredTheFont');
    assert.isTrue(pFont instanceof p5.Font);
  });

  test('loadFont.then', async () => new Promise(done => {

    myp5.loadFont(fontFile, 'acmesa').then(pFont => {
      assert.ok(pFont, 'acmesa.ttf loaded');
      assert.equal(pFont.name, 'acmesa');
      assert.isTrue(pFont instanceof p5.Font);
      done();
    });

  }));

  test('loadFont.callback', async () => new Promise(done => {
    myp5.loadFont(fontFile, (pFont) => {

      assert.ok(pFont, 'acmesa.ttf loaded');
      assert.equal(pFont.name, 'A.C.M.E. Secret Agent');
      assert.isTrue(pFont instanceof p5.Font);
      done();
    });
  }));

});