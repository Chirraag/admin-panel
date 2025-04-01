import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Challenge } from '@/types/challenge';
import { toast } from 'sonner';
import Vapi from "@vapi-ai/web";
import { useAuth } from '@/lib/auth';

interface TestChallengeDialogProps {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestChallengeDialog({ challenge, open, onOpenChange }: TestChallengeDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Cleanup on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (vapi) {
        try {
          vapi.stop();
          setVapi(null);
          setIsCallActive(false);
        } catch (e) {
          console.error('Error cleaning up vapi instance:', e);
        }
      }
    };
  }, [vapi]);

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsCallActive(false);
      setInitializing(false);
      setLoading(false);
      if (vapi) {
        try {
          vapi.stop();
          setVapi(null);
        } catch (e) {
          console.error('Error cleaning up vapi instance:', e);
        }
      }
    }
  }, [open, vapi]);

  const startCall = async () => {
    if (!user) {
      toast.error('You must be logged in to test challenges');
      return;
    }

    try {
      setLoading(true);
      setInitializing(true);

      // Initialize Vapi first
      const vapiInstance = new Vapi("0dba36e4-e054-438e-a3a8-0da03f5c28c1");
      setVapi(vapiInstance);
      
      // Start call API request
      const response = await fetch('https://closercademy-backend-v-4-chiragguptaatwo.replit.app/api/start_call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          challenge_id: challenge.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start call');
      }

      const data = await response.json();
      
      if (!data.success || !data.data.agent_id) {
        throw new Error('Invalid response from server');
      }

      // Start the call only after successful API response
      await vapiInstance.start(data.data.agent_id);
      setIsCallActive(true);
      toast.success('Call started successfully');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
      // Clean up on error
      if (vapi) {
        try {
          await vapi.stop();
        } catch (e) {
          console.error('Error cleaning up vapi instance:', e);
        }
        setVapi(null);
      }
      setIsCallActive(false);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const endCall = async () => {
    try {
      setLoading(true);
      if (vapi) {
        await vapi.stop();
        setVapi(null);
      }
      setIsCallActive(false);
      toast.success('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (isCallActive) {
      await endCall();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Challenge: {challenge.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {initializing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Initializing call...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={`p-6 rounded-full transition-colors ${
                isCallActive ? 'bg-green-50' : 'bg-gray-100'
              }`}>
                {isCallActive ? (
                  <Mic className="h-8 w-8 text-green-600" />
                ) : (
                  <MicOff className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <Button
                onClick={isCallActive ? endCall : startCall}
                disabled={loading || !user}
                variant={isCallActive ? "destructive" : "default"}
                className="w-full relative"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isCallActive ? "Ending call..." : "Starting call..."}
                  </>
                ) : (
                  <>
                    {isCallActive ? "End Call" : "Start Call"}
                  </>
                )}
              </Button>

              {isCallActive && (
                <div className="text-center text-sm text-gray-500">
                  Call is active. Click "End Call" when you're finished.
                </div>
              )}

              {!user && (
                <div className="text-center text-sm text-red-500">
                  You must be logged in to test challenges
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}