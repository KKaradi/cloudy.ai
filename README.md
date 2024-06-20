# Overview 

Cloudy.ai provides a new UI for comfy ui that supports nodal image generation where every image thats generated may be iterated upon in a branching structure. 

Cloudy.ai is built ontop of a comfy ui server that is run through a flask server which works with a next.js frontend 

### Here are some examples of the possibilities with Cloudy.ai
![image](example3.png "Title")
![image](example2.png "Title")
![image](example.png "Title")


# Running Locally

## Setup Environmental Variables
For the flask server set
```
COMFY_PORT: The url of the server to which your comfy ui server is running
COMFY_PATH: Should end in /ComfyUi, the path to your local comfy ui source code
COMFY_COMFY_SUB_PATH: Should look like '/v1', the subpath version to differentiate cloudy ai output and input files from any prexisting comfy ui files
```
For the node server set 
```
FLASK_PORT: The url of the local flask server
```

First, start the server for your local version of comfy ui. If you haven't cloned the comfy ui repository yet the link is here https://github.com/comfyanonymous/ComfyUI.

Then enter the pip virtual environment from the flask directory and run
`pip3 install -r requirements.txt`
`flask --app portal.py run`

Then run the node development server from the root director

```
npm run dev
```