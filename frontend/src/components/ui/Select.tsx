import { forwardRef, ReactNode } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        >
          {options ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : children}
        </select>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
