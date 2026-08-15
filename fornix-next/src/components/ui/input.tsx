import React from 'react'

interface IInput {
    type?: string;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
    sx?: string;
    disabled?: boolean;
    error?: boolean;
    errorMessage?: string;
    name?: string;
    autoFocus?: boolean;
    pattern?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
}

const Input = ({type, placeholder, value, sx, disabled, error, required, autoFocus, errorMessage, onChange, name, minLength, maxLength } : IInput) => {
  return (
    <input
     type={type} 
     placeholder={placeholder} 
     value={value}
     onChange={onChange} 
     name= {name}
     disabled={disabled}
     required={required}
     autoFocus={autoFocus}
     minLength={minLength}
     maxLength={maxLength}
     className={`w-full h-11 rounded-[5px] border-border o py-2 px-3 border-[1px] ${error && "border-red-500"} ${sx}`}
     />
  )
}

export default Input
