import React from 'react';

interface ActionDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
    isOpen,
    onClose,
    onEdit,
    onDelete,
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-90">
            <div className="py-1 flex flex-col" role="menu">
                <button
                    onClick={() => {
                        onEdit?.();
                        onClose();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                >
                    Edit
                </button>
                <button
                    onClick={() => {
                        onDelete?.();
                        onClose();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    role="menuitem"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default ActionDropdown;
