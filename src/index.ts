
import { Observable, empty } from 'rxjs';

export interface ChunkManager<TChunk> {
  sliceChunk(source: TChunk, startOffset?: number, endOffset?: number): TChunk;
  createPaddingChunk(length: number): TChunk;
  getChunkLength(chunk: TChunk): number;
  joinChunks(chunks: TChunk[]): TChunk;
}

export interface ChunkHints {
  readonly minChunkSize: number;
  readonly maxChunkSize: number;
  readonly chunkSizeStep: number;
}

export type ChunkHinted<T> = T & ChunkHints;

export type MaybeChunkHinted<T> = T & Partial<ChunkHints>;

export type ChunkOperatorFunction<TChunk> = ChunkHinted<
  (input: MaybeChunkHinted<Observable<TChunk>>) => ChunkHinted<Observable<TChunk>>
>;

export const enum MisalignedTrailerBehavior {
  ERROR = 'error',
  TRUNCATE = 'truncate',
  PASS_THROUGH = 'passThrough',
  PAD = 'pad',
}

export class MisalignedTrailerError extends Error {  
}

export type RechunkFunc<T> = (
  minChunkSize?: number,
  maxChunkSize?: number,
  chunkSizeStep?: number,
  onMisalignedTrailer?: MisalignedTrailerBehavior
) => ChunkHinted<(input: MaybeChunkHinted<Observable<T>>) => ChunkHinted<Observable<T>>>;
export type RechunkParams = Parameters<RechunkFunc<unknown>>;

const NO_CHUNKS_AUX = Object.assign(
  new Observable<never>(subscriber => subscriber.complete()),
  {minChunkSize:0, maxChunkSize:0, chunkSizeStep:0}
);
const NO_CHUNKS: ChunkOperatorFunction<unknown> = Object.assign(
  () => NO_CHUNKS_AUX,
  {minChunkSize:0, maxChunkSize: 0, chunkSizeStep: 0}
);

export function rechunk<TChunk>(
  chunkManager: ChunkManager<TChunk>,
  minChunkSize = 1,
  maxChunkSize = minChunkSize,
  chunkSizeStep = (minChunkSize === maxChunkSize) ? 0 : 1,
  onMisalignedTrailer = MisalignedTrailerBehavior.ERROR,
): ChunkOperatorFunction<TChunk>
{
  if (!Number.isInteger(minChunkSize)) throw new TypeError('min chunk size must be an integer');
  if (minChunkSize < 0) throw new RangeError('min chunk size cannot be negative');
  if (!Number.isInteger(maxChunkSize) && maxChunkSize !== Infinity) {
    throw new TypeError('max chunk size must either be infinite or an integer');
  }
  if (maxChunkSize < 0) throw new RangeError('max chunk size cannot be negative');
  if (!Number.isInteger(chunkSizeStep)) throw new TypeError('chunk size step must be an integer');
  if (chunkSizeStep < 0) throw new RangeError('chunk size step cannot be negative');
  if (maxChunkSize === 0 || maxChunkSize < minChunkSize) {
    return NO_CHUNKS as ChunkOperatorFunction<TChunk>;
  }
  if (minChunkSize === maxChunkSize) {
    chunkSizeStep = 0;
  }
  else if ((maxChunkSize - minChunkSize) < chunkSizeStep) {
    maxChunkSize = minChunkSize;
    chunkSizeStep = 0;
  }
  else if (chunkSizeStep === 0) {
    maxChunkSize = minChunkSize;
  }
  else {
    maxChunkSize -= (maxChunkSize - minChunkSize) % chunkSizeStep;
  }
  if (minChunkSize === 0 && maxChunkSize !== 0) {
    minChunkSize = 1;
  }
  const opFunc = (input: MaybeChunkHinted<Observable<TChunk>>): ChunkHinted<Observable<TChunk>> => {
    const bufChunks = new Array<TChunk>();
    let bufSize = 0;
    return Object.assign(new Observable<TChunk>(subscriber => {
      return input.subscribe(
        chunk => {
          let len = chunkManager.getChunkLength(chunk);
          if (len < 1) return;
          if ((bufSize + len) < minChunkSize) {
            bufChunks.push(chunk);
            bufSize += len;
            return;
          }
          if (bufSize !== 0) {
            bufChunks.push(chunk);
            chunk = chunkManager.joinChunks(bufChunks);
            len += bufSize;
            bufSize = 0;
            bufChunks.length = 0;
          }
          do {
            const sliceLen = (len >= maxChunkSize) ? maxChunkSize : len - (len - minChunkSize) % chunkSizeStep;
            if (sliceLen === len) {
              subscriber.next(chunk);
              return;
            }
            else {
              subscriber.next(chunkManager.sliceChunk(chunk, 0, sliceLen));
              chunk = chunkManager.sliceChunk(chunk, sliceLen);
              len -= sliceLen;
            }
          } while (len >= minChunkSize);
          bufChunks.push(chunk);
          bufSize = len;
        },
        e => subscriber.error(e),
        () => {
          if (bufSize !== 0) switch (onMisalignedTrailer) {
            case MisalignedTrailerBehavior.ERROR: {
              subscriber.error(new MisalignedTrailerError());
              return;
            }
            case MisalignedTrailerBehavior.PAD: {
              bufChunks.push(chunkManager.createPaddingChunk(minChunkSize - bufSize));
              subscriber.next(chunkManager.joinChunks(bufChunks));
              break;
            }
            case MisalignedTrailerBehavior.PASS_THROUGH: {
              subscriber.next(chunkManager.joinChunks(bufChunks));
              break;
            }
            case MisalignedTrailerBehavior.TRUNCATE: {
              bufChunks.length = 0;
              break;
            }
          }
          subscriber.complete();
        },
      );
    }), {
      minChunkSize,
      maxChunkSize,
      chunkSizeStep,
    });
  };
  return Object.assign(opFunc, {
    minChunkSize,
    maxChunkSize,
    chunkSizeStep,
  });
}
