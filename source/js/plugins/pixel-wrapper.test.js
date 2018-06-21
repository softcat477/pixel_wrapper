import "isomorphic-fetch"; // required otherwise fetch is undefined with jest
import {Diva} from '../diva';
import PixelPlugin from './pixel.js/source/pixel';
import {PixelWrapper} from './pixel-wrapper';

const divaDiv = document.createElement('div');
divaDiv.setAttribute('id', 'diva-wrapper');
document.body.appendChild(divaDiv);

// initialize classes
const diva = new Diva('diva-wrapper', {
    objectData: "https://images.simssa.ca/iiif/manuscripts/cdn-hsmu-m2149l4/manifest.json",
    plugins: [Diva.PixelPlugin]
});
const pixelInstance = new PixelPlugin(diva.divaState.viewerCore);
const wrapperInstance = new PixelWrapper(pixelInstance);

test('wrapper layers are defined', () => {
    expect(wrapperInstance.layers).toBeDefined();
});

test('button methods can run successfully (create and destroy)', () => {
    expect(wrapperInstance.createButtons()).toBeTruthy();
    expect(wrapperInstance.destroyButtons()).toBeTruthy();
});