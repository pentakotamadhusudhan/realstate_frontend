/**
 * Formats API errors from Django REST Framework, fetch responses, or NetworkErrors
 * into user-friendly strings.
 */
export function formatApiErrorMessage(error: any): string {
    if (!error) {
        return "Unable to connect to the server. Please try again.";
    }

    if (typeof error === "string") {
        if (error.startsWith("<!DOCTYPE") || error.startsWith("<html")) {
            return "Internal server error. Please check server logs.";
        }
        return error;
    }

    if (error instanceof Error) {
        if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("Network Error") ||
            error.message.includes("Load failed")
        ) {
            return "Unable to connect to the server. Please check your backend connection.";
        }
        return error.message;
    }

    if (typeof error === "object") {
        if (typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }

        if (typeof error.detail === "string" && error.detail.trim()) {
            return error.detail;
        }

        if (typeof error.error === "string" && error.error.trim()) {
            return error.error;
        }

        if (Array.isArray(error.non_field_errors) && error.non_field_errors.length > 0) {
            return error.non_field_errors.join(" ");
        }

        // Handle Django DRF serializer errors like { email: ["Already in use"], password: ["Too short"] }
        const fieldErrors: string[] = [];
        for (const [key, value] of Object.entries(error)) {
            if (["status", "code", "tokens", "user", "stack"].includes(key)) continue;

            const fieldName = key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

            if (Array.isArray(value)) {
                fieldErrors.push(`${fieldName}: ${value.join(" ")}`);
            } else if (typeof value === "string") {
                fieldErrors.push(`${fieldName}: ${value}`);
            } else if (typeof value === "object" && value !== null) {
                try {
                    fieldErrors.push(`${fieldName}: ${JSON.stringify(value)}`);
                } catch {
                    // ignore
                }
            }
        }

        if (fieldErrors.length > 0) {
            return fieldErrors.join(" | ");
        }

        try {
            const str = JSON.stringify(error);
            if (str !== "{}") return str;
        } catch {
            // ignore
        }
    }

    return "An unexpected error occurred. Please try again.";
}
