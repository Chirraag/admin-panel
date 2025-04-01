export interface PushNotificationCampaign {
  id: string;
  title: string;
  body: string;
  sendDate: Date;
  status: 'scheduled' | 'sent' | 'failed';
  createdAt: Date;
}

export type PushNotificationFormData = Omit<PushNotificationCampaign, 'id' | 'status' | 'createdAt'>;