function vectorstudio_send_image(dataURL, name = "Embed Resource") {
	svgE = gradioApp().querySelector("#vectorstudio-iframe").contentWindow.svgEditor
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










