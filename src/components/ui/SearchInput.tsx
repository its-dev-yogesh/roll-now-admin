import { SearchIcon } from "./icons";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
}

export function SearchInput({ value, onChange, placeholder, ...rest }: SearchInputProps) {
  return (
    <label className="search">
      <SearchIcon size={16} />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} {...rest} />
    </label>
  );
}
