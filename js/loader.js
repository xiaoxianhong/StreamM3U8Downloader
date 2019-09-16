/*
 *  This file is part of Stream Recorder <https://www.hlsloader.com/>
 */

'use strict';
(function(globals) {
  const CMD_FETCH = "cmd_fetch";
  const CMD_MODIFY_HEADERS = "cmd_modify_headers";
  const CMD_WATCH_HEADERS = "cmd_watch_headers";
  Object.assign(globals, {LM_Get, LM_Get_X, LM_Head, LM_ModifyRequest, LM_WatchRequest});
  const WebExtensions = navigator.userAgent.includes("Chrome") ? chrome : browser;
  const isFirefox = navigator.userAgent.includes("Firefox");
  const isEdge = false;
  const SIGNATURE = "loadmonkey";
  function LM_Get(params) {
    let {url, method, headers, resultType, timeout} = params;
    return new Promise(function(resolve, reject) {
      url = createValidUrl(url);
      const init = {method:method ? method : "GET", mode:"cors", credentials:"include"};
      const customHeaders = createCustomHeaders(headers);
      if (customHeaders) {
        init.headers = customHeaders;
      }
      if (timeout) {
        setTimeout(() => {
          reject({status:408});
        }, timeout);
      }
      fetch(url, init).then((response) => {
        if (!response.ok) {
          return reject({status:response.status});
        }
        if (method === "HEAD") {
          const h = {};
          for (const pair of response.headers.entries()) {
            h[pair[0]] = pair[1];
          }
          return h;
        } else {
          return response[resultType || "text"]();
        }
      }).then((response) => {
        resolve(response);
      }).catch((error) => {
        reject({status:-1, error});
      });
    });
  }
  function LM_Get_X(params) {
    return new Promise(function(resolve, reject) {
      let {url, method, headers, resultType} = params;
      url = createValidUrl(url);
      ModifyRequestHeaders(url, headers);
      WebExtensions.runtime.sendMessage({cmd:CMD_FETCH, params}, function(response) {
        resolve(response);
      });
    });
  }
  function LM_Head(params) {
    let {url, method, headers} = params;
    return new Promise(function(resolve, reject) {
      url = createValidUrl(url);
      headers = createValidHeaders(headers);
      if (method === "HEAD") {
        method = "GET";
      }
      ModifyRequestHeaders(url, headers, resolve);
      const init = {method:method ? method : "GET", mode:"cors", credentials:"include"};
      fetch(url, init).then(function(response) {
        response.body.cancel();
      }).catch(function(error) {
        reject();
      });
    });
  }
  function LM_ModifyRequest(params) {
    const {url, headers} = params;
    ModifyRequestHeaders(url, headers);
  }
  function LM_WatchRequest(params) {
    const {targetString, targetHeader, frameId} = params;
    return new Promise(function(resolve, reject) {
      WebExtensions.runtime.sendMessage({cmd:CMD_WATCH_HEADERS, params:{targetString, targetHeader, frameId}}, function(response) {
        resolve(response);
      });
    });
  }
  function ModifyRequestHeaders(url, headers) {
    if (url && headers) {
      WebExtensions.runtime.sendMessage({cmd:CMD_MODIFY_HEADERS, params:{url, headers}});
    }
  }
  function createValidUrl(url) {
    if (url.startsWith("//")) {
      url = location.protocol + url;
    }
    return url;
  }
  function createValidHeaders(headers) {
    if (isFirefox) {
      if (!headers) {
        headers = {};
      }
      if (headers["Referer"] === undefined && headers["referer"] === undefined) {
        headers["Referer"] = location.href;
      }
      return headers;
    } else {
      return headers;
    }
  }
})(this);
const BoxProps = {isom:{container:true}, ftyp:{struct:[["majorBrand", "text", 4], ["minorVersion", "int", 4], ["compatibleBrands", ["text", 4], "end"]]}, moov:{container:true}, mvhd:{struct:[["version", "int", 1], ["flags", "int", 3], ["creationTime", "int", 4, "or", 8], ["modificationTime", "int", 4, "or", 8], ["timeScale", "int", 4], ["duration", "int", 4, "or", 8], ["rate", "int", 4], ["volume", "int", 2], ["reserved", "skip", 10], ["matrix", ["int", 4], 9], ["preDefined", "skip", 24], ["nextTrackID", 
"int", 4]]}, mvex:{container:true}, mehd:{struct:[["version", "int", 1], ["flags", "int", 3], ["fragmentDuration", "int", 4, "or", 8]]}, trex:{struct:[["version", "int", 1], ["flags", "int", 3], ["trackID", "int", 4], ["sampleDescriptionIndex", "int", 4], ["sampleDuration", "int", 4], ["sampleSize", "int", 4], ["sampleFlags", "int", 4]]}, trep:{struct:[["version", "int", 1], ["flags", "int", 3], ["trackID", "int", 4]]}, iods:{}, trak:{container:true}, tkhd:{struct:[["version", "int", 1], ["flags", 
"int", 3], ["creationTime", "int", 4, "or", 8], ["modificationTime", "int", 4, "or", 8], ["trackID", "int", 4], ["reserved1", "int", 4], ["duration", "int", 4, "or", 8], ["reserved2", "skip", 8], ["layer", "int", 2], ["alternateGroup", "int", 2], ["volume", "int", 2], ["reserved3", "int", 2], ["matrix", ["int", 4], 9], ["width", "int", 4], ["height", "int", 4]]}, edts:{container:true}, elst:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entries", [["segmentDuration", 
"int", 4, "or", 8], ["mediaTime", "int", 4, "or", 8], ["mediaRateInteger", "int", 2], ["mediaRateFraction", "int", 2]], "entryCount"]]}, mdia:{container:true}, mdhd:{struct:[["version", "int", 1], ["flags", "int", 3], ["creationTime", "int", 4, "or", 8], ["modificationTime", "int", 4, "or", 8], ["timeScale", "int", 4], ["duration", "int", 4, "or", 8], ["languageValues", "int", 2], ["QTQuality", "int", 2]]}, hdlr:{struct:[["version", "int", 1], ["flags", "int", 3], ["preDefined", "int", 4], ["handlerType", 
"text", 4], ["reserved", "skip", 12], ["name", "text", 0]]}, minf:{container:true}, vmhd:{}, dinf:{container:true}, dref:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entrySize", "int", 4], ["typeText", "text", 4], ["entryVersion", "int", 1], ["entryFlags", "int", 3]]}, stbl:{container:true}, stsd:{}, stts:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entries", [["sampleCount", "int", 4], ["sampleDuration", "int", 4]], "entryCount"]]}, 
stss:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["syncSamples", ["int", 4], "entryCount"]]}, stsz:{struct:[["version", "int", 1], ["flags", "int", 3], ["sampleSize", "int", 4], ["sampleCount", "int", 4], ["sampleSizes", ["int", 4], "sampleCount"]]}, stsc:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entries", [["firstChunk", "int", 4], ["samplesPerChunk", "int", 4], ["sampleDescriptionIndex", "int", 4]], "entryCount"]]}, stco:{struct:[["version", 
"int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["chunkOffsets", ["int", 4], "entryCount"]]}, co64:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["chunkOffsets", ["int", 8], "entryCount"]]}, ctts:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entries", [["sampleCount", "int", 4], ["sampleOffset", "int", 4]], "entryCount"]]}, stdp:{}, sdtp:{struct:[["version", "int", 1], ["flags", "int", 3], ["sampleDependencies", ["int", 
4], "end"]]}, stsh:{}, udta:{container:true}, mdat:{}, sidx:{struct:[["version", "int", 1], ["flags", "int", 3], ["referenceID", "int", 4], ["timeScale", "int", 4], ["earliestPresentationTime", "int", 4, "or", 8], ["firstOffset", "int", 4, "or", 8], ["reserved", "int", 2], ["referenceCount", "int", 2], ["references", [["subsegmentSize", "int", 4], ["subsegmentDuration", "int", 4], ["RAPDeltaTime", "int", 4]], "referenceCount"]]}, smhd:{struct:[["version", "int", 1], ["flags", "int", 3], ["balance", 
"int", 2], ["reserved", "int", 2]]}, moof:{container:true}, mfhd:{struct:[["version", "int", 1], ["flags", "int", 3], ["sequenceNumber", "int", 4]]}, traf:{container:true}, tfhd:{minLength:8, struct:[["version", "int", 1], ["flags", "int", 3], ["trackID", "int", 4], ["baseDataOffset", "int", 8, "if", 1], ["sampleDescriptionIndex", "int", 4, "if", 2], ["defaultSampleDuration", "int", 4, "if", 8], ["defaultSampleSize", "int", 4, "if", 16], ["defaultSampleFlags", "int", 4, "if", 32], ["emptyDuration", 
"int", 4], ["iframeSwitching", "int", 1]]}, tfma:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["segmentDuration", "int", 4, "or", 8], ["mediaTime", "int", 4, "or", 8], ["mediaRateInteger", "int", 2], ["mediaRateFraction", "int", 2]]}, tfdt:{struct:[["version", "int", 1], ["flags", "int", 3], ["baseMediaDecodeTime", "int", 4, "or", 8]]}, trun:{struct:[["version", "int", 1], ["flags", "int", 3], ["sampleCount", "int", 4], ["dataOffset", "int", 4, "if", 1], ["firstSampleFlags", 
"int", 4, "if", 4], ["samples", [["duration", "int", 4, "if", 256], ["size", "int", 4, "if", 512], ["flags", "int", 4, "if", 1024], ["compositionTimeOffset", "int", 4, "if", 2048]], "sampleCount"]]}, mfra:{container:true}, tfra:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["chunkOffsets", ["int", 4], "entryCount"]]}, mfro:{struct:[["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["chunkOffsets", ["int", 4], "entryCount"]]}};
const SIZE = 0, READ = 1, WRITE = 2;
class Box {
  constructor(boxInfo, parent, offset) {
    if (!boxInfo) {
      throw new Error("usage : new Box( boxInfo , parent , offset ) or new Box( type )");
    }
    if (typeof boxInfo === "string") {
      this.property = BoxProps[boxInfo];
      if (!this.property) {
        throw new Error("not supported type : " + boxInfo);
      }
      this.boxInfo = {type:boxInfo, container:this.property.container};
    } else {
      if (!boxInfo.type) {
        throw new Error("Need boxInfo.type");
      }
      this.boxInfo = boxInfo;
      this.property = BoxProps[boxInfo.type];
    }
    this.type = this.boxInfo.type;
    this.container = this.boxInfo.container || this.property && this.property.container || false;
    this.setData(new Uint8Array(0), 0);
    this.offset = offset !== null && offset > 0 ? offset : 0;
    this.id = null;
    this.parent = parent;
    this.children = [];
    if (this.parent) {
      this.parent.appendChild(this);
    }
    this.wholeSize = 0;
  }
  setData(d, wholeSize) {
    this.data = d;
    this.buffer = new SimpleView(d);
    if (wholeSize) {
      this.wholeSize = wholeSize;
    }
  }
  setDataAndSync(d, wholeSize) {
    this.setData(d, wholeSize);
    this.sync(READ);
  }
  size() {
    if (this.container) {
      return this.type === "isom" ? 0 : 8;
    } else {
      return this.wholeSize || this.data && this.data.length;
    }
  }
  sync(mode) {
    const struct = this.property && this.property.struct || this.boxInfo.struct;
    const minLength = this.property && this.property.minLength || this.boxInfo.minLength;
    if (!struct) {
      return 0;
    }
    if (mode !== SIZE && mode !== READ && mode !== WRITE) {
      return 0;
    }
    if (mode !== SIZE) {
      if (this.buffer.data.length < 8) {
        return 0;
      }
      this.buffer.setPos(8);
    }
    const r = this.recursiveProc({mode, struct, minLength}, this, 0) + 8;
    return r;
  }
  calcLength(vlength, unitLength, properties) {
    const lengthType = typeof vlength;
    unitLength = unitLength > 0 ? unitLength : 1;
    if (lengthType == "number") {
      return vlength;
    } else {
      if (lengthType == "string") {
        if (vlength == "end") {
          return Math.floor((this.size() - this.buffer.getPos()) / unitLength);
        } else {
          const prop = vlength.match(/(\w+)([\-\+\*\/\d]*)/);
          let len = this[prop[1]] || 0;
          const op = prop[2] && prop[2][0];
          if (op) {
            const n = Number(prop[2].substr(1));
            if (op === "-") {
              len -= n;
            }
            if (op === "+") {
              len += n;
            }
            if (op === "*") {
              len *= n;
            }
            if (op === "/") {
              len /= n;
            }
          }
          return len;
        }
      }
    }
    return 0;
  }
  recursiveProc(option, target, depth) {
    const {mode, struct, minLength} = option;
    let _size = 0;
    for (let i = 0, len = struct.length; i < len; i++) {
      const vname = struct[i][0];
      const vtype = struct[i][1];
      let vlength = struct[i][2];
      const vcondition = struct[i][3];
      const voption = struct[i][4];
      if (vcondition !== null) {
        if (this.version && this.version > 0 && vcondition === "or") {
          vlength = voption;
        }
        if (this.flags && vcondition === "if" && (this.flags & voption) === 0) {
          continue;
        }
      }
      if (mode === READ && !this.buffer.ready()) {
        break;
      }
      if (mode === WRITE && target[vname] === (null || undefined)) {
        break;
      }
      if (mode === SIZE && minLength && (minLength <= _size && target[vname] === (null || undefined))) {
        break;
      }
      if (vtype === "int") {
        if (vlength === 1) {
          if (mode === READ) {
            target[vname] = this.buffer.read8();
          } else {
            if (mode === WRITE) {
              this.buffer.write8(target[vname]);
            }
          }
          _size += 1;
        } else {
          if (vlength === 2) {
            if (mode === READ) {
              target[vname] = this.buffer.read16();
            } else {
              if (mode === WRITE) {
                this.buffer.write16(target[vname]);
              }
            }
            _size += 2;
          } else {
            if (vlength === 3) {
              if (mode === READ) {
                target[vname] = this.buffer.read24();
              } else {
                if (mode === WRITE) {
                  this.buffer.write24(target[vname]);
                }
              }
              _size += 3;
            } else {
              if (vlength === 4) {
                if (mode === READ) {
                  target[vname] = this.buffer.read32();
                } else {
                  if (mode === WRITE) {
                    this.buffer.write32(target[vname]);
                  }
                }
                _size += 4;
              } else {
                if (vlength === 8) {
                  if (mode === READ) {
                    target[vname] = this.buffer.read64();
                  } else {
                    if (mode === WRITE) {
                      this.buffer.write64(target[vname]);
                    }
                  }
                  _size += 8;
                }
              }
            }
          }
        }
      } else {
        if (vtype === "skip") {
          const skipLen = this.calcLength(vlength, 1);
          if (mode === READ) {
            target[vname] = "(" + skipLen + ")bytes";
            this.buffer.skip(skipLen);
          } else {
            if (mode === WRITE) {
              this.buffer.fill(skipLen, 0);
            }
          }
          _size += skipLen;
        } else {
          if (vtype === "text") {
            const textLen = this.calcLength(vlength, 1);
            if (textLen > 0) {
              if (mode === READ) {
                target[vname] = this.buffer.readText(textLen);
              } else {
                if (mode === WRITE) {
                  this.buffer.writeText(target[vname], textLen);
                }
              }
              _size += textLen;
            } else {
              if (mode === READ) {
                target[vname] = this.buffer.readTextAsNullTermination();
              } else {
                if (mode === WRITE) {
                  this.buffer.writeTextAsNullTermination(target[vname]);
                }
              }
              if (target[vname]) {
                _size += target[vname].length + 1;
              }
            }
          } else {
            if (vtype instanceof Array) {
              if (mode === READ || mode === SIZE && target[vname] === (null || undefined)) {
                target[vname] = [];
              }
              if (vtype.length > 0) {
                const propArray = vtype[0] instanceof Array;
                let unitLength = 0;
                if (propArray) {
                  for (let _tmpi = 0, _tmplen = vtype[0].length; _tmpi < _tmplen; _tmpi++) {
                    unitLength += vtype[0][_tmpi][2];
                  }
                } else {
                  unitLength = vtype[1];
                }
                const loopCnt = mode === SIZE ? target[vname].length : this.calcLength(vlength, unitLength);
                for (let ai = 0; ai < loopCnt; ai++) {
                  if (propArray) {
                    const obj = mode === READ ? {} : target[vname][ai];
                    _size += this.recursiveProc({mode, struct:vtype, minLength}, obj, depth + 1);
                    if (mode === READ) {
                      target[vname].push(obj);
                    }
                  } else {
                    _size += this.recursiveProc({mode, struct:[[ai, vtype[0], vtype[1]]], minLength}, target[vname], depth + 1);
                  }
                }
              }
            }
          }
        }
      }
      if (depth === 0 && target[vname]) {
      }
    }
    return _size;
  }
  hasChild(child) {
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] === child) {
        return i;
      }
    }
    return -1;
  }
  append(child) {
    return this.appendChild(child);
  }
  appendChild(child) {
    if (child) {
      if (this.hasChild(child) === -1) {
        this.children.push(child);
        let list = this[child.type + "s"];
        if (!list) {
          list = [];
        }
        list.push(child);
        this[child.type + "s"] = list;
        this[child.type] = list[0];
      }
      child.parent = this;
    }
  }
  remove(child) {
    return this.removeChild(child);
  }
  removeChild(child) {
    if (child) {
      const pos = this.hasChild(child);
      if (pos !== -1) {
        this.children.splice(pos, 1);
        const list = this[child.type + "s"];
        if (list) {
          const idx = list.indexOf(child);
          if (idx >= 0) {
            list.splice(idx, 1);
          }
          if (list.length > 0) {
            this[child.type] = list[0];
          } else {
            delete this[child.type + "s"];
            delete this[child.type];
          }
        } else {
          delete this[child.type];
        }
      }
      child.parent = null;
    }
  }
  find(type) {
    const _find = (box) => {
      if (box.type === type) {
        return box;
      }
      for (let i = 0, len = box.children.length; i < len; i++) {
        const result = _find(box.children[i]);
        if (result) {
          return result;
        }
      }
      return null;
    };
    return _find(this);
  }
  findAll(type) {
    const _find = (box, result) => {
      if (box.type === type) {
        result.push(box);
      }
      for (let i = 0, len = box.children.length; i < len; i++) {
        _find(box.children[i], result);
      }
      return result;
    };
    return _find(this, []);
  }
  arrange() {
    const _calc = (box) => {
      const sz = box.sync(SIZE) || box.size();
      if (box.type !== "mdat" && sz !== box.data.length) {
        box.setData(new Uint8Array(sz));
      }
      box.sync(WRITE);
      let nextPtr = box.offset + sz;
      for (let i = 0, len = box.children.length; i < len; i++) {
        box.children[i].offset = nextPtr;
        nextPtr += _calc(box.children[i]);
      }
      box.wholeSize = nextPtr - box.offset;
      box.buffer.setPos(0);
      box.buffer.write32(box.wholeSize);
      box.buffer.writeText(box.type, 4);
      return box.wholeSize;
    };
    return _calc(this);
  }
  publish(buffer, progressCallback, _cb) {
    const _sz = this.sync(SIZE);
    if (_sz > 0) {
      if (_sz > this.data.length) {
        this.setData(new Uint8Array(_sz));
      }
    }
    this.sync(WRITE);
    const writeSize = this.size();
    if (writeSize > 0 && buffer) {
      buffer.writeUint8Array(this.data, 0, writeSize);
    }
    _cb(null);
  }
  publishToFile(writer, progressCallback, _cb) {
    const _sz = this.sync(SIZE);
    if (_sz > 0) {
      if (_sz > this.data.length) {
        this.setData(new Uint8Array(_sz));
      }
    }
    this.sync(WRITE);
    const writeSize = this.size();
    if (writeSize > 0 && writer) {
      writer(this.type, function(w, isError) {
        if (!isError) {
          w.write(new Blob([this.data]));
        }
        _cb(null);
      });
    } else {
      _cb(null);
    }
  }
  inspect() {
    return "Box : '" + this.type + "' [ " + (this.container ? "container" : "prop") + " ]" + " / " + this.size();
  }
  dump() {
    var r = "";
    for (var k in this) {
      if (typeof this[k] !== "function") {
        r += k + ":" + this[k] + " , ";
      }
    }
    return r;
  }
  static create(type, structure, initialData) {
    const boxInfo = {};
    boxInfo.type = type;
    boxInfo.struct = structure || BoxProps[type].struct;
    if (boxInfo.struct || initialData instanceof Uint8Array) {
      const box = new Box(boxInfo);
      if (boxInfo.struct) {
        box.setData(new Uint8Array(0));
        for (let i = 0, len = boxInfo.struct.length; i < len; i++) {
          const name = boxInfo.struct[i][0];
          const type = boxInfo.struct[i][1];
          box[name] = initialData && initialData[name] || (type instanceof Array ? [] : type === "text" ? "" : 0);
        }
      } else {
        box.setDataAndSync(initialData);
      }
      return box;
    }
    return null;
  }
  static get ignore() {
    return {type:1, container:1, data:1, buffer:1, offset:1, id:1, parent:1, children:1, wholeSize:1, boxInfo:1, property:1};
  }
}
class SimpleView {
  constructor(data) {
    this.ptr = 0;
    this.data = data;
  }
  read8() {
    return this.data[this.ptr++];
  }
  read16() {
    return this.data[this.ptr++] << 8 | this.data[this.ptr++];
  }
  read24() {
    return this.data[this.ptr++] << 16 | this.data[this.ptr++] << 8 | this.data[this.ptr++];
  }
  read32() {
    return this.data[this.ptr++] << 24 | this.data[this.ptr++] << 16 | this.data[this.ptr++] << 8 | this.data[this.ptr++];
  }
  read64() {
    return this.read32() * 4294967296 + this.read32();
  }
  readText(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      const d = this.data[this.ptr++];
      result += String.fromCharCode(d);
    }
    return result;
  }
  readTextAsNullTermination() {
    const length = this.data.length;
    let result = "";
    while (this.ptr < length) {
      const d = this.data[this.ptr++];
      if (d === 0) {
        break;
      }
      result += String.fromCharCode(d);
    }
    return result;
  }
  readUint8Array(dest, offset, length) {
    for (let i = 0; i < length; i++) {
      dest[offset++] = this.data[this.ptr++];
    }
  }
  write8(value) {
    this.data[this.ptr++] = value & 255;
    return this;
  }
  write16(value) {
    this.data[this.ptr++] = value >> 8 & 255;
    this.data[this.ptr++] = value & 255;
    return this;
  }
  write24(value) {
    this.data[this.ptr++] = value >> 16 & 255;
    this.data[this.ptr++] = value >> 8 & 255;
    this.data[this.ptr++] = value & 255;
    return this;
  }
  write32(value) {
    this.data[this.ptr++] = value >> 24 & 255;
    this.data[this.ptr++] = value >> 16 & 255;
    this.data[this.ptr++] = value >> 8 & 255;
    this.data[this.ptr++] = value & 255;
    return this;
  }
  write64(value) {
    this.write32(Math.floor(value / 4294967296));
    this.write32(Math.floor(value % 4294967296));
    return this;
  }
  writeText(text, length) {
    length = length || text.length;
    for (let i = 0, len = length; i < len; i++) {
      this.data[this.ptr++] = text.charCodeAt(i);
    }
    return this;
  }
  writeTextAsNullTermination(text) {
    this.writeText(text);
    this.data[this.ptr++] = 0;
    return this;
  }
  writeUint8Array(src, offset, length) {
    if (length < 512) {
      for (let i = 0; i < length; i++) {
        this.data[this.ptr++] = src[offset++];
      }
    } else {
      this.data.set(src.subarray(offset, offset + length), this.ptr);
      this.ptr += length;
    }
    return this;
  }
  fill(length, v) {
    v = v || 0;
    for (let i = 0; i < length; i++) {
      this.data[this.ptr++] = v;
    }
    return this;
  }
  getPos() {
    return this.ptr;
  }
  setPos(p) {
    this.ptr = p;
    return this;
  }
  skip(length) {
    this.ptr += length;
    return this;
  }
  ready() {
    return this.ptr < this.data.length;
  }
  copy(length) {
    const view = this.data.subarray(this.ptr, this.ptr + length);
    this.ptr += length;
    return this.ptr < 0 ? new Uint8Array(view) : view;
  }
  toUint8Array() {
    return this.data;
  }
  analyze(hasParent) {
    let result = null;
    let savePtr = this.ptr;
    let size, type;
    const isTypeText = (text) => {
      return text.match(/^[a-zA-Z0-9\u00a9]{4}$/) ? true : false;
    };
    if (!hasParent) {
      size = this.data.length + 8;
      type = "isom";
      savePtr -= 8;
    } else {
      size = this.read32();
      type = this.readText(4);
      if (type === "mdat" && size === 1) {
        size = this.read32() << 32 | this.read32();
      }
    }
    const limit = savePtr + size;
    if (limit <= this.data.length && isTypeText(type)) {
      result = {size:size - (!hasParent ? 8 : 0), type:type, container:false, children:0};
      let totalSize = 8;
      while (totalSize < size) {
        let childSize = this.read32();
        const childType = this.readText(4);
        if (childType === "mdat" && childSize === 1) {
          childSize = this.read32() << 32 | this.read32();
          this.skip(-8);
        }
        if (!isTypeText(childType)) {
          break;
        }
        if (childSize < 8) {
          break;
        }
        this.skip(childSize - 8);
        totalSize += childSize;
        result.children++;
      }
      if (size === totalSize) {
        result.container = true;
      }
    }
    this.ptr = savePtr;
    return result;
  }
}
class MP4 {
  constructor(data) {
    if (!data) {
      this.data = new Uint8Array(0);
    } else {
      if (typeof Buffer !== "undefined" && data instanceof Buffer) {
        this.data = new Uint8Array(data);
      } else {
        if (data instanceof Uint8Array === false) {
          throw new Error("Usage : new MP4( Uint8Array ) or new MP4( Buffer )");
        }
      }
    }
    this.data = data;
    this.rootBox = null;
    if (this.data) {
      this.parse();
    } else {
      this.root = new Box("isom");
    }
  }
  parse() {
    const buffer = new SimpleView(this.data);
    const next = (parent) => {
      const boxInfo = buffer.analyze(parent);
      if (boxInfo) {
        const box = new Box(boxInfo, parent, buffer.getPos());
        if (!this.root) {
          this.root = box;
        }
        if (boxInfo.container) {
          box.setData(buffer.copy(8), boxInfo.size);
          for (let i = 0, len = boxInfo.children; i < len; i++) {
            next(box);
          }
        } else {
          box.setDataAndSync(buffer.copy(boxInfo.size));
        }
      }
    };
    next(null);
  }
  get root() {
    return this.rootBox;
  }
  set root(box) {
    this.rootBox = box;
  }
  size() {
    if (!this.root) {
      return 0;
    }
    const sum = (box) => {
      let i, len = box.children.length, size = box.size();
      for (i = 0; i < len; i++) {
        size += sum(box.children[i]);
      }
      return size;
    };
    return sum(this.root);
  }
  tree(outFunc, verbose) {
    if (!this.root) {
      return (outFunc || console.log)("no box found");
    }
    const spacer = "                                  ";
    const _tree = (box, depth) => {
      const offset = (box.offset + spacer).substr(0, 10);
      let tmp = offset + "| " + spacer.substr(0, depth * 2) + "+" + box.type + " / " + box.size() + (box.container ? " ( total " + box.wholeSize + " ) " : "") + (box.id ? " , ID:" + box.id : "");
      (outFunc || console.log)(tmp);
      if (verbose) {
        for (const k in box) {
          if (typeof box[k] !== "function" && !(box[k] instanceof Box) && !Box.ignore[k]) {
            let value = box[k];
            if (box[k] instanceof Array) {
              if (box[k][0] instanceof Box) {
                continue;
              }
              value = JSON.stringify(box[k].slice(0, 10));
              if (box[k].length > 10) {
                value += " ...";
              }
            }
            tmp = "          | " + spacer.substr(0, depth * 2) + "  > " + k + " : " + value;
            (outFunc || console.log)(tmp);
          }
        }
      }
      for (let i = 0, len = box.children.length; i < len; i++) {
        _tree(box.children[i], depth + 1);
      }
    };
    _tree(this.root, 0);
  }
  publish(progressCallback, callback) {
    if (!this.root) {
      throw new Error("no rootbox found");
    }
    const totalSize = this.size();
    const outBuffer = new SimpleView(new Uint8Array(totalSize));
    const _publish = function(box, _cb) {
      let i = 0, len = box.children.length;
      box.publish(outBuffer, function(ptr) {
        progressCallback(Math.floor(100 * ptr / totalSize));
      }, function(e) {
        const next = function(ci) {
          if (ci < len) {
            _publish(box.children[ci], function(e) {
              next(ci + 1);
            });
          } else {
            _cb(null);
          }
        };
        next(0);
      });
    };
    _publish(this.root, function(e) {
      callback(e, outBuffer.data);
    });
  }
  async publishAsync() {
    return new Promise((resolve, reject) => {
      if (!this.root) {
        return reject("no rootbox found");
      }
      const totalSize = this.size();
      const outBuffer = new SimpleView(new Uint8Array(totalSize));
      const _publish = (box, _cb) => {
        let i = 0, len = box.children.length;
        box.publish(outBuffer, null, () => {
          const next = (ci) => {
            if (ci < len) {
              _publish(box.children[ci], () => {
                next(ci + 1);
              });
            } else {
              _cb();
            }
          };
          next(0);
        });
      };
      _publish(this.root, () => {
        resolve(outBuffer.data);
      });
    });
  }
  static get Box() {
    return Box;
  }
}
const _buildMP4 = async(data, flags) => {
  if (!data || data.length === 0) {
    throw new Error("buildMP4 : Video contains no media");
  }
  let primaryTrackNum = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].mimetype.includes("video")) {
      primaryTrackNum = i;
    }
  }
  if (data.length === 2 && primaryTrackNum === 1) {
    data = [data[1], data[0]];
    primaryTrackNum = 0;
  }
  const {skipLiveKeyFrame, modifyESDSTrackConfig, over4G, over13H} = flags;
  const mdatOrder = [];
  for (let track = 0, tlen = data.length; track < tlen; track++) {
    const d = data[track];
    let order = 0;
    for (let num = 0, len = d.mdats.length; num < len; num++) {
      if (d.start[num] !== undefined) {
        mdatOrder.push({track, num, order, start:d.start[num]});
        order++;
      }
    }
  }
  mdatOrder.sort((a, b) => a.start - b.start);
  for (const d of data) {
    if (d.moofs.length !== d.mdats.length) {
      throw new Error("moofs.length !== mdats.length");
    }
    if (d.mdats[0] && d.mdats[0].size === 9) {
      d.mdats = [];
    }
  }
  const mp4s = [];
  const mp4boxes = [];
  for (const d of data) {
    const mp4 = d.init && d.init.data && d.init.data.length < 20000 ? new MP4(d.init.data.slice()) : d.init;
    mp4s.push(mp4);
    mp4boxes.push(mp4.root);
  }
  const trackLength = mp4s.length;
  for (let i = 0, len = mp4boxes.length; i < len; i++) {
    const root = mp4boxes[i];
    root.moov.mvhd.version = root.moov.trak.tkhd.version = root.moov.trak.mdia.mdhd.version = 0;
    root.moov.trak.tkhd.flags = 3;
    const trackId = i + 1;
    root.moov.trak.tkhd.trackID = root.moov.mvex.trex.trackID = trackId;
    if (root.ftyp) {
      root.ftyp.majorBrand = "mp42";
      root.ftyp.minorVersion = 0;
      root.ftyp.compatibleBrands = ["isom", "iso2", "avc1", "mp41", "mp42"];
    }
    if (modifyESDSTrackConfig) {
      const stsd = root.moov.trak.mdia.minf.stbl.stsd;
      const view = new SimpleView(stsd.data);
      view.skip(12);
      const entryCount = view.read32();
      for (let i = 0; i < entryCount; i++) {
        const size = view.read32();
        const code = view.readText(4);
        if (code === "mp4a") {
          view.skip(28);
          const esdsPtr = view.getPos();
          const size = view.read32();
          const code = view.readText(4);
          if (code === "esds") {
            view.skip(5);
            const len01 = view.read8();
            view.skip(4);
            const len02 = view.read8();
            view.skip(14);
            const trackConfigLength = view.read8();
            if (trackConfigLength === 4) {
              const c0 = view.read8();
              const c1 = view.read8();
              view.skip(2);
              const remains = [];
              for (let n = 0, len = size - 38; n < len; n++) {
                remains.push(view.read8());
              }
              view.setPos(esdsPtr);
              view.write32(size);
              view.skip(9);
              view.write8(len01 - 2);
              view.skip(4);
              view.write8(len02 - 2);
              view.skip(14);
              view.write8(trackConfigLength - 2);
              view.write8((c0 & 7) + 16);
              view.write8(c1 & 248);
              for (const d of remains) {
                view.write8(d);
              }
              view.write16(0);
            }
          } else {
            view.skip(size - 8);
          }
        } else {
          view.skip(size - 8);
        }
      }
    }
  }
  const o = new MP4;
  const out = o.root;
  out.append(mp4boxes[primaryTrackNum].ftyp);
  out.append(new MP4.Box("moov"));
  out.moov.append(mp4boxes[primaryTrackNum].moov.mvhd);
  for (const root of mp4boxes) {
    out.moov.append(root.moov.trak);
  }
  out.moov.mvhd.nextTrackID = mp4s.length + 1;
  const creationTime = 0;
  out.moov.mvhd.creationTime = out.moov.mvhd.modificationTime = creationTime;
  for (let i = 0, len = mp4s.length; i < len; i++) {
    out.moov.traks[i].tkhd.creationTime = out.moov.traks[i].mdia.mdhd.creationTime = out.moov.traks[i].tkhd.modificationTime = out.moov.traks[i].mdia.mdhd.modificationTime = creationTime;
  }
  let maxTrackDuration = 0;
  for (const trak of out.moov.traks) {
    const stbl = trak.mdia.minf.stbl;
    const trackID = trak.tkhd.trackID;
    const type = trak.mdia.hdlr.handlerType;
    if (type === "soun") {
      trak.tkhd.alternateGroup = 1;
      trak.tkhd.volume = 256;
    }
    let {stsz, stts, stsc, stss, stco, ctts, sdtp, co64} = stbl;
    if (!stsz) {
      stbl.append(stsz = MP4.Box.create("stsz"));
    }
    if (!stts) {
      stbl.append(stts = MP4.Box.create("stts"));
    }
    if (!stsc) {
      stbl.append(stsc = MP4.Box.create("stsc"));
    }
    if (!stss) {
      stbl.append(stss = MP4.Box.create("stss"));
    }
    if (!sdtp) {
      sdtp = MP4.Box.create("sdtp");
    }
    if (!ctts) {
      ctts = MP4.Box.create("ctts");
    }
    if (over4G) {
      if (!co64) {
        stbl.append(co64 = MP4.Box.create("co64"));
      }
      if (stco) {
        stbl.remove(stco);
        stco = null;
      }
    } else {
      if (!stco) {
        stbl.append(stco = MP4.Box.create("stco"));
      }
      if (co64) {
        stbl.remove(co64);
        co64 = null;
      }
    }
    stsz.sampleSizes = [];
    stts.entries = [];
    stsc.entries = [];
    stss.syncSamples = [];
    sdtp.sampleDependencies = [];
    ctts.entries = [];
    let currentSampleIdx = 0;
    let chunkCount = 0;
    let samplesPerChunk = 0;
    let curSampleDuration = 0;
    let sameDurationCount = 0;
    let curCompositionTimeOffset = -1;
    let sameCompositionTimeOffsetCount = 0;
    const keyframeCandidates = [];
    let totalDuration = 0;
    for (const moofBlob of data[trackID - 1].moofs) {
      if (!moofBlob) {
        continue;
      }
      const moofMP4 = moofBlob instanceof MP4 ? moofBlob : new MP4(new Uint8Array(await readBlob(moofBlob)));
      const moof = moofMP4.root.moof;
      if (moofMP4.root.mdat) {
        data[trackID - 1].mdats.push(new Blob([moofMP4.root.mdat.data]));
      }
      const traf = moof.traf;
      const tfhd = traf.tfhd;
      const trun = traf.trun;
      const trex = mp4boxes[trackID - 1].moov.mvex && mp4boxes[trackID - 1].moov.mvex.trex;
      chunkCount++;
      if (trun.sampleCount === 1) {
        if (!trun.samples) {
          trun.samples = [{}];
        }
      }
      for (const sample of trun.samples) {
        currentSampleIdx++;
        sample.duration = sample.duration || tfhd && tfhd.defaultSampleDuration || trex && trex.sampleDuration;
        sample.size = sample.size || tfhd && tfhd.defaultSampleSize || trex && trex.sampleSize;
        sample.flags = sample.flags || tfhd && tfhd.defaultSampleFlags || trex && trex.sampleFlags || 0;
        if (!sample.duration) {
          sample.duration = 1;
          if ((trun.flags & 2048) > 0) {
            sample.compositionTimeOffset -= sample.duration;
          }
        }
        if ((sample.flags & 33554432) > 0) {
          if (false) {
          } else {
            if (type === "soun") {
            } else {
              stss.syncSamples.push(currentSampleIdx);
            }
          }
        }
        if (sample.flags === 0 && type === "vide") {
          keyframeCandidates.push(currentSampleIdx);
        }
        stsz.sampleSizes.push(sample.size);
        if (curSampleDuration !== sample.duration) {
          if (sameDurationCount > 0) {
            stts.entries.push({sampleCount:sameDurationCount, sampleDuration:curSampleDuration});
            sameDurationCount = 0;
          }
          curSampleDuration = sample.duration;
        }
        sameDurationCount++;
        totalDuration += sample.duration;
        if ((trun.flags & 2048) > 0) {
          if (curCompositionTimeOffset !== sample.compositionTimeOffset) {
            if (sameCompositionTimeOffsetCount > 0) {
              ctts.entries.push({sampleCount:sameCompositionTimeOffsetCount, sampleOffset:curCompositionTimeOffset});
              sameCompositionTimeOffsetCount = 0;
            }
          }
          curCompositionTimeOffset = sample.compositionTimeOffset;
          sameCompositionTimeOffsetCount++;
        }
      }
      if (samplesPerChunk !== trun.sampleCount) {
        samplesPerChunk = trun.sampleCount;
        stsc.entries.push({firstChunk:chunkCount, samplesPerChunk, sampleDescriptionIndex:1});
      }
      if (traf.sdtp) {
        sdtp.sampleDependencies.push(...traf.sdtp.sampleDependencies);
      }
    }
    stts.entries.push({sampleCount:sameDurationCount, sampleDuration:curSampleDuration});
    if (curCompositionTimeOffset !== -1) {
      ctts.entries.push({sampleCount:sameCompositionTimeOffsetCount, sampleOffset:curCompositionTimeOffset});
    }
    if (type === "vide") {
      if (stss.syncSamples.length === 0) {
        stss.syncSamples = keyframeCandidates;
        if (stss.syncSamples.length === 0) {
          stss.syncSamples = [1];
        }
      }
    }
    stsz.sampleCount = stsz.sampleSizes.length;
    stts.entryCount = stts.entries.length;
    stsc.entryCount = stsc.entries.length;
    stss.entryCount = stss.syncSamples.length;
    if (over4G) {
      co64.entryCount = chunkCount;
      co64.chunkOffsets = new Array(chunkCount);
    } else {
      stco.entryCount = chunkCount;
      stco.chunkOffsets = new Array(chunkCount);
    }
    if (ctts.entries.length) {
      ctts.entryCount = ctts.entries.length;
      if (type !== "soun") {
        stbl.append(ctts);
      }
    }
    const mediaTime = ctts.entryCount > 0 ? ctts.entries[0].sampleOffset : 0;
    if (!trak.edts) {
      trak.append(new MP4.Box("edts"));
    }
    if (!trak.edts.elst) {
      trak.edts.append(MP4.Box.create("elst"));
    }
    trak.edts.elst.entryCount = 1;
    trak.edts.elst.entries = [{segmentDuration:trak.tkhd.duration, mediaTime, mediaRateInteger:1, mediaRateFraction:0}];
    if (sdtp.sampleDependencies.length) {
      stbl.append(sdtp);
    }
    trak.mdia.mdhd.duration = totalDuration;
    maxTrackDuration = Math.max(totalDuration / trak.mdia.mdhd.timeScale, maxTrackDuration);
  }
  const timeScale = 1000;
  const duration = Math.floor(maxTrackDuration * timeScale);
  out.moov.mvhd.timeScale = timeScale;
  out.moov.mvhd.duration = duration;
  for (const trak of out.moov.traks) {
    const trackDuration = trak.mdia.mdhd.duration / trak.mdia.mdhd.timeScale * timeScale;
    trak.tkhd.duration = trackDuration;
    if (trak.edts && trak.edts.elst) {
      trak.edts.elst.entries[0].segmentDuration = trackDuration;
    }
  }
  out.arrange();
  let mdatOffset = o.size();
  for (const order of mdatOrder) {
    if (over4G) {
      out.moov.traks[order.track].mdia.minf.stbl.co64.chunkOffsets[order.order] = mdatOffset + 8;
    } else {
      out.moov.traks[order.track].mdia.minf.stbl.stco.chunkOffsets[order.order] = mdatOffset + 8;
    }
    mdatOffset += data[order.track].mdats[order.num].size;
  }
  const blobs = [new Blob([await o.publishAsync()])];
  for (const order of mdatOrder) {
    blobs.push(data[order.track].mdats[order.num]);
  }
  const file = new Blob(blobs, {type:"appplication/octet-stream"});
  return file;
};
function createMP3InitSegment(mp3header) {
  const {sampleRate, channelCount} = mp3header;
  const init = new MP4;
  const init_root = init.root;
  init_root.append(new MP4.Box("moov"));
  const mvhd = MP4.Box.create("mvhd", null, {timeScale:sampleRate, duration:0, rate:65536, volume:256, matrix:[65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824], preDefined:24, nextTrackID:0});
  init_root.moov.append(mvhd);
  init_root.moov.append(new MP4.Box("trak"));
  const trak = init_root.moov.trak;
  const tkhd = MP4.Box.create("tkhd", null, {flags:3, trackID:1, duration:0, layer:0, alternateGroup:1, volume:256, matrix:[65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824]});
  trak.append(tkhd);
  trak.append(new MP4.Box("mdia"));
  const mdhd = MP4.Box.create("mdhd", null, {timeScale:sampleRate, duration:5120, languageValues:21956});
  trak.mdia.append(mdhd);
  const hdlr = MP4.Box.create("hdlr", null, {handlerType:"soun", name:"SoundHandler"});
  trak.mdia.append(hdlr);
  trak.mdia.append(new MP4.Box("minf"));
  trak.mdia.minf.append(MP4.Box.create("smhd"));
  trak.mdia.minf.append(new MP4.Box("dinf"));
  trak.mdia.minf.dinf.append(MP4.Box.create("dref", null, {entryCount:1, entrySize:12, typeText:"url ", entryVersion:0, entryFlags:1}));
  trak.mdia.minf.append(new MP4.Box("stbl"));
  const stsd = MP4.Box.create("stsd", [["version", "int", 1], ["flags", "int", 3], ["entryCount", "int", 4], ["entrySize", "int", 4], ["code", "text", 4], ["reserved", "int", 3], ["reserved2", "int", 3], ["dataReferenceIndex", "int", 2], ["reserved3", "int", 8], ["channelCount", "int", 2], ["sampleSize", "int", 2], ["reserved4", "int", 4], ["sampleRate", "int", 2], ["reserved5", "int", 2]], {entryCount:1, entrySize:36, code:".mp3", dataReferenceIndex:1, channelCount, sampleSize:16, sampleRate});
  trak.mdia.minf.stbl.append(stsd);
  init_root.moov.append(new MP4.Box("mvex"));
  init_root.moov.mvex.append(MP4.Box.create("trex", null, {sampleDescriptionIndex:1, sampleFlags:65537}));
  init.id = `audio/mp3:${init_root.moov.trak.mdia.mdhd.timeScale}`;
  init_root.arrange();
  return init;
}
function createMP3Moof(data2) {
  const samples = [];
  const mdatLen = data2.length;
  for (let offset = 0; offset < mdatLen;) {
    const mp3header = MpegAudio.parseHeader(data2, offset);
    if (!mp3header) {
      break;
    }
    const size = mp3header.frameLength;
    samples.push({duration:mp3header.samplesPerFrame, size});
    offset += size;
  }
  const moof = new MP4;
  moof.root.append(new MP4.Box("moof"));
  moof.root.moof.append(new MP4.Box("traf"));
  moof.root.moof.traf.append(MP4.Box.create("tfhd", [["version", "int", 1], ["flags", "int", 3], ["trackID", "int", 4], ["defaultSampleFlags", "int", 4, "if", 32]], {flags:32, defaultSampleFlags:65536}));
  moof.root.moof.traf.append(MP4.Box.create("tfdt", null, {}));
  const trun = MP4.Box.create("trun", null, {flags:768, sampleCount:samples.length, samples});
  moof.root.moof.traf.append(trun);
  moof.root.arrange();
  const header = new Uint8Array(8);
  const mdl = mdatLen + 8;
  header.set([mdl >> 24 & 255, mdl >> 16 & 255, mdl >> 8 & 255, mdl & 255, 109, 100, 97, 116]);
  const mdat = new Blob([header, data2]);
  return {moof, mdat};
}
const isSameInitSegment = (t1, t2) => {
  try {
    if (t1.root.moov.trak.tkhd.width === t2.root.moov.trak.tkhd.width && t1.root.moov.trak.tkhd.height === t2.root.moov.trak.tkhd.height && t1.root.moov.trak.mdia.mdhd.timeScale === t2.root.moov.trak.mdia.mdhd.timeScale) {
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
};
const typeSupported = {mp4:MediaSource.isTypeSupported("video/mp4"), mpeg:MediaSource.isTypeSupported("audio/mpeg"), mp3:MediaSource.isTypeSupported('audio/mp4; codecs="mp3"')};
const muxConfig = [{demux:TSDemuxer, remux:MP4Remuxer}, {demux:MP4Demuxer, remux:PassThroughRemuxer}, {demux:AACDemuxer, remux:MP4Remuxer}, {demux:MP3Demuxer, remux:MP4Remuxer}];
const hlsConfig = {stretchShortVideoTrack:false, maxBufferHole:0.5, maxAudioFramesDrift:1, enableSoftwareAES:true, forceKeyFrameOnDiscontinuity:true};
class DMXR {
  constructor(initSegment, audioCodec, videoCodec, duration) {
    this.demuxer = null;
    this.remuxer = null;
    this.initSegment = initSegment;
    this.audioCodec = audioCodec;
    this.videoCodec = videoCodec;
    this.duration = duration;
    this.result = {};
    this.resolve = null;
    this.reject = null;
    this._evt_ = [];
  }
  init() {
    if (this.demuxer) {
      this.demuxer.resetInitSegment(this.initSegment, this.audioCodec, this.videoCodec, this.duration);
      this.demuxer.resetTimeStamp();
    }
    if (this.remuxer) {
      this.remuxer.resetInitSegment();
      this.remuxer.resetTimeStamp();
    }
  }
  get observer() {
    return {trigger:(evt, data) => {
      this._evt_.push(evt.replace(/hlsFrag/, "").replace(/hls/, ""));
      if (evt === "hlsError") {
        this.reject({fatal:false, message:data});
      }
      if (evt === HlsEvents.FRAG_PARSED) {
        if (_LOG_) {
          console.log(...logGen(null, "DMXR", this._evt_.join(",")));
        }
        this._evt_ = [];
        return this.resolve(this.result);
      }
      if (evt === HlsEvents.FRAG_PARSING_INIT_SEGMENT) {
        this.result[evt] = data;
      } else {
        if (evt === HlsEvents.FRAG_PARSING_DATA) {
          if (!this.result[evt]) {
            this.result[evt] = [];
          }
          this.result[evt].push(data);
        }
      }
    }};
  }
  demux(data, decryptdata, timeOffset, accurateTimeOffset, contiguous) {
    return new Promise(async(resolve, reject) => {
      this.result = {};
      this.resolve = resolve;
      this.reject = reject;
      try {
        data = new Uint8Array(data);
        if (!this.demuxer) {
          for (const mux of muxConfig) {
            if (mux.demux.probe(data)) {
              this.remuxer = new mux.remux(this.observer, hlsConfig, typeSupported, navigator.vendor);
              this.demuxer = new mux.demux(this.observer, this.remuxer, hlsConfig, typeSupported);
              break;
            }
          }
          if (!this.demuxer) {
            return reject({fatal:true, message:"suitable demuxer not found"});
          }
          contiguous = false;
        }
        if (!contiguous) {
          this.init();
        }
        this.demuxer.append(data, timeOffset, contiguous, accurateTimeOffset);
      } catch (e) {
        console.error(e);
        reject({fatal:true, message:e.message});
      }
    });
  }
}
"use strict";
const WebExtensions = navigator.userAgent.includes("Chrome") ? chrome : browser;
const manifest = WebExtensions.runtime.getManifest();
const i18n = WebExtensions.i18n;
const language = navigator.language.substr(0, 2);
const isEdge = navigator.userAgent.includes("Edge");
const isFirefox = !isEdge && navigator.userAgent.includes("Firefox");
const isChrome = !isEdge && navigator.userAgent.includes("Chrome");
const supportedLanguages = ["ja"];
const UNITS = ["B", "KB", "MB", "GB", "TB"];
function getUnit(n) {
  if (n < 1) {
    return {value:0, unitIdx:0};
  }
  const unitIdx = Math.floor(Math.log(n) / Math.log(1024));
  const value = Math.floor(10 * n / Math.pow(1024, unitIdx)) / 10;
  if (value < 1000) {
    return {value, unitIdx};
  } else {
    return {value:Math.floor(value), unitIdx};
  }
}
function fitUnit(n, unitIdx) {
  return Math.floor(10 * n / Math.pow(1024, unitIdx)) / 10;
}
const now = () => (new Date).getTime();
const getTimeStampLabel = () => {
  const date = new Date;
  const pad = (n) => ("" + n).padStart(2, "0");
  return " " + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + "_" + pad(date.getMinutes());
};
function throttle(func, wait) {
  var ctx, args, rtn, timeoutID;
  var last = 0;
  return function throttled() {
    ctx = this;
    args = arguments;
    var delta = new Date - last;
    if (!timeoutID) {
      if (delta >= wait) {
        call();
      } else {
        timeoutID = setTimeout(call, wait - delta);
      }
    }
    return rtn;
  };
  function call() {
    timeoutID = 0;
    last = +new Date;
    rtn = func.apply(ctx, args);
    ctx = null;
    args = null;
  }
}
async function sleep(msec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, msec);
  });
}
function logColor(n) {
  const _r = n % 64;
  return "color:#" + ((_r >> 4 & 3) << 22 | (_r >> 2 & 3) << 14 | (_r & 3) << 6 | 1048576).toString(16);
}
function logGen(label, eventName, message, color) {
  color = "color:" + (color || "#f60b91");
  if (label) {
    if (typeof label === "number") {
      return ["%c" + label + "%c [" + eventName + "]%c " + message, logColor(label * 16 + 1), color, ""];
    } else {
      return ["%c" + label + "%c [" + eventName + "]%c " + message, "color:#ff8888", color, ""];
    }
  } else {
    return ["%c  %c[" + eventName + "]%c " + message, logColor(0), color, ""];
  }
}
const TABLE_FOR_ESCAPE_HTML = {"&":"&amp;", '"':"&quot;", "<":"&lt;", ">":"&gt;"};
function escapeHTML(content) {
  return content.replace(/[&"<>]/g, (match) => TABLE_FOR_ESCAPE_HTML[match]);
}
function calcMD5(blob, progress, result) {
  const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  const totalSize = blob.size;
  const chunkSize = 1048576;
  const chunks = Math.ceil(totalSize / chunkSize);
  const spark = new SparkMD5.ArrayBuffer;
  const fileReader = new FileReader;
  let currentChunk = 0;
  fileReader.onload = function(e) {
    spark.append(e.target.result);
    currentChunk++;
    progress(currentChunk + 1, chunks);
    if (currentChunk < chunks) {
      loadNext();
    } else {
      const hash = spark.end();
      result(hash);
    }
  };
  fileReader.onerror = function() {
    result("error");
  };
  function loadNext() {
    const start = currentChunk * chunkSize;
    const end = start + chunkSize >= totalSize ? totalSize : start + chunkSize;
    fileReader.readAsArrayBuffer(blobSlice.call(blob, start, end));
  }
  loadNext();
}
const _md5 = async(file) => {
  return new Promise((resolve, reject) => {
    calcMD5(file, (cur, total) => {
    }, (hash) => {
      resolve(hash);
    });
  });
};
function setText(id, text) {
  const o = document.getElementById(id);
  if (o) {
    o.innerText = text;
  }
  if (id === "message") {
    document.title = text;
  }
}
function setHTML(id, html) {
  const o = document.getElementById(id);
  if (o) {
    o.innerHTML = html;
  }
}
function sendMessage(obj) {
  return new Promise((resolve, reject) => {
    WebExtensions.runtime.sendMessage(obj, (result) => {
      resolve(result);
    });
  });
}
function adsChecker() {
  setTimeout(() => {
    const g = document.querySelector('ins[class="adsbygoogle"]');
    if (g && g.parentNode && g.parentNode.clientHeight === 0) {
      const warn = document.createElement("div");
      warn.style.color = "#888";
      warn.style.fontSize = "small";
      warn.innerHTML = i18n.getMessage("disableAdblockMessage");
      g.parentNode.appendChild(warn);
      let scnt = Number(localStorage.scnt || 0) || 0;
      scnt++;
      localStorage.scnt = scnt;
    }
  }, 1000);
}
const _tree = (o) => {
  const _o = [];
  o.tree((s) => {
    _o.push(s);
  }, true);
  console.log(_o.join("\n"));
};
const publish = (o, filename, cb) => {
  o.publish(() => {
  }, (e, d) => {
    const m = new MP4(d);
    const _o = [];
    m.tree((s) => {
      _o.push(s);
    }, true);
    if (cb) {
      cb(_o);
    }
    const blobs = [new Blob([d])];
    const file = new Blob(blobs, {type:"appplication/octet-stream"});
    const blobURL = URL.createObjectURL(file);
    document.body.innerHTML += '<a href="' + blobURL + '" download="' + filename + '">' + filename + "</a>";
  });
};
const readBlob = async(blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onload = (evt) => {
      resolve(reader.result);
    };
    reader.onerror = (evt) => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(blob);
  });
};
const loadExternalBlob = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(xhr.response);
      }
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  });
};
const checkSequencialUrl = (list) => {
  let head = null, tail = null;
  for (let i = 0, len = list.length - 1; i < len; i++) {
    const ptr = list[i].length - 1;
    let dPtr = 0;
    for (let n = ptr; 0 < n; n--) {
      if (list[i][n] !== list[i + 1][n]) {
        if (list[i][n].match(/\D/)) {
          return null;
        }
        dPtr = n;
        break;
      }
    }
    if (dPtr === 0) {
      return null;
    }
    const s1 = list[i].substr(0, dPtr + 1);
    const s2 = list[i].substr(dPtr + 1);
    if (!tail) {
      tail = s2;
    }
    if (tail !== s2) {
      return null;
    }
    const parts = s1.match(/(.*?)(\d{0,6}$)/);
    if (!parts) {
      return null;
    }
    if (!head) {
      head = parts[1];
    }
    if (head !== parts[1]) {
      return null;
    }
  }
  const esc = (s) => {
    return s.replace(/\?/g, "\\?").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\+/g, "\\+");
  };
  if (head === null || tail === null) {
    return null;
  }
  const regExp = new RegExp(`(${esc(head)})(\\d+)(${esc(tail)})`);
  let current = -1;
  for (let i = 0, len = list.length; i < len; i++) {
    const parts = regExp.exec(list[i]);
    if (!parts) {
      return null;
    }
    const n = Number(parts[2]);
    if (current === -1) {
      current = n;
    }
    if (n !== current + i) {
      return null;
    }
  }
  if (current === -1) {
    return null;
  }
  const createUrl = (num) => {
    return head + num + tail;
  };
  return {current, createUrl};
};
const getDomainName = (url) => {
  return (url.match(/https?:\/\/([^\/]+)/) || [])[1] || "";
};
const createCustomHeaders = (headers) => {
  if (!headers) {
    return null;
  }
  let h = {};
  for (const key in headers) {
    h["LM_" + key] = headers[key] || "null";
  }
  return h;
};
"use strict";
const _PAUSE_ = 0;
const _LOADING_ = 1;
const _DESTROY_ = 2;
class Video {
  constructor(sourceType) {
    this.sourceType = sourceType;
    this.tracks = [];
    this.index = {};
    this.size = 0;
    this.ui = new LiveUI(async() => {
      await flush(this, this.sourceType, FLUSH_TEST);
    });
    this.isPreviewed = false;
    this.isLive = false;
    this.startTS = 0;
    this.context = null;
    sendMessage({cmd:CMD_GET_TITLE, params:{}}).then((pageInfo) => {
      this.title = pageInfo && pageInfo.title;
      const t = this.title || this.context && this.context.title;
      const r = this.context && this.context.referer;
      if (t) {
        this.ui.titleLabel.innerText = t;
        this.ui.titleLink.title = t;
      }
      if (r) {
        this.ui.titleLink.href = r;
      }
    });
  }
  async load() {
  }
  destroy() {
    this.ui.removeSelf();
  }
  get qualityLabel() {
    let vq = "", aq = "";
    for (const track of this.tracks) {
      if (track.init) {
        if (track.mimetype.includes("video")) {
          vq = track.quality;
        }
        if (track.mimetype.includes("audio")) {
          aq = track.quality;
        }
      }
    }
    return vq + (vq !== "" ? " - " : "") + aq;
  }
  createPreviewOnce(n) {
    if (!this.isPreviewed) {
      n = n || 0;
      for (const track of this.tracks) {
        if (track.init && track.mimetype.includes("video") && track.moofs.length > n && track.mdats.length > n) {
          flush(this, this.sourceType, FLUSH_TEST);
          this.isPreviewed = true;
          break;
        }
      }
    }
  }
  assign(params) {
    for (const key in params) {
      this[key] = params[key];
    }
  }
}
class HLSVideo extends Video {
  constructor(target, live) {
    super(SOURCE_TYPE_TS);
    if (target instanceof HLSVideo) {
      const {tracks, index, context, videoNum, levelNum, level, audioLevel, fragmentOffset, hasOption} = target;
      this.assign({index, context, videoNum, levelNum, level, audioLevel, fragmentOffset, hasOption});
      const newTracks = [];
      for (const track of tracks) {
        const {mimetype, init} = track;
        newTracks.push({mimetype, init, moofs:[], mdats:[], start:[]});
      }
      this.tracks = newTracks;
    } else {
      this.assign(target);
    }
    this.isLive = live;
    this.contig = false;
    this.stat = _PAUSE_;
    this.pauseResolver = null;
    this.ui.startButton.addEventListener("click", () => {
      this.stat = _LOADING_;
      if (this.pauseResolver) {
        this.pauseResolver();
        this.pauseResolver = null;
      }
      this.ui.startButton.classList.add("disabled");
      this.ui.stopButton.classList.remove("disabled");
      this.ui.forceRenderLink.style.display = "none";
      this.ui.progress.style.removeProperty("background");
      this.ui.errorLabel.innerHTML = "&nbsp;";
      document.title = document.title.replace("! ", "");
    });
    this.ui.stopButton.addEventListener("click", () => {
      this.stat = _PAUSE_;
      this.ui.startButton.classList.remove("disabled");
      this.ui.stopButton.classList.add("disabled");
      this.ui.forceRenderLink.style.display = "inline";
    });
    this.ui.startButton.classList.remove("disabled");
    this.ui.qualitySelectLabel.addEventListener("click", async() => {
      if (this.hasOption) {
        this.ui.stopButton.click();
        this.ui.forceRenderLink.style.display = "none";
        const result = await select(this.context, this);
        if (result.status === SELECT_STATUS_CONTINUE) {
          this.ui.startButton.click();
          if (result.message) {
            this.ui.setWarn(result.message);
          }
        } else {
          if (result.status === SELECT_STATUS_ERROR) {
            this.ui.setError(result.message);
          }
        }
      }
    });
    if (this.isLive) {
      this.ui.closeButton.addEventListener("click", () => {
        this.context.remove(this);
      });
    }
  }
  getTrack(type) {
    if (this.index[type] === undefined) {
      this.index[type] = this.tracks.length;
      this.tracks.push({init:null, moofs:[], mdats:[], start:[], mimetype:type, duration:0, quality:""});
    }
    return this.tracks[this.index[type]];
  }
  async loadFragment(fragment, retryCount, timeout) {
    const {data, error} = await fetchFragment(this.context, fragment, retryCount, timeout);
    if (!error) {
      await fragment.demuxer.demux({video:this, fragment, data});
    } else {
      return error;
    }
  }
  async load() {
    super.load();
    this.ui.startButton.click();
    if (this.isLive) {
      await liveLoader(this);
    } else {
      await hlsLoader(this);
    }
  }
  async pause() {
    return new Promise((resolve, reject) => {
      if (this.stat === _LOADING_) {
        return resolve();
      } else {
        if (this.stat === _DESTROY_) {
          return reject();
        }
      }
      this.pauseResolver = resolve;
    });
  }
  destroy() {
    super.destroy();
    this.stat = _DESTROY_;
    if (this.destroyFunc) {
      this.destroyFunc();
    }
  }
  updateQualitySelectLabel() {
    if (this.context) {
      this.ui.qualitySelectLabel.innerHTML = i18n.getMessage("quality") + '&nbsp;-&nbsp;<a href="javascript:void(0)">' + i18n.getMessage(this.context.settings.quality) + "</a>";
      this.ui.qualitySelectLabel.style.display = this.hasOption ? "inline" : "none";
    }
  }
}
class CapturedVideo extends Video {
  constructor(mediasourceid, src) {
    super(SOURCE_TYPE_MEDIASTREAM);
    if (src) {
      const {tracks, index, context} = src;
      this.assign({tracks, index, context});
    }
    this.isLive = true;
    this.startTS = (new Date).getTime();
    this.mediasourceid = mediasourceid;
    this.ui.setStatus("REC", COLOR.RED.content);
    this.ui.showControl(false);
    this.ui.showSaveButton(true);
  }
}
class LiveUI {
  constructor(flushFunc) {
    const container = document.createElement("div");
    const template = document.getElementById("liveVideoTemplateV2").innerHTML;
    container.innerHTML = template;
    const videos = document.getElementById("videos");
    videos.appendChild(container);
    this.container = container;
    this.loading = true;
    this.size = 0;
    this.duration = 0;
    const save = async() => {
      if (this.saveButton.classList.contains("disabled")) {
        return;
      }
      this.saveButton.classList.add("disabled");
      if (this.loading) {
        if (flushFunc) {
          await flushFunc();
        }
      }
      this.downloadLink.click();
      await sleep(1000);
      this.saveButton.classList.remove("disabled");
    };
    this.saveButton.addEventListener("click", save);
    this.forceRenderLink.addEventListener("click", save);
    const v = this.video;
    v._mouseEvents = {enter:() => {
      if (v.src) {
        v.controls = true;
      }
    }, leave:() => {
      if (v.src) {
        v.controls = false;
      }
    }};
    v.addEventListener("mouseover", v._mouseEvents.enter);
    v.addEventListener("mouseout", v._mouseEvents.leave);
    this.dateLabel = getTimeStampLabel();
  }
  get video() {
    return this.container.querySelector("video");
  }
  get progress() {
    return this.container.querySelector("progress");
  }
  get loadCtrls() {
    return this.container.querySelectorAll(".loadCtrls");
  }
  get downloadLink() {
    return this.container.querySelector(".donwloadLink");
  }
  get stopButton() {
    return this.container.querySelector(".stopButton");
  }
  get startButton() {
    return this.container.querySelector(".startButton");
  }
  get saveButton() {
    return this.container.querySelector(".saveButton");
  }
  get closeButton() {
    return this.container.querySelector(".closeButton");
  }
  get forceRenderLink() {
    return this.container.querySelector(".forceRenderLink");
  }
  get titleLabel() {
    return this.container.querySelector(".titleLabel");
  }
  get titleLink() {
    return this.container.querySelector(".titleLink");
  }
  get sizeLabel() {
    return this.container.querySelector(".sizeLabel");
  }
  get durationLabel() {
    return this.container.querySelector(".durationLabel");
  }
  get progressLabel() {
    return this.container.querySelector(".progressLabel");
  }
  get qualityLabel() {
    return this.container.querySelector(".qualityLabel");
  }
  get qualitySelectLabel() {
    return this.container.querySelector(".qualitySelectLabel");
  }
  get boostLabel() {
    return this.container.querySelector(".boostLabel");
  }
  get errorLabel() {
    return this.container.querySelector(".errorLabel");
  }
  get statusLabel() {
    return this.container.querySelector(".statusLabel");
  }
  addSize(v) {
    this.setSize(this.size + v);
  }
  setSize(sz) {
    this.size = sz;
    const s = getUnit(this.size);
    this.sizeLabel.innerText = s.value + " " + UNITS[s.unitIdx];
  }
  addDuration(d) {
    this.setDuration(this.duration + d);
  }
  setDuration(d) {
    this.duration = d;
    this.durationLabel.innerText = this.getDurationString();
  }
  getDurationString() {
    return String(Math.trunc(this.duration / 60)) + ":" + String(Math.trunc(this.duration % 60)).padStart(2, "0");
  }
  updateProgressInfo() {
    this.progressLabel.innerText = this.getProgressInfo();
  }
  getProgressInfo() {
    return this.progress.value + " / " + this.progress.max;
  }
  setQuality(q) {
    this.qualityLabel.innerHTML = q;
  }
  setWarn(e) {
    this.errorLabel.innerHTML = e;
  }
  setError(e) {
    this.errorLabel.innerHTML = e;
    const tryCaptureLink = this.errorLabel.querySelector(".tryCapture");
    if (tryCaptureLink) {
      tryCaptureLink.addEventListener("click", () => {
        document.getElementById("forceCaptureButton").click();
      });
    }
    this.progress.style.background = COLOR.RED.content;
    this.stopButton.classList.add("disabled");
    document.title = "! " + document.title;
  }
  setStatus(label, color) {
    if (color !== undefined) {
      this.statusLabel.style.background = color;
    }
    if (label !== undefined) {
      this.statusLabel.innerText = label;
    }
  }
  showControl(v) {
    this.loadCtrls.forEach((c) => {
      c.style.display = v ? "inline" : "none";
    });
  }
  showSaveButton(v) {
    this.saveButton.style.display = v ? "inline" : "none";
  }
  terminate() {
    const color = COLOR.GREEN;
    this.setStatus("RECORDED", color.content);
    this.progress.setAttribute("value", 0);
    this.progress.style.background = color.content;
    this.saveButton.style.background = color.content;
    this.saveButton.style.borderColor = color.border;
    this.loading = false;
    this.showControl(false);
    this.showSaveButton(true);
    if (!this.downloadLink.href.includes("blob")) {
      this.saveButton.classList.add("disabled");
      const videos = document.getElementById("videos");
      if (videos && videos.querySelectorAll("video").length > 1) {
        this.removeSelf();
      }
    }
  }
  removeSelf() {
    const videos = document.getElementById("videos");
    if (videos && videos.contains(this.container)) {
      videos.removeChild(this.container);
    }
  }
}
const selectLevel = (context, levels) => {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById("selectLevelModal");
    const radios = modal.querySelectorAll('input[name="level"]');
    const select = modal.querySelector("select");
    select.innerHTML = "";
    const prevQuality = context.settings.quality;
    const prevLevel = context.settings.level;
    const handler = (evt) => {
      const value = evt.target.value;
      if (value === QUALITY_CUSTOM) {
        select.innerHTML = "";
        select.classList.remove("disabled");
        for (let i = 0, len = levels.length; i < len; i++) {
          const level = levels[i];
          const bitrate = level.attrs["BANDWIDTH"];
          const resolution = level.attrs["RESOLUTION"];
          const option = document.createElement("option");
          const label = (resolution ? resolution + " , " : "") + (bitrate ? bitrate + " bps" : "");
          option.setAttribute("value", i);
          option.innerHTML = label;
          select.appendChild(option);
          if (i === prevLevel) {
            option.selected = true;
          }
        }
      } else {
        select.classList.add("disabled");
        select.innerHTML = "";
      }
    };
    for (const r of radios) {
      r.addEventListener("click", handler);
    }
    for (const radio of document.querySelectorAll('input[name="level"]')) {
      if (radio.value === prevQuality) {
        radio.click();
      }
    }
    const closeButton = modal.querySelector(".close-modal");
    const _close = () => {
      closeButton.addEventListener("click", _close);
      modal.classList.remove("active");
      reject();
    };
    closeButton.addEventListener("click", _close);
    const okButton = document.getElementById("selectLevelOKButton");
    const _ok = () => {
      okButton.removeEventListener("click", _ok);
      modal.classList.remove("active");
      for (const r of radios) {
        r.removeEventListener("click", handler);
      }
      const checked = document.querySelector('input:checked[name="level"]');
      if (checked) {
        const quality = checked.value;
        if (quality === QUALITY_HIGH) {
          resolve({level:levels.length - 1, quality});
        } else {
          if (quality === QUALITY_LOW) {
            resolve({level:0, quality});
          } else {
            resolve({level:select.selectedIndex, quality});
          }
        }
      } else {
        resolve({level:0, quality:QUALITY_LOW});
      }
    };
    okButton.addEventListener("click", _ok);
    modal.classList.add("active");
  });
};
const selectAudio = (context, audios) => {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById("selectAudioModal");
    const group = modal.querySelector(".form-group");
    const radio = modal.querySelector(".radioTemplate").innerHTML;
    group.innerHTML = "";
    for (let i = 0, len = audios.length; i < len; i++) {
      const audio = audios[i];
      const {audioCodec, lang, name, details} = audio;
      const duration = details.totalduration;
      const value = i;
      const label = `[ ${lang} ]  ${name} ( ${audioCodec} )`;
      const tooltip = "Duration : " + String(Math.trunc(duration / 60)) + ":" + String(Math.trunc(duration % 60)).padStart(2, "0");
      const div = document.createElement("div");
      div.innerHTML = radio.replace(/\$value/, value).replace(/\$label/, label).replace(/\$tooltip/, tooltip);
      group.appendChild(div);
    }
    const closeButton = modal.querySelector(".close-modal");
    const _close = () => {
      closeButton.addEventListener("click", _close);
      modal.classList.remove("active");
      reject();
    };
    closeButton.addEventListener("click", _close);
    const okButton = document.getElementById("selectAudioOKButton");
    const _ok = () => {
      okButton.removeEventListener("click", _ok);
      modal.classList.remove("active");
      const checked = modal.querySelector('input:checked[name="audios"]');
      if (checked) {
        resolve(Number(checked.value));
      } else {
        resolve(0);
      }
    };
    okButton.addEventListener("click", _ok);
    modal.classList.add("active");
  });
};
const showVideoStatus = (video) => {
  const {tracks} = video;
  const len = tracks.length;
  if (len === 0) {
    return;
  }
  const track = tracks[len - 1];
  const mimetype = track.mimetype;
  const isVideo = mimetype.includes("video");
  if (tracks.length === 1 || isVideo) {
    try {
      if (isVideo) {
        const tkhd = track.init.root.moov.trak.tkhd;
        video.ui.setQuality("MP4 ( " + tkhd.width / 65536 + " x " + tkhd.height / 65536 + " )");
      } else {
        const codec = mimetype.match(/codecs="([^\.]+)/);
        const mdhd = track.init.root.moov.trak.mdia.mdhd;
        if (codec) {
          video.ui.setQuality("mp4, " + codec[1] + "/" + mdhd.timeScale);
        }
      }
    } catch (e) {
    }
  }
};
const showImportantNotice = (type) => {
  document.getElementById("important_hls").style.display = "none";
  document.getElementById("important_live").style.display = "none";
  document.getElementById("important_capture").style.display = type === "capture" ? "inline" : "none";
};
const LevelType = {MAIN:"main", AUDIO:"audio", SUBTITLE:"subtitle"};
class PlayListLoader {
  constructor() {
    this.url = null;
    this.headers = null;
    this.master = null;
    this.details = null;
    this.retry = 0;
  }
  async load(url, headers) {
    this.url = url;
    this.headers = headers;
    this.retry = 0;
    return await this.loadPlayList();
  }
  get isMaster() {
    return this.master;
  }
  get isLevelDetail() {
    return this.details;
  }
  async loadPlayList(testHeaders) {
    const {url, headers} = this;
    const init = {method:"GET", mode:"cors", credentials:"include"};
    const customHeaders = createCustomHeaders(testHeaders || headers);
    if (customHeaders) {
      init.headers = customHeaders;
    }
    const response = await fetch(url, init);
    if (!response.ok) {
      this.retry++;
      if (this.retry >= 2) {
        return response.status;
      } else {
        await sleep(1000);
        return await this.loadPlayList();
      }
    }
    try {
      let text = await response.text();
      if (text.match(/edef8ba9-79d6-4ace-a3c8-27dcd51d21ed/i)) {
        throw Error("[Abort] not supported");
      }
      if (text.indexOf("#EXTINF:") > 0 || text.indexOf("#EXT-X-TARGETDURATION:") > 0) {
        this.details = await this._handleTrackOrLevelPlaylist(text, response.url, 0);
      } else {
        const data = await this._handleMasterPlaylist(text, response.url, null, null, null);
        this.master = this.onManifestLoaded(data);
      }
      if (testHeaders) {
        this.headers = testHeaders;
      }
    } catch (e) {
      console.error(e);
      return e.message;
    }
    return 300;
  }
  async _handleMasterPlaylist(response, url, stats, context, networkDetails) {
    const string = response;
    const levels = M3U8Parser.parseMasterPlaylist(string, url);
    if (!levels.length) {
    }
    const subtitles = M3U8Parser.parseMasterPlaylistMedia(string, url, "SUBTITLES");
    let audioTracks = M3U8Parser.parseMasterPlaylistMedia(string, url, "AUDIO", levels.map((level) => ({id:level.attrs.AUDIO, codec:level.audioCodec})));
    if (audioTracks.length) {
      let embeddedAudioFound = false;
      audioTracks.forEach((audioTrack) => {
        if (!audioTrack.url) {
          embeddedAudioFound = true;
        }
      });
      if (embeddedAudioFound === false && levels[0].audioCodec && !levels[0].attrs.AUDIO) {
        audioTracks.unshift({type:"main", name:"main"});
      }
    }
    return {levels, audioTracks, subtitles};
  }
  async _handleTrackOrLevelPlaylist(response, url, levelId) {
    const levelType = LevelType.MAIN;
    const levelDetails = M3U8Parser.parseLevelPlaylist(response, url, levelId, levelType);
    if (!levelDetails.targetduration) {
      throw Error("[Abort] invalid target duration" + response.status);
    }
    return levelDetails;
  }
  onManifestLoaded(data) {
    let levels = [];
    let bitrateStart;
    let levelSet = {};
    let levelFromSet = null;
    let videoCodecFound = false;
    let audioCodecFound = false;
    let chromeOrFirefox = /chrome|firefox/.test(navigator.userAgent.toLowerCase());
    let audioTracks = [];
    data.levels.forEach((level) => {
      level.loadError = 0;
      level.fragmentError = false;
      videoCodecFound = videoCodecFound || !!level.videoCodec;
      audioCodecFound = audioCodecFound || !!level.audioCodec || !!(level.attrs && level.attrs.AUDIO);
      if (chromeOrFirefox === true && level.audioCodec && level.audioCodec.indexOf("mp4a.40.34") !== -1) {
        level.audioCodec = undefined;
      }
      levelFromSet = levelSet[level.bitrate];
      if (levelFromSet === undefined) {
        level.url = [level.url];
        level.urlId = 0;
        levelSet[level.bitrate] = level;
        levels.push(level);
      } else {
        levelFromSet.url.push(level.url);
      }
    });
    if (videoCodecFound === true && audioCodecFound === true) {
      levels = levels.filter(({videoCodec}) => !!videoCodec);
    }
    levels = levels.filter(({audioCodec, videoCodec}) => {
      return (!audioCodec || isCodecSupportedInMp4(audioCodec)) && (!videoCodec || isCodecSupportedInMp4(videoCodec));
    });
    if (data.audioTracks) {
      audioTracks = data.audioTracks.filter((track) => !track.audioCodec || isCodecSupportedInMp4(track.audioCodec, "audio"));
    }
    if (levels.length > 0) {
      bitrateStart = levels[0].bitrate;
      levels.sort(function(a, b) {
        return a.bitrate - b.bitrate;
      });
      for (let i = 0; i < levels.length; i++) {
        if (levels[i].bitrate === bitrateStart) {
          break;
        }
      }
      return {levels, audioTracks, audio:audioCodecFound, video:videoCodecFound, altAudio:audioTracks.length > 0};
    } else {
      throw Error("[Abort] no level with compatible codecs found in manifest");
    }
  }
}
"use strict";
const hlsLoader = async(video) => {
  const {level, audioLevel, context} = video;
  const hasAltAudio = audioLevel && audioLevel.details && audioLevel.details.fragments && audioLevel.details.fragments.length > 0;
  const fragmentStream = sortFragments([...level.details.fragments, ...hasAltAudio ? audioLevel.details.fragments : []]);
  const UI = video.ui;
  UI.setStatus("HLS");
  UI.durationLabel.style.display = "none";
  UI.progressLabel.style.display = "inline";
  UI.boostLabel.style.display = "inline";
  UI.boostLabel.addEventListener("click", () => {
    const boostState = UI.boostLabel.style.color.toString().includes("255") ? true : false;
    UI.boostLabel.style.color = boostState ? "#ccc" : "#f88";
    p_max = Math.max(1, Math.min(6, boostState ? 1 : Number(localStorage["parallel"]) || 3));
  });
  video.updateQualitySelectLabel();
  showImportantNotice("hls");
  const ccLen = {};
  let loaded = -1;
  let n = 0;
  let currentCC = fragmentStream[0].cc;
  for (let i = 0, len = fragmentStream.length; i < len; i++) {
    const fragment = fragmentStream[i];
    if (currentCC !== fragment.cc) {
      ccLen[currentCC] = n;
      currentCC = fragment.cc;
      n = 0;
    }
    if (fragment.loaded) {
      loaded = i;
    }
    n++;
  }
  ccLen[currentCC] = n;
  loaded = video.contig ? loaded + 1 : 0;
  currentCC = fragmentStream[loaded].cc;
  const _start_ = location.href.match(/start=(\d+)/);
  const _stop_ = location.href.match(/stop=(\d+)/);
  const startIdx = loaded === 0 && _start_ && !hasAltAudio ? Math.max(0, Number(_start_[1])) : loaded;
  const stopIdx = loaded === 0 && _stop_ && !hasAltAudio ? Math.min(fragmentStream.length, Number(_stop_[1])) : fragmentStream.length;
  n = 0;
  video.ui.progress.max = Math.min(stopIdx - startIdx, ccLen[currentCC]);
  const _ts = (new Date).getTime();
  const NOWAIT = true;
  if (_LOG_) {
    console.log("hlsLoder [ new version ] : " + (NOWAIT ? "nowait" : "wait"));
  }
  const indexWaitQue = {};
  const demuxWaitQue = {};
  const fetchWaitQue = {};
  const pass = (q, n) => {
    n = n || 0;
    if (q[n]) {
      q[n]();
      delete q[n];
    }
  };
  const waiter = (q, n) => {
    return new Promise((resolve, reject) => {
      n = n || 0;
      pass(q, n);
      q[n] = resolve;
    });
  };
  let p_max = 1;
  let d_current = startIdx;
  let d_stop = stopIdx;
  (async() => {
    const preload_max = 30;
    let p_loading = 0;
    let p_current = startIdx;
    let p_stop = stopIdx;
    while (p_current < p_stop && p_current < fragmentStream.length) {
      while (p_loading < p_max && p_current < d_current + preload_max) {
        await video.pause();
        if (p_current >= p_stop || p_current >= fragmentStream.length) {
          break;
        }
        const fragment = fragmentStream[p_current];
        fragment.__fragment_index__ = p_current;
        if (currentCC !== fragment.cc) {
          await flush(video, SOURCE_TYPE_TS);
          const newVideo = new HLSVideo(video);
          newVideo.contig = true;
          context.append(newVideo);
          await newVideo.load();
          p_loading = d_current = 99999;
          return pass(indexWaitQue, fragment.__fragment_index__);
        }
        (async(fragment) => {
          const idx = fragment.__fragment_index__;
          p_loading++;
          const {data, error} = await fetchFragment(context, fragment, 3);
          p_loading--;
          if (NOWAIT) {
            pass(indexWaitQue, idx);
            pass(fetchWaitQue);
          }
          if (!error) {
            fragment._data = data;
          } else {
            const _e = error.status !== undefined ? error.error || new Error(error.status) : error;
            showErrorDetail(video, _e);
            video.stat = _PAUSE_;
            video.ui.startButton.classList.remove("disabled");
            video.ui.stopButton.classList.add("disabled");
            video.ui.forceRenderLink.style.display = "inline";
            p_current = idx;
            await video.pause();
          }
        })(fragment);
        p_current++;
      }
      if (NOWAIT) {
        if (p_loading >= p_max) {
          await waiter(fetchWaitQue);
        }
        if (p_current >= d_current + preload_max) {
          await waiter(demuxWaitQue);
        }
      } else {
        await sleep(100);
      }
    }
  })();
  while (d_current < d_stop) {
    const fragment = fragmentStream[d_current];
    if (fragment._data) {
      await fragment.demuxer.demux({video, fragment, data:fragment._data});
      delete fragment._data;
      if (NOWAIT) {
        pass(demuxWaitQue);
      }
      d_current++;
      n++;
      video.createPreviewOnce();
      video.ui.setQuality(video.qualityLabel);
      video.ui.setSize(video.size);
      video.ui.progress.value = n;
      video.ui.updateProgressInfo();
      document.title = d_current + " / " + d_stop + " - " + i18n.getMessage("title_loading");
    } else {
      if (NOWAIT) {
        await waiter(indexWaitQue, d_current);
      } else {
        await sleep(100);
      }
    }
  }
  const _now = (new Date).getTime();
  if (_LOG_) {
    console.log("TIME : " + (_now - _ts));
  }
  await flush(video, SOURCE_TYPE_TS);
  document.title = i18n.getMessage("title_completed") + " - " + stopIdx + " / " + stopIdx;
};
const liveLoader = async(video) => {
  const {level, context} = video;
  const details = level.details;
  const fragments = details.fragments;
  const intervalTime = Math.max((details.averagetargetduration || details.totalduration / details.fragments) - 0.1, 0.5) * 1000;
  video.startTS = now();
  video.ui.setStatus("LIVE", COLOR.RED.content);
  video.ui.showControl(false);
  video.ui.showSaveButton(true);
  video.updateQualitySelectLabel();
  video.destroyFunc = () => {
    clearInterval(loop);
    loop = -2;
  };
  showImportantNotice("live");
  const playList = new PlayListLoader;
  const playListUrl = details.url;
  let loop = -1;
  let lastError = null;
  const stopLoadingPlayList = (msg) => {
    if (_LOG_) {
      console.log(...logGen("", "liveLoader.stopLoadingPlayList", msg));
    }
    if (loop >= 0) {
      clearInterval(loop);
      loop = -1;
    }
  };
  let prevSN = -1, errCnt = 0;
  const _loop = async() => {
    try {
      const stat = await playList.load(playListUrl, details.requestHeaders);
      if (stat === 300) {
        const latestFrags = playList.details && playList.details.fragments || [];
        if (latestFrags.length > 0) {
          let curFrag = fragments[fragments.length - 1];
          for (const f of latestFrags) {
            if (f.sn > curFrag.sn) {
              fragments.push(f);
              f._n = curFrag._n + 1;
              f._parent = details;
              f.start = curFrag.start + curFrag.duration;
              f.demuxer = level.details.demuxer;
              curFrag = f;
              errCnt = 0;
            } else {
              if (f.cc !== curFrag.cc) {
                return stopLoadingPlayList("end of live : reason ( f.cc !== curFrag.cc )");
              }
            }
          }
          errCnt++;
          if (errCnt >= 8) {
            return stopLoadingPlayList("end of live : reason ( errCnt === 8 )");
          }
        } else {
          return stopLoadingPlayList("end of live : reason ( details.fragments.length === 0 )");
        }
      } else {
        return stopLoadingPlayList(`may be end of live : reason ( status_code : ${stat} )`);
      }
    } catch (e) {
      clearInterval(loop);
      loop = -3;
      lastError = e;
    }
  };
  loop = setInterval(_loop, intervalTime);
  let loadPtr = 0;
  while (loop >= 0) {
    const fragment = fragments[loadPtr];
    if (fragment) {
      const retry = loadPtr < fragments.length - 1 ? 1 : 3;
      const err = await video.loadFragment(fragment, retry);
      if (err) {
        if (loadPtr < fragments.length - 1) {
          loadPtr++;
          continue;
        } else {
          throw err.status !== undefined ? err.error || new Error(err.status) : err;
        }
      }
      video.createPreviewOnce();
      video.ui.setQuality(video.qualityLabel);
      video.ui.setSize(video.size);
      video.ui.setDuration(video.tracks[0].duration);
      document.title = video.ui.durationLabel.innerText + " - " + i18n.getMessage("title_recording");
      loadPtr++;
      if (loadPtr === 5) {
        if (level.audioCodec) {
          const t = video.getTrack("audio");
          if (!t.init) {
            video.ui.setError(i18n.getMessage("error_no_audio") + i18n.getMessage("error_try_capture"));
          }
        }
        if (level.videoCodec) {
          const t = video.getTrack("video");
          if (!t.init) {
            video.ui.setError(i18n.getMessage("error_no_video") + i18n.getMessage("error_try_capture"));
          }
        }
      }
    } else {
      await sleep(intervalTime);
    }
  }
  if (loop === -1) {
    await stopLoadingPlayList("download complete");
    await flush(video, SOURCE_TYPE_TS);
  } else {
    if (loop === -2) {
    } else {
      if (loop === -3) {
        if (lastError) {
          throw lastError;
        }
      }
    }
  }
  document.title = i18n.getMessage("title_completed") + " - " + video.ui.durationLabel.innerText;
};
class Demuxer {
  constructor(level) {
    this.demuxer = new DMXR(level.details.initSegment.data || [], level.audioCodec, level.videoCodec, level.details.totalduration);
    this.prevSN = -1;
    this.prevCC = -1;
    this.prevError = null;
  }
  async demux(params) {
    const {video, fragment, data} = params;
    const timeOffset = !isNaN(fragment.startDTS) ? fragment.startDTS : fragment.start;
    try {
      const contig = fragment.sn === this.prevSN + 1 && fragment.cc === this.prevCC && !this.prevError;
      this.prevError = null;
      this.prevSN = fragment.sn;
      this.prevCC = fragment.cc;
      const result = await this.demuxer.demux(data, fragment.decryptdata, timeOffset, true, contig);
      const initSegment = result[HlsEvents.FRAG_PARSING_INIT_SEGMENT];
      if (initSegment) {
        onFragParsingInitSegment(video, fragment, initSegment);
      }
      const mdats = result[HlsEvents.FRAG_PARSING_DATA];
      if (mdats) {
        for (const mdat of mdats) {
          onFragParsingData(video, fragment, mdat);
        }
      }
    } catch (e) {
      if (_LOG_) {
        console.log(...logGen("", "Demuxer.demux", (e.fatal ? "FATAL" : "Continue") + e.message));
      }
      if (e.fatal) {
        throw new Error(e.message);
      }
      this.prevError = e;
    }
  }
}
const onFragParsingInitSegment = (video, frag, data) => {
  const {tracks} = data;
  for (const type in tracks) {
    if (!type.match(/audio|video/)) {
      continue;
    }
    const track = tracks[type];
    const dest = video.getTrack(type);
    if (track.initSegment) {
      const initSegment = new MP4(track.initSegment);
      const moov = initSegment.root && initSegment.root.moov;
      if (moov) {
        initSegment.id = `${track.container}:${track.codec}:${moov.trak.tkhd.width}:${moov.trak.tkhd.height}:${moov.trak.mdia.mdhd.timeScale}`;
      } else {
        initSegment.id = `${track.container}:${track.codec}:` + "void";
      }
      dest.init = initSegment;
      if (_LOG_) {
        console.log(...logGen("", "onFragParsingInitSegment", `  >> found ${type} initSegment`));
      }
    }
    try {
      if (type === "video") {
        const tkhd = dest.init.root.moov.trak.tkhd;
        dest.quality = tkhd.width / 65536 + " x " + tkhd.height / 65536;
      } else {
        const mdhd = dest.init.root.moov.trak.mdia.mdhd;
        dest.quality = mdhd.timeScale + " Hz";
      }
    } catch (e) {
      dest.quality = "";
    }
  }
};
const onFragParsingData = (video, frag, data) => {
  const {type, startPTS, endPTS, startDTS, endDTS, hasAudio, hasVideo, dropped, nb, data1, data2} = data;
  if (!type.match(/audio|video/)) {
    return;
  }
  const dest = video.getTrack(type);
  let initSegment = dest.init;
  const pos = frag._n;
  if (initSegment && initSegment.id.includes("void")) {
    if (MpegAudio.isHeader(data2, 0)) {
      const mp3header = MpegAudio.parseHeader(data2, 0);
      initSegment = dest.init = createMP3InitSegment(mp3header);
    }
  }
  if (data1 && !data2) {
    const mp4 = new MP4(new Uint8Array(data1));
    const sn = frag.sn;
    const moofS = mp4.root.moofs[sn].offset;
    const moofE = moofS + mp4.root.moofs[sn].wholeSize;
    dest.moofs[pos] = new Blob([data1.slice(moofS, moofE)]);
    dest.mdats[pos] = new Blob([mp4.root.mdats[sn].data]);
  } else {
    if (initSegment && initSegment.id.includes("mp3")) {
      const {moof, mdat} = createMP3Moof(data2);
      dest.moofs[pos] = moof;
      dest.mdats[pos] = mdat;
    } else {
      dest.moofs[pos] = new Blob([data1]);
      dest.mdats[pos] = new Blob([data2]);
    }
  }
  dest.start[pos] = frag.start;
  dest.duration += frag.duration;
  video.size += (data1 && data1.length || 0) + (data2 && data2.length || 0);
};
const sortFragments = (list) => {
  const N = 100000;
  list.sort((a, b) => a.cc * N + a.start - (b.cc * N + b.start));
  return list;
};
const fetchFragment = async(context, fragment, retryCount, timeout) => {
  retryCount = Math.max(1, Math.min(5, retryCount || 1));
  if (fragment.decryptdata && fragment.decryptdata.uri != null && fragment.decryptdata.key == null) {
    return {error:new Error("HLS-encryption is not supported : abort"), data:null};
  }
  if (_LOG_) {
    console.log(...fragmentLog("Load Fragment : ", fragment));
  }
  const originHeaders = fragment._parent && fragment._parent.requestHeaders || context.requestHeaders;
  let lastError = null;
  let testHeaders = null;
  for (let i = 0; i < retryCount; i++) {
    const headers = testHeaders || originHeaders;
    try {
      const buffer = await LM_Get({url:fragment.url, method:"GET", headers, resultType:"arrayBuffer", timeout});
      fragment.loaded = buffer.byteLength;
      fragment.autoLevel = false;
      return {error:null, data:buffer};
    } catch (e) {
      if (e.status === 408) {
        return {error:e, data:null};
      } else {
        if (e.status === -1) {
          i++;
        }
      }
      if (_LOG_) {
        console.log(...logGen("", "fetchFragment", "retry LM_Get at fetchFragment"));
      }
      lastError = e;
    }
    await sleep(1000);
  }
  return {error:lastError, data:null};
};
const fragmentLog = (title, fragment) => {
  return [`${title}    -   CC:${fragment.cc} , SN:${fragment.sn} , start:${fragment.start !== undefined ? fragment.start : ""}  ${fragment.url}`];
};
"use strict";
const _ILOG_ = localStorage.ilog;
const CONTIG_THRESHOLD_SEC = 0.1;
const interceptLoader = async(context) => {
  showImportantNotice("capture");
  document.getElementById("waitingData").style.display = "block";
  let videos = {};
  let vCnt = 0;
  let success = false;
  const messageHandler = (message, sender, sendResponse) => {
    sendResponse();
    if (context.mode === MODE_NORMAL) {
      return WebExtensions.runtime.onMessage.removeListener(messageHandler);
    }
    (async() => {
      const {cmd, params} = message;
      if (cmd === "ondata") {
        const {url, mimetype, mediasourceid, bufferid, timestamp} = params;
        if (!success) {
          success = true;
          sendMessage({cmd:"intercept_success", params:{}});
          document.getElementById("waitingData").style.display = "none";
        }
        let video = videos[mediasourceid];
        if (!video) {
          if (_ILOG_) {
            console.log("......+ create new video " + mediasourceid);
          }
          video = videos[mediasourceid] = new CapturedVideo(mediasourceid);
          context.append(video);
          vCnt++;
        }
        if (mimetype.includes("webm")) {
          video.ui.setError(i18n.getMessage("webm_detected"));
          return;
        }
        let {tracks, index} = video;
        if (url === "abort") {
          if (_ILOG_) {
            console.log("------x abort");
          }
          const flushed = await flush(video, SOURCE_TYPE_MEDIASTREAM, FLUSH_ALL);
          delete videos[mediasourceid];
          vCnt--;
          return;
        }
        const blob = await loadExternalBlob(url);
        const array = await readBlob(blob);
        const wholeMP4 = new MP4(new Uint8Array(array));
        const mp4s = divideByTrack(wholeMP4);
        for (const mp4 of mp4s) {
          const trackId = bufferid + (mp4s.length === 1 ? "" : mp4s.indexOf(mp4));
          if (videos[mediasourceid]) {
            video = videos[mediasourceid];
          }
          let duration = 0;
          const hasInitSegment = mp4.root.moovs;
          const hasMoof = mp4.root.moofs;
          const hasMdat = mp4.root.mdats || mp4.mdat;
          if (index[trackId] === undefined) {
            index[trackId] = tracks.length;
            tracks.push({init:null, moofs:[], mdats:[], start:[], duration:[], contig:0, mimetype, quality:""});
          }
          const track = tracks[index[trackId]];
          if (_ILOG_) {
            const isVideo = mimetype.includes("video") || mimetype.includes("avc1");
            const isAudio = mimetype.includes("audio") || mimetype.includes("mp4a");
            const {moofDuration, moofStart} = getMoofDeltaAndDuration(track.init, mp4.root);
            const _media = track.init ? track.init.root.moov.trak.tkhd.width > 0 ? "video" : "audio" : "unknown";
            const mime = "[" + (isAudio ? "audio/" : "") + (isVideo ? "video" : "");
            const contain = (hasInitSegment ? "initSeg " : "") + (hasMoof ? "Moof " : "") + (hasMdat ? "Mdat" : "") + "]";
            console.log(mediasourceid, bufferid, mime, contain, moofStart + "\u0394" + moofDuration, mp4s.indexOf(mp4) + "-" + _media);
          }
          if (hasInitSegment) {
            if (track.init && isCompleteTrack(tracks) && (!hasMoof && !hasMdat || (hasMoof || hasMdat) && !isSameInitSegment(track.init, mp4))) {
              if (_ILOG_) {
                console.log("---+--- new init segment found");
              }
              const flushed = await flush(video, SOURCE_TYPE_MEDIASTREAM, FLUSH_ALL);
              video = videos[mediasourceid] = new CapturedVideo(mediasourceid, video);
              context.append(video);
            }
            track.init = mp4;
            const trak = track.init.root.moov.trak;
            if (trak) {
              if (trak.tkhd.width) {
                track.quality = trak.tkhd.width / 65536 + " x " + trak.tkhd.height / 65536;
                track.mimetype = "video";
              } else {
                track.quality = trak.mdia.mdhd.timeScale + " Hz";
                track.mimetype = "audio";
              }
            }
          }
          if (hasMoof) {
            if (mp4.root.moofs[0] && mp4.root.moofs[0].traf && mp4.root.moofs[0].traf.senc) {
              video.ui.setError('<span style="font-size:small;color:#f00">' + i18n.getMessage("drm_detected") + "</span>");
            }
            const timeScale = getTrackTimeScale(track);
            if (mp4.isDivided) {
              track.moofs.push(mp4);
              const {moofDuration, moofStart} = getMoofDeltaAndDuration(track.init, mp4.root);
              track.start.push(moofStart);
              track.duration.push(moofDuration);
              if (index[trackId] === 0) {
                duration += moofDuration;
              }
            } else {
              for (let i = 0, len = mp4.root.moofs.length; i < len; i++) {
                const moof = mp4.root.moofs[i];
                const moofS = moof.offset;
                const moofE = moofS + moof.wholeSize;
                track.moofs.push(new Blob([array.slice(moofS, moofE)]));
                const {moofDuration, moofStart} = getMoofDeltaAndDuration(track.init, mp4.root, i);
                track.start.push(moofStart);
                track.duration.push(moofDuration);
                if (index[trackId] === 0) {
                  duration += moofDuration;
                }
              }
            }
          }
          if (hasMdat) {
            if (mp4.isDivided) {
              track.mdats.push(mp4.mdat);
            } else {
              for (const mdat of mp4.root.mdats) {
                track.mdats.push(new Blob([mdat.data]));
              }
            }
          }
          checkAVSync(tracks);
          if (isDiscontigTrack(track)) {
            const flushed = await flush(video, SOURCE_TYPE_MEDIASTREAM);
            if (flushed) {
              video = videos[mediasourceid] = new CapturedVideo(mediasourceid, video);
              context.append(video);
            }
          }
          video.ui.addDuration(duration);
          document.title = (vCnt === 1 ? video.ui.getDurationString() + " - " : "") + i18n.getMessage("title_recording");
          video.ui.setQuality(video.qualityLabel);
        }
        video.ui.addSize(wholeMP4.data.byteLength);
        video.createPreviewOnce(1);
      } else {
        if (cmd === "disconnect") {
          if (_ILOG_) {
            console.log("------: disconnect");
          }
          for (const mediaSourceId in videos) {
            const video = videos[mediaSourceId];
            const flushed = await flush(video, SOURCE_TYPE_MEDIASTREAM, FLUSH_ALL);
            document.title = i18n.getMessage("title_completed") + (vCnt === 1 ? " - " + video.ui.getDurationString() : "");
          }
        }
      }
    })();
  };
  WebExtensions.runtime.onMessage.addListener(messageHandler);
  await sendMessage({cmd:"intercept", params:{}});
};
const divideByTrack = (srcMP4) => {
  const src = srcMP4.root;
  if (src.moov) {
    const traks = src.moov.traks;
    const len = traks.length;
    if (len > 1 && src.moov.mvex.trexs.length === len) {
      const result = [];
      for (let i = 0; i < len; i++) {
        const mp4 = new MP4;
        const root = mp4.root;
        if (src.ftyp) {
          root.append(src.ftyp);
        }
        root.append(new MP4.Box("moov"));
        root.moov.append(src.moov.mvhd);
        root.moov.append(new MP4.Box("mvex"));
        root.moov.mvex.append(src.moov.mvex.trexs[i]);
        root.moov.append(src.moov.traks[i]);
        root.arrange();
        result.push(mp4);
      }
      return result;
    }
  } else {
    if (src.moof) {
      const trafs = src.moof.trafs;
      const len = trafs.length;
      if (len > 1) {
        const result = [];
        let dataOffset = 0;
        for (let i = 0; i < len; i++) {
          let mdatSize = 0;
          for (const s of src.moof.trafs[i].trun.samples) {
            mdatSize += s.size;
          }
          const mp4 = new MP4;
          const root = mp4.root;
          if (src.styp) {
            root.append(src.styp);
          }
          if (src.sidx) {
            root.append(src.sidx);
          }
          root.append(new MP4.Box("moof"));
          root.moof.append(src.moof.mfhd);
          root.moof.append(src.moof.trafs[i]);
          root.arrange();
          root.publish(null, null, () => {
          });
          result.push(mp4);
          const mdat = src.mdat.data.slice(8 + dataOffset, 8 + dataOffset + mdatSize);
          dataOffset += mdatSize;
          const header = new Uint8Array(8);
          mdatSize += 8;
          header.set([mdatSize >> 24 & 255, mdatSize >> 16 & 255, mdatSize >> 8 & 255, mdatSize & 255, 109, 100, 97, 116]);
          mp4.mdat = new Blob([header, mdat]);
          mp4.isDivided = true;
        }
        return result;
      }
    }
  }
  return [srcMP4];
};
const getTrackTimeScale = (track) => {
  const mdia = track && track.init && track.init.root && track.init.root.moov && track.init.root.moov.trak && track.init.root.moov.trak.mdia;
  if (mdia) {
    const ts = mdia.mdhd && mdia.mdhd.timeScale;
    if (ts) {
      return ts;
    } else {
      if (mdia.hdlr) {
        if (mdia.hdlr.handlerType === "vide") {
          return 90000;
        }
        if (mdia.hdlr.handlerType === "soun") {
          return 48000;
        }
      }
    }
  }
  return 1000;
};
const getMoofBaseMediaDecodeTime = (moof) => {
  return moof && moof.traf && moof.traf.tfdt && moof.traf.tfdt.baseMediaDecodeTime || 0;
};
const getMoofDuration = (moof) => {
  let duration = 0;
  const traf = moof && moof.traf;
  if (traf) {
    const tfhd = traf.tfhd;
    const trun = traf.trun;
    const defaultSampleDuration = tfhd && tfhd.defaultSampleDuration;
    if (trun) {
      for (const sample of trun.samples) {
        duration += sample.duration || defaultSampleDuration || 0;
      }
    }
  }
  return duration;
};
const getMoofDeltaAndDuration = (init, root, index) => {
  index = index || 0;
  const moof = root && root.moofs && root.moofs[index];
  const sidx = root && root.sidx;
  if (sidx) {
    const {timeScale, earliestPresentationTime} = sidx;
    let start;
    if (_ILOG_) {
      if (init && init.root && init.root.moov.trak.mdia.mdhd.timeScale !== 0) {
        if (Math.abs(moof.traf.tfdt.baseMediaDecodeTime / init.root.moov.trak.mdia.mdhd.timeScale - earliestPresentationTime / timeScale) > CONTIG_THRESHOLD_SEC) {
          console.log("baseMediaDecodeTime !== earliestPresentationTime", moof.traf.tfdt.baseMediaDecodeTime / init.root.moov.trak.mdia.mdhd.timeScale, earliestPresentationTime / timeScale);
        }
      }
    }
    if (earliestPresentationTime && timeScale) {
      start = earliestPresentationTime / timeScale;
    } else {
      if (moof.traf.tfdt.baseMediaDecodeTime && init && init.root && init.root.moov.trak.mdia.mdhd.timeScale) {
        start = moof.traf.tfdt.baseMediaDecodeTime / init.root.moov.trak.mdia.mdhd.timeScale;
      }
    }
    const subsegmentDuration = sidx.references && sidx.references[index] && sidx.references[index].subsegmentDuration;
    if (timeScale && start !== undefined && subsegmentDuration) {
      const moofDuration = subsegmentDuration / timeScale;
      return {moofDuration, moofStart:start};
    }
  }
  if (moof && init && init.root && init.root.moov) {
    const timeScale = init.root.moov.trak.mdia.mdhd.timeScale;
    const traf = moof.traf;
    if (traf && timeScale) {
      const {tfhd, trun, tfdt} = traf;
      if (tfhd && tfdt && trun) {
        const moofStart = tfdt.baseMediaDecodeTime / timeScale;
        const defaultSampleDuration = tfhd.defaultSampleDuration;
        if (trun.samples) {
          let moofDuration = 0;
          for (const sample of trun.samples) {
            moofDuration += sample.duration || defaultSampleDuration || 0;
          }
          if (moofDuration === 0) {
            const sampleDuration = init.root.moov.mvex && init.root.moov.mvex.trex && init.root.moov.mvex.trex.sampleDuration || 0;
            moofDuration = (trun.sampleCount || 0) * sampleDuration;
          }
          moofDuration /= timeScale;
          if (_ILOG_) {
            console.log("#2, moofStart:" + moofStart + " , moofDuration:" + moofDuration);
          }
          return {moofDuration, moofStart};
        }
      }
    }
  }
  return {moofDuration:0, moofStart:0};
};
const isDiscontigTrack = (track) => {
  if (track && track.start) {
    const len = track.start.length;
    if (len > 1) {
      for (let i = track.contig; i < len - 1; i++) {
        const start = track.start[i];
        const duration = track.duration[i];
        const next = track.start[i + 1];
        if (Math.abs(start + duration - next) > CONTIG_THRESHOLD_SEC) {
          if (_ILOG_) {
            console.log("---:--- discontig track found");
            console.log("        start:" + start, "duration:" + duration, "next:" + next);
            console.log("        " + JSON.stringify(track.start));
            console.log("        " + JSON.stringify(track.duration));
          }
          return true;
        }
        track.contig = i + 1;
      }
    }
  }
  return false;
};
const isCompleteTrack = (tracks) => {
  let trackCnt = 0;
  for (const track of tracks) {
    if (track.init && track.moofs.length > 0) {
      trackCnt++;
    }
  }
  return tracks.length === trackCnt;
};
const checkAVSync = (tracks) => {
  for (const track of tracks) {
    if (track.init && track.moofs.length > 1) {
      const last = track.moofs.length - 1;
      if (track.start[last] === track.start[last - 1] && track.duration[last] === track.duration[last - 1]) {
        if (_ILOG_) {
          console.log("[ - ]   remove same start/duration");
          console.log("        track-start    " + JSON.stringify(track.start.map((v) => Math.floor(v * 10) / 10)));
          console.log("        track-duration " + JSON.stringify(track.duration.map((v) => Math.floor(v * 10) / 10)));
          console.log("        track-moof    " + JSON.stringify(track.moofs.map((v) => 1)));
          console.log("        track-mdat " + JSON.stringify(track.mdats.map((v) => 1)));
        }
        track.moofs.splice(last - 1, 1);
        track.mdats.splice(last - 1, 1);
        track.start.splice(last - 1, 1);
        track.duration.splice(last - 1, 1);
      }
    }
  }
  if (tracks.length !== 2) {
    return;
  }
  if (tracks[0].start.length < 1 || tracks[1].start.length < 1) {
    return;
  }
  const a = tracks[0];
  const b = tracks[1];
  let t = null;
  let diff = Math.abs(a.start[0] - b.start[0]);
  if (a.start.length > 1) {
    const candidate = Math.abs(a.start[1] - b.start[0]);
    if (candidate < diff) {
      diff = candidate;
      t = a;
    }
  }
  if (b.start.length > 1) {
    const candidate = Math.abs(b.start[1] - a.start[0]);
    if (candidate < diff) {
      diff = candidate;
      t = b;
    }
  }
  if (t) {
    if (_ILOG_) {
      console.log("[ - ]   remove the first to sync a/v");
      console.log("        a " + JSON.stringify(a.start.map((v) => Math.floor(v * 10) / 10)));
      console.log("        b " + JSON.stringify(b.start.map((v) => Math.floor(v * 10) / 10)));
    }
    t.moofs.splice(0, 1);
    t.mdats.splice(0, 1);
    t.start.splice(0, 1);
    t.duration.splice(0, 1);
  }
};
"use strict";
const MODE_NORMAL = 1;
const MODE_CAPTURE = 2;
const MODE_TEST = 3;
const SOURCE_TYPE_TS = 1;
const SOURCE_TYPE_MEDIASTREAM = 2;
const SELECT_STATUS_ERROR = -1;
const SELECT_STATUS_CONTINUE = 2;
const QUALITY_HIGH = "quality_high";
const QUALITY_LOW = "quality_low";
const QUALITY_CUSTOM = "quality_custom";
const COLOR = {GREEN:{content:"#2a9441", border:"#1a8431"}, RED:{content:"#ff3030", border:"#ef2020"}};
const FLUSH_PART = "FLUSH_PART";
const FLUSH_ALL = "FLUSH_ALL";
const FLUSH_TEST = "FLUSH_TEST";
const _LIVE_ = true;
class Page {
  constructor() {
  }
  init(params) {
    this.title = null;
    this.mastersList = null;
    this.assign(params);
    this.origin = (this.referer.match(/https?:\/\/[^\/]+/) || [])[0] || "";
    this.requestHeaders = {"Referer":this.referer, "Origin":this.origin};
    if (this.videos && this.videos.length > 0) {
      this.removeAllVideos();
    }
    this.videos = [];
    this.hlsLiveVideos = [];
    this.mode = MODE_NORMAL;
  }
  async preload() {
    if (!this.title) {
      sendMessage({cmd:CMD_GET_TITLE, params:{}}).then((pageInfo) => {
        this.title = pageInfo && pageInfo.title || "no-title";
      });
    }
    if (!this.mastersList) {
      if (this.list && this.list.length > 0) {
        try {
          this.mastersList = await getMastersList(this);
        } catch (e) {
          console.error(e);
          document.getElementById("globalError").innerHTML = '<p class="text-error" style="font-size:small">' + e + " : " + i18n.getMessage("error_no_index") + i18n.getMessage("refer_troubleshoot") + "</p>";
          return false;
        }
      }
    }
    return true;
  }
  async test(levelNum) {
    const master = this.mastersList[0];
    const level = master.levels[levelNum];
    const audioLevel = master.audioTracks.length > 0 ? master.audioTracks[0] : null;
    for (const lv of [level, audioLevel]) {
      await initLevel(this, lv);
    }
    const target = {videoNum:0, levelNum, audioNum:0, level, audioLevel, hasOption:false};
    const video = new HLSVideo(target);
    this.append(video);
    await video.load();
    return video;
  }
  async load() {
    const result = await select(this);
    if (result && result.status === SELECT_STATUS_ERROR) {
      document.getElementById("globalError").innerHTML = result.message;
    }
  }
  async tryCapture(showDialog) {
    if (this.mode === MODE_NORMAL) {
      this.mode = MODE_CAPTURE;
      this.removeAllVideos();
      await interceptLoader(this);
    }
  }
  append(video) {
    video.context = this;
    this.videos.push(video);
    if (video.sourceType === SOURCE_TYPE_TS && video.isLive) {
      this.hlsLiveVideos.push(video);
      if (this.hlsLiveVideos.length > 1) {
        for (const v of this.hlsLiveVideos) {
          v.ui.closeButton.style.display = "block";
        }
      }
    }
  }
  remove(video) {
    const idx = this.videos.indexOf(video);
    if (idx >= 0) {
      this.videos.splice(idx, 1);
    }
    if (video.sourceType === SOURCE_TYPE_TS && video.isLive) {
      const idx = this.hlsLiveVideos.indexOf(video);
      if (idx >= 0) {
        this.hlsLiveVideos.splice(idx, 1);
      }
      if (this.hlsLiveVideos.length <= 1) {
        for (const v of this.hlsLiveVideos) {
          v.ui.closeButton.style.display = "none";
        }
      }
    }
    video.destroy();
  }
  removeAllVideos() {
    for (const video of this.videos) {
      video.destroy();
    }
    this.videos = [];
    this.hlsLiveVideos = [];
  }
  get settings() {
    return Object.assign({level:0, quality:QUALITY_LOW, captureMode:false}, JSON.parse(localStorage[this.origin] || "{}"));
  }
  set settings(newSettings) {
    const r = Object.assign(this.settings, newSettings);
    localStorage[this.origin] = JSON.stringify(r);
  }
  static settings(referer) {
    const origin = (referer.match(/https?:\/\/[^\/]+/) || [])[0] || "";
    return Object.assign({level:0, quality:QUALITY_LOW, captureMode:false}, JSON.parse(localStorage[origin] || "{}"));
  }
  assign(params) {
    for (const key in params) {
      this[key] = params[key];
    }
  }
}
const select = (context, currentVideo) => {
  return new Promise(async(resolve, reject) => {
    try {
      let {mastersList} = context;
      let level = null;
      let audioLevel = null;
      let success = 0;
      for (let videoNum = 0, len = mastersList.length; videoNum < len; videoNum++) {
        let hasOption = false;
        const master = mastersList[videoNum];
        if (currentVideo && currentVideo.videoNum !== videoNum) {
          continue;
        }
        let levelNum = 0, audioNum = 0;
        try {
          if (master.levels.length > 1) {
            const {level, quality} = context.settings;
            if (!currentVideo) {
              levelNum = quality === QUALITY_LOW ? 0 : quality === QUALITY_HIGH ? master.levels.length - 1 : level;
            } else {
              context.settings = await selectLevel(context, master.levels);
              levelNum = context.settings.level;
            }
            hasOption = true;
          }
          levelNum = Math.max(0, Math.min(master.levels.length - 1, levelNum));
          level = master.levels[levelNum];
          audioLevel = null;
          if (master.audioTracks.length > 0) {
            const audioTracks = [];
            for (const audio of master.audioTracks) {
              if (audio.groupId === level.attrs.AUDIO) {
                audioTracks.push(audio);
              }
            }
            if (audioTracks.length === 1) {
              audioLevel = audioTracks[0];
            } else {
              if (audioTracks.length > 0) {
                const n = currentVideo ? await selectAudio(context, audioTracks) : audioTracks.length - 1;
                audioLevel = audioTracks[n];
              } else {
                const n = currentVideo ? await selectAudio(context, master.audioTracks) : audioTracks.length - 1;
                audioLevel = master.audioTracks[n];
              }
            }
            audioNum = master.audioTracks.indexOf(audioLevel);
            hasOption = true;
          }
        } catch (e) {
          if (currentVideo) {
            return resolve({status:SELECT_STATUS_CONTINUE, message:null});
          } else {
            continue;
          }
        }
        if (currentVideo && currentVideo.levelNum === levelNum && currentVideo.audioNum === audioNum) {
          return resolve({status:SELECT_STATUS_CONTINUE});
        }
        for (const lv of [level, audioLevel]) {
          await initLevel(context, lv);
        }
        if (!level || !level.details) {
          continue;
        }
        const target = {videoNum, levelNum, audioNum, level, audioLevel, hasOption};
        if (level.details.live) {
          if (currentVideo) {
            context.remove(currentVideo);
          }
          const video = new HLSVideo(target, _LIVE_);
          context.append(video);
          video.load().catch((e) => {
            showErrorDetail(video, e);
          });
        } else {
          if (currentVideo) {
            context.remove(currentVideo);
          }
          const video = new HLSVideo(target);
          context.append(video);
          video.load().catch((e) => {
            showErrorDetail(video, e);
          });
        }
        success++;
      }
      if (success === 0) {
        return resolve({status:SELECT_STATUS_ERROR, message:i18n.getMessage("error_no_downloadable")});
      }
    } catch (e) {
      console.error(e);
      resolve({status:SELECT_STATUS_ERROR, message:e.message + " : " + i18n.getMessage("error_quality_select")});
    }
  });
};
const showErrorDetail = (video, err) => {
  console.error(err);
  let msg = "";
  if (err.message.includes("Failed to fetch")) {
    msg = i18n.getMessage("error_fetch");
  } else {
    if (err.message.includes("HLS-encryption")) {
      return video.ui.setError('<p style="color:#c00">' + err.message + "</p>");
    } else {
      if (err.message === "403") {
        msg = i18n.getMessage("error_403");
      } else {
        if (err.message === "404") {
          msg = i18n.getMessage("error_404");
        } else {
          if (err.message === "408") {
            msg = i18n.getMessage("error_408");
          } else {
            msg = i18n.getMessage("error_label");
          }
        }
      }
    }
  }
  const refer = i18n.getMessage("refer_troubleshoot");
  video.ui.setError(msg + refer + i18n.getMessage("error_try_capture") + "(" + err + ")");
};
const getMastersList = async(context) => {
  const {list} = context;
  let result = [];
  let foundMaster = false;
  for (const params of list) {
    const referer = params.referer || context.referer;
    const origin = (referer.match(/https?:\/\/[^\/]+/) || [])[0] || "";
    const requestHeaders = {"Referer":referer, "Origin":origin};
    const optionalHeaders = {};
    if (params.addition) {
      for (const h of params.addition) {
        if (h.value) {
          optionalHeaders[h.name] = h.value;
        }
      }
    }
    const url = URLToolkit.buildAbsoluteURL(referer, params.url, {alwaysNormalize:true});
    const playList = new PlayListLoader;
    let httpStatus = await playList.load(url, requestHeaders);
    if (httpStatus !== 300) {
      httpStatus = await playList.load(url, optionalHeaders);
    }
    if (httpStatus === 300) {
      if (playList.isMaster) {
        if (!foundMaster) {
          result = [];
          foundMaster = true;
        }
        const master = playList.master;
        const {levels, audioTracks} = master;
        result.push({url, levels, audioTracks});
        for (const level of [...levels, ...audioTracks]) {
          if (!level.url) {
            continue;
          }
          const tmpUrl = typeof level.url === "string" ? level.url : level.url[0];
          const subListUrl = URLToolkit.buildAbsoluteURL(referer, tmpUrl, {alwaysNormalize:true});
          const subList = new PlayListLoader;
          httpStatus = await subList.load(subListUrl, requestHeaders);
          if (httpStatus !== 300) {
            httpStatus = await subList.load(subListUrl, optionalHeaders);
          }
          if (httpStatus === 300) {
            if (subList.isLevelDetail) {
              level.details = subList.details;
              level.details.requestHeaders = requestHeaders;
            } else {
              if (_LOG_) {
                console.log("Skip error at subList.load", subListUrl, httpStatus);
              }
            }
          }
        }
      } else {
        if (playList.isLevelDetail) {
          if (!foundMaster) {
            const level = {attrs:{}, audioCodec:null, videoCodec:null, width:0, height:0, bitrate:0, details:playList.details, url};
            level.details.requestHeaders = requestHeaders;
            result.push({url, levels:[level], audioTracks:[]});
          }
        }
      }
    } else {
      if (_LOG_) {
        console.log("Skip error at playList.load", url, httpStatus);
      }
    }
  }
  return result;
};
const initLevel = async(context, level) => {
  if (level) {
    const details = level.details;
    if (details) {
      if (details.needSidxRanges) {
        const sidxUrl = details.initSegment.url;
      }
      if (details.initSegment) {
        const {data, error} = await fetchFragment(context, details.initSegment);
        details.initSegment.data = error ? null : new Uint8Array(data);
      } else {
        details.initSegment = {data:null};
      }
      const demuxer = new Demuxer(level);
      details.demuxer = demuxer;
      let n = 0, cc = -1;
      for (const fragment of details.fragments) {
        if (cc !== fragment.cc) {
          cc = fragment.cc;
          n = 0;
        }
        fragment._parent = details;
        fragment.demuxer = demuxer;
        fragment._n = n;
        n++;
      }
    }
  }
};
const copyAllTracks = (tracks) => {
  if (_ILOG_) {
    console.log("------# Copy all tracks");
  }
  const valid = [];
  for (const track of tracks) {
    if (track.init && track.moofs.length > 0) {
      const moofs = track.moofs.slice(0);
      const mdats = track.mdats.slice(0);
      const start = track.start.slice(0);
      const {mimetype, init} = track;
      valid.push({mimetype, init, moofs, mdats, start});
    }
  }
  return valid;
};
const getValidTracks = (tracks, option) => {
  if (_ILOG_) {
    console.log("------# Get valid tracks, option = " + (option || "NO_OPTION"));
  }
  const valid = [];
  if (option === FLUSH_ALL) {
    for (const track of tracks) {
      if (track.init && track.moofs.length > 0) {
        const moofs = track.moofs.splice(0);
        const mdats = track.mdats.splice(0);
        const start = track.start.splice(0);
        const duration = track.duration.splice(0);
        const {mimetype, init} = track;
        valid.push({mimetype, init, moofs, mdats, start});
      }
    }
    return valid;
  }
  let trackCnt = 0;
  const durations = [];
  for (const track of tracks) {
    if (track.init && track.moofs.length > 0) {
      trackCnt++;
      track.contig = 0;
      isDiscontigTrack(track);
      durations.push(track.start[track.contig] + track.duration[track.contig]);
    }
  }
  if (trackCnt === 0) {
    return valid;
  }
  if (tracks.length !== trackCnt) {
    return valid;
  }
  if (_ILOG_) {
    console.log("------# durations " + JSON.stringify(durations));
  }
  const stop = Math.min(...durations) + CONTIG_THRESHOLD_SEC;
  const slice = option === FLUSH_TEST ? "slice" : "splice";
  for (const track of tracks) {
    const len = track.moofs.length;
    if (track.init && len > 0) {
      let i = 0;
      for (; i < len; i++) {
        const start = track.start[i];
        const duration = track.duration[i];
        if (track.start[i] + track.duration[i] > stop) {
          break;
        }
        if (i < len - 1) {
          const next = track.start[i + 1];
          if (Math.abs(start + duration - next) > CONTIG_THRESHOLD_SEC) {
            i++;
            break;
          }
        }
      }
      if (i > 0) {
        const moofs = track.moofs[slice](0, i);
        const mdats = track.mdats[slice](0, i);
        const start = track.start[slice](0, i);
        const duration = track.duration[slice](0, i);
        const {mimetype, init} = track;
        valid.push({mimetype, init, moofs, mdats, start});
      }
    }
    track.contig = 0;
  }
  if (_ILOG_) {
    for (let i = 0, len = valid.length; i < len; i++) {
      const track = valid[i];
      console.log("------# Write buffer(" + i + ")  " + JSON.stringify(track.start.map((v) => Math.floor(v * 10) / 10)));
    }
    for (let i = 0, len = tracks.length; i < len; i++) {
      const track = tracks[i];
      console.log("------# Remains(" + i + ")  " + JSON.stringify(track.start.map((v) => Math.floor(v * 10) / 10)));
    }
  }
  return valid;
};
const flush = async(video, mediaType, opt) => {
  const valid = mediaType === SOURCE_TYPE_TS ? copyAllTracks(video.tracks) : getValidTracks(video.tracks, opt);
  if (valid.length > 0) {
    if (_ILOG_) {
      console.log("------# Flush");
    }
    const context = video.context;
    const option = {skipLiveKeyFrame:mediaType === SOURCE_TYPE_MEDIASTREAM, modifyESDSTrackConfig:mediaType === SOURCE_TYPE_MEDIASTREAM, over4G:video.size > 4 * 1000 * 1000 * 1000, over13H:false};
    const file = await _buildMP4(valid, option);
    const blobURL = URL.createObjectURL(file);
    video.ui.downloadLink.href = blobURL;
    if (file.size < 1048576 * 200) {
      video.ui.video.src = blobURL;
    }
    video.ui.downloadLink.download = (video.title || video.context.title) + (video.isLive ? video.ui.dateLabel : "") + ".mp4";
    if (opt !== FLUSH_TEST) {
      video.ui.terminate();
      if (context && context.mode === MODE_TEST) {
        const md5 = await _md5(file);
        video.ui.downloadLink.setAttribute("md5", md5);
      }
    }
    if (context && context.mode === MODE_CAPTURE) {
      context.settings = {captureMode:true};
    }
    return true;
  } else {
    if (_ILOG_) {
      console.log("------# Flush failed ( valid.length === 0 )");
    }
    if (opt !== FLUSH_TEST) {
      video.ui.terminate();
    }
    return false;
  }
};
"use strict";
const _LOG_ = localStorage.log;
if (_LOG_) {
  console.log(...logGen("", "HLS Loader", "start"));
}
const CMD_GET_INFO = "cmd_get_info";
const CMD_GET_TITLE = "cmd_get_title";
const CMD_UPDATE_INFO = "cmd_update_info";
document.addEventListener("DOMContentLoaded", async function(event) {
  const page = new Page;
  init(page);
  if (window._enable_test_) {
    if (location.href.includes("test")) {
      return await testStart(page);
    }
    const N = (location.href.match(/\?N=(\d+)/) || [])[1];
    if (N !== undefined) {
      if (_LOG_) {
        console.log(...logGen("", "testN", N));
      }
      page.init({tabId:0, rootId:0, referer:testUrls[Number(N)], list:[{url:testUrls[Number(N)]}], title:"N=" + N});
      const ok = await page.preload();
      if (ok) {
        page.mode = MODE_TEST;
        await page.load();
      }
      return;
    }
  }
  await loadItem(page);
});
const loadItem = async(context) => {
  const downloadItem = await sendMessage({cmd:CMD_GET_INFO, params:{}});
  if (!downloadItem) {
    return;
  }
  if (_LOG_) {
    console.log(...logGen("", "downloadItem", JSON.stringify(downloadItem)));
  }
  const {referer, statistics, list} = downloadItem;
  if (statistics) {
    const statDom = document.getElementById("statistics");
    if (statDom) {
      for (const key in statistics) {
        statDom.setAttribute(key, statistics[key]);
      }
    }
  }
  if (list) {
    if (referer) {
      const lang = (location.href.match(/\/(\w\w)\/rec.html/) || [])[1] || "en";
      if (lang === "ja") {
        const gForm = document.querySelector("#section-form a");
        if (gForm) {
          gForm.href = "https://docs.google.com/forms/d/e/1FAIpQLScZgGxpwcut6WDH8GaVw8WCcdZVBC28TmNvBssFzJxGhkFZ8Q/viewform?usp=sf_link" + "&entry.552842524=" + encodeURIComponent(referer);
        }
      }
    }
    context.init(downloadItem);
    if (context.settings.captureMode) {
      document.querySelector("#forceCaptureModal .modal-title").innerHTML = i18n.getMessage("capture_reason_3");
      document.getElementById("forceCaptureButton").click();
    } else {
      await context.preload();
      if (!context.mastersList || context.mastersList.length === 0) {
        document.querySelector("#forceCaptureModal .modal-title").innerHTML = i18n.getMessage("capture_reason_2");
        document.getElementById("forceCaptureButton").click();
      } else {
        document.querySelector("#forceCaptureModal .modal-title").innerHTML = i18n.getMessage("capture_reason_1");
        await context.load();
      }
    }
  }
};
const init = (context) => {
  WebExtensions.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {cmd, params} = message;
    if (cmd === CMD_UPDATE_INFO) {
      sendResponse(true);
    }
    if (cmd === "disconnect") {
      sendResponse(true);
    }
    if (cmd === "ondata") {
      sendResponse(true);
    }
  });
  const restartAsNormal = async() => {
    context.mode = MODE_NORMAL;
    context.settings = {captureMode:false};
    const ok = await context.preload();
    if (ok) {
      await context.load();
    }
  };
  const forceCaptureButton = document.getElementById("forceCaptureButton");
  forceCaptureButton.addEventListener("click", async() => {
    if (forceCaptureButton.checked) {
      const forceCaptureModal = document.getElementById("forceCaptureModal");
      forceCaptureModal.classList.add("active");
      const result = await new Promise((resolve, reject) => {
        const closeBtns = forceCaptureModal.querySelectorAll(".close-modal");
        const _close = () => {
          for (const obj of closeBtns) {
            obj.removeEventListener("click", _close);
          }
          resolve(false);
        };
        for (const obj of closeBtns) {
          obj.addEventListener("click", _close);
        }
        const confirmCaptureOKButton = document.getElementById("confirmCaptureOKButton");
        const _ok = () => {
          confirmCaptureOKButton.removeEventListener("click", _ok);
          resolve(true);
        };
        confirmCaptureOKButton.addEventListener("click", _ok);
      });
      if (result) {
        context.tryCapture();
      } else {
        forceCaptureButton.checked = false;
        document.querySelector("#forceCaptureModal .modal-title").innerHTML = i18n.getMessage("capture_reason_1");
        if (context.settings.captureMode) {
          restartAsNormal();
        }
      }
      forceCaptureModal.classList.remove("active");
    } else {
      restartAsNormal();
    }
  });
};

