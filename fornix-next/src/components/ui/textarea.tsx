import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={`border rounded-lg p-2 w-full focus:ring focus:ring-blue-300 ${className}`}
      {...props}
    />
  );
};

export default Textarea;
