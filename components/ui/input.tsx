import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`
            flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black
            ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
            transition-colors duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
