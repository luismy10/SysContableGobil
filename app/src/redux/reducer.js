import { RESTORE_TOKEN, SIGN_IN, SIGN_OUT, PROJECT_ACTIVE, PROJECT_CLOSE } from './types';

const initialState = {
    isLoading: true,
    isSignout: false,
    isVisible: false,
    userToken: null,
    project: null,
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case RESTORE_TOKEN:
            return {
                ...state,
                userToken: action.token,
                project: action.token === null ? null : action.token.project,
                isLoading: false,
                isVisible: true,
            };
        case SIGN_IN:
            return {
                ...state,
                userToken: action.token,
                isSignout: false,
                isVisible: true,
            };
        case SIGN_OUT:
            return {
                ...state,
                isSignout: true,
                isVisible: false,
                userToken: null,
                project: null
            };
        case PROJECT_ACTIVE:
            return {
                ...state,
                project: action.project
            };
        case PROJECT_CLOSE:
            return {
                ...state,
                project: null
            };
        default: return state;
    }
}

export default reducer;