import { useState } from 'react';
import { PlusCircle, SearchIcon } from 'lucide-react';

interface SearchableCheckboxListProps {
    options: any[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    className?: string;
    canCreate?: boolean;
    onCreateNew?: (name: string) => void;
    isLoading?: boolean; // Add this prop
}

const SearchableCheckboxList = ({
    options,
    selectedValues,
    onChange,
    className = '',
    canCreate = false,
    onCreateNew,
    isLoading = false, // Add default value
}: SearchableCheckboxListProps) => {
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (optionId: string) => {
        onChange(
            selectedValues.includes(optionId)
                ? selectedValues.filter((id) => id !== optionId)
                : [...selectedValues, optionId]
        );
    };

    const handleCreateNew = async (e?: React.MouseEvent) => {
        e?.preventDefault(); // Prevent any form submission

        if (!newItemName.trim() || !onCreateNew) {
            return;
        }

        try {
            await onCreateNew(newItemName.trim());
            setNewItemName('');
            setIsAdding(false);
            setSearch(''); // Clear search when new item is added
        } catch (error) {
            console.error('Failed to create new item:', error);
        }
    };

    return (
        <div className={`border border-silver200 rounded-[5px] ${className}`}>
            <div className="flex items-center px-3 py-2 border-b border-silver200">
                <SearchIcon className="h-4 w-4 text-icongrey" />
                <input
                    type="text"
                    className="w-full ml-2 text-sm outline-none text-grey200 placeholder:text-icongrey"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex flex-col max-h-[200px]">
                <div className="flex-1 overflow-y-auto p-4 max-h-[200px]">
                    {isLoading ? (
                        <div className="text-sm text-tmgrey100 text-center py-2">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {filteredOptions.map((option) => (
                                <label
                                    key={option.id}
                                    className="flex items-center gap-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.includes(
                                            option.id
                                        )}
                                        onChange={() => handleToggle(option.id)}
                                        className="rounded border-tmgrey20 checked:bg-tmprimary checked:border-tmprimary focus:ring-tmprimary"
                                    />
                                    <span className="text-sm text-tmgrey500">
                                        {option.name}
                                    </span>
                                </label>
                            ))}
                            {filteredOptions.length === 0 && !isLoading && (
                                <div className="text-sm text-tmgrey100 text-center py-2">
                                    No results found
                                </div>
                            )}
                        </>
                    )}
                </div>

                {canCreate && !isLoading && (
                    <div className="border-t border-silver200 mt-auto">
                        {!isAdding ? (
                            <div
                                className="flex items-center gap-2 px-4 py-2 text-sm text-tmprimary cursor-pointer hover:bg-gray-50"
                                onClick={() => setIsAdding(true)}
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>
                                    {search
                                        ? `Add "${search}"`
                                        : 'Add new item'}
                                </span>
                            </div>
                        ) : (
                            <div className="p-2 flex items-center gap-2">
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
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateNew}
                                    className="px-2 py-1 text-sm text-white bg-tmprimary rounded hover:bg-tmprimary/90"
                                >
                                    Add
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableCheckboxList;
