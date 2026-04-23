import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  Loader2,
  Image,
  Video,
  Users,
  FileText,
  Heart,
  EyeOff,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const formatDbSize = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const getPercent = (value: number, total: number): string => {
  if (total === 0) {
    return "0.0%";
  }
  return `${((value / total) * 100).toFixed(1)}%`;
};

const PIE_COLORS = {
  safe: "#22c55e",
  questionable: "#eab308",
  explicit: "#ef4444",
};

const STATUS_COLORS = {
  primary: "#3b82f6",
  secondary: "#94a3b8",
  accent: "#f59e0b",
  muted: "#64748b",
};

export const StatsPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => window.api.getExtendedStats(),
    staleTime: 30_000,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ratingData = [
    { name: "Safe", value: stats.ratingCounts.safe, color: PIE_COLORS.safe },
    {
      name: "Questionable",
      value: stats.ratingCounts.questionable,
      color: PIE_COLORS.questionable,
    },
    { name: "Explicit", value: stats.ratingCounts.explicit, color: PIE_COLORS.explicit },
  ];
  const viewedData = [
    {
      name: "Viewed",
      value: stats.totalPosts - stats.totalUnviewed,
      color: STATUS_COLORS.primary,
    },
    {
      name: "Unviewed",
      value: stats.totalUnviewed,
      color: STATUS_COLORS.secondary,
    },
  ];
  const favoritesData = [
    {
      name: "Favorited",
      value: stats.totalFavorites,
      color: STATUS_COLORS.accent,
    },
    {
      name: "Not Favorited",
      value: stats.totalPosts - stats.totalFavorites,
      color: STATUS_COLORS.muted,
    },
  ];
  const mediaData = [
    {
      name: "Images",
      value: stats.mediaCounts.images,
      color: STATUS_COLORS.primary,
    },
    {
      name: "Videos",
      value: stats.mediaCounts.videos,
      color: STATUS_COLORS.accent,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistics Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Extended overview of local library distribution and growth.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Artists" value={stats.totalArtists.toLocaleString()} icon={<Users className="w-4 h-4" />} />
        <StatCard title="Posts" value={stats.totalPosts.toLocaleString()} icon={<FileText className="w-4 h-4" />} />
        <StatCard
          title="Favorites"
          value={stats.totalFavorites.toLocaleString()}
          subtitle={getPercent(stats.totalFavorites, stats.totalPosts)}
          icon={<Heart className="w-4 h-4" />}
        />
        <StatCard
          title="Unviewed"
          value={stats.totalUnviewed.toLocaleString()}
          subtitle={getPercent(stats.totalUnviewed, stats.totalPosts)}
          icon={<EyeOff className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[18rem]">
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  label
                >
                  {ratingData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <PieMetricCard title="Media Type Split" data={mediaData} />
        <PieMetricCard title="Viewed vs Unviewed" data={viewedData} />
        <PieMetricCard title="Favorites vs Others" data={favoritesData} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[10.5rem]">
          <CardHeader>
            <CardTitle className="text-lg">Media and Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Image className="w-3 h-3" /> Images {stats.mediaCounts.images.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Video className="w-3 h-3" /> Videos {stats.mediaCounts.videos.toLocaleString()}
              </Badge>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">rule34 artists: {stats.providerCounts.rule34.toLocaleString()}</Badge>
              <Badge variant="secondary">gelbooru artists: {stats.providerCounts.gelbooru.toLocaleString()}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="h-[10.5rem]">
          <CardHeader>
            <CardTitle className="text-lg">Database Size</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current database file</span>
            <span className="flex gap-2 items-center text-lg font-semibold">
              <HardDrive className="w-4 h-4" />
              {formatDbSize(stats.dbSizeBytes)}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Artists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topArtists.map((artist, index) => (
              <div key={artist.name} className="flex justify-between items-center text-sm">
                <span className="truncate">
                  {index + 1}. {artist.name}
                </span>
                <Badge variant="outline">{artist.postCount.toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stats.topTags.map((tagItem) => (
              <Badge key={tagItem.tag} variant="secondary">
                {tagItem.tag} ({tagItem.count})
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

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

type PieMetricDatum = {
  name: string;
  value: number;
  color: string;
};

type PieMetricCardProps = {
  title: string;
  data: PieMetricDatum[];
};

const PieMetricCard = ({ title, data }: PieMetricCardProps) => {
  return (
    <Card className="h-[18rem]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={72}
              label
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
