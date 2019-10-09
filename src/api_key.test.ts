import { validate_key } from './api_key';
import fetchMock from 'fetch-mock';

describe("validate_key", () => {
    beforeEach(() => fetchMock.restore());

    it("should return false on a 401", async () => {
        fetchMock.get('*', {
            'status': 401,
            'body': { 'status': 401, 'message': "Mocked 401" }
        });
        const res = await validate_key("foo");
        expect(res).toBe(false);
    });

    it("should return true on a 200", async () => {
        fetchMock.get('*', {
            'status': 200,
            'body': {
                "status": 200, "message": "Mocked 200"
            }
        });
        const res = await validate_key("foo");
        expect(res).toBe(true);
    })
});
