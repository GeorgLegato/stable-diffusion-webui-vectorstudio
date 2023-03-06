import launch
import os
from sys import platform
import json

PO_URL     = "https://potrace.sourceforge.net/download/1.16/potrace-1.16.win64.zip"
PO_ZIP     = "potrace.zip"
PO_ZIP_EXE = "potrace-1.16.win64/potrace.exe"
PO_EXE     = "bin/potrace.exe"


def check_Potrace_install(self) -> str:
        # For Linux, run potrace from installed binary
        if platform == "darwin":
            try:
                # check whether already in PATH 
                checkPath = subprocess.Popen(["potrace","-v"])
                checkPath.wait()
                return "potrace"
            except (Exception):
                raise Exception("Cannot find installed Protrace on Mac. Please run `brew install potrace`")

        elif platform == "linux"or platform == "linux2":
            try:
                # check whether already in PATH 
                checkPath = subprocess.Popen(["potrace","-v"])
                checkPath.wait()
                return "potrace"
            except (Exception):
                raise Exception("Cannot find installed Potrace. Please run `sudo apt install potrace`")

        # prefer local potrace over that from PATH
        elif platform == "win32":
            if not os.path.exists(PO_EXE):
                try:
                    # check whether already in PATH 
                    checkPath = subprocess.Popen(["potrace","-v"])
                    checkPath.wait()
                    return "potrace"

                except (Exception):
                    try:
                        # try to download Potrace and unzip locally into "scripts"
                        if not os.path.exists(PO_ZIP):
                            r = requests.get(PO_URL)
                            with open(PO_ZIP, 'wb') as f:
                                f.write(r.content) 

                        with ZipFile(PO_ZIP, 'r') as zipObj:
                            exe = zipObj.read(PO_ZIP_EXE)
                            with open(PO_EXE,"wb") as e:
                                e.write(exe)
                                zipObj.close()
                                os.remove(PO_ZIP)
                    except:
                        raise Exception("Cannot find and or download/extract Potrace. Provide Potrace in script folder. ")
        return PO_EXE

req_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), "requirements.txt")
reqs = json.load(open(req_file))

#for i in data['emp_details']:
#    print(i)

"""
with open(req_file) as file:
    for lib in file:
        lib = lib.strip()
        if not launch.is_installed(lib):
            launch.run_pip(f"install {lib}", f"sd-webui-vector-studio requirement: {lib}")
"""


