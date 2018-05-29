import {Rectangle} from './Pixel.js/source/rectangle';
import {Point} from './Pixel.js/source/point';
import {Layer} from './Pixel.js/source/layer';
import {Colour} from './Pixel.js/source/colour';
import {Export} from './Pixel.js/source/export';

export class PixelWrapper
{
    constructor (pixelInstance)
    {
        this.pixelInstance = pixelInstance;
        this.layers = pixelInstance.layers;
        this.layersCount = this.layers.length;
        this.uiManager = pixelInstance.uiManager;
        this.pageIndex = pixelInstance.core.getSettings().currentPageIndex;
        this.zoomLevel = pixelInstance.core.getSettings().zoomLevel;
    }

    activate ()
    {
        this.createButtons();
    }

    deactivate ()
    {
        this.destroyButtons();
    }

    createButtons () 
    {
        let createBackgroundButton = document.createElement("button"),
            createBackgroundText = document.createTextNode("Generate Background Layer"),
            rodanExportButton = document.createElement("button"),
            rodanExportText = document.createTextNode("Submit To Rodan");

        this.createBackground = () => { this.createBackgroundLayer(); };
        this.exportToRodan = () => { this.exportLayersToRodan(); };

        createBackgroundButton.setAttribute("id", "create-background-button");
        createBackgroundButton.appendChild(createBackgroundText);
        createBackgroundButton.addEventListener("click", this.createBackground);

        rodanExportButton.setAttribute("id", "rodan-export-button");
        rodanExportButton.appendChild(rodanExportText);
        rodanExportButton.addEventListener("click", this.exportToRodan);

        document.body.appendChild(createBackgroundButton);
        document.body.appendChild(rodanExportButton);
    }

    destroyButtons ()
    {
        let createBackgroundButton = document.getElementById("create-background-button"),
            rodanExportButton = document.getElementById("rodan-export-button");

        createBackgroundButton.parentNode.removeChild(createBackgroundButton);
        rodanExportButton.parentNode.removeChild(rodanExportButton);
    }

    exportLayersToRodan ()
    {
        console.log("Exporting!");

        let count = this.layers.length;
        let urlList = [];

        // The idea here is to draw each layer on a canvas and scan the pixels of that canvas to fill the matrix
        this.layers.forEach((layer) => {
            
            let dataURL = layer.getCanvas().toDataURL();
            urlList[layer.layerId] = dataURL;
            count -= 1;
                if (count === 0)
                {
                    console.log(urlList);
                    console.log("done");

                    $.ajax({url: '', type: 'POST', data: JSON.stringify({'user_input': urlList}), contentType: 'application/json'});
                }
        });
    }

    /**
     *  Generates a background layer by iterating over all the pixel data for each layer and 
     *  subtracting it from the background layer if the data is non-transparent (alpha != 0). Somewhat
     *  replicates what the exportLayersAsImageData function does but for generating the background
     *  layer, and there are numerous (albeit small) differences that requires a new function
     */
    createBackgroundLayer () 
    {
        // If generate background button has already been clicked, remove that background layer from layers
        if (document.getElementById("create-background-button").value === "clicked") { 
            this.layers.pop();
            this.layersCount = this.layers.length;
        }

        let backgroundLayer = new Layer(this.layersCount+1, new Colour(242, 0, 242, 1), "Background Layer", 
            this.pixelInstance, 0.5, this.pixelInstance.actions),
            maxZoom = this.pixelInstance.core.getSettings().maxZoomLevel,
            pageIndex = this.pageIndex, 
            width = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(pageIndex, maxZoom).width,
            height = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(pageIndex, maxZoom).height;

        // Highlight whole image for background layer
        let rect = new Rectangle(new Point(0, 0, pageIndex), width, height, "add");
        backgroundLayer.addShapeToLayer(rect);
        backgroundLayer.drawLayer(maxZoom, backgroundLayer.getCanvas());

        // Instantiate progress bar
        let exportInstance = new Export(this.pixelInstance, this.layers, this.pageIndex, this.zoomLevel, this.uiManager);
        this.uiManager.createExportElements(exportInstance);

        this.layers.forEach((layer) => {
            // Create layer canvas and draw (so pixel data can be accessed)
            let layerCanvas = document.createElement('canvas');
            layerCanvas.setAttribute("class", "export-page-canvas");
            layerCanvas.setAttribute("id", "layer-" + layer.layerId + "-export-canvas");
            layerCanvas.setAttribute("style", "position: absolute; top: 0; left: 0;");
            layerCanvas.width = width;
            layerCanvas.height = height;
            layer.drawLayerInPageCoords(maxZoom, layerCanvas, pageIndex); 

            this.subtractLayerFromBackground(backgroundLayer, layerCanvas, pageIndex, width, height);
        });
    }

    subtractLayerFromBackground (backgroundLayer, layerCanvas, pageIndex, width, height) 
    {
        var chunkSize = width,
            chunkNum = 0,
            row = 0,
            col = 0,
            pixelCtx = layerCanvas.getContext('2d');
        let doChunk = () => { // Use this method instead of nested for so UI isn't blocked
            var cnt = chunkSize;
            chunkNum++;
            while (cnt--) { 
                if (row >= height)
                    break;
                if (col < width) {
                    let data = pixelCtx.getImageData(col, row, 1, 1).data,
                        colour = new Colour(data[0], data[1], data[2], data[3]);
                    if (colour.alpha !== 0) { 
                        let currentPixel = new Rectangle(new Point(col, row, pageIndex), 1, 1, "subtract");
                        backgroundLayer.addShapeToLayer(currentPixel);
                    }
                    col++;
                }
                else { // Reached end of row, jump to next
                    row++;
                    col = 0;
                }
            }
            if (this.progress(row, chunkSize, chunkNum, height, backgroundLayer).needsRecall) { // recall function
                setTimeout(doChunk, 1); 
            }
        };  
        doChunk();
    }

    progress (row, chunkSize, chunkNum, height, backgroundLayer) 
    {
        if (row === height || this.exportInterrupted) {
            this.layersCount -= 1;
        }
        if (row < height && !this.exportInterrupted) {
            let percentage = (chunkNum * chunkSize) * 100 / (height * chunkSize),
                roundedPercentage = (percentage > 100) ? 100 : Math.round(percentage * 10) / 10;
            this.pixelInstance.uiManager.updateProgress(roundedPercentage);
            return {
                needsRecall: true
            };
        } else {
            if (this.exportInterrupted && (this.layersCount === 0)) {
                this.exportInterrupted = false;
                this.uiManager.destroyExportElements();
            } else if (this.exportInterrupted) {
                // Do nothing and wait until last layer has finished processing to cancel
            } else if (this.layersCount === 0) { // Done generating background layer
                backgroundLayer.drawLayer(0, backgroundLayer.getCanvas());
                this.layers.push(backgroundLayer);  
                document.getElementById("create-background-button").innerText = "Background Generated!";
                document.getElementById("create-background-button").value = "clicked";
                this.uiManager.destroyExportElements();
            }
        }
        return {
            needsRecall: false
        };
    }
}