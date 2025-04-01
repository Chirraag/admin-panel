import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';

interface Voice {
  voice_id: string;
  name: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url: string;
}

interface VoiceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (voiceId: string) => void;
}

export function VoiceSelectionDialog({
  open,
  onOpenChange,
  onSelect,
}: VoiceSelectionDialogProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      if (!open) return; // Only fetch when dialog is open
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://closercademy-backend-v-4-chiragguptaatwo.replit.app/api/list_voices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }

        const data = await response.json();
        console.log('Fetched voices:', data); // Debug log
        setVoices(data.voices || []);
      } catch (error) {
        console.error('Error fetching voices:', error);
        setError('Failed to load voices');
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, [open]); // Re-fetch when dialog opens

  const playPreview = (previewUrl: string, voiceId: string) => {
    const audio = document.getElementById('voice-preview') as HTMLAudioElement;
    
    if (audioPlaying === voiceId) {
      // If the same voice is playing, pause it
      audio?.pause();
      setAudioPlaying(null);
    } else {
      // If a different voice is selected or nothing is playing
      if (audioPlaying) {
        // If something else is playing, stop it first
        audio?.pause();
      }
      // Play the new selection
      audio.src = previewUrl;
      audio.play().catch(console.error);
      setAudioPlaying(voiceId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Voice</DialogTitle>
        </DialogHeader>

        {loading && <div className="text-center py-4">Loading voices...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voices.map((voice) => (
                <TableRow key={voice.voice_id}>
                  <TableCell className="font-medium">{voice.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(voice.labels).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {value}
                          </Badge>
                        )
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Toggle
                      pressed={audioPlaying === voice.voice_id}
                      onPressedChange={() => playPreview(voice.preview_url, voice.voice_id)}
                      size="sm"
                      aria-label="Toggle voice preview"
                    >
                      {audioPlaying === voice.voice_id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Toggle>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onSelect(voice.voice_id);
                        onOpenChange(false);
                      }}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Hidden audio element for previews */}
        <audio 
          id="voice-preview" 
          onEnded={() => setAudioPlaying(null)}
          onPause={() => setAudioPlaying(null)}
        />
      </DialogContent>
    </Dialog>
  );
}