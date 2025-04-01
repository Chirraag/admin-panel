import { Control } from 'react-hook-form';
import { ChallengeFormData } from '@/types/challenge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FeatureInput } from '@/components/forms/feature-input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ProductFormProps {
  control: Control<ChallengeFormData>;
}

export function ProductForm({ control }: ProductFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Product Details</h2>
      <div className="grid gap-4">
        <FormField
          control={control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="product_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <FeatureInput 
                  items={field.value} 
                  onChange={field.onChange}
                  addButtonText="Add Feature"
                  placeholder="Enter feature"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}