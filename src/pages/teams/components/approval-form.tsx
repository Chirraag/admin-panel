import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ApprovalFormData } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
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

const CATEGORIES = [
  'SaaS Sales',
  'Real Estate',
  'Insurance',
  'Retail',
  'Healthcare',
  'Financial Services',
  'Technology',
  'Education',
  'Other'
] as const;

const approvalSchema = z.object({
  team_code: z.string().min(6, 'Team code must be at least 6 characters'),
  category: z.enum(CATEGORIES),
  website: z.string().url('Invalid website URL'),
  social_media: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    twitter: z.string().optional(),
  }),
  knowledge_base: z.array(z.string().url('Invalid URL')).optional(),
});

interface ApprovalFormProps {
  onSubmit: (data: ApprovalFormData) => Promise<void>;
  onCancel: () => void;
}

export function ApprovalForm({ onSubmit, onCancel }: ApprovalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knowledgeBaseUrls, setKnowledgeBaseUrls] = useState<string[]>([]);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      team_code: '',
      category: 'SaaS Sales',
      website: '',
      social_media: {
        instagram: '',
        tiktok: '',
        youtube: '',
        twitter: '',
      },
      knowledge_base: [],
    },
  });

  const handleSubmit = async (data: ApprovalFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKnowledgeBaseUrl = () => {
    setKnowledgeBaseUrls([...knowledgeBaseUrls, '']);
  };

  const removeKnowledgeBaseUrl = (index: number) => {
    const newUrls = knowledgeBaseUrls.filter((_, i) => i !== index);
    setKnowledgeBaseUrls(newUrls);
    form.setValue('knowledge_base', newUrls);
  };

  const updateKnowledgeBaseUrl = (index: number, value: string) => {
    const newUrls = [...knowledgeBaseUrls];
    newUrls[index] = value;
    setKnowledgeBaseUrls(newUrls);
    form.setValue('knowledge_base', newUrls);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="team_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input {...field} type="url" placeholder="https://" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Social Media Links (Optional)</h3>
          <FormField
            control={form.control}
            name="social_media.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="@username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="social_media.tiktok"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TikTok</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="@username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="social_media.youtube"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Channel URL" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="social_media.twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>X (Twitter)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="@username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Knowledge Base URLs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKnowledgeBaseUrl}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
          {knowledgeBaseUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => updateKnowledgeBaseUrl(index, e.target.value)}
                placeholder="https://"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeKnowledgeBaseUrl(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve Team'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}