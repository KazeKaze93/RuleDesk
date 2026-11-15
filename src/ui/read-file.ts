const READ_ERROR = "Could not read file";

/** Text of a file the user picked. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error(READ_ERROR));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(READ_ERROR));
    };
    reader.readAsText(file);
  });
}
