# Script to add pixel_wrapper functionality code to pixel.js 

f = open('./pixel.js/source/pixel.js', 'r')
lines = f.readlines()
f.close()

import_flag = True
activate_flag = True
deactivate_flag = True

import_code = "import {PixelWrapper} from '../../pixel-wrapper';\n"
activate_code = """\t\t// Activate wrapper\n\t\tthis.pixelWrapper = new PixelWrapper(this);
\t\tthis.pixelWrapper.activate();\n\n"""
deactivate_code = "\t\t// Deactivate wrapper\n\t\tthis.pixelWrapper.deactivate();\n\n"

if import_code in lines:
    print("The wrapper code has already been added!")
    raise SystemExit

f = open('./pixel.js/source/pixel.js', 'w')

for i in range(len(lines)):
    if ('import {' in lines[i] and import_flag):
        lines.insert(i, import_code)
        import_flag = False
    if ('this.uiManager.createPluginElements(this.layers);' in lines[i] and activate_flag):
        lines.insert(i, activate_code)
        activate_flag = False
    if ('deactivatePlugin ()' in lines[i] and deactivate_flag):
        lines.insert(i+2, deactivate_code)
        deactivate_Flag = False

# Write to file
for i in range(len(lines)):
    f.write(lines[i])

f.close()