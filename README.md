# stable-diffusion-webui-vectorstudio

## Beta-Phase
Adds the Javascript-SVG-Editor as tab to Stable-Diffusion-Webui Automatic 1111.
* You can either generate txt2vectorgraphics and finish/edit them in this svg editor
* Or start drawing in svg editor and send your sketches to Controlnet (txt/img2-img) to a particular control net instance.

# Installation
* Copy this url from the git repository and add this extension by pasting it into the Extension Tab/Url.
---
* If you want to create vectorgraphics (svg) download POTRACE and put it into ```extensionfolder/bin/```  
This is tested under windows,yet.

## For Hackers and Betatesters
* Linux & MacOos. Potrace is compiled for each OS, so you can just download and add the binary as mentioned to ```extensionfolder/bin/potrace.exe```.  
Yes, rename it either to ```potrace.exe```or create a link named potrace.exe and point to your installation.

## Todos
* Linux/Mac-Support
* Settings
* Rework of the GUI for vectorizing

## Note
This extension will replace the simple "txt2vectorgraphics" script. No need for both



