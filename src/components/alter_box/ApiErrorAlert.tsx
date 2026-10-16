import React, { useState } from "react";
import { createPortal } from "react-dom";
import { WifiOff, AlertCircle, RefreshCw, X } from "lucide-react";
import "./ApiErrorAlert.css";

export interface ApiErrorDialogProps {
    open?: boolean;
    title?: string;
    message?: string;
    detail?: string;
    badge?: string;
    code?: string | number;
    onRetry?: () => void | Promise<void>;
    onClose?: () => void;
}

export default function ApiErrorDialog({
    open = true,
    title = "Connection Failed!",
    badge = "CONNECTION ERROR",
    message = "We couldn't connect to the server. Please try again.",
    detail,
    code,
    onRetry,
    onClose,
}: ApiErrorDialogProps) {
    const [retrying, setRetrying] = useState(false);

    if (!open) return null;

    const handleRetry = async () => {
        if (!onRetry) return;
        try {
            setRetrying(true);
            await onRetry();
        } finally {
            setRetrying(false);
        }
    };

    const displayDetail = detail || (code ? `Error Status: ${code}` : "Unable to complete request");

    const dialogNode = (
        <div className="api-dialog-overlay" onClick={onClose} role="presentation">
            <div
                className="api-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="api-dialog-title"
                onClick={(e) => e.stopPropagation()}
            >
                {onClose && (
                    <button
                        type="button"
                        className="api-dialog-close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="api-dialog-icon">
                    <WifiOff size={36} strokeWidth={1.8} />
                </div>

                <span className="api-dialog-badge">{badge}</span>

                <h2 id="api-dialog-title">{title}</h2>

                <p className="api-dialog-message">{message}</p>

                <div className="api-dialog-detail">
                    <AlertCircle size={18} />
                    <span>{displayDetail}</span>
                </div>

                <div className="api-dialog-actions">
                    {onClose && (
                        <button
                            type="button"
                            className="api-dialog-secondary"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    )}

                    {onRetry && (
                        <button
                            type="button"
                            className="api-dialog-primary"
                            onClick={handleRetry}
                            disabled={retrying}
                        >
                            <RefreshCw size={17} className={retrying ? "animate-spin" : ""} />
                            {retrying ? "Retrying..." : "Try Again"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document !== "undefined") {
        return createPortal(dialogNode, document.body);
    }

    return dialogNode;
}

// Export as both ApiErrorDialog and ApiErrorAlert for backward compatibility
export { ApiErrorDialog as ApiErrorAlert };
