import { create } from 'zustand';

export interface ApiErrorInfo {
    id: string;
    title?: string;
    message: string;
    code?: string | number;
    onRetry?: (() => void | Promise<void>) | null;
}

interface ApiErrorStoreState {
    errors: ApiErrorInfo[];
    showError: (error: { title?: string; message: string; code?: string | number; onRetry?: () => void | Promise<void> } | string) => string;
    dismissError: (id: string) => void;
    clearAllErrors: () => void;
}

export const useApiErrorStore = create<ApiErrorStoreState>((set) => ({
    errors: [],
    showError: (error) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newError: ApiErrorInfo =
            typeof error === 'string'
                ? { id, message: error, title: 'Oops! Something Went Wrong' }
                : { id, title: 'Oops! Something Went Wrong', ...error };

        set((state) => {
            // Deduplicate same message if already shown
            const filtered = state.errors.filter((e) => e.message !== newError.message);
            // Keep at most 3 alerts to prevent flooding
            return {
                errors: [...filtered, newError].slice(-3),
            };
        });
        return id;
    },
    dismissError: (id) => {
        set((state) => ({
            errors: state.errors.filter((e) => e.id !== id),
        }));
    },
    clearAllErrors: () => set({ errors: [] }),
}));

export const showApiError = (
    error: { title?: string; message: string; code?: string | number; onRetry?: () => void | Promise<void> } | string
) => {
    return useApiErrorStore.getState().showError(error);
};

export const clearApiErrors = () => {
    useApiErrorStore.getState().clearAllErrors();
};
