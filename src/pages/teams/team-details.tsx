import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TeamDocument, TeamMember } from '@/types/team';
import { Challenge } from '@/types/challenge';
import { User } from '@/types/user';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MembersDialog } from './components/members-dialog';
import { Button } from '@/components/ui/button';
import { Users, FileText, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDocument | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        
        // Fetch team details
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (!teamDoc.exists()) {
          throw new Error('Team not found');
        }
        setTeam({ id: teamDoc.id, ...teamDoc.data() } as TeamDocument);

        // Fetch team members
        const membersQuery = query(
          collection(db, 'team_members'),
          where('team_id', '==', teamId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TeamMember[];
        setMembers(membersData);

        // Fetch team challenges
        const challengesQuery = query(
          collection(db, 'challenges'),
          where('team_id', '==', teamId)
        );
        const challengesSnapshot = await getDocs(challengesQuery);
        const challengesData = challengesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Challenge[];
        setChallenges(challengesData);

        // Fetch all users for email suggestions
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);

      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading team details...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900">Team not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {team.logo_url && (
            <img
              src={team.logo_url}
              alt={team.name}
              className="h-16 w-16 object-contain rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-500">Created {format(team.created_at.toDate(), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowMembersDialog(true)}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Manage Members
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Team Members</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{members.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Challenges</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{challenges.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Knowledge Base</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{team.knowledge_base?.length || 0}</p>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full border-b">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{team.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Team Information</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{team.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {team.website}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Team Code</dt>
                    <dd className="mt-1">
                      <Badge variant="outline" className="font-mono">
                        {team.team_code}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Team Leader</dt>
                    <dd className="mt-1 text-sm text-gray-900">{team.team_leader_email}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Social Media</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {Object.entries(team.social_media || {}).map(([platform, handle]) => (
                    handle && (
                      <div key={platform}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">{platform}</dt>
                        <dd className="mt-1 text-sm text-gray-900">{handle}</dd>
                      </div>
                    )
                  ))}
                </dl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(member.joined_at.toDate(), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="challenges" className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>{challenge.title}</TableCell>
                      <TableCell>{challenge.type}</TableCell>
                      <TableCell>{challenge.duration}s</TableCell>
                      <TableCell>
                        <Badge variant={challenge.isFree ? 'secondary' : 'default'}>
                          {challenge.isFree ? 'Free' : 'Premium'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="knowledge" className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.knowledge_base?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      <MembersDialog
        team={team}
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        availableUsers={users}
      />
    </div>
  );
}