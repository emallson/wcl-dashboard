import { ReportCode, initialState } from './store';
import { toNullable } from 'fp-ts/lib/Option';
import { missingFights, dummyEventMeta } from './query';

describe('missingFights', () => {
    it("should not throw an error when the report doesn't exist", () => {
        const code = toNullable(ReportCode.getOption('foo'))!;
        missingFights(dummyEventMeta(), code, initialState);
    });
});
