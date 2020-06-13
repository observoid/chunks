
import { TestHarness } from 'zora';
import { MisalignedTrailerBehavior, MisalignedTrailerError } from '../lib/index';
import { rechunkStrings } from '../lib/text';
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';

export default (t: TestHarness) => {

  t.test('rechunkStrings', t => {

    t.test('basic usage', async t => {

      t.eq(
        await of('', 'ba', '', 'baaa', '', 'baa', '').pipe( rechunkStrings( 3 ), toArray() ).toPromise(),
        ['bab', 'aaa', 'baa'],
      );
      
    });

    t.test('trailer error', async t => {

      let err: any;
      try {
        await of('12345').pipe( rechunkStrings( 4, 4, 0, MisalignedTrailerBehavior.ERROR ), toArray() ).toPromise();
      }
      catch (e) {
        err = e;
      }
      t.ok(err instanceof MisalignedTrailerError);
      
    });

    t.test('trailer padding', async t => {

      t.eq(
        await of('12345').pipe( rechunkStrings( 4, 4, 0, MisalignedTrailerBehavior.PAD ), toArray() ).toPromise(),
        ['1234', '5   '],
      );
      
    });

    t.test('trailer truncate', async t => {

      t.eq(
        await of('12345').pipe( rechunkStrings( 4, 4, 0, MisalignedTrailerBehavior.TRUNCATE ), toArray() ).toPromise(),
        ['1234'],
      );
      
    });

    t.test('trailer pass-through', async t => {

      t.eq(
        await of('12345').pipe( rechunkStrings( 4, 4, 0, MisalignedTrailerBehavior.PASS_THROUGH ), toArray() ).toPromise(),
        ['1234', '5'],
      );
      
    });

    t.test('zero length', async t => {

      t.eq(
        await of('ba', 'baaa', 'baa').pipe( rechunkStrings( 0, 0, 0 ), toArray() ).toPromise(),
        [],
      );
      
    });

    t.test('pass through', async t => {

      t.eq(
        await of('abc').pipe(
          rechunkStrings( 3, 3 ),
          rechunkStrings( 1, 2 ),
          rechunkStrings( 1, 1 ),
          toArray()
        ).toPromise(),
        ['a', 'b', 'c'],
      );

    });

    t.test('step larger than max', async t => {

      t.eq(
        await of('abcde').pipe( rechunkStrings( 1, 5, 10 ), toArray() ).toPromise(),
        ['a', 'b', 'c', 'd', 'e'],
      );
      
    });

    t.test('step is zero', async t => {

      t.eq(
        await of('abcde').pipe( rechunkStrings( 1, 5, 0 ), toArray() ).toPromise(),
        ['a', 'b', 'c', 'd', 'e'],
      );
      
    });

    t.test('min is zero', async t => {

      t.eq(
        await of('abcde').pipe( rechunkStrings( 0, 1 ), toArray() ).toPromise(),
        ['a', 'b', 'c', 'd', 'e'],
      );
      
    });

    t.test('errors', t => {
      t.throws(() => rechunkStrings(NaN));
      t.throws(() => rechunkStrings(-100));
      t.throws(() => rechunkStrings(1, NaN));
      t.throws(() => rechunkStrings(1, -100));
      t.throws(() => rechunkStrings(0, 1, 0.5));
      t.throws(() => rechunkStrings(0, 1, -1));
      t.throws(() => rechunkStrings(1, NaN));
    });

  });

}
