import React, { useState, useEffect, ChangeEvent } from 'react';

interface FormattedInputProps {
  label: string;
  type?: string;
  value: number;
  displayInt?: boolean;
  onChange: (value: number) => void;
  className?: string;
}

export default function FormattedInput({ 
  label, 
  type = 'number', 
  value, 
  displayInt = false, 
  onChange, 
  className = "flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
}: FormattedInputProps) {
  const [inputValue, setInputValue] = useState<string>('');

  // Update input value when prop value changes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setInputValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty input
    if (newValue === '') {
      setInputValue('');
      onChange(0);
      return;
    }

    // Only allow numbers and decimal point
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(newValue)) {
      return;
    }

    if (displayInt) {
      // Format with 2 decimal places
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        const formattedValue = isNaN(parseInt(newValue, 10)) ? '' : parseInt(newValue, 10).toString();
        console.log(formattedValue, 'formattedValue')
        setInputValue(formattedValue);
        onChange(Number(formattedValue));
      }
      return
    }

    setInputValue(newValue);
    
    // Convert to number and format with 2 decimal places
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      onChange(parseFloat(numValue.toFixed(2)));
    }
  };

  const handleBlur = () => {
    // Format with 2 decimal places on blur
    if (inputValue !== '' && inputValue !== "0") {
      const numValue = parseFloat(inputValue.toLocaleString());
      if (!isNaN(numValue)) {
        if (displayInt){
          const formattedValue = isNaN(parseInt(inputValue, 10)) ? '' : parseInt(inputValue, 10).toString();
          setInputValue(formattedValue);
          onChange(Number(formattedValue));
          return
        }
        else{
          const formattedValue = numValue.toFixed(2);
          setInputValue(formattedValue);
          onChange(parseFloat(formattedValue));
          return
        }
      }
    }
  };

  return (
    <div className='flex flex-col gap-2 text-sm'>
      {label && <label>{label}</label>}
      <input
        type={type}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
    </div>
  );
}