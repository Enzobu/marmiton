export const maxImageBytes = 5_000_000;
export const maxImageDataUrlLength = 'data:image/jpeg;base64,'.length + 4 * Math.ceil(maxImageBytes / 3);
export const imageUploadBodyLimit = 8 * 1024 * 1024;
