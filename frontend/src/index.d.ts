declare module "@/components/ui/button" {
  import { ButtonHTMLAttributes } from 'react';
  export const Button: React.FC<ButtonHTMLAttributes<HTMLButtonElement>>;
}

declare module "@/components/ui/input" {
  import { InputHTMLAttributes } from 'react';
  export const Input: React.FC<InputHTMLAttributes<HTMLInputElement>>;
}

declare module "@/components/ui/progress" {
  import { ProgressHTMLAttributes } from 'react';
  export const Progress: React.FC<ProgressHTMLAttributes<HTMLProgressElement>>;
}
