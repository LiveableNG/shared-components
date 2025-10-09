import { ReactNode, useEffect, useRef } from 'react';

interface ActionButtonPayload {
    icon?: ReactNode;
    label: string;
    action: () => void;
    condition?: boolean;
}

interface PopoverPosition {
    x: number;
    y: number;
}

interface CustomActionModalProps {
    isActive: boolean;
    onClose: () => void;
    selectedItem?: any;
    actions: ActionButtonPayload[];
    position: PopoverPosition;
}

const CustomActionModal = ({
    isActive,
    onClose,
    actions,
    position,
}: CustomActionModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isActive) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isActive, onClose]);

    if (!isActive) return null;

    return (
        <div
            ref={modalRef}
            style={{
                left: position.x,
                top: position.y,
                position: 'fixed',
                zIndex: 9999,
            }}
            className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-2 min-w-[180px]"
            onClick={e => e.stopPropagation()}
        >
            {actions?.length > 0 &&
                actions?.map((button: ActionButtonPayload, index: number) => {
                    return (
                        (button.condition === undefined || button.condition === true) && (
                            <button
                                key={index}
                                className="flex gap-3 items-center whitespace-nowrap text-sm leading-5 font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-2 py-2 rounded transition-colors"
                                onClick={() => {
                                    button?.action();
                                    onClose();
                                }}
                            >
                                {button.icon && (
                                    <div className="text-gray-500">{button.icon}</div>
                                )}
                                {button?.label}
                            </button>
                        )
                    );
                })}
        </div>
    );
};

export default CustomActionModal;
