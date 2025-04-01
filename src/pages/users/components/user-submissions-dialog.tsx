import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types/submission';
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
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserSubmissionsDialog({ 
  open, 
  onOpenChange, 
  userId,
  userName 
}: UserSubmissionsDialogProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        const q = query(
          collection(db, 'submissions'),
          where('user_id', '==', userId),
          orderBy('created_at', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at ? new Date(doc.data().created_at) : null
        })) as Submission[];
        
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Submissions for {userName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No submissions found for this user
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {submission.created_at ? 
                        format(submission.created_at, 'MMM dd, yyyy HH:mm') : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {submission.callDuration ? 
                        `${(submission.callDuration).toFixed(2)} min` : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {submission.metrics && (
                          <>
                            <Badge variant="outline">
                              Clarity: {submission.metrics.clarity ?? 'N/A'}%
                            </Badge>
                            <Badge variant="outline">
                              Pace: {submission.metrics.pace ?? 'N/A'}
                            </Badge>
                            <Badge variant="outline">
                              Tonality: {submission.metrics.tonality ?? 'N/A'}
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.recordingUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(submission.recordingUrl, '_blank')}
                          title="Play Recording"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}