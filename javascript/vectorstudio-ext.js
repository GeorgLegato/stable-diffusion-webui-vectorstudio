const VS_IFRAME_NAME = "vectorstudio-iframe"
let svgE
const VS_SCRIPTLIST_NAME = "Vector Studio"

function vectorstudio_send_image(dataURL, name = "Embed Resource") {
	svgE = gradioApp().querySelector("#" + VS_IFRAME_NAME).contentWindow.svgEditor
	svgE.loadFromURL(dataURL)
}


function vectorstudio_gototab(tabname = "Vector Studio", tabsId = "tabs", focusElement) {
	Array.from(
		gradioApp().querySelectorAll(`#${tabsId} > div:first-child button`)
	).forEach((button) => {
		if (button.textContent.trim() === tabname) {
			button.click();
		}
	});
	if (focusElement) {
		setTimeout(() => {
			focusElement.scrollIntoView()
		}, 500);
	}
}


async function vectorstudio_get_image_from_gallery() {

	const curGal = gradioApp().querySelector('#tabs button.selected').innerText // get_uiCurrentTab() is currently buggy
	const buttons = gradioApp().querySelectorAll("#" + curGal + "_gallery .grid-container button")
	let button = gradioApp().querySelector("#" + curGal + "_gallery .grid-container button.selected")

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

async function vectorstudio_controlnet_send(toTab, controlnetNum) {
	svgE = gradioApp().querySelector("#" + VS_IFRAME_NAME).contentWindow.svgEditor

	var svgCode = svgE.svgCanvas.getSvgString();
	var dataUrl = "data:image/svg+xml;base64," + btoa(svgCode);

	const blob = await (await fetch(dataUrl)).blob()
	const dt = new DataTransfer()
	dt.items.add(new File([blob], "ImageBrowser.png", { type: blob.type }))

	const container = gradioApp().querySelector(toTab === "txt2img" ? "#txt2img_script_container" : "#img2img_script_container")

	const accordion = container.querySelector("#controlnet .label-wrap")
	if (!accordion.classList.contains("open")) accordion.click()  // on first time no DOM there!

	const tab = gradioApp().querySelectorAll("#tab_" + toTab + " #controlnet .tab-nav button")[controlnetNum]
	if (!tab) {
		// come back after click() has created the DOM 
		setTimeout(() => {
			vectorstudio_controlnet_send(toTab, controlnetNum)
		}, 1000)
		return
	}

	if (!tab.classList.contains("selected")) tab.click()

	const input = gradioApp().querySelectorAll("#tab_" + toTab + " #controlnet input[type='file']")[controlnetNum]
	/*  try {
			a click seems not to be neccessary 
			input.parentElement.click()
		} catch (e) {}
	*/

	input.value = ""
	input.files = dt.files
	input.dispatchEvent(new Event("change", { bubbles: true, composed: true }))

	// switch to txt2/img2img and scroll to controlnet-tab
	vectorstudio_gototab(toTab, "tabs", tab)
}

function vectorstudio_controlnet_send_txt2img(controlnetNum) {
	vectorstudio_controlnet_send("txt2img", controlnetNum)
}

function vectorstudio_controlnet_send_img2img(controlnetNum) {
	vectorstudio_controlnet_send("img2img", controlnetNum)
}


let vs_bg_count = 0
const vs_bg_max = 3
const vs_bg_class_pre = "vs_svg_bg_"

function vectorstudio_cycle_svg_bg() {
	allsvgs = gradioApp().querySelectorAll('img[src$=".svg"], img[src^="data:image/svg"]')
	if (allsvgs) {

		const newClass = vs_bg_class_pre + "" + vs_bg_count
		vs_bg_count += 1
		vs_bg_count %= vs_bg_max + 1

		allsvgs.forEach(s => {
			s.classList.forEach(cle => {
				if (cle.startsWith(vs_bg_class_pre)) {
					s.classList.remove(cle)
				}
			});
			s.classList.add(newClass)
		});
	}
}





/* need to be in iframe-html*/
document.addEventListener("DOMContentLoaded", () => {
	const onload = () => {
		if (gradioApp) {

			// Select the node that will be observed for mutations
			let targetNodeTxt = getVSScriptEntry("txt")
			let targetNodeImg = getVSScriptEntry("img")

			if (targetNodeTxt && targetNodeImg) {

				// Options for the observer (which mutations to observe)
				const config = { attributes: true, childList: false, subtree: false };

				// Callback function to execute when mutations are observed
				const callback = function (mutationsList, observer) {
					// Look through all mutations that just occured
					for (let mutation of mutationsList) {
						// If the mutation was a childList mutation
						if (mutation.type === 'attributes') {
							const toHide = (mutation.target.classList.contains('hidden'))
							const txtToolbox = gradioApp().querySelector("#txt2img_results #VectorStudio_ToolBox");
							const imgToolbox = gradioApp().querySelector("#img2img_results #VectorStudio_ToolBox");
							txtToolbox.style.display = !targetNodeTxt.classList.contains('hidden') ? "flex" : "none"
							imgToolbox.style.display = !targetNodeImg.classList.contains('hidden') ? "flex" : "none"

						}
					}
					observer.observe(targetNodeTxt, config);
					observer.observe(targetNodeImg, config);
				};

				// Create an observer instance linked to the callback function
				const observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(targetNodeTxt, config);
				observer.observe(targetNodeImg, config);
			}
			else {
				setTimeout(onload, 3000);
			}
		}
		else {
			setTimeout(onload, 3000);
		}

		function getVSScriptEntry(pre) {
			const q = "#"+pre+"2img_script_container"
			if (!gradioApp().querySelector(q)) return null

			let matchingDivs = Array.from(document.querySelectorAll(q+' div.gradio-group')).filter((div) => {
				let labelWrapSpan = div.querySelector('.label-wrap span')
				return labelWrapSpan && labelWrapSpan.textContent === VS_SCRIPTLIST_NAME
			})

			let targetNode = matchingDivs ? matchingDivs[0] : null
			return targetNode
		}
	};

	onload();

});



/*
st2i = gradioApp().querySelector("#txt2img_script_container")
si2i = gradioApp().querySelector("#img2img_script_container")
if (st2i && si2i) {
	const txtToolbox = gradioApp().querySelector("#txt2img_results #VectorStudio_ToolBox");
	const imgToolbox = gradioApp().querySelector("#img2img_results #VectorStudio_ToolBox");
	//  display the Toolboxes (sendto etc) only when the script is selected 
	st2i.addEventListener("DOMCharacterDataModified", () => {
		txtToolbox.style.display = st2i.innerText == VS_SCRIPTLIST_NAME ? "flex" : "none"
	})
	si2i.addEventListener("DOMCharacterDataModified", () => {
		imgToolbox.style.display = si2i.innerText == VS_SCRIPTLIST_NAME ? "flex" : "none"
	})
*/