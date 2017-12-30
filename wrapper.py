import os
from binascii import a2b_base64
from rodan.settings import MEDIA_URL, MEDIA_ROOT
from rodan.jobs.base import RodanTask
from django.conf import settings
import json

def media_file_path_to_public_url(media_file_path):
    chars_to_remove = len(MEDIA_ROOT)
    return os.path.join(MEDIA_URL, media_file_path[chars_to_remove:])

def get_iiif_query (resource_path):
		resource_path = resource_path.split('/')
		resource_path.remove('')
		resource_path.remove('rodan')
		resource_path.remove('data')
		del resource_path[-1]	# last element is the original uncoverted file
		resource_path.append('diva')
		resource_path.append('image.jp2')
		resource_path = '%2F'.join(resource_path)

		server_url = settings.IIPSRV_URL
		query = server_url + '?IIIF=' + resource_path
    
		return query

def get_image_dimensions():
    """
    returns the image dimensions in the following format [height, width]
    """
    return [6993,4414]

height, width = get_image_dimensions()

def get_images(query_url):
    return [ 
                {
                    "@type":"oa:Annotation",
                    "motivation":"sc:painting",
                    "resource": {
                                    "@id":query_url,
                                    "@type":"dctypes:Image",
                                    "format":"image/jpeg",
                                    "height":height,
                                    "width":width,
                                    "service": {
                                                    "@context": "http://iiif.io/api/image/2/context.json", "@id": query_url, "profile": "http://iiif.io/api/image/2/level2.json"
                                                }
                                }
                                ,
                        "on":"https://images.simssa.ca/iiif/manuscripts/cdn-hsmu-m2149l4/canvas/folio-001r.json"
                }
            ]


def create_canvases(query_url):
    data = {}
    data['@id'] = 'https://images.simssa.ca/iiif/manuscripts/cdn-hsmu-m2149l4/canvas/folio-001r.json'
    data['@type'] = 'sc:Canvas'
    data['label'] = 'Folio 001r'
    data['height'] = height
    data['width'] = width
    data['images'] = get_images(query_url)
    return [data]

def create_sequences(query_url):
    data = {}
    data['@type'] = 'sc:Sequence'
    data['canvases'] = create_canvases(query_url)
    return [data]

def create_metadata(query_url):
    return [    
                {"label": "Date", "value": "1554-5"},
                {"label": "Siglum", "value": "CDN-Hsmu M2149.L4"},
                {"label": "Provenance", "value": "Salzinnes"}
           ]

def create_json(query_url):
    data = {}
    data['@context'] = 'http://iiif.io/api/presentation/2/context.json'
    data['@id'] = 'https://images.simssa.ca/iiif/manuscripts/cdn-hsmu-m2149l4/manifest.json'
    data['@type'] = 'sc:Manifest'
    data['label'] = 'Salzinnes, CDN-Hsmu M2149.L4'
    data['metadata'] = create_metadata(query_url)
    data['description'] = 'Image'
    data['sequences'] = create_sequences(query_url)
    return json.dumps(data)


class PixelInteractive(RodanTask):
    name = 'Pixel_js'
    author = 'Zeyad Saleh, Ke Zhang & Andrew Hankinson'
    description = 'Pixel-level ground truth creation and correction'
    settings = {}
    enabled = True
    category = 'Diva - Pixel.js'
    interactive = True
    input_port_types = [
        {
            'name': 'Image',
            'resource_types': lambda mime: mime.startswith('image/'), 
            'minimum': 1,
            'maximum': 1,
            'is_list': False
        },
        {
            'name': 'PNG - Layer 1 Input',
            'resource_types': ['image/rgb+png'],
            'minimum': 0,
            'maximum': 1,
            'is_list': False
        },
        {
            'name': 'PNG - Layer 2 Input',
            'resource_types': ['image/rgb+png'],
            'minimum': 0,
            'maximum': 1,
            'is_list': False
        },
        {
            'name': 'PNG - Layer 3 Input',
            'resource_types': ['image/rgb+png'],
            'minimum': 0,
            'maximum': 1,
            'is_list': False
        },
    ]
    output_port_types = [
        # {'name': 'Text output', 'minimum': 1, 'maximum': 1, 'resource_types': ['text/plain']},
        {
            'name': 'PNG - Layer 1 Output',
            'resource_types': ['image/rgb+png'],
            'minimum': 1,
            'maximum': 1,
            'is_list': False
        },
        {
            'name': 'PNG - Layer 2 Output',
            'resource_types': ['image/rgb+png'],
            'minimum': 1,
            'maximum': 1,
            'is_list': False
        },
        {
            'name': 'PNG - Layer 3 Output',
            'resource_types': ['image/rgb+png'],
            'minimum': 1,
            'maximum': 1,
            'is_list': False
        },
    ]

    def get_my_interface(self, inputs, settings):
		# Get input.
        layer1_url = ''
        layer2_url = ''
        layer3_url = ''

        query_url = get_iiif_query(inputs['Image'][0]['resource_path'])

        if 'PNG - Layer 1 Input' in inputs:
            layer1_path = inputs['PNG - Layer 1 Input'][0]['resource_path']
            layer1_url = media_file_path_to_public_url(layer1_path)

        if 'PNG - Layer 2 Input' in inputs:
            layer2_path = inputs['PNG - Layer 2 Input'][0]['resource_path']
            layer2_url = media_file_path_to_public_url(layer2_path)

        if 'PNG - Layer 3 Input' in inputs:
            layer3_path = inputs['PNG - Layer 3 Input'][0]['resource_path']
            layer3_url = media_file_path_to_public_url(layer3_path)

    	# Create data to pass.
    	data = {
    		'json': create_json(query_url),
            'layer1_url' : layer1_url,
            'layer2_url' : layer2_url,
            'layer3_url' : layer3_url,
        }
    	return ('index.html', data)

    def run_my_task(self, inputs, settings, outputs):
        if '@done' not in settings:
            return self.WAITING_FOR_INPUT() 

        list=settings['@user_input']    # List passed having the image data (base 64) from all layer

        for i in range(0, len(list)):
            port = "PNG - Layer %d Output" % (i)
            if port in outputs:
                outfile_path = outputs[port][0]['resource_path']
                data = list[i].split(',')[1]    # Remove header from the base 64 string
                missing_padding = len(data) % 4
                
                if missing_padding != 0:
                    data += '=' * (4 - missing_padding % 4)

                binary_data = a2b_base64(data)   # Parse base 64 image data
                outfile = open(outfile_path + '.png', "wb")
                outfile.write(binary_data)
                outfile.close()
                os.rename(outputs[port][0]['resource_path']+'.png',outputs[port][0]['resource_path'])
        return True

    def validate_my_user_input(self, inputs, settings, user_input):
        return { '@done': True, '@user_input': user_input['user_input'] }

    def my_error_information(self, exc, traceback):
	pass

