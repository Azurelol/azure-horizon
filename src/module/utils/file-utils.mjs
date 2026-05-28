import { StringUtils } from "./_module.mjs";

export default class FileUtils {
  /**
   * @desc Helper for reading string content out of a text file.
   * @param {string} filePath The path to the file.
   * @returns {Promise<string>} The text content read from the file.
   */
  static async readTextFromFile(filePath) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (ev) => {
        resolve(reader.result);
      };
      reader.onerror = (ev) => {
        reader.abort();
        reject();
      };
      reader.readAsText(filePath);
    });
  }

  static async uploadClipboardImage(directory, prefix) {
    let imageItem;

    try {
      const clipboardItems = await navigator.clipboard.read();
      imageItem = clipboardItems.find((item) => item.types.some((type) => type.startsWith("image/")));
    } catch (error) {
      return;
    }

    if (!imageItem) {
      ui.notifications.warn("No image found in clipboard.");
      return;
    }

    const imageType = imageItem.types.find((type) => type.startsWith("image/"));
    const blob = await imageItem.getType(imageType);

    // Preview and confirm
    const objectUrl = URL.createObjectURL(blob);
    const confirm = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: StringUtils.localize("AH.DIALOG.UploadClipboardImage"),
      },
      content: "<img id=\"clipboard-preview\" style=\"max-width:100%; max-height:300px; object-fit:contain;\">",
      render: (event, dialog) => {
        dialog.element.querySelector("#clipboard-preview").src = objectUrl;
      },
      rejectClose: false,
    });
    URL.revokeObjectURL(objectUrl);

    if (!confirm) return;

    const extension = imageType.split("/")[1];
    const filename = `${prefix}-${Date.now()}.${extension}`;
    const file = new File([blob], filename, { type: imageType });

    // eslint-disable-next-line no-undef
    const response = await FilePicker.upload("data", directory, file, {});
    if (!response?.path) {
      ui.notifications.error("Failed to upload clipboard image.");
      return;
    }

    return response.path;
  }
}
