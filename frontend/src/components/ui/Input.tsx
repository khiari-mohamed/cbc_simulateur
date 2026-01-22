import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-2.5 py-1.5 text-sm border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
