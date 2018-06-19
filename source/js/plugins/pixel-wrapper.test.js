import PixelWrapper from './pixel-wrapper';

test('pixel isnt instantiated', () => {
    expect(PixelWrapper.layers).toBeUndefined();
});