import { useEffect, useState } from 'react';
import { $api } from '@/services';
import SearchableSelect from './SearchableSelect';

interface Employee {
    id: string;
    name: string;
    email?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
}

interface EmployeeFilterProps {
    selectedEmployeeId?: string;
    onEmployeeChange: (employee: Employee | null) => void;
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

const EmployeeFilter = ({
    selectedEmployeeId,
    onEmployeeChange,
    placeholder = 'Select an employee',
    className = '',
    showAllOption = true,
    allOptionLabel = 'All Employees',
    variant = 'default',
    label = 'Employee',
    showLabel = false,
    padding = 'default',
    containerPadding
}: EmployeeFilterProps) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmployees = async (search?: string) => {
        try {
            setIsLoading(true);
            const response = await $api.fetch(
                `/api/v3/company/employees?search=${search || ''}`
            );
            if ($api.isSuccessful(response)) {
                const employeeData = response?.data || [];
                
                // Transform the data to ensure consistent structure
                const transformedEmployees = employeeData.map((emp: any) => ({
                    id: emp.id || emp.user_id,
                    name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email,
                    email: emp.email,
                    role: emp.role,
                    first_name: emp.first_name,
                    last_name: emp.last_name,
                    code: emp.id || emp.user_id // For SearchableSelect compatibility
                }));

                setEmployees(transformedEmployees);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            setEmployees([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleEmployeeChange = (option: any) => {
        if (option.id === 'all_employees') {
            onEmployeeChange(option);
        } else {
            const employee = employees.find(emp => emp.id === option.id);
            onEmployeeChange(employee || null);
        }
    };

    // Set default to "All Employees" if no employee is selected
    useEffect(() => {
        if (!selectedEmployeeId && showAllOption && employees.length > 0) {
            const allEmployeesOption = { id: 'all_employees', name: allOptionLabel };
            onEmployeeChange(allEmployeesOption);
        }
    }, [selectedEmployeeId, showAllOption, employees.length, allOptionLabel, onEmployeeChange]);

    // Prepare options for SearchableSelect
    const options = [
        ...(showAllOption ? [{ id: 'all_employees', name: allOptionLabel, code: 'all_employees' }] : []),
        ...employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            code: emp.id
        }))
    ];

    const selectedOption = options.find(opt => opt.code === selectedEmployeeId) || 
                          (showAllOption ? options.find(opt => opt.id === 'all_employees') : undefined);

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
                            handleEmployeeChange(option);
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
                            handleEmployeeChange(option);
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

    // Default variant
    return (
        <div className={`w-full max-w-xs ${getPaddingClasses()} ${className}`}>
            {showLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <SearchableSelect
                options={options}
                value={selectedOption?.code}
                onChange={handleEmployeeChange}
                placeholder={placeholder}
                isLoading={isLoading}
                className="w-full"
            />
        </div>
    );
};

export default EmployeeFilter;
