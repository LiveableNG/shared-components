import { useEffect, useState } from 'react';
import { $api } from '@/services';

interface Property {
    id: string;
    name: string;
    label?: string;
    address?: string;
}

interface PropertyFilterProps {
    selectedPropertyId?: string;
    onPropertyChange: (property: Property | null) => void;
    placeholder?: string;
    className?: string;
    showAllOption?: boolean;
    allOptionLabel?: string;
    variant?: 'default' | 'inline' | 'compact';
    label?: string;
    showLabel?: boolean;
    padding?: 'default' | 'sm' | 'lg' | 'none';
    containerPadding?: string;
}

const PropertyFilter = ({
    selectedPropertyId,
    onPropertyChange,
    placeholder = 'Select a property',
    className = '',
    showAllOption = true,
    allOptionLabel = 'All Properties',
    variant = 'default',
    label = 'Property',
    showLabel = false,
    padding = 'default',
    containerPadding
}: PropertyFilterProps) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProperties = async () => {
        try {
            setIsLoading(true);
            const response = await $api.fetch('/api/mgt/v1/property/search-list');
            if ($api.isSuccessful(response)) {
                const propertyData = response?.data?.data || response?.data || [];
                
                // Transform the data to ensure consistent structure
                const transformedProperties = propertyData.map((prop: any) => ({
                    id: prop.id,
                    name: prop.label || prop.name || prop.address || 'Unnamed Property',
                    label: prop.label,
                    address: prop.address,
                    code: prop.id
                }));

                setProperties(transformedProperties);
            }
        } catch (err) {
            console.error('Error fetching properties:', err);
            setProperties([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const handlePropertyChange = (option: any) => {
        if (option.id === 'all_properties') {
            onPropertyChange(option);
        } else {
            const property = properties.find(prop => prop.id === option.id);
            onPropertyChange(property || null);
        }
    };

    // Prepare options for select
    const options = [
        ...(showAllOption ? [{ id: 'all_properties', name: allOptionLabel, code: 'all_properties' }] : []),
        ...properties.map(prop => ({
            id: prop.id,
            name: prop.name,
            code: prop.id
        }))
    ];

    const selectedOption = options.find(opt => opt.code === selectedPropertyId) || 
                          (showAllOption ? options.find(opt => opt.id === 'all_properties') : undefined);

    // Padding utility function
    const getPaddingClasses = () => {
        if (containerPadding) return containerPadding;
        
        switch (padding) {
            case 'sm':
                return 'px-2 py-2';
            case 'lg':
                return 'px-6 py-4';
            case 'none':
                return 'px-0 py-0';
            case 'default':
            default:
                return 'px-4 py-3';
        }
    };

    // Render based on variant
    if (variant === 'inline') {
        return (
            <div className={`flex gap-2.5 items-center ${getPaddingClasses()} border border-tmgrey300 rounded-lg w-[259px] max-[768px]:w-full ${className}`}>
                {showLabel && (
                    <label className="text-tmgrey500 text-sm leading-[18px] whitespace-nowrap">
                        {label}:
                    </label>
                )}
                <select
                    className="custom-select w-full text-sm leading-[18px] font-bold text-tmgrey500 outline-none"
                    value={selectedOption?.code || ''}
                    onChange={(e) => {
                        const option = options.find(opt => opt.code === e.target.value);
                        if (option) {
                            handlePropertyChange(option);
                        }
                    }}
                    disabled={isLoading}
                >
                    <option value="">{isLoading ? 'Loading...' : placeholder}</option>
                    {options.map((option) => (
                        <option key={option.id} value={option.code}>
                            {option.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    if (variant === 'compact') {
        const compactPadding = padding === 'none' ? '' : getPaddingClasses();
        return (
            <div className={`flex items-center gap-2 ${compactPadding} ${className}`}>
                {showLabel && (
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                        {label}:
                    </span>
                )}
                <select
                    className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                    value={selectedOption?.code || ''}
                    onChange={(e) => {
                        const option = options.find(opt => opt.code === e.target.value);
                        if (option) {
                            handlePropertyChange(option);
                        }
                    }}
                    disabled={isLoading}
                >
                    <option value="">{isLoading ? 'Loading...' : placeholder}</option>
                    {options.map((option) => (
                        <option key={option.id} value={option.code}>
                            {option.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    // Default variant - simple select for now
    return (
        <div className={`w-full max-w-xs ${getPaddingClasses()} ${className}`}>
            {showLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <select
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                value={selectedOption?.code || ''}
                onChange={(e) => {
                    const option = options.find(opt => opt.code === e.target.value);
                    if (option) {
                        handlePropertyChange(option);
                    }
                }}
                disabled={isLoading}
            >
                <option value="">{isLoading ? 'Loading...' : placeholder}</option>
                {options.map((option) => (
                    <option key={option.id} value={option.code}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default PropertyFilter;

