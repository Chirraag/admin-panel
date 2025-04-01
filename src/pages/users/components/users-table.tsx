import { User } from '@/types/user';
import { columns } from '../columns';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

export function UsersTable({ users, onLoadMore, hasMore, loadingMore }: UsersTableProps) {
  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={users} />
      {hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={loadingMore}
            className="mt-4"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}