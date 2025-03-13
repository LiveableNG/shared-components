import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type AlertType = 'warning' | 'error' | 'success' | 'info';

interface AlertProps {
    type: AlertType;
    title: string;
    message: string;
    actionButton?: {
        label: string;
        onClick: () => void;
        active?: boolean;
    };
    className?: string;
}

const Alert: React.FC<AlertProps> = ({
    type = 'info',
    title,
    message,
    actionButton,
    className = '',
}) => {
    const getAlertStyles = () => {
        switch (type) {
            case 'warning':
                return {
                    container: 'bg-amber-50 border-amber-200',
                    icon: 'text-amber-500',
                    title: 'text-amber-800',
                    message: 'text-amber-700',
                    button: 'bg-amber-500 text-white hover:bg-amber-600',
                    activeButton: 'bg-green-600 text-white hover:bg-green-700',
                };
            case 'error':
                return {
                    container: 'bg-red-50 border-red-200',
                    icon: 'text-red-500',
                    title: 'text-red-800',
                    message: 'text-red-700',
                    button: 'bg-red-500 text-white hover:bg-red-600',
                    activeButton: 'bg-green-600 text-white hover:bg-green-700',
                };
            case 'success':
                return {
                    container: 'bg-green-50 border-green-200',
                    icon: 'text-green-500',
                    title: 'text-green-800',
                    message: 'text-green-700',
                    button: 'bg-green-500 text-white hover:bg-green-600',
                    activeButton: 'bg-green-600 text-white hover:bg-green-700',
                };
            default: // info
                return {
                    container: 'bg-blue-50 border-blue-200',
                    icon: 'text-blue-500',
                    title: 'text-blue-800',
                    message: 'text-blue-700',
                    button: 'bg-blue-500 text-white hover:bg-blue-600',
                    activeButton: 'bg-blue-600 text-white hover:bg-blue-700',
                };
        }
    };

    const styles = getAlertStyles();

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return (
                    <AlertTriangle
                        className={`h-5 w-5 ${styles.icon} mt-0.5 mr-2`}
                    />
                );
            case 'error':
                return (
                    <AlertCircle
                        className={`h-5 w-5 ${styles.icon} mt-0.5 mr-2`}
                    />
                );
            case 'success':
                return (
                    <CheckCircle
                        className={`h-5 w-5 ${styles.icon} mt-0.5 mr-2`}
                    />
                );
            default: // info
                return (
                    <Info className={`h-5 w-5 ${styles.icon} mt-0.5 mr-2`} />
                );
        }
    };

    return (
        <div
            className={`p-4 border rounded-md ${styles.container} ${className}`}
        >
            <div className="flex items-start">
                {getIcon()}
                <div>
                    <p className={`font-medium ${styles.title}`}>{title}</p>
                    <p className={`text-sm mt-1 ${styles.message}`}>
                        {message}
                    </p>
                    {actionButton && (
                        <button
                            type="button"
                            className={`mt-3 px-4 py-2 text-sm font-medium rounded-md ${actionButton.active ? styles.activeButton : styles.button}`}
                            onClick={actionButton.onClick}
                        >
                            {actionButton.active
                                ? `✓ ${actionButton.label}`
                                : actionButton.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Alert;
