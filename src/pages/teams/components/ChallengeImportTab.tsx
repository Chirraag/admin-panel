import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Challenge } from "@/types/challenge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Import } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface ChallengeImportTabProps {
  onImport: (challenge: Challenge) => void;
}

export function ChallengeImportTab({ onImport }: ChallengeImportTabProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Fetch categories and challenges
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First fetch categories to build the mapping
        const categorySnap = await getDocs(collection(db, "categories"));
        const categoryData = categorySnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        })) as Category[];

        setCategories(categoryData);

        // Build a map from category_id to name for easier lookup
        const catMap: Record<string, string> = {};
        categoryData.forEach((cat) => {
          catMap[cat.id] = cat.name;
        });
        setCategoryMap(catMap);

        // Now fetch challenges
        const challengeSnap = await getDocs(collection(db, "challenges"));
        const challengeData = challengeSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Add category name for display purposes
          categoryName: catMap[doc.data().category_id] || "Unknown",
        })) as Challenge[];

        setChallenges(challengeData);
        setFilteredChallenges(challengeData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter challenges when search or category changes
  useEffect(() => {
    let filtered = challenges;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (challenge) =>
          challenge.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          challenge.type?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((challenge) => {
        // Get category name from the map
        const challengeCategoryName = categoryMap[challenge.category_id] || "";
        return challengeCategoryName === selectedCategory;
      });
    }

    setFilteredChallenges(filtered);
  }, [searchQuery, selectedCategory, challenges, categoryMap]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading challenges...</p>
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No challenges found</p>
          <p className="text-sm text-gray-400 mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {challenge.type}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {challenge.duration}s
                      </span>
                      {challenge.category_id && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {categoryMap[challenge.category_id] || "Unknown"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-2">
                      {challenge.isFree ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge>Premium</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImport(challenge)}
                    className="flex items-center gap-2"
                  >
                    <Import className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
