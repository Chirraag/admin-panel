import { Control } from 'react-hook-form';
import { ChallengeFormData } from '@/types/challenge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

interface TrainingFormProps {
  control: Control<ChallengeFormData>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function TrainingForm({ control, onCancel, isSubmitting }: TrainingFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Training Parameters</h2>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (seconds)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                The duration for both training and actual challenge
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="training_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Training Type</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Challenge'
          )}
        </Button>
      </div>
    </div>
  );
}