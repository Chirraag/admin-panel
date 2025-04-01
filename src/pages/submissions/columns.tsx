import { ColumnDef } from "@tanstack/react-table";
import { Submission } from "@/types/submission";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Submission>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => row.getValue("title") || "Untitled",
  },
  {
    accessorKey: "callDuration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("callDuration");
      if (typeof duration !== 'number') return "N/A";
      return `${duration.toFixed(2)} min`;
    },
  },
  {
    accessorKey: "metrics",
    header: "Metrics",
    cell: ({ row }) => {
      const metrics = row.getValue("metrics") as Submission["metrics"];
      if (!metrics) return "No metrics available";

      return (
        <div className="flex gap-2">
          <Badge variant="outline">
            Clarity: {metrics.clarity ?? 'N/A'}%
          </Badge>
          <Badge variant="outline">
            Pace: {metrics.pace ?? 'N/A'}
          </Badge>
          <Badge variant="outline">
            Tonality: {metrics.tonality ?? 'N/A'}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const submission = row.original;
      if (!submission) return null;

      return (
        submission.recordingUrl && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(submission.recordingUrl, '_blank')}
            title="Play Recording"
          >
            <Play className="h-4 w-4" />
          </Button>
        )
      );
    },
  },
];