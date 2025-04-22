import { Control } from 'react-hook-form';
import { ChallengeFormData } from '@/types/challenge';
import { Textarea } from '@/components/ui/textarea';
import { FeatureInput } from '@/components/forms/feature-input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ProspectFormProps {
  control: Control<ChallengeFormData>;
}

export function ProspectForm({ control }: ProspectFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Prospect Information</h2>
      <div className="grid gap-4">
        <FormField
          control={control}
          name="prospect_data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prospect Profile</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="objections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objection List</FormLabel>
              <FormControl>
                <FeatureInput 
                  items={field.value || []} 
                  onChange={field.onChange}
                  addButtonText="Add Objection"
                  placeholder="Enter objection"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="talking_points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Talking Points</FormLabel>
              <FormControl>
                <FeatureInput 
                  items={field.value || []} 
                  onChange={field.onChange}
                  addButtonText="Add Talking Point"
                  placeholder="Enter talking point"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="pain_points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pain Points</FormLabel>
              <FormControl>
                <FeatureInput 
                  items={field.value} 
                  onChange={field.onChange}
                  addButtonText="Add Pain Point"
                  placeholder="Enter pain point"
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