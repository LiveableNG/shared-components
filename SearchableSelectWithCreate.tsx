import { useEffect, useRef, useState } from 'react';
import {
    CheckIcon,
    ChevronDownIcon,
    PlusCircle,
    SearchIcon,
} from 'lucide-react';

interface Option {
    id: string;
    name: string;
    [key: string]: any;
}

interface SearchableSelectWithCreateProps {
    options: any;
    value?: string;
    onChange: (value: Option) => void;
    onCreateNew?: (name: string) => Promise<void>;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

const SearchableSelectWithCreate = ({
    options,
    value,
    onChange,
    onCreateNew,
    placeholder = 'Select an option',
    isLoading = false,
    disabled = false,
    className = '',
}: SearchableSelectWithCreateProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt: any) => opt.id === value);

    const filteredOptions = options.filter((opt: any) =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsAdding(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateNew = async () => {
        if (newItemName.trim() && onCreateNew) {
            setIsCreating(true);
            try {
                await onCreateNew(newItemName.trim());
                setNewItemName('');
                setIsAdding(false);
                setSearch('');
            } catch (error) {
                console.error('Failed to create new item:', error);
            } finally {
                setIsCreating(false);
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center justify-between text-sm leading-[20px] border border-tmgrey20 w-full h-10 rounded-[5px] px-4 py-2.5 ${
                    disabled
                        ? 'bg-gray-50 cursor-not-allowed'
                        : 'cursor-pointer'
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span
                    className={
                        selectedOption ? 'text-tmgrey500' : 'text-[#a5abb6]'
                    }
                >
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-tmgrey200" />
            </div>

            {isOpen && (
                <div className="absolute z-70 w-full mt-1 bg-white border border-tmgrey20 rounded-[5px] shadow-lg">
                    <div className="flex items-center px-3 py-2 border-b border-tmgrey20">
                        <SearchIcon className="h-4 w-4 text-[#a5abb6]" />
                        <input
                            type="text"
                            className="w-full ml-2 text-sm outline-none text-tmgrey500 placeholder:text-[#a5abb6]"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-3 text-center text-sm text-tmgrey200">
                                Loading...
                            </div>
                        ) : (
                            <>
                                {filteredOptions.map((option: any) => (
                                    <div
                                        key={option.id}
                                        className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                                            option.id === value
                                                ? 'bg-gray-50'
                                                : ''
                                        }`}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        <span className="text-tmgrey500">
                                            {option.name}
                                        </span>
                                        {option.id === value && (
                                            <CheckIcon className="h-4 w-4 text-tmprimary" />
                                        )}
                                    </div>
                                ))}

                                {onCreateNew && !isAdding && (
                                    <div
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-tmprimary cursor-pointer hover:bg-gray-50 border-t border-tmgrey20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAdding(true);
                                        }}
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        <span>
                                            {search
                                                ? `Add "${search}"`
                                                : 'Add new'}
                                        </span>
                                    </div>
                                )}

                                {isAdding && (
                                    <div className="p-2 flex items-center gap-2 border-t border-tmgrey20">
                                        <input
                                            type="text"
                                            className="flex-1 p-1 text-sm border border-tmgrey20 rounded text-tmgrey500"
                                            value={newItemName || search}
                                            onChange={(e) =>
                                                setNewItemName(e.target.value)
                                            }
                                            onFocus={() => {
                                                if (!newItemName && search) {
                                                    setNewItemName(search);
                                                }
                                            }}
                                            placeholder="Enter name"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateNew}
                                            disabled={isCreating}
                                            className="px-2 py-1 text-sm text-white bg-tmprimary rounded hover:bg-tmprimary/90 disabled:opacity-50"
                                        >
                                            {isCreating ? 'Adding...' : 'Add'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAdding(false);
                                                setNewItemName('');
                                            }}
                                            className="px-2 py-1 text-sm text-tmgrey100 border border-tmgrey20 rounded hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelectWithCreate;
