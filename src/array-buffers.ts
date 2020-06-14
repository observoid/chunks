
import { ChunkManager, rechunk, RechunkFunc } from './index';

const ARRAYBUFFER_CHUNKS: ChunkManager<ArrayBuffer> = {
  sliceChunk: (ab: ArrayBuffer, startOffset = 0, endOffset = ab.byteLength) => {
    return ab.slice(startOffset, endOffset);
  },
  createPaddingChunk: length => new ArrayBuffer(length),
  getChunkLength: ab => ab.byteLength,
  joinChunks: (abs) => {
    const buf = new Uint8Array(abs.reduce((len, ab) => len + ab.byteLength, 0));
    let offset = 0;
    for (const ab of abs) {
      buf.set(new Uint8Array(ab), offset);
      offset += ab.byteLength;
    }
    return buf.buffer;
  },
};

export const rechunkArrayBuffers: RechunkFunc<ArrayBuffer> = (...params) => rechunk(ARRAYBUFFER_CHUNKS, ...params);

const UINT8ARRAY_CHUNKS: ChunkManager<Uint8Array> = {
  sliceChunk: (u8, startOffset = 0, endOffset = u8.length) => u8.subarray(startOffset, endOffset),
  createPaddingChunk: length => new Uint8Array(length),
  getChunkLength: u8 => u8.length,
  joinChunks: (u8s) => {
    const joined = new Uint8Array(u8s.reduce((len, u8) => len + u8.length, 0));
    let offset = 0;
    for (const u8 of u8s) {
      joined.set(u8, offset);
      offset += u8.length;
    }
    return joined;
  },
};

export const rechunkUint8Arrays: RechunkFunc<Uint8Array> = (...params) => rechunk(UINT8ARRAY_CHUNKS, ...params);

const INT8ARRAY_CHUNKS: ChunkManager<Int8Array> = {
  sliceChunk: (i8, startOffset = 0, endOffset = i8.length) => i8.subarray(startOffset, endOffset),
  createPaddingChunk: length => new Int8Array(length),
  getChunkLength: i8 => i8.length,
  joinChunks: (i8s) => {
    const joined = new Int8Array(i8s.reduce((len, u8) => len + u8.length, 0));
    let offset = 0;
    for (const u8 of i8s) {
      joined.set(u8, offset);
      offset += u8.length;
    }
    return joined;
  },
};

export const rechunkInt8Arrays: RechunkFunc<Int8Array> = (...params) => rechunk(INT8ARRAY_CHUNKS, ...params);

const DATAVIEW_CHUNKS: ChunkManager<DataView> = {
  sliceChunk: (dv, startOffset = 0, endOffset = dv.byteLength) => (
    new DataView(dv.buffer, dv.byteOffset + startOffset, endOffset - startOffset)
  ),
  createPaddingChunk: length => new DataView(new ArrayBuffer(length)),
  getChunkLength: (dv) => dv.byteLength,
  joinChunks(dvs) {
    const joined = new Uint8Array(dvs.reduce((len, u8) => len + u8.byteLength, 0));
    let offset = 0;
    for (const dv of dvs) {
      joined.set(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength), offset);
      offset += dv.byteLength;
    }
    return new DataView(joined.buffer, joined.byteOffset, joined.byteLength);
  },
};

export const rechunkDataViews: RechunkFunc<DataView> = (...params) => rechunk(DATAVIEW_CHUNKS, ...params);
