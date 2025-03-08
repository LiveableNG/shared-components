import { useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';

interface Option {
    id: string | number;
    name: string;
    code?: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: Option) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    isLoading = false,
    disabled = false,
    className = '',
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((opt) => opt.code === value);

    const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center justify-between text-sm leading-[20px] border border-silver200 w-full h-10 rounded-[5px] px-4 py-2.5 ${
                    disabled
                        ? 'bg-gray-50 cursor-not-allowed'
                        : 'cursor-pointer'
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span
                    className={
                        selectedOption ? 'text-grey200' : 'text-icongrey'
                    }
                >
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-grey200" />
            </div>

            {isOpen && (
                <div
                    className="fixed z-50 w-full mt-1 bg-white border border-silver200 rounded-[5px] shadow-lg"
                    style={{
                        width: dropdownRef.current?.offsetWidth + 'px',
                        left:
                            dropdownRef.current?.getBoundingClientRect().left +
                            'px',
                        top:
                            (dropdownRef.current?.getBoundingClientRect()
                                .bottom || 0) +
                            5 +
                            'px',
                    }}
                >
                    <div className="flex items-center px-3 py-2 border-b border-silver200">
                        <SearchIcon className="h-4 w-4 text-icongrey" />
                        <input
                            type="text"
                            className="w-full ml-2 text-sm outline-none text-grey200 placeholder:text-icongrey"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-3 text-center text-sm text-grey200">
                                Loading...
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="py-3 text-center text-sm text-grey200">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                                        option.code === value
                                            ? 'bg-gray-50'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="text-grey200">
                                        {option.name}
                                    </span>
                                    {option.code === value && (
                                        <CheckIcon className="h-4 w-4 text-dkblue" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
