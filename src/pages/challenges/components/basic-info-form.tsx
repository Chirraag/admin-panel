import { Control } from 'react-hook-form';
import { ChallengeFormData } from '@/types/challenge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AvatarSelect } from '@/components/forms/avatar-select';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/types/category';
import {
  FormControl,
  FormDescription,
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

const CHALLENGE_TYPES = [
  'Cold Call',
  '1:1 Meeting',
  'Relationship Building',
  'Price Drop',
  'Offer Delivery'
] as const;

interface BasicInfoFormProps {
  control: Control<ChallengeFormData>;
}

export function BasicInfoForm({ control }: BasicInfoFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        // Filter out any categories with empty or undefined IDs or names
        const validCategories = categoriesData.filter(category => 
          category.id && 
          category.id.trim() !== '' && 
          category.name && 
          category.name.trim() !== ''
        );
        setCategories(validCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const watchIsFree = (isFree: boolean, onChange: (value: number) => void, currentValue: number) => {
    useEffect(() => {
      if (isFree && currentValue !== 0) {
        onChange(0);
      }
    }, [isFree, onChange, currentValue]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Basic Information</h2>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <AvatarSelect 
                    value={field.value} 
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select challenge type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHALLENGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="credits"
            render={({ field }) => {
              return (
                <FormField
                  control={control}
                  name="isFree"
                  render={({ field: isFreeField }) => {
                    watchIsFree(isFreeField.value, field.onChange, field.value);
                    
                    return (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={isFreeField.value ? 0 : field.value}
                            onChange={e => field.onChange(Number(e.target.value))}
                            disabled={isFreeField.value}
                          />
                        </FormControl>
                        {isFreeField.value && (
                          <FormDescription className="text-amber-600">
                            Credits set to 0 for free challenges
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              );
            }}
          />

          <FormField
            control={control}
            name="isFree"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Free Access</FormLabel>
                  <FormDescription>
                    Make this challenge available to all users
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}