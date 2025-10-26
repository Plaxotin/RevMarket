import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const cities = [
  "Россия, все города",
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград"
];

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CityCombobox = ({ value, onChange, placeholder = "Выберите или введите город" }: CityComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue(selectedValue);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Поиск города..." 
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 text-center text-sm">
                <div>Выберите город из списка</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  или введите свой в поле выше
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => handleSelect(city)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
            {inputValue && !filteredCities.includes(inputValue) && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSelect(inputValue)}
                  className="text-primary"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === inputValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Использовать: "{inputValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
