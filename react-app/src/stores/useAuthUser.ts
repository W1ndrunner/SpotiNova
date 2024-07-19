import {create} from "zustand";

interface AuthUser {
    email: string;
}

interface AuthUserStore {
    authUser: AuthUser;
    setUser: (user: string) => void;
    logoutUser: () => void;
}

const useAuthUserStore = create<AuthUserStore>((set) => ({
    authUser: {} as AuthUser,
    setUser: (user) => set((store) => ({ authUser: {...store.authUser, email: user} })),
    logoutUser: () => set({})
}));

export default useAuthUserStore;