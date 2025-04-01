import { ColumnDef } from "@tanstack/react-table";
import { PushNotificationCampaign } from "@/types/push-notification";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<PushNotificationCampaign>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "body",
    header: "Message",
  },
  {
    accessorKey: "sendDate",
    header: "Send Date",
    cell: ({ row }) => {
      const date = row.getValue("sendDate") as Date;
      return date ? format(date, 'MMM dd, yyyy HH:mm') : 'N/A';
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={
          status === 'sent' ? 'default' :
          status === 'scheduled' ? 'secondary' :
          'destructive'
        }>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return date ? format(date, 'MMM dd, yyyy') : 'N/A';
    },
  },
];