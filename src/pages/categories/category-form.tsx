import { useForm } from 'react-hook-form';
import { CategoryFormData, VapiFileInfo } from '@/types/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { X, Plus, Upload, Icon as Icons } from 'lucide-react';
import { uploadVapiFile, deleteVapiFile } from '@/lib/api/vapi';
import { toast } from 'sonner';
import { IconSearchDialog } from './icon-search-dialog';

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category_icon: z.string().min(1, 'Icon is required'),
  knowledge_base: z.array(z.any()).optional(),
  knowledge_base_dump: z.string().optional(),
  websites: z.array(z.string()).optional(),
});

export function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [showIconSearch, setShowIconSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      category_icon: '',
      knowledge_base: [],
      knowledge_base_dump: '',
      websites: [],
      ...initialData,
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload to Vapi
      const vapiFile = await uploadVapiFile(file);
      
      // Create file info object
      const fileInfo: VapiFileInfo = {
        id: vapiFile.id,
        name: vapiFile.name,
        orgId: vapiFile.orgId,
      };

      // Update form state with new file info
      const currentFiles = form.getValues('knowledge_base') || [];
      form.setValue('knowledge_base', [...currentFiles, fileInfo]);
      
      // Clear the input
      event.target.value = '';
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const removeFile = async (index: number) => {
    try {
      const currentFiles = form.getValues('knowledge_base');
      const fileToRemove = currentFiles[index];

      if (fileToRemove?.id) {
        // Delete from Vapi
        await deleteVapiFile(fileToRemove.id);
      }

      // Remove from form state
      form.setValue(
        'knowledge_base',
        currentFiles.filter((_, i) => i !== index)
      );
      
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const handleSubmit = async (data: CategoryFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon <span className="text-red-500">*</span></FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <div className="flex-1 flex items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {field.value && (
                        <span className="material-symbols-outlined">
                          {field.value}
                        </span>
                      )}
                      <span className="flex-1">
                        {field.value || 'No icon selected'}
                      </span>
                    </div>
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconSearch(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="knowledge_base_dump"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Knowledge Base Dump</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  className="min-h-[200px]"
                  placeholder="Enter knowledge base content..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="knowledge_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Knowledge Base Files</FormLabel>
              <div className="space-y-4">
                <div className="grid gap-2">
                  {field.value.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={file.name} readOnly />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
              initialData ? 'Update Category' : 'Create Category'
            )}
          </Button>
        </div>
      </form>

      <IconSearchDialog
        open={showIconSearch}
        onOpenChange={setShowIconSearch}
        onSelect={(iconName) => form.setValue('category_icon', iconName)}
      />
    </Form>
  );
}