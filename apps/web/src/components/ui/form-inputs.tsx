interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Input Component - Form input with label
 */
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        className={`w-full rounded border p-2 focus:border-blue-500 focus:outline-none ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

/**
 * Textarea Component
 */
export function Textarea({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        className={`w-full rounded border p-2 focus:border-blue-500 focus:outline-none ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

/**
 * Select Component
 */
export function Select({
  label,
  options,
  error,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <select
        className={`w-full rounded border p-2 focus:border-blue-500 focus:outline-none ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
