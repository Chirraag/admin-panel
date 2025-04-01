import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';

interface IconSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (iconName: string) => void;
}

interface IconMetadata {
  name: string;
  version: number;
  popularity: number;
  tags: string[];
  categories: string[];
}

export function IconSearchDialog({ open, onOpenChange, onSelect }: IconSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIcons = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.codepoints');
        const text = await response.text();
        
        // Parse the codepoints file to get icon names
        const iconNames = text
          .split('\n')
          .filter(Boolean)
          .map(line => line.split(' ')[0]);
        
        setIcons(iconNames);
      } catch (err) {
        console.error('Error fetching icons:', err);
        setError('Failed to load icons');
      } finally {
        setLoading(false);
      }
    };

    fetchIcons();
  }, [open]);

  const filteredIcons = icons.filter(icon => 
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Material Icon</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[500px] rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-4 p-4">
              {filteredIcons.map((icon, index) => (
                <Button
                  key={`${icon}-${index}`}
                  variant="outline"
                  className="h-20 w-full p-2 flex flex-col items-center gap-1"
                  onClick={() => {
                    onSelect(icon);
                    onOpenChange(false);
                  }}
                >
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                  <span className="text-xs truncate w-full text-center">{icon}</span>
                </Button>
              ))}
              {filteredIcons.length === 0 && (
                <div className="col-span-6 text-center py-8 text-gray-500">
                  No icons found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}