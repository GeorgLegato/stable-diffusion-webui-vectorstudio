"""
using POTRACE as backend cmd line tool for vectorizing SD output
This script will download from

https://potrace.sourceforge.net/#downloading

the windows exetuable (todo: mac, linux support)
Potrace is under GPL, you can download the source from the url above.

If you dont want to download that, please install POTRACE to your 
system manually and assign it to your PATH env variable properly.
"""

# not yet
BASE_PROMPT=",(((lineart))),((low detail)),(simple),high contrast,sharp,2 bit"
BASE_NEGPROMPT="(((text))),((color)),(shading),background,noise,dithering,gradient,detailed,out of frame,ugly,error,Illustration, watermark"

BASE_STEPS=40
BASE_SCALE=10

StyleDict = {
    "Illustration":BASE_PROMPT+",(((vector graphic))),medium detail",
    "Logo":BASE_PROMPT+",(((centered vector graphic logo))),negative space,stencil,trending on dribbble",
    "Drawing":BASE_PROMPT+",(((cartoon graphic))),childrens book,lineart,negative space",
    "Artistic":BASE_PROMPT+",(((artistic monochrome painting))),precise lineart,negative space",
    "Tattoo":BASE_PROMPT+",(((tattoo template, ink on paper))),uniform lighting,lineart,negative space",
    "Gothic":BASE_PROMPT+",(((gothic ink on paper))),H.P. Lovecraft,Arthur Rackham",
    "Anime":BASE_PROMPT+",(((clean ink anime illustration))),Studio Ghibli,Makoto Shinkai,Hayao Miyazaki,Audrey Kawasaki",
    "Cartoon":BASE_PROMPT+",(((clean ink funny comic cartoon illustration)))",
    "Sticker":",(Die-cut sticker, kawaii sticker,contrasting background, illustration minimalism, vector, pastel colors)",
    "Gold Pendant": ",gold dia de los muertos pendant, intricate 2d vector geometric, cutout shape pendant, blueprint frame lines sharp edges, svg vector style, product studio shoot",
    "None - prompt only":""
}

##########################################################################

import os
import pathlib
import subprocess
from PIL import Image

from tkinter import Image, image_types
from zipfile import ZipFile
import requests
import glob
import os.path

import modules.scripts as scripts
import modules.images as Images
import gradio as gr

from modules.processing import Processed, process_images
from modules.shared import opts

class Script(scripts.Script):
    def title(self):
        return "Vector Studio"

    def show(self, is_img2img):
        return True # scripts.AlwaysVisible

    def ui(self, is_img2img):
        self.run_callback = False

        with gr.Group():
            with gr.Accordion("Vector Studio", open=False):

                with gr.Row():
                    poUseColor = gr.Radio(list(StyleDict.keys()), label="Visual style", value="Illustration")

                with gr.Row():

                    with gr.Column():
                            with gr.Box():
                                with gr.Group():
                                    with gr.Row():
                                        poDoVector = gr.Checkbox(label="Enable Vectorizing", value=True)
                                        poFormat = gr.Dropdown(["svg","pdf"], label="Output format", value="svg")
                                        poOpaque = gr.Checkbox(label="White is Opaque", value=True)
                                        poTight = gr.Checkbox(label="Cut white margin from input", value=True)
                                    with gr.Row():
                                        poKeepPnm = gr.Checkbox(label="Keep temp images", value=False)
                                        poThreshold = gr.Slider(label="Threshold", minimum=0.0, maximum=1.0, step=0.05, value=0.5)

                    with gr.Column():
                            with gr.Box():
                                with gr.Group():
                                    poTransPNG      = gr.Checkbox(label="Transparent PNG",value=False)
                                    poTransPNGEps   = gr.Slider(label="Noise Tolerance",minimum=0,maximum=128,value=16)
                                    poTransPNGQuant = gr.Slider(label="Quantize",minimum=2,maximum=255,value=16)

                return [poUseColor,poFormat, poOpaque, poTight, poKeepPnm, poThreshold, poTransPNG, poTransPNGEps,poDoVector,poTransPNGQuant]

    def run(self, p, poUseColor, poFormat, poOpaque, poTight, poKeepPnm, poThreshold, poTransPNG, poTransPNGEps,poDoVector, poTransPNGQuant):

        p.do_not_save_grid = True

        # Add the prompt from above
        p.prompt += StyleDict[poUseColor]

        PO_TO_CALL = scripts.basedir() + "\\extensions\\stable-diffusion-webui-vectorstudio\\bin\\potrace.exe"
        proc = process_images(p)
        mixedImages = []

        try:
            # vectorize
            for i,img in enumerate(proc.images[::-1]): 
                if (not hasattr(img,"already_saved_as")) : continue
                fullfn = img.already_saved_as
                fullfnPath = pathlib.Path(fullfn)
                
                fullofpnm =  fullfnPath.with_suffix('.pnm') #for vectorizing

                fullofTPNG = fullfnPath.with_stem(fullfnPath.stem+ "_T")
                fullofTPNG = fullofTPNG.with_suffix('.png')

                fullof = pathlib.Path(fullfn).with_suffix('.'+poFormat)

                mixedImages.append([img,"PNG"])

                # set transparency to PNG, actually not vector feature, but people need it
                if poTransPNG:
                    self.doTransPNG(poTransPNGEps, mixedImages, img, fullofTPNG, poTransPNGQuant)

                if poDoVector:
                    self.doVector(poFormat, poOpaque, poTight, poKeepPnm, poThreshold, PO_TO_CALL, img, fullofpnm, fullof, mixedImages)

        except (Exception):
            raise Exception("TXT2Vectorgraphics: Execution of Potrace failed, check filesystem, permissions, installation or settings (is image saving on?)")

        return Processed(p, mixedImages, p.seed, proc.info)

    def doVector(self, poFormat, poOpaque, poTight, poKeepPnm, poThreshold, PO_TO_CALL, img, fullofpnm, fullof, mixedImages):
        # for vectorizing
        img.save(fullofpnm)
        print (pathlib.Path().resolve())
        args = [PO_TO_CALL,  "-b", poFormat, "-o", fullof, "--blacklevel", format(poThreshold, 'f')]
        if poOpaque: args.append("--opaque")
        if poTight: args.append("--tight")
        args.append(fullofpnm)

        p2 = subprocess.Popen(args)

        if not poKeepPnm:
            p2.wait()
            os.remove(fullofpnm)

        abspathsvg = os.path.abspath(fullof)
        mixedImages.append([abspathsvg,"SVG"]) # img, caption

    def doTransPNG(self, poTransPNGEps, mixedImages, img, fullofTPNG, poTransPNGQuant):
        #Image.quantize(colors=256, method=None, kmeans=0, palette=None)
        imgQ = img.quantize(colors=poTransPNGQuant, kmeans=0, palette=None)
        histo = imgQ.histogram()

        # get first pixel and assume it is background, best with Sticker style
        if (imgQ):
            bgI = imgQ.getpixel((0,0)) # return pal index
            bg = list(imgQ.palette.colors.keys())[bgI]

        E = poTransPNGEps # tolerance range if noisy

        imgT=imgQ.convert('RGBA')
        datas = imgT.getdata()
        newData = []
        for item in datas:
            if (item[0] > bg[0]-E and item[0] < bg[0]+E) and (item[1] > bg[1]-E and item[1] < bg[1]+E) and (item[2] > bg[2]-E and item[1] < bg[2]+E):
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        imgT.putdata(newData)
        imgT.save(fullofTPNG)
        mixedImages.append([imgQ,"PNG-quantized"])
        mixedImages.append([imgT,"PNG-transparent"])
