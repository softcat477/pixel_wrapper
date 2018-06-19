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
        this.totalRegionCount;
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
        this.createTooltip();
    }

    deactivate ()
    {
        this.destroyButtons();
    }

    createTooltip ()
    {
        // Create help box next to selectRegionLayer selector
        let selectRegionLayerBox = document.getElementById("layer--1-selector");

        let helpDiv = document.createElement("div"),
            helpText = document.createTextNode("?"),
            tooltipDiv = document.createElement("div"),
            tooltipText = document.createTextNode("While in the Select Region Layer, use the " +
            "rectangle tool to select the regions of the page that you will classify. " +
            "Once you select these regions, select another layer and begin classifying! " + 
            "Make sure to stay within the bounds of the region.");

        helpDiv.setAttribute("class", "tooltip");
        helpDiv.appendChild(helpText);
        tooltipDiv.setAttribute("class", "tooltiptext");
        tooltipDiv.appendChild(tooltipText);

        helpDiv.appendChild(tooltipDiv);
        selectRegionLayerBox.appendChild(helpDiv);
    }


    createButtons () 
    {
        let rodanExportButton = document.createElement("button"),
            rodanExportText = document.createTextNode("Submit To Rodan");

        this.exportToRodan = () => { this.createBackgroundLayer(); }; // This will call exportLayersToRodan when done

        rodanExportButton.setAttribute("id", "rodan-export-button");
        rodanExportButton.appendChild(rodanExportText);
        rodanExportButton.addEventListener("click", this.exportToRodan);

        document.body.insertBefore(rodanExportButton, document.getElementById('imageLoader'));    
    }

    destroyButtons ()
    {
        let rodanExportButton = document.getElementById("rodan-export-button");

        rodanExportButton.parentNode.removeChild(rodanExportButton);
    }

    /**
     *  Creates the number of required layers based on the number of input ports in the Rodan job.
     *  The variable numberInputLayers is defined in the outermost index.html 
     */
    createLayers ()
    {
        // Set default tool to rectangle (for select region layer)
        this.pixelInstance.tools.currentTool = "rectangle";

        // Only create default layers once
        if (this.layers.length !== 1) 
            return;

        let numLayers = numberInputLayers;

        // Ask user how many layers to create if there's no input
        if (numberInputLayers === 0) 
        {
            while (numLayers <= 0 || numLayers > 7) 
            {
                numLayers = parseInt(prompt("How many layers will you classify?\n" +
                "This must be the same number as the number of output ports.", 3));
            }
        }

        this.selectRegionLayer = new Layer(-1, new Colour(240, 232, 227, 1), "Select Region", this.pixelInstance, 0.3);
        this.layers.unshift(this.selectRegionLayer);

        // There is 1 active layer already created by default in PixelPlugin with layerId = 1, 
        // so start at 2, and ignore one input layer which gets assigned to layer 1. Max 7 input
        for (var i = 2; i < numLayers + 1; i++) 
        { 
            let colour;
            switch (i) 
            {
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

        // Refresh UI 
        this.uiManager.destroyPluginElements(this.layers, this.pixelInstance.background);
        this.uiManager.createPluginElements(this.layers);
    }

    exportLayersToRodan ()
    {
        console.log("Exporting!");

        this.layers.push(this.selectRegionLayer);

        let count = this.layers.length;
        let urlList = [];

        this.layers.forEach((layer) => 
        {    
            console.log(layer.layerId + " " + layer.layerName);

            let dataURL = layer.getCanvas().toDataURL();
            urlList.push(dataURL); 
            count -= 1;
                if (count === 0)
                {
                    console.log(urlList);
                    console.log("done");

                    $.ajax({url: '', type: 'POST', data: JSON.stringify({'user_input': urlList}), contentType: 'application/json'});
                }
        });

        // Alert and close Pixel after submitting
        setTimeout(function(){ alert("Submission successful! Click OK to exit Pixel.js."); }, 1000);
        setTimeout(function(){ window.close(); }, 1200);
    }

    /**
     *  Generates a background layer by iterating over all the pixel data for each layer within the
     *  selection regions, and subtracting it from the background layer if the data is 
     *  non-transparent (alpha != 0). Uses the uiManager progress bar and exports to Rodan when done
     */
    createBackgroundLayer () 
    {
        // Don't consider selectRegionLayer for background generation
        this.layers.shift();

        // NOTE: this backgroundLayer and the original background (image) both have layerId 0, but 
        // this backgroundLayer is only created upon submitting (so no conflicts)
        let backgroundLayer = new Layer(0, new Colour(242, 0, 242, 1), "Background Layer", 
            this.pixelInstance, 0.5, this.pixelInstance.actions),
            maxZoom = this.pixelInstance.core.getSettings().maxZoomLevel,
            width = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(this.pageIndex, maxZoom).width,
            height = this.pixelInstance.core.publicInstance.getPageDimensionsAtZoomLevel(this.pageIndex, maxZoom).height,
            selectRegions = this.selectRegionLayer.shapes,
            regionsInfo = { // For progress method calculations
                count: 0, // Number of "add" regions
                sumHeight: 0 // Sum of all "add" regions
            };

        // Add selection regions to the backgroundLayer
        selectRegions.forEach((region) => 
        {
            // Get shape dimensions
            let x = region.origin.getCoordsInPage(maxZoom).x,
                y = region.origin.getCoordsInPage(maxZoom).y,
                rectWidth = region.relativeRectWidth * Math.pow(2, maxZoom),
                rectHeight = region.relativeRectHeight * Math.pow(2, maxZoom),
                rect = new Rectangle(new Point(x, y, this.pageIndex), rectWidth, rectHeight, "add");

            if (region.blendMode === "subtract") 
                rect.changeBlendModeTo("subtract");
            else 
            { 
                regionsInfo.count++;
                regionsInfo.sumHeight += rectHeight;
            }

            backgroundLayer.addShapeToLayer(rect);
        });
        backgroundLayer.drawLayer(maxZoom, backgroundLayer.getCanvas());

        // Alert and return if user hasn't created a selection region
        if (regionsInfo.count === 0) 
        {
            alert("You haven't created any select regions!");
            this.layers.unshift(this.selectRegionLayer);
            return;
        }

        // Instantiate progress bar
        this.uiManager.createExportElements(this);
        // Total number of regions to iterate over (over all layers)
        this.totalRegionCount = this.layers.length * regionsInfo.count;

        this.layers.forEach((layer) => 
        {
            // Create layer canvas and draw (so pixel data can be accessed)
            let layerCanvas = document.createElement('canvas');
            layerCanvas.setAttribute("class", "export-page-canvas");
            layerCanvas.setAttribute("id", "layer-" + layer.layerId + "-export-canvas");
            layerCanvas.setAttribute("style", "position: absolute; top: 0; left: 0;");
            layerCanvas.width = width;
            layerCanvas.height = height;
            layer.drawLayerInPageCoords(maxZoom, layerCanvas, this.pageIndex); 

            // Go over every selection region and subtract layer within this region from background
            for (var i = 0; i < selectRegions.length; i++) 
            {
                let region = selectRegions[i];
                if (region.blendMode !== "add") 
                    continue;
                let dimensions = {
                    x: region.origin.getCoordsInPage(maxZoom).x,
                    y: region.origin.getCoordsInPage(maxZoom).y,
                    width: region.relativeRectWidth * Math.pow(2, maxZoom),
                    height: region.relativeRectHeight * Math.pow(2, maxZoom)
                };  
                this.subtractLayerFromBackground(backgroundLayer, layerCanvas, dimensions, regionsInfo);    
            }
        });
    }

    subtractLayerFromBackground (backgroundLayer, layerCanvas, dimensions, regionsInfo) 
    {
        var chunkSize = dimensions.width,
            chunkNum = 0, 
            col = dimensions.x,
            row = dimensions.y,
            // Height and width relative to the origin point (col, row)
            width = col + dimensions.width,
            height = row + dimensions.height, 
            pixelCtx = layerCanvas.getContext('2d');

        let doChunk = () => 
        { 
            var cnt = chunkSize;
            chunkNum++;
            while (cnt--) 
            { 
                if (row >= height)
                    break;
                if (col < width) 
                {
                    let data = pixelCtx.getImageData(col, row, 1, 1).data;
                    // data is RGBA for one pixel, data[3] is alpha
                    if (data[3] !== 0) 
                    { 
                        let currentPixel = new Rectangle(new Point(col, row, this.pageIndex), 1, 1, "subtract");
                        backgroundLayer.addShapeToLayer(currentPixel);
                    }
                    col++;
                }
                else 
                { // Reached end of row, jump to next
                    row++;
                    col = dimensions.x;
                }
            }
            // If progress not complete, recall this function
            if (this.progress(row, chunkSize, chunkNum, height, backgroundLayer, regionsInfo).incomplete) 
                setTimeout(doChunk, 1); 
        };  
        doChunk();
    }

    progress (row, chunkSize, chunkNum, height, backgroundLayer, regionsInfo) 
    {
        if (row === height || this.exportInterrupted) 
            this.totalRegionCount -= 1;
        if (row < height && !this.exportInterrupted) 
        {
            let percentage = (regionsInfo.count * chunkNum * chunkSize) * 100 / (regionsInfo.sumHeight * chunkSize),
                roundedPercentage = (percentage > 100) ? 100 : Math.round(percentage * 10) / 10;
            this.pixelInstance.uiManager.updateProgress(roundedPercentage);
            return {
                incomplete: true
            };
        } 
        else 
        {
            if (this.exportInterrupted && (this.totalRegionCount === 0)) 
            {
                this.exportInterrupted = false;
                this.uiManager.destroyExportElements();
                this.layers.unshift(this.selectRegionLayer);
            } 
            else if (this.exportInterrupted) 
            {
                // Do nothing and wait until last layer has finished processing to cancel
            } 
            else if (this.totalRegionCount === 0) 
            { // Done generating background layer
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

    /**
     *  Handles the Rodan input layers and draws them on each layer in Pixel 
     */
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