import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PushNotificationCampaign } from '@/types/push-notification';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationForm } from './notification-form';
import { toast } from 'sonner';
import { getMessaging, getToken, sendMessage } from 'firebase/messaging';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchNotifications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'push_notifications'));
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sendDate: doc.data().sendDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      } as PushNotificationCampaign));
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreate = async (data: PushNotificationFormData) => {
    try {
      // Create the notification campaign
      const docRef = await addDoc(collection(db, 'push_notifications'), {
        ...data,
        status: 'scheduled',
        createdAt: Timestamp.now(),
        sendDate: Timestamp.fromDate(data.sendDate)
      });

      // Get FCM token
      const messaging = getMessaging();
      const token = await getToken(messaging);

      // Send the notification immediately
      await sendMessage(messaging, {
        notification: {
          title: data.title,
          body: data.body
        },
        token
      });

      toast.success('Notification campaign created and sent successfully');
      setShowForm(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <DataTable columns={columns} data={notifications} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Push Notification Campaign</DialogTitle>
          </DialogHeader>
          <NotificationForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}