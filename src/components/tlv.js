const TLV_TYPE_END = 0;
const TLV_TYPE_STRING = 1;
const TLV_TYPE_ARRAY = 2;
const TLV_TYPE_OBJECT = 3;
const TLV_TYPE_BUFFER = 4;
const TLV_TYPE_NULL = 5;
const TLV_TYPE_INT = 6;
const TLV_TYPE_FLOAT = 7;
const TLV_TYPE_BOOL = 8;
const TLV_TYPE_UNDEFINED = 9;

function memorySizeOf(obj) {
  let bytes = 0;
  function sizeOf(obj) {
    if (obj === null || obj === undefined) {
      bytes += 2;
    } else {
      switch (typeof obj) {
        case "number":
          bytes += 8 + 6;
          break;
        case "string":
          bytes += obj.length * 3 + 6;
          break;
        case "boolean":
          bytes += 3;
          break;
        case "object":
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === "Object") {
            for (let key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              sizeOf(key);
              sizeOf(obj[key]);
              bytes += 4;
            }
          } else if (objClass === "Array") {
            for (const element of obj) {
              sizeOf(element);
            }
            bytes += 4;
          } else if (
            objClass === "ArrayBuffer" ||
            objClass === "Uint8Array" ||
            objClass === "Int8Array" ||
            objClass === "Int16Array" ||
            objClass === "Uint16Array" ||
            objClass === "Uint32Array" ||
            objClass === "Int32Array" ||
            objClass === "Float32Array" ||
            objClass === "Float64Array" ||
            objClass === "BigInt64Array" ||
            objClass === "BigUint64Array"
          ) {
            bytes += obj.byteLength + 6;
          } else {
            bytes += obj.toString().length * 2;
          }
          break;
        default:
          console.log(obj);
          throw Error(`Invalid type of object:${typeof obj}`);
      }
    }
    return bytes;
  }
  return sizeOf(obj);
}

function stringToArrayBuffer(str) {
  let bytes = [];
  let len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10ffff) {
      bytes.push(((c >>> 18) & 0x07) | 0xf0);
      bytes.push(((c >>> 12) & 0x3f) | 0x80);
      bytes.push(((c >>> 6) & 0x3f) | 0x80);
      bytes.push((c & 0x3f) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00ffff) {
      bytes.push(((c >>> 12) & 0x0f) | 0xe0);
      bytes.push(((c >>> 6) & 0x3f) | 0x80);
      bytes.push((c & 0x3f) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007ff) {
      bytes.push(((c >>> 6) & 0x1f) | 0xc0);
      bytes.push((c & 0x3f) | 0x80);
    } else {
      bytes.push(c & 0xff);
    }
  }
  return bytes;
}

function utf8ArrayToStr(dv, cursor, len) {
  let out, i, c;
  let char2, char3;

  out = "";
  i = 0;

  let array = new Uint8Array(dv.buffer, cursor.offset, len);
  while (i < len) {
    c = array[i++];
    switch (c >>> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
      default:
        break;
    }
  }
  cursor.offset += len;
  return out;
}

function tlv_parse_length(dv, cursor) {
  let len = dv.getUint8(cursor.offset);
  ++cursor.offset;
  if (len & 0x80) {
    let c = len & 0x7f;
    if (c === 0) {
      /// Nothing to do
    } else if (c === 1) {
      len = dv.getUint8(cursor.offset);
      ++cursor.offset;
    } else if (c === 2) {
      len = dv.getUint16(cursor.offset);
      cursor.offset += 2;
    } else if (c === 4) {
      len = dv.getUint32(cursor.offset);
      cursor.offset += 4;
    } else {
      throw new Error(`Invalid tlv length:${c}`);
    }
  }
  return len;
}

function tlv_endode_length(dv, cursor, len) {
  if (len <= 127) {
    dv.setInt8(cursor.offset, len);
    ++cursor.offset;
  } else if (len > 127 && len <= 255) {
    dv.setInt8(cursor.offset, 0x80 | 0x01);
    ++cursor.offset;
    dv.setUint8(len);
    ++cursor.offset;
  } else if (len > 255 && len <= 65535) {
    dv.setInt8(cursor.offset, 0x80 | 0x02);
    ++cursor.offset;
    dv.setUint16(cursor.offset, len);
    cursor.offset += 2;
  } else {
    dv.setInt8(cursor.offset, 0x80 | 0x04);
    ++cursor.offset;
    dv.setUint32(cursor.offset, len);
    cursor.offset += 4;
  }
}

function tlv_parse_type(dv, cursor) {
  let t = dv.getInt8(cursor.offset);
  ++cursor.offset;
  return t;
}

function tlv_parse_int(dv, cursor) {
  let val = 0;
  let len = tlv_parse_length(dv, cursor);
  if (len === 1) {
    val = dv.getUint8(cursor.offset);
  } else if (len === 2) {
    val = dv.getUint16(cursor.offset);
  } else if (len === 4) {
    val = dv.getUint32(cursor.offset);
  } else if (len === 8) {
    val = dv.getFloat64(cursor.offset);
  } else {
    throw new Error(`Read tlv int, but size is:${len}`);
  }
  cursor.offset += len;
  return val;
}

function tlv_parse_float(dv, cursor) {
  let val = 0.0;
  let len = tlv_parse_length(dv, cursor);
  if (len === 4) {
    val = dv.getFloat32(cursor.offset);
  } else if (len === 8) {
    val = dv.getFloat64(cursor.offset);
  } else {
    throw new Error(`Read tlv float, but size is:${len}`);
  }
  cursor.offset += len;
  return val;
}

function tlv_parse_string(dv, cursor) {
  let len = tlv_parse_length(dv, cursor);
  return utf8ArrayToStr(dv, cursor, len);
}

function tlv_parse_buffer(dv, cursor) {
  let len = tlv_parse_length(dv, cursor);
  let buf = new Uint8Array(dv.buffer, cursor.offset, len);
  cursor.offset += len;
  return buf;
}

function tlv_parse_bool(dv, cursor) {
  let val = false;
  let len = tlv_parse_length(dv, cursor);
  if (len !== 1) {
    throw Error(`Parse tlv bool, but length:${len}`);
  }
  val = dv.getInt8(cursor.offset) === 1 ? true : false;
  ++cursor.offset;
  return val;
}

function tlv_parse_null(dv, cursor) {
  let val = null;
  let len = tlv_parse_length(dv, cursor);
  if (len !== 0) {
    throw Error(`Parse tlv null, but length:${len}`);
  }
  return val;
}

function tlv_parse_undefined(dv, cursor) {
  let val = undefined;
  let len = tlv_parse_length(dv, cursor);
  if (len !== 0) {
    throw Error(`Parse tlv undefined, but length:${len}`);
  }
  return val;
}

function tlv_parse_value(dv, cursor, tlv_type) {
  let val = undefined;
  switch (tlv_type) {
    case TLV_TYPE_NULL:
      val = tlv_parse_null(dv, cursor);
      break;
    case TLV_TYPE_BOOL:
      val = tlv_parse_bool(dv, cursor);
      break;
    case TLV_TYPE_STRING:
      val = tlv_parse_string(dv, cursor);
      break;
    case TLV_TYPE_INT:
      val = tlv_parse_int(dv, cursor);
      break;
    case TLV_TYPE_FLOAT:
      val = tlv_parse_float(dv, cursor);
      break;
    case TLV_TYPE_BUFFER:
      val = tlv_parse_buffer(dv, cursor);
      break;
    case TLV_TYPE_ARRAY:
      val = tlv_parse_array(dv, cursor);
      break;
    case TLV_TYPE_OBJECT:
      val = tlv_parse_object(dv, cursor);
      break;
    case TLV_TYPE_UNDEFINED:
      val = tlv_parse_undefined(dv, cursor);
      break;
    default:
      break;
  }
  return val;
}

function tlv_parse_object(dv, cursor) {
  let obj = {};
  let len = tlv_parse_length(dv, cursor);
  if (len !== 0x80) {
    throw Error("Parse object but length not 0x80!");
  }
  while (1) {
    /// name
    let t = tlv_parse_type(dv, cursor);
    if (t === TLV_TYPE_END) {
      if (tlv_parse_length(dv, cursor) === 0) {
        /// object end
        break;
      } else {
        throw Error("Parse object, type end, but length not 0!");
      }
    }
    if (t !== TLV_TYPE_STRING) {
      throw new Error(`Parse name, but type is ${t}`);
    }
    let name = tlv_parse_string(dv, cursor);
    /// value
    t = tlv_parse_type(dv, cursor);
    obj[name] = tlv_parse_value(dv, cursor, t);
  }
  return obj;
}

function tlv_parse_array(dv, cursor) {
  let arr = [];
  let len = tlv_parse_length(dv, cursor);
  if (len !== 0x80) {
    throw Error("Parse array but length not 0x80!");
  }
  while (1) {
    /// value
    let t = dv.getInt8(cursor.offset);
    if (t === TLV_TYPE_END) {
      if (tlv_parse_length(dv, cursor) === 0) {
        /// array end
        break;
      } else {
        throw Error("Parse array, type end, but length not 0!");
      }
    }
    let val = tlv_parse_value(dv, cursor, t);
    arr.push(val);
  }
  return arr;
}

function tlv_encode_string(dv, cursor, val) {
  dv.setUint8(cursor.offset, TLV_TYPE_STRING);
  ++cursor.offset;
  let arrBytes = stringToArrayBuffer(val);
  tlv_endode_length(dv, cursor, arrBytes.length);
  /// Copy to array buffer of data view
  for (let i in arrBytes) {
    dv.setInt8(cursor.offset, arrBytes[i]);
    ++cursor.offset;
  }
}

function tlv_encode_null(dv, cursor) {
  dv.setInt8(cursor.offset, TLV_TYPE_NULL);
  ++cursor.offset;
  dv.setInt8(cursor.offset, 0);
  ++cursor.offset;
}

function tlv_encode_undefined(dv, cursor) {
  dv.setInt8(cursor.offset, TLV_TYPE_UNDEFINED);
  ++cursor.offset;
  dv.setInt8(cursor.offset, 0);
  ++cursor.offset;
}

function tlv_encode_variant_end(dv, cursor) {
  dv.setInt8(cursor.offset, TLV_TYPE_END);
  ++cursor.offset;
  dv.setInt8(cursor.offset, 0);
  ++cursor.offset;
}

function tlv_encode_bool(dv, cursor, val) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_BOOL);
  ++cursor.offset;
  /// Length of TLV
  dv.setInt8(cursor.offset, 1);
  ++cursor.offset;
  /// Value of TLV
  dv.setInt8(cursor.offset, val ? 1 : 0);
  ++cursor.offset;
}

function tlv_encode_int(dv, cursor, val) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_INT);
  ++cursor.offset;
  let loffset = cursor.offset;
  let lsize = 0;
  ++cursor.offset;
  if (val <= 0xff) {
    dv.setUint8(cursor.offset, val);
    ++cursor.offset;
    lsize = 1;
  } else if (val > 0xff && val <= 0xffff) {
    dv.setUint16(val);
    cursor.offset += 2;
    lsize = 2;
  } else if (val > 0xffff && val <= 0xffffffff) {
    dv.setUint32(cursor.offset, val);
    cursor.offset += 4;
    lsize = 4;
  } else {
    dv.setFloat64(cursor.offset, val);
    cursor.offset += 8;
    lsize = 8;
  }
  /// Length of TLV
  dv.setInt8(loffset, lsize);
}

function tlv_encode_float(dv, cursor, val) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_FLOAT);
  ++cursor.offset;
  /// Length of TLV
  dv.setInt8(cursor.offset, 4);
  ++cursor.offset;
  /// Value of TLV
  dv.setFloat32(cursor.offset, Math.fround(val));
  cursor.offset += 4;
}

function tlv_encode_buffer(dv, cursor, val) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_BUFFER);
  ++cursor.offset;
  /// Length of TLV
  let len = val.byteLength;
  tlv_endode_length(dv, cursor, len);
  /// Copy arraybuffer to buffer of dv
  new Uint8Array(dv.buffer, cursor.offset, len).set(
    new Uint8Array(val instanceof ArrayBuffer ? val : val.buffer)
  );
  cursor.offset += len;
}

function tlv_encode_value(dv, cursor, val) {
  if (val === null) {
    tlv_encode_null(dv, cursor);
  } else if (typeof val === undefined) {
    tlv_encode_undefined(dv, cursor);
  } else if (typeof val === "boolean") {
    tlv_encode_bool(dv, cursor, val);
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      tlv_encode_int(dv, cursor, val);
    } else {
      tlv_encode_float(dv, cursor, val);
    }
  } else if (typeof val === "string") {
    tlv_encode_string(dv, cursor, val);
  } else if (typeof val === "object") {
    let classObject = Object.prototype.toString.call(val).slice(8, -1);
    if (classObject === "Object") {
      tlv_encode_object(dv, cursor, val);
    } else if (classObject === "Array") {
      tlv_encode_array(dv, cursor, val);
    } else if (
      classObject === "ArrayBuffer" ||
      classObject === "Uint8Array" ||
      classObject === "Int8Array" ||
      classObject === "Uint16Array" ||
      classObject === "Int16Array" ||
      classObject === "Uint32Array" ||
      classObject === "Int32Array" ||
      classObject === "Float32Array" ||
      classObject === "Float64Array" ||
      classObject === "BigUint64Array" ||
      classObject === "BigInt64Array"
    ) {
      tlv_encode_buffer(dv, cursor, val);
    } else {
      console.log(`No processing data type:${classObject}`);
    }
  } else {
    /// Nothing to do
    console.log(`No processing data type:${typeof val}`);
  }
}

function tlv_encode_array(dv, cursor, val) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_ARRAY);
  ++cursor.offset;
  /// Variant length
  dv.setUint8(cursor.offset, 0x80);
  ++cursor.offset;
  val.forEach((element) => {
    tlv_encode_value(dv, cursor, element);
  });
  tlv_encode_variant_end(dv, cursor);
}

function tlv_encode_object(dv, cursor, obj) {
  /// Type of TLV
  dv.setInt8(cursor.offset, TLV_TYPE_OBJECT);
  ++cursor.offset;
  /// Variant length
  dv.setUint8(cursor.offset, 0x80);
  ++cursor.offset;
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    console.log(`encode key:${key} value:${obj[key]}`);
    tlv_encode_string(dv, cursor, key);
    tlv_encode_value(dv, cursor, obj[key]);
  }
  tlv_encode_variant_end(dv, cursor);
}

function tlv_serialize_object(obj) {
  let msize = memorySizeOf(obj);
  console.log(`Serialize object memory size:${msize}`);
  let dv = new DataView(new ArrayBuffer(msize));
  let cursor = { offset: 0 };
  tlv_encode_object(dv, cursor, obj);
  return dv.buffer.slice(0, cursor.offset);
}

function tlv_unserialize_object(data) {
  let dv = new DataView(data);
  let cursor = { offset: 0 };
  let t = dv.getInt8(cursor.offset);
  cursor.offset += 1;
  if (t !== TLV_TYPE_OBJECT) {
    throw Error(`Parse object, but type is:${t}.`);
  }
  return tlv_parse_object(dv, cursor);
}

export { tlv_serialize_object, tlv_unserialize_object };
