import React from 'react'

export const Progress: React.FC<React.ProgressHTMLAttributes<HTMLProgressElement>> = (props) => {
  return <progress {...props} />
}
