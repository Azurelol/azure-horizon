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
}
