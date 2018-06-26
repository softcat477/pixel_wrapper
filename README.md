# Pixel Wrapper

A wrapper to run [```Pixel.js```](https://github.com/DDMAL/Pixel.js) on top of [```Diva.js```](https://github.com/DDMAL/diva.js) as a job in the workflow builder [```Rodan```](https://github.com/DDMAL/Rodan)

## Installation
- Follow the [rodan-docker guide](https://github.com/DDMAL/rodan-docker/blob/master/README.md) to have docker set up.
- Clone this repo inside the rodan `jobs` folder (`rodan-docker/jobs`) using 

  ``` 
  git clone --recurse-submodules https://github.com/DDMAL/pixel_wrapper.git
  ```
  - If using an older version of `git` (pre-2.13) and the above command fails, instead run 
    ```
    git clone https://github.com/DDMAL/pixel_wrapper.git
    git submodule update --init --recursive
    ```
  - If you already have an outdated version of this repository cloned, then pull all the changes and run
    ```
    git submodule update --init --recursive
    ```
- Copy `jobs/setting.py.job_development` to `jobs/settings.py`.
- Open up `jobs/settings.py` in a text editor. You'll need to do two things:
  - Include the path to the wrapper folder in the Rodan Job Package registration (line 96). This should look something like the following
    ``` python
    RODAN_JOB_PACKAGES = (
      "rodan.jobs.pixel_wrapper",
      # Paths to other jobs
    )
    ```
  - Increase `RODAN_RUNJOB_WORKING_USER_EXPIRY_SECONDS` (line 87) from `15` to `15000000`.
- In `RODAN_JOB_PACKAGES`, check if `rodan.jobs.pil-rodan` is included in the job paths.
  - If `pil-rodan` is not in the list, clone https://github.com/DDMAL/pil-rodan.git to the jobs folder, like in the first step and add its path to the list of rodan job packages like so:
    ``` python
    RODAN_JOB_PACKAGES = (
      "rodan.jobs.pixel_wrapper", 
      "rodan.jobs.pil-rodan",
      # Paths to other jobs
    )
    ```
- Open `docker-compose.job-dev.yml` and replace both occurences of `demojob` with `pixel_wrapper`.
- In ```source/js/plugins``` run ```python activate_wrapper.py``` in terminal to activate the wrapper within `Pixel.js`.
- In ```source/js/plugins/Pixel.js``` run ```./pixel.sh``` in terminal to install all dependencies and compile the project.
- The wrapper should now be available to use in any workflow

## Running Rodan
- Once the above installation steps are complete, run Rodan with the following command: 
  ```
  docker-compose -f docker-compose.yml -f docker-compose.job-dev.yml up
  ``` 

### Using Pixel as a Rodan job
Here are some user-level instructions on adding a pixel.js job in RODAN.
- By following the rodan-docker guide, the rodan client should now be running on `localhost:9002`
- Create a new workflow, or select an existing one.
- Double-click workflow -> workflow header tab -> add job
- Find `Diva - Pixel.js` -> Add
- Double-click red input square to select your image from resources (you must pre-upload resources, select the resource section on the left to do so)
- Choose png or tiff resource -> add -> input square should be green now
- Workflow header tab -> run

### Setting Up the Ports
- You must create however many layers that you wish to classify as the input ports.
  - Do this by right clicking on the Pixel job, clicking on ports, and adding/deleting input ports as needed.
  - For example, if you're working with 3 layers (music symbols, text, and staff lines), then create three input ports.
- There must be two more output ports than input ports. 
  - This is because one port is reserved for the auto-generated *Background Layer* (the negative of the classified layers combined), and another is reserved for the *Select Regions Layer* (a mask of the user-verified portions of the image). 
  - Ensure that your output ports are in incremental order (ie. do not skip from layer 1 to layer 5).
- For example, if you have `Layers {1, 2, 3}` as input ports, then you must have `Layers {0, 1, 2, 3, 4}` as output ports. `Layer 0` is already enabled by default, so you'd just need to enable the other 4.

## Making changes to the pixel_wrapper source code
Sometimes changes need to be done to the wrapper code found in `source/js/plugins/pixel-wrapper.js`, or the `Pixel.js` source code in `source/js/plugins/Pixel.js`. 

If this is the case, make sure to run ```gulp develop:rodan``` from the ```pixel_wrapper``` directory after making any changes. This will compile the source code and move it to the static folder, which is used to upload the code to the server running Rodan. You won't need to restart Rodan. 

If you make any changes to the css files, you'll need to move them manually the ```pixel_wrapper/static/css``` folder.

## Testing
Unit testing for **Pixel Wrapper** is done using [Selenium](http://seleniumhq.github.io/selenium/docs/api/javascript/index.html), and requires a web browser ([FireFox](https://www.mozilla.org/en-US/firefox/), make sure you have the latest version if already installed), and its driver ([`geckodriver`](https://github.com/mozilla/geckodriver/releases/)). 

- Once you install `geckodriver`, place it in your system [PATH](https://en.wikipedia.org/wiki/PATH_%28variable%29), perhaps like so
  ```
  mv ~/Downloads/geckodriver /usr/local/bin
  ```
- You can access the `pixel-wrapper.test.js` file in `source/js/plugins` in order to add/remove/alter existing tests. 
- Before running, you must set the proper URL for the Selenium `WebDriver` to fetch. 
  - To do this, open the `Pixel.js` job within Rodan (go to `Run Jobs` and open `Pixel_js`). Get the URL of the new window, and update the `url` variable in `pixel-wrapper.test.js`:
    ```javascript
    const url = "your Pixel.js url"; // line 6
    ```
  - This will not pass the Travis CI build, since `Pixel.js` will be served at `localhost` which won't work. However, local testing will work properly. 
- Run `npm test` to run the tests.
