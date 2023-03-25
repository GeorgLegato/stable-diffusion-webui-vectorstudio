const VS_IFRAME_NAME = "vectorstudio-iframe"
let svgE

function vectorstudio_send_image(dataURL, name = "Embed Resource") {
	svgE = gradioApp().querySelector("#" + VS_IFRAME_NAME).contentWindow.svgEditor
	svgE.loadFromURL(dataURL)
}


function vectorstudio_gototab(tabname = "Vector Studio", tabsId = "tabs") {
	Array.from(
		gradioApp().querySelectorAll(`#${tabsId} > div:first-child button`)
	).forEach((button) => {
		if (button.textContent.trim() === tabname) {
			button.click();
		}
	});
}


async function vectorstudio_get_image_from_gallery() {
	var buttons = gradioApp().querySelectorAll(
		'[style="display: block;"].tabitem div[id$=_gallery] .gallery-item'
	);
	var button = gradioApp().querySelector(
		'[style="display: block;"].tabitem div[id$=_gallery] .gallery-item.\\!ring-2'
	);

	if (!button) button = buttons[0];

	if (!button)
		throw new Error("[vectorstudio] No svg available in the gallery");

	/* only use file url, not data url 
	
	const canvas = document.createElement("canvas");
		const image = document.createElement("img");
		image.src = button.querySelector("img").src;
	
	
		await image.decode();
	
		canvas.width = image.width;
		canvas.height = image.height;
	
		canvas.getContext("2d").drawImage(image, 0, 0);
	
		return canvas.toDataURL();
		*/
	return button.querySelector("img").src
}

function vectorstudio_send_gallery(name = "Embed Resource") {
	return async () => {
		vectorstudio_get_image_from_gallery()
			.then((dataURL) => {
				// Send to panorama-viewer
				console.info("[vectorstudio] Using URL: " + dataURL)
				// Change Tab
				vectorstudio_gototab();
				vectorstudio_send_image(dataURL, name);

			})
			.catch((error) => {
				console.warn("[vectorstudio] No SVG selected.");
			});
	}
}

async function image_browser_controlnet_send(toTab, controlnetNum) {
	svgE = gradioApp().querySelector("#" + VS_IFRAME_NAME).contentWindow.svgEditor

	var svgCode = svgE.svgCanvas.getSvgString();
	var dataUrl = "data:image/svg+xml;base64," + btoa(svgCode);

    const blob = await (await fetch(dataUrl)).blob()
    const dt = new DataTransfer()
    dt.items.add(new File([blob], "ImageBrowser.png", { type: blob.type }))
    const container = gradioApp().querySelector(
        toTab === "txt2img" ? "#txt2img_script_container" : "#img2img_script_container"
    )
    const accordion = container.querySelector("#controlnet .transition")
    if (accordion.classList.contains("rotate-90")) accordion.click()

    const tab = container.querySelectorAll(
        "#controlnet > div:nth-child(2) > .tabs > .tabitem, #controlnet > div:nth-child(2) > div:not(.tabs)"
    )[controlnetNum]
    if (tab.classList.contains("tabitem"))
        tab.parentElement.firstElementChild.querySelector(`:nth-child(${Number(controlnetNum) + 1})`).click()

    const input = tab.querySelector("input[type='file']")
    try {
        input.previousElementSibling.previousElementSibling.querySelector("button[aria-label='Clear']").click()
    } catch (e) {}

    input.value = ""
    input.files = dt.files
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }))

    image_browser_gototab(toTab)
}

function image_browser_controlnet_send_txt2img(controlnetNum) {
    image_browser_controlnet_send("txt2img", controlnetNum)
}
  
function image_browser_controlnet_send_img2img(controlnetNum) {
    image_browser_controlnet_send("img2img", controlnetNum)
}


/* need to be in iframe-html
document.addEventListener("DOMContentLoaded", () => {
	const onload = () => {
		if (gradioApp) {

			vs-frame = gradioApp().querySelector("#" + VS_IFRAME_NAME).contentWindow.svgEditor
			if (!Editor) {
				setTimeout(onload, 10);
				return
			}
			// change layout: bottom color swatches to top.
			TOP = document.getElementById("tools_top")
			BOTTOM = document.getElementById("tools_bottom")
			TOP.appendChild(BOTTOM)
		}
		else {
			setTimeout(onload, 3);
		}
	};
	onload();
});
*/



