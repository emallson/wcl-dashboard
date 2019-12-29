import { createTransform } from 'redux-persist';
import { decompressFromUTF16 } from 'lz-string';

export default function createTransformDecompress(cfg?: any) {
    return createTransform(
        state => state,
        state => {
            if (typeof state !== 'string') {
                return state;
            }

            try {
                return JSON.parse(decompressFromUTF16(state));
            } catch (e) {
                // could not decompress
                console.warn('Decompression failed:', e);
                return state;
            }
        },
        cfg
    );
}
