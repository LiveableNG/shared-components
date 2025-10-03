import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    reference: React.RefObject<HTMLDivElement>;
    children: ReactNode;
    disableClickOut?: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

const Modal = ({
    isActive,
    setIsActive,
    reference,
    children,
    disableClickOut = false,
    maxWidth = 'md',
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

    const getMaxWidthClass = (size: string) => {
        const sizeMap = {
            'sm': 'max-w-sm',    // 384px
            'md': 'max-w-[500px]', // 500px (current default)
            'lg': 'max-w-2xl',   // 672px
            'xl': 'max-w-4xl',   // 896px
            '2xl': 'max-w-6xl',  // 1152px
            '4xl': 'max-w-7xl',  // 1280px
            '6xl': 'max-w-full', // Full width with margins
        };
        return sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
    };

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
                    className={`relative bg-white rounded-2xl shadow-xl w-full ${getMaxWidthClass(maxWidth)} mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 pointer-events-auto`}
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
