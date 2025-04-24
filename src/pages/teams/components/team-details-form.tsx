import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TeamDocument } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, X, Check, FileText } from 'lucide-react';
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
import { KnowledgeBaseUpload } from './knowledge-base-upload';

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

const detailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(CATEGORIES),
  website: z.string().url('Invalid website URL'),
  team_leader_email: z.string().email('Invalid email address'),
  social_media: z.object({
    youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
    twitter: z.string().min(1, 'Twitter handle is required').optional().or(z.literal('')),
    instagram: z.string().min(1, 'Instagram handle is required').optional().or(z.literal('')),
    tiktok: z.string().min(1, 'TikTok handle is required').optional().or(z.literal('')),
  }),
  knowledge_base: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })),
});

interface TeamDetailsFormProps {
  team: TeamDocument;
  onSave: (data: z.infer<typeof detailsSchema>) => Promise<void>;
  defaultEditMode?: boolean;
}

export function TeamDetailsForm({ team, onSave, defaultEditMode = false }: TeamDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(defaultEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set edit mode based on team status when component mounts
  useEffect(() => {
    if (team.status === 'Pending') {
      setIsEditing(true);
    }
  }, [team.status]);

  // Return early if team is null or undefined
  if (!team) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const form = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: team.name || '',
      description: team.description || '',
      category: (team.category as any) || 'SaaS Sales',
      website: team.website || '',
      team_leader_email: team.team_leader_email || '',
      social_media: {
        youtube: team.social_media?.youtube || '',
        twitter: team.social_media?.twitter || '',
        instagram: team.social_media?.instagram || '',
        tiktok: team.social_media?.tiktok || '',
      },
      knowledge_base: team.knowledge_base || [],
    },
  });

  const handleSubmit = async (data: z.infer<typeof detailsSchema>) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      // Only set editing to false if not in pending status
      if (team.status !== 'Pending') {
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Details
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-600">{team.description || 'No description provided'}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Team Information</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{team.category || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {team.website ? (
                  <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {team.website}
                  </a>
                ) : (
                  'Not specified'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Team Leader</dt>
              <dd className="mt-1 text-sm text-gray-900">{team.team_leader_email || 'Not specified'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Social Media</h3>
          <dl className="grid grid-cols-2 gap-4">
            {Object.entries(team.social_media || {}).map(([platform, handle]) => (
              handle && (
                <div key={platform}>
                  <dt className="text-sm font-medium text-gray-500 capitalize">{platform}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {platform === 'youtube' ? (
                      <a href={handle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {handle}
                      </a>
                    ) : (
                      <a 
                        href={`https://${platform}.com/${handle.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {handle}
                      </a>
                    )}
                  </dd>
                </div>
              )
            ))}
          </dl>
          {!team.social_media || Object.values(team.social_media).every(v => !v) && (
            <p className="text-sm text-gray-500">No social media links provided</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
          {team.knowledge_base && team.knowledge_base.length > 0 ? (
            <div className="space-y-2">
              {team.knowledge_base.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No files uploaded yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <FormField
          control={form.control}
          name="team_leader_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Leader Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="social_media.youtube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Channel URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://youtube.com/..." />
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
                  <FormLabel>X (Twitter) Handle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="@username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_media.instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Handle</FormLabel>
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
                  <FormLabel>TikTok Handle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="@username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="knowledge_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Knowledge Base Files</FormLabel>
              <FormControl>
                <KnowledgeBaseUpload
                  files={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}