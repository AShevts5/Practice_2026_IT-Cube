import * as React from "react";
import { formatRuPhoneInput, RU_PHONE_PLACEHOLDER } from "@/shared/lib/phone";
import { Input } from "./input";

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "onChange" | "value"
> & {
  value: string;
  onChange: (value: string) => void;
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onBlur, name, placeholder, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(formatRuPhoneInput(e.target.value));
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        name={name}
        placeholder={placeholder ?? RU_PHONE_PLACEHOLDER}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
