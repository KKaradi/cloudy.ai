from flask import Flask
from flask import request
import websocket
import uuid
import json
import urllib.request
import urllib.parse
import shutil
import os

app = Flask(__name__)

server_address = os.environ['COMFY_PORT']"127.0.0.1:8188"
client_id = str(uuid.uuid4())

process = {}

comfy_path= os.environ['COMFY_PATH']r'C:/Users/kaika/comfyui/new_ComfyUI_windows_portable_nvidia_cu121_or_cpu/ComfyUI_windows_portable/ComfyUI'
master_sub_dir=os.environ['COMFY_SUB_PATH']r'/v1'

def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": client_id}
    data = json.dumps(p).encode('utf-8')
    req =  urllib.request.Request("http://{}/prompt".format(server_address), data=data)
    return json.loads(urllib.request.urlopen(req).read())

def get_image_url(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    return "http://{}/view?{}".format(server_address, url_values)

def get_history(prompt_id):
    with urllib.request.urlopen("http://{}/history/{}".format(server_address, prompt_id)) as response:
        return json.loads(response.read())

def get_image_urls(ws, prompt, uuid):
    global process
    prompt_id = queue_prompt(prompt)['prompt_id']
    image_urls_dict = {}
    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            print(out)
            if message['type'] == 'progress':
                progress = message['data']['value']/message['data']['max']
                process[uuid]['progress'] = progress
                print(process[uuid]['progress'],'processing')
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    break
        else:
            continue 
    
    history = get_history(prompt_id)[prompt_id]
    for o in history['outputs']:
        for node_id in history['outputs']:
            node_output = history['outputs'][node_id]
            if 'images' in node_output:
                images_output = []
                for image in node_output['images']:
                    path = (image['subfolder']+'\\'+image['filename']).replace('\\','/')
                    image_urls_dict[path] =get_image_url(image['filename'], image['subfolder'], image['type'])
                    print(image_urls_dict) 
    image_urls_list = []
    for key in image_urls_dict:
        image_urls_list.append({'path':key,'url':image_urls_dict[key]})
    return (image_urls_dict,image_urls_list)

def copy_latents(file_name):
    file_name = file_name.replace('img','latent')
    file_name = file_name.replace('png','latent')

    source_path = comfy_path+'/output/'+file_name
    dest_path = comfy_path+'/input/'+file_name
    print(file_name)
    print('src',source_path)
    print('dest',dest_path)

    try:
        shutil.copy(source_path, dest_path)
    except Exception as e:
        print(f"An error occurred: {e}")

@app.route("/")
def hello_world():
    global myVar
    myVar = myVar+1
    return str(myVar)

@app.route("/debug")
def debug():
    global process
    return process

@app.route("/process/<uuid>")
def fetch_process(uuid):
    global process
    return process[uuid]

@app.route('/start', methods=['POST'])
def start():
    image_dict = None
    if request.method == 'POST':
        prompt = request.get_json()
        ''
        uuid = prompt['uuid']
        params = prompt['params']
        global process
        process[uuid] = {
            "progress": 0,
            "batch":[],
            "done":False,
        }
        ws = websocket.WebSocket()
        ws.connect("ws://{}/ws?clientId={}".format(server_address, client_id))
        ret_tup = get_image_urls(ws, params, uuid)

        image_dict = ret_tup[0]
        ws.close()
        for path in image_dict:
            copy_latents(path)
        process[uuid]['batch'] = ret_tup[1]
        process[uuid]['done'] = True
        process[uuid]['progress'] = 1

    return image_dict