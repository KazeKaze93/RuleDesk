import { type ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  Heart,
  Images,
  Eye,
  Loader2,
  Users,
  Video,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const PIE_COLORS = {
  safe: "#22c55e",
  questionable: "#eab308",
  explicit: "#ef4444",
};

const formatDbSize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const StatsPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => window.api.getStats(),
    staleTime: 30_000,
  });

  const viewedPercent = useMemo(() => {
    if (!stats || stats.totalPosts === 0) {
      return 0;
    }
    return (stats.totalViewed / stats.totalPosts) * 100;
  }, [stats]);

  const favoritedPercent = useMemo(() => {
    if (!stats || stats.totalPosts === 0) {
      return 0;
    }
    return (stats.totalFavorited / stats.totalPosts) * 100;
  }, [stats]);

  const ratingData = useMemo(() => {
    if (!stats) {
      return [];
    }
    return [
      { name: "Safe", value: stats.postsByRating.safe, color: PIE_COLORS.safe },
      {
        name: "Questionable",
        value: stats.postsByRating.questionable,
        color: PIE_COLORS.questionable,
      },
      { name: "Explicit", value: stats.postsByRating.explicit, color: PIE_COLORS.explicit },
    ];
  }, [stats]);

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of local database and content metrics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard title="Total Artists" value={stats.totalArtists.toLocaleString()} icon={<Users className="w-4 h-4" />} />
        <StatCard title="Total Posts" value={stats.totalPosts.toLocaleString()} icon={<Images className="w-4 h-4" />} />
        <StatCard
          title="Viewed"
          value={stats.totalViewed.toLocaleString()}
          subtitle={`${viewedPercent.toFixed(1)}%`}
          icon={<Eye className="w-4 h-4" />}
        />
        <StatCard
          title="Favorited"
          value={stats.totalFavorited.toLocaleString()}
          subtitle={`${favoritedPercent.toFixed(1)}%`}
          icon={<Heart className="w-4 h-4" />}
        />
        <StatCard title="Videos" value={stats.totalVideos.toLocaleString()} icon={<Video className="w-4 h-4" />} />
        <StatCard
          title="DB Size"
          value={formatDbSize(stats.dbFileSizeBytes)}
          icon={<HardDrive className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <PieChart width={720} height={300}>
            <Pie data={ratingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {ratingData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Artists by Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist Name</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">New Posts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topArtistsByPosts.map((artist) => (
                <TableRow key={artist.name}>
                  <TableCell>{artist.name}</TableCell>
                  <TableCell className="text-right">{artist.postCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{artist.newPostsCount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
};

const StatCard = ({ title, value, icon, subtitle }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle ? <p className="text-xs text-muted-foreground">({subtitle})</p> : null}
      </CardContent>
    </Card>
  );
};
