
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DateSelector = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "Pick a date",
  required = false,
  minDate,
  maxDate
}: DateSelectorProps) => {
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM');
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <div>
      <Label htmlFor={id} className="text-foreground font-medium">
        {label} {required && '*'}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseDate(value)!, "MMMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDate(value)}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (maxDate && date > maxDate) return true;
              if (minDate && date < minDate) return true;
              return false;
            }}
            className={cn("p-3 pointer-events-auto")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateSelector;
