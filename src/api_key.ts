import { zones } from './request';
import { initialState, DashboardAction, ApiKey } from './store';

export async function validate_key(key: ApiKey) {
    try {
        await zones(key);
        return true; // valid key
    } catch(err) {
        console.error(err);
        return false;
    }
}

const CLEAR_KEY = Symbol("CLEAR_KEY");
export interface ClearKeyAction {
    type: typeof CLEAR_KEY,
}

export function apiKeyReducer(state = initialState, action: DashboardAction) {
    switch(action.type) {
        case CLEAR_KEY:
            return {
                ...state,
                api_key: null,
            };
        default:
            return state;
    }
}
