
import { ChunkManager, rechunk, RechunkFunc } from './index';

export const STRINGS: ChunkManager<string> = {
  sliceChunk: (source, startOffset = 0, endOffset = source.length) => source.slice(startOffset, endOffset),
  createPaddingChunk: length => ' '.repeat(length),
  getChunkLength: chunk => chunk.length,
  joinChunks: chunks => chunks.join(''),
};

export const rechunkStrings: RechunkFunc<string> = (...params) => rechunk(STRINGS, ...params);
