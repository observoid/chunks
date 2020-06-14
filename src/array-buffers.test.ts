
import { TestHarness } from 'zora';
import { rechunkArrayBuffers, rechunkUint8Arrays, rechunkInt8Arrays, rechunkDataViews } from '../lib/array-buffers';
import { from } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { MisalignedTrailerBehavior } from '../lib';

export default (t: TestHarness) => {

  t.test('rechunkArrayBuffers', t => {

    t.test('basic usage', async t => {

      const inout = [ [1], [2, 3, 4, 5], [6, 7], [8], [9] ];
      const expectedResult = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 0] ];

      const actualResult = await from(inout.map(v => new Uint8Array(v).buffer as ArrayBuffer))
        .pipe( rechunkArrayBuffers(2, 2, 0, MisalignedTrailerBehavior.PAD), toArray() )
        .toPromise();
      
      t.eq(actualResult.map(v => [...new Uint8Array(v)]), expectedResult);

    });

  });

  t.test('rechunkUint8Arrays', t => {

    t.test('basic usage', async t => {

      const input = [ [1], [2, 3, 4, 5], [6, 7], [8], [9] ];
      const expectedResult = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 0] ];

      const actualResult = await from(input.map(v => new Uint8Array(v)))
        .pipe( rechunkUint8Arrays(2, 2, 0, MisalignedTrailerBehavior.PAD), toArray() )
        .toPromise();
      
      t.eq(actualResult.map(v => [...v]), expectedResult);

    });

  });

  t.test('rechunkInt8Arrays', t => {

    t.test('basic usage', async t => {

      const input = [ [1], [2, 3, 4, 5], [6, 7], [8], [9] ];
      const expectedResult = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 0] ];

      const actualResult = await from(input.map(v => new Int8Array(v)))
        .pipe( rechunkInt8Arrays(2, 2, 0, MisalignedTrailerBehavior.PAD), toArray() )
        .toPromise();
      
      t.eq(actualResult.map(v => [...v]), expectedResult);

    });

  });

  t.test('rechunkDataViews', t => {

    t.test('basic usage', async t => {

      const input = [ [1], [2, 3, 4, 5], [6, 7], [8], [9] ];
      const expectedResult = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 0] ];

      const actualResult = await from(input.map(v => new DataView(new Uint8Array(v).buffer)))
        .pipe( rechunkDataViews(2, 2, 0, MisalignedTrailerBehavior.PAD), toArray() )
        .toPromise();
      
      t.eq(actualResult.map(v => [...new Uint8Array(v.buffer, v.byteOffset, v.byteLength)]), expectedResult);

    });

  });

};
