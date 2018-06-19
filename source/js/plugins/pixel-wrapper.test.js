import {PixelWrapper} from './pixel-wrapper';

test('pixel is not yet instantiated', () => {
    expect(PixelWrapper.layers).toBeUndefined();
});