import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  Image,
  Video,
  Users,
  FileText,
  Heart,
  EyeOff,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { PageHeader } from "../layout/PageHeader";
import { resolveErrorMessage } from "../../utils/error-message";

const PIE_COLORS = {
  safe: "hsl(var(--primary))",
  questionable: "hsl(var(--accent-foreground))",
  explicit: "hsl(var(--destructive))",
};

const STATUS_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary-foreground))",
  accent: "hsl(var(--accent-foreground))",
  muted: "hsl(var(--muted-foreground))",
};

const PAGE_TITLE = "Statistics Dashboard";
const PAGE_DESCRIPTION =
  "Extended overview of local library distribution and growth.";
const NO_DATA_TITLE = "No data yet";
const NO_DATA_DESCRIPTION =
  "Track artists and sync posts to populate library statistics.";
const ERROR_TITLE = "Could not load statistics";
const RETRY_LABEL = "Retry";

const formatDbSize = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const getPercent = (value: number, total: number): string => {
  if (total === 0) {
    return "0.0%";
  }
  return `${((value / total) * 100).toFixed(1)}%`;
};

const StatsLoadingSkeleton = () => (
  <div className="space-y-6">
    <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} icon={BarChart3} />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[18rem] w-full" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[10.5rem] w-full" />
      <Skeleton className="h-[10.5rem] w-full" />
    </div>
  </div>
);

export const StatsPage = () => {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: () => window.api.getExtendedStats(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_DESCRIPTION}
          icon={BarChart3}
        />
        <Alert variant="destructive">
          <AlertTitle>{ERROR_TITLE}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {resolveErrorMessage(error, "Failed to load statistics.")}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {RETRY_LABEL}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_DESCRIPTION}
          icon={BarChart3}
        />
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center text-muted-foreground"
          role="status"
        >
          <p className="text-lg font-semibold text-foreground">{NO_DATA_TITLE}</p>
          <p className="text-sm">{NO_DATA_DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  const hasLibraryData = stats.totalArtists > 0 || stats.totalPosts > 0;

  if (!hasLibraryData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_DESCRIPTION}
          icon={BarChart3}
        />
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center text-muted-foreground"
          role="status"
        >
          <BarChart3 className="h-12 w-12 opacity-50" aria-hidden />
          <p className="text-lg font-semibold text-foreground">{NO_DATA_TITLE}</p>
          <p className="text-sm">{NO_DATA_DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        icon={BarChart3}
      />

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
        <PieMetricCard
          title="Rating Distribution"
          data={[
            { name: "Safe", value: stats.ratingCounts.safe, color: PIE_COLORS.safe },
            { name: "Questionable", value: stats.ratingCounts.questionable, color: PIE_COLORS.questionable },
            { name: "Explicit", value: stats.ratingCounts.explicit, color: PIE_COLORS.explicit },
          ]}
        />
        <PieMetricCard
          title="Media Type Split"
          data={[
            { name: "Images", value: stats.mediaCounts.images, color: STATUS_COLORS.primary },
            { name: "Videos", value: stats.mediaCounts.videos, color: STATUS_COLORS.accent },
          ]}
        />
        <PieMetricCard
          title="Viewed vs Unviewed"
          data={[
            { name: "Viewed", value: stats.totalPosts - stats.totalUnviewed, color: STATUS_COLORS.primary },
            { name: "Unviewed", value: stats.totalUnviewed, color: STATUS_COLORS.secondary },
          ]}
        />
        <PieMetricCard
          title="Favorites vs Others"
          data={[
            { name: "Favorited", value: stats.totalFavorites, color: STATUS_COLORS.accent },
            { name: "Not Favorited", value: stats.totalPosts - stats.totalFavorites, color: STATUS_COLORS.muted },
          ]}
        />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posts Timeline (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.postsTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill={STATUS_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
