import { useForm } from 'react-hook-form';
import { SaleTypeFormData } from '@/types/sale-type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface SaleTypeFormProps {
  initialData?: Partial<SaleTypeFormData>;
  onSubmit: (data: SaleTypeFormData) => Promise<void>;
  onCancel: () => void;
}

export function SaleTypeForm({ initialData, onSubmit, onCancel }: SaleTypeFormProps) {
  const form = useForm<SaleTypeFormData>({
    defaultValues: {
      name: '',
      description: '',
      ...initialData,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Inbound Booked Calls" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="e.g., I handle calls with leads who book calls on our website"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Sale Type' : 'Create Sale Type'}
          </Button>
        </div>
      </form>
    </Form>
  );
}