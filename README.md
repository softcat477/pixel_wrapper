# pixel_wrapper

A wrapper to run [```Pixel.js```](https://github.com/DDMAL/Pixel.js) on top of [```Diva.js```](https://github.com/DDMAL/diva.js) as a job in the workflow builder [```Rodan```](https://github.com/DDMAL/Rodan)

## Installation
- Clone this repo in the rodan jobs folder
- In rodan, go to Rodan/rodan and include the path to the wrapper folder in the Rodan Job Package registration in the the settings.py file. This should look something like the following
``` python
RODAN_JOB_PACKAGES = (
  "rodan.jobs.pixel_wrapper",
  # Paths to other jobs
)
```
- In ```source/js/plugins/Pixel.js``` run ```./pixel.sh``` in terminal to install all dependencies and compile the project.
- The wrapper should now be available to use in any workflow
- For other information please refer to the [rodan job package documentation](https://github.com/DDMAL/Rodan/wiki/Write-a-Rodan-job-package)

## Making changes to the pixel_wrapper source code
Sometimes changes need to be done to the source code found in ```source/js/plugins/Pixel.js```. If this is the case, make sure to run ```gulp develop:rodan``` from the ```pixel_wrapper/``` directory after making any changes. This will compile the source code and move it to the static folder, which is used to upload the code to the server running Rodan. If you make any changes to the css files, make sure to move them manually the ```pixel_wrapper/static/css``` folder 

### Note
The current implementation dissociates the wrapper from Diva.js and Pixel.js. Current work aims to solve this issue.
