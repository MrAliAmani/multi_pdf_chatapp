import React, { ReactNode } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export const Select: React.FC<SelectProps> = ({ onValueChange, children, ...props }) => {
  return (
    <select
      {...props}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
    >
      {children}
    </select>
  )
}

interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => (
  <div className={className}>{children}</div>
)

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => <span>{placeholder}</span>

interface SelectContentProps {
  children: ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => <div>{children}</div>

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => <option {...props}>{children}</option>
