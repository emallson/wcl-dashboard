import { parseCode } from './Sidebar';

describe('parseCode', () => {

    it('should parse a bare code', () => {
        expect(parseCode("YGRNjaw1ZptzHL6r")).toEqual("YGRNjaw1ZptzHL6r");
    });

    it('should parse a full URL with hash', () => {
        expect(parseCode("https://www.warcraftlogs.com/reports/YGRNjaw1ZptzHL6r#boss=-2&difficulty=0"))
            .toEqual("YGRNjaw1ZptzHL6r");
    });

});
