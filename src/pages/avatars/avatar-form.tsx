import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AvatarFormData } from '@/types/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/forms/image-upload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VoiceSelectionDialog } from './voice-selection-dialog';

const BOOK_RATES = ['Easy', 'Medium', 'Hard'] as const;

const avatarSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(18, 'Age must be at least 18'),
  gender: z.string().min(1, 'Gender is required'),
  description: z.string().min(1, 'Description is required'),
  ambient_sound: z.string().min(1, 'Ambient sound is required'),
  image_url: z.string().min(1, 'Image is required'),
  voice_id: z.string().min(1, 'Voice ID is required'),
  volume: z.string().min(1, 'Volume is required'),
  book_rate: z.enum(['Easy', 'Medium', 'Hard'], {
    required_error: 'Book rate is required',
  }),
  key_personality_trait: z.string().min(1, 'Key personality trait is required'),
});

interface AvatarFormProps {
  initialData?: Partial<AvatarFormData>;
  onSubmit: (data: AvatarFormData) => Promise<void>;
  onCancel: () => void;
}

export function AvatarForm({ initialData, onSubmit, onCancel }: AvatarFormProps) {
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      name: '',
      age: 30,
      gender: 'Male',
      description: '',
      ambient_sound: 'coffee-shop',
      image_url: '',
      voice_id: '',
      volume: '1',
      book_rate: '',
      key_personality_trait: '',
      ...initialData,
    },
  });

  const handleSubmit = async (data: AvatarFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="key_personality_trait"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Personality Trait</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Witty but mildly sarcastic" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="book_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Rate</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select book rate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOK_RATES.map((rate) => (
                        <SelectItem key={rate} value={rate}>
                          {rate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ambient_sound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambient Sound</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="voice_id"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Voice ID</FormLabel>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVoiceDialog(true)}
                      className="h-8 px-3"
                    >
                      Select Voice
                    </Button>
                  </div>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Avatar' : 'Create Avatar'
              )}
            </Button>
          </div>
        </form>
      </Form>

      <VoiceSelectionDialog
        open={showVoiceDialog}
        onOpenChange={setShowVoiceDialog}
        onSelect={(voiceId) => {
          form.setValue('voice_id', voiceId);
        }}
      />
    </>
  );
}