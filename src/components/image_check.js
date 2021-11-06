const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const jpeg_jfif = [0x4a, 0x46, 0x49, 0x46];
const jpeg_exif = [0x45, 0x78, 0x69, 0x66];
const jpegMagic = [0xff, 0xd8, 0xff, 0xe0];
const gifMagic0 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const getGifMagic1 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];

function arraycopy(src, index, dist, distIndex, size) {
  for (let i = 0; i < size; i++) {
    dist[distIndex + i] = src[index + i];
  }
}

function arrayEquals(arr1, arr2) {
  if (arr1 === "undefined" || arr2 === "undefined") {
    return false;
  }
  if (arr1 instanceof Array && arr2 instanceof Array) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function isImage(buf) {
  if (buf == null || buf === "undefined" || buf.length <= 8) {
    return null;
  }
  var bytes = [];
  arraycopy(buf, 0, bytes, 0, 6);
  if (isGif(bytes)) {
    return "image/gif";
  }
  bytes = [];
  arraycopy(buf, 6, bytes, 0, 4);
  if (isJpeg(bytes)) {
    return "image/jpeg";
  }
  bytes = [];
  arraycopy(buf, 0, bytes, 0, 8);
  if (isPng(bytes)) {
    return "image/png";
  }
  return null;
}

/**
 * @param data first 6 bytes of file
 * @return gif image file true,other false
 */
function isGif(data) {
  console.log("GIF");
  return arrayEquals(data, gifMagic0) || arrayEquals(data, getGifMagic1);
}

/**
 * @param data first 4 bytes of file
 * @return jpeg image file true,other false
 */
function isJpeg(data) {
  console.log("JPEG");
  return (
    arrayEquals(data, jpegMagic) ||
    arrayEquals(data, jpeg_jfif) ||
    arrayEquals(data, jpeg_exif)
  );
}

/**
 * @param data first 8 bytes of file
 * @return png image file true,other false
 */
function isPng(data) {
  console.log("PNG");
  return arrayEquals(data, pngMagic);
}

export { isImage };
