import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    reference: React.RefObject<HTMLDivElement>;
    children: ReactNode;
    disableClickOut?: boolean;
}

const Modal = ({
    isActive,
    setIsActive,
    reference,
    children,
    disableClickOut = false,
}: ModalProps) => {
    useEffect(() => {
        if (isActive) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isActive]);

    if (!isActive) return null;

    return createPortal(
        <>
            {/* Overlay - separate layer */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50"
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disableClickOut) {
                        setIsActive(false);
                    }
                }}
            />
            {/* Modal Content - separate layer */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div
                    ref={reference}
                    className="relative bg-white rounded-2xl shadow-xl w-full max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </>,
        document.body
    );
};

export default Modal;
