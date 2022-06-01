import { RESTORE_TOKEN, SIGN_IN, SIGN_OUT,PROJECT_ACTIVE,PROJECT_CLOSE } from './types';

export const restoreToken = (user) => (
    {
        type: RESTORE_TOKEN,
        token: user
    }
)

export const signIn = (user) => (
    {
        type: SIGN_IN,
        token: user
    }
)

export const signOut = () => (
    {
        type: SIGN_OUT
    }
)

export const selectProject = (project) => (
    {
        type: PROJECT_ACTIVE,
        project: project
    }
)

export const closeProject = () => (
    {
        type: PROJECT_CLOSE
    }
)

