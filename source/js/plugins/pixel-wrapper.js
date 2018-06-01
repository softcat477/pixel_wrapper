import {Rectangle} from './Pixel.js/source/rectangle';
import {Point} from './Pixel.js/source/point';
import {Layer} from './Pixel.js/source/layer';
import {Colour} from './Pixel.js/source/colour';

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
        this.exportInterrupted = false;
        this.selectRegionLayer;
    }

    activate ()
    {
        this.createLayers();
        this.createButtons();
        this.rodanImagesToCanvas();
    }

    deactivate ()
    {
        this.destroyButtons();
    }

    /**
     *  Creates the number of required layers based on the number of input ports in the Rodan job.
     *  The variable numberInputLayers is defined in the outermost index.html 
     */
    createLayers ()
    {
        // Set default tool to rectangle for Select Region layer. Once createPluginElements()
        // is done, this will destroy the brush cursor and set the current tool to rectangle.
        this.pixelInstance.tools.currentTool = "rectangle";

        // Only create default layers once 
        if (this.layers.length !== 1) {
            return;
        }

        // Select Region layer. Will be 2nd element in array after backgroundLayer is added.
        this.selectRegionLayer = new Layer(-1, new Colour(227, 231, 255, 1), "Select Region", this.pixelInstance, 0.3);
        this.layers.unshift(this.selectRegionLayer);

        // There is 1 active layer already created by default in PixelPlugin with layerId = 1, 
        // so start at 2, and ignore one input layer which gets assigned to layer 1
        for (var i = 2; i < numberInputLayers + 1; i++) { 
            let colour;
            switch (i) {
                case 2:
                    colour = new Colour(255, 51, 102, 1);
                    break;
                case 3:
                    colour = new Colour(255, 255, 10, 1);
                    break;
                case 4:
                    colour = new Colour(2, 136, 0, 1);
                    break;
                case 5:
                    colour = new Colour(96, 0, 186, 1);
                    break;
                case 6:
                    colour = new Colour(239, 143, 0, 1);
                    break;
                case 7:
                    colour = new Colour(71, 239, 200, 1);
                    break;
            }
            let layer = new Layer(i, colour, "Layer " + i, this.pixelInstance, 0.5);
            this.layers.push(layer);
        }

        this.pixelInstance.layerIdCounter = this.layers.length;
    }

    createButtons () 
    {
        let rodanExportButton = document.createElement("button"),
            rodanExportText = document.createTextNode("Submit To Rodan");

        this.exportToRodan = () => { this.createBackgroundLayer(); }; // This will call exportLayersToRodan when done

        rodanExportButton.setAttribute("id", "rodan-export-button");
        rodanExportButton.appendChild(rodanExportText);
        rodanExportButton.addEventListener("click", this.exportToRodan);

        document.body.appendChild(rodanExportButton);
    }

    destroyButtons ()
    {
        let rodanExportButton = document.getElementById("rodan-export-button");

        rodanExportButton.parentNode.removeChild(rodanExportButton);
    }

    exportLayersToRodan ()
    {
        console.log("Exporting!");

        let count = this.layers.length;
        let urlList = [];

        this.layers.forEach((layer) => {
            
            console.log(layer.layerId + " " + layer.layerName);

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

        setTimeout(function(){ alert("Submission successful! Click OK to exit Pixel.js."); }, 100);
        setTimeout(function(){ window.close(); }, 200);
    }

    /**
     *  Generates a background layer by iterating over all the pixel data for each layer and 
     *  subtracting it from the background layer if the data is non-transparent (alpha != 0). Somewhat
     *  replicates what the exportLayersAsImageData function does but for generating the background
     *  layer, and there are numerous (albeit small) differences that requires a new function
     */
    createBackgroundLayer () 
    {
        // Don't export selectRegionLayer to Rodan
        this.layers.shift();
        this.layersCount = this.layers.length;

        // NOTE: this backgroundLayer and the original background (image) both have layerId 0, but 
        // this backgroundLayer is only created upon submitting (so no conflicts)
        let backgroundLayer = new Layer(0, new Colour(242, 0, 242, 1), "Background Layer", 
            this.pixelInstance, 0.5, this.pixelInstance.actions),
            maxZoom = this.pixelInstance.core.getSettings().maxZoomLevel,
            width = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(this.pageIndex, maxZoom).width,
            height = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(this.pageIndex, maxZoom).height;

        // Add select regions to backgroundLayer
        this.selectRegionLayer.shapes.forEach((shape) => {
            let x = shape.origin.getCoordsInPage(maxZoom).x,
                y = shape.origin.getCoordsInPage(maxZoom).y,
                rectWidth = shape.relativeRectWidth * Math.pow(2, maxZoom),
                rectHeight = shape.relativeRectHeight * Math.pow(2, maxZoom);

            console.log("x: " + x + ", y: " + y + ", width: " + rectWidth + ", height: " + rectHeight);

            let rect = new Rectangle(new Point(x, y, this.pageIndex), rectWidth, rectHeight, "add");
            backgroundLayer.addShapeToLayer(rect);
        });
        backgroundLayer.drawLayer(maxZoom, backgroundLayer.getCanvas());

        // Instantiate progress bar
        this.uiManager.createExportElements(this);

        this.layers.forEach((layer) => {
            // Create layer canvas and draw (so pixel data can be accessed)
            let layerCanvas = document.createElement('canvas');
            layerCanvas.setAttribute("class", "export-page-canvas");
            layerCanvas.setAttribute("id", "layer-" + layer.layerId + "-export-canvas");
            layerCanvas.setAttribute("style", "position: absolute; top: 0; left: 0;");
            layerCanvas.width = width;
            layerCanvas.height = height;
            layer.drawLayerInPageCoords(maxZoom, layerCanvas, this.pageIndex); 

            this.subtractLayerFromBackground(backgroundLayer, layerCanvas, width, height);
        });
    }

    subtractLayerFromBackground (backgroundLayer, layerCanvas, width, height) 
    {
        var chunkSize = width,
            chunkNum = 0,
            row = 0,
            col = 0,
            pixelCtx = layerCanvas.getContext('2d');

        let doChunk = () => { 
            var cnt = chunkSize;
            chunkNum++;
            while (cnt--) { 
                if (row >= height)
                    break;
                if (col < width) {
                    let data = pixelCtx.getImageData(col, row, 1, 1).data;
                    // data[3] is alpha
                    if (data[3] !== 0) { 
                        let currentPixel = new Rectangle(new Point(col, row, this.pageIndex), 1, 1, "subtract");
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
                this.layers.unshift(this.selectRegionLayer);
            } else if (this.exportInterrupted) {
                // Do nothing and wait until last layer has finished processing to cancel
            } else if (this.layersCount === 0) { // Done generating background layer
                backgroundLayer.drawLayer(0, backgroundLayer.getCanvas());
                this.layers.unshift(backgroundLayer);  
                this.uiManager.destroyExportElements();
                this.exportLayersToRodan();
            }
        }
        return {
            needsRecall: false
        };
    }

    rodanImagesToCanvas ()
    {
        this.layers.forEach((layer) =>
        {
            let img = document.getElementById("layer" + layer.layerId +"-img");
            if (img !== null)
            {
                let imageCanvas = document.createElement("canvas");
                imageCanvas.width = layer.getCanvas().width;
                imageCanvas.height = layer.getCanvas().height;
                let ctx = imageCanvas.getContext("2d");

                ctx.drawImage(img,0,0);

                let imageData = ctx.getImageData(0, 0, layer.getCanvas().width, layer.getCanvas().height),
                    data = imageData.data;

                for(let i = 0; i < data.length; i += 4)
                {
                    data[i] = layer.colour.red;             // red
                    data[i + 1] = layer.colour.green;       // green
                    data[i + 2] = layer.colour.blue;        // blue
                }
                // overwrite original image
                ctx.putImageData(imageData, 0, 0);

                layer.backgroundImageCanvas = imageCanvas;
                layer.drawLayer(this.pixelInstance.core.getSettings().maxZoomLevel, layer.getCanvas());
            }
        });
    }

}