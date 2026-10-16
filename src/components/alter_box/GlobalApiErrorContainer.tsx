import React from "react";
import { useApiErrorStore } from "../../store/apiErrorStore";
import ApiErrorDialog from "./ApiErrorAlert";

export default function GlobalApiErrorContainer() {
    const { errors, dismissError } = useApiErrorStore();

    if (errors.length === 0) return null;

    // Show the active error dialog (latest one)
    const currentError = errors[errors.length - 1];

    return (
        <ApiErrorDialog
            open={true}
            title={currentError.title || "Connection Failed!"}
            message={currentError.message}
            code={currentError.code}
            onRetry={
                currentError.onRetry
                    ? () => {
                          const retryFn = currentError.onRetry;
                          dismissError(currentError.id);
                          retryFn?.();
                      }
                    : undefined
            }
            onClose={() => dismissError(currentError.id)}
        />
    );
}
