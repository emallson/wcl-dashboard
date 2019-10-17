import { createTransform } from 'redux-persist';

export default function createFixOrderTransform(cfg?: any) {
    return createTransform(
        state => state,
        (state: any, key: any) => {
            console.log(state, key);
            if(key !== 'visualizations') {
                return state;
            }

            let index = 0;
            return state.map((viz: any) => {
                viz.index = index;
                index += 1;
                return viz;
            });
        },
        cfg
    );
}
