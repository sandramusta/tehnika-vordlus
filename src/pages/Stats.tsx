import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Trophy,
  BarChart3,
  Users,
  ArrowUpDown,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useLeaderboard, useDashboardStats, type StatsPeriod } from "@/hooks/useActivityStats";
import { formatDistanceToNow, format } from "date-fns";
import { et, lv } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type SortField = "total_points" | "pdf_count" | "comparison_count";

export default function Stats() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<StatsPeriod>("current_month");
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useLeaderboard(period);
  const { data: stats, isLoading: loadingStats } = useDashboardStats(period);
  const [sortBy, setSortBy] = useState<SortField>("total_points");

  const dateLocale = i18n.language === "lv" ? lv : et;

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === "pdf_count") {
      return b.pdf_count - a.pdf_count;
    }
    if (sortBy === "comparison_count") {
      return b.comparison_count - a.comparison_count;
    }
    return b[sortBy] - a[sortBy];
  });

  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 0:
        return <span className="text-2xl">🥇</span>;
      case 1:
        return <span className="text-2xl">🥈</span>;
      case 2:
        return <span className="text-2xl">🥉</span>;
      default:
        return (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {position + 1}.
          </span>
        );
    }
  };

  const getRowStyle = (position: number) => {
    switch (position) {
      case 0:
        return "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-400";
      case 1:
        return "bg-gray-50 dark:bg-gray-900/20 border-l-4 border-l-gray-400";
      case 2:
        return "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-400";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-primary-foreground">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8" />
            {t("stats.title")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-primary-foreground/80">
            {t("stats.description")}
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          <Button
            variant={period === "current_month" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("current_month")}
            className="gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            {t("stats.currentMonth")}
          </Button>
          <Button
            variant={period === "all_time" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("all_time")}
            className="gap-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t("stats.allTime")}
          </Button>
        </div>

        {period === "current_month" && (
          <h2 className="text-2xl sm:text-3xl font-bold capitalize">
            {format(new Date(), "LLLL yyyy", { locale: dateLocale })}
          </h2>
        )}

        {/* Dashboard Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.todayPdfs")}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingStats ? "..." : stats?.todayPDFs ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.downloadedPdfs")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.mostPopularMachine")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {loadingStats
                  ? "..."
                  : stats?.mostPopularModel ?? t("stats.noData")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.mostComparedModel")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.mostActiveUser")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {loadingStats
                  ? "..."
                  : stats?.mostActiveUser ?? t("stats.noData")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.mostActiveToday")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("stats.leaderboard")}
              </CardTitle>
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  variant={sortBy === "total_points" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("total_points")}
                  className="gap-1 text-xs px-2"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {t("stats.sortByPoints")}
                </Button>
                <Button
                  variant={sortBy === "pdf_count" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("pdf_count")}
                  className="gap-1 text-xs px-2"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  PDF
                </Button>
                <Button
                  variant={sortBy === "comparison_count" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("comparison_count")}
                  className="gap-1 text-xs px-2"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {t("stats.sortByComparisons")}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("stats.pointsLegend")}
            </p>
          </CardHeader>
          <CardContent>
            {loadingLeaderboard ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                {t("stats.loading")}
              </div>
            ) : sortedLeaderboard.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                {t("stats.empty")}
              </div>
            ) : (
              <>
                {/* Mobile: card layout */}
                <div className="space-y-3 sm:hidden">
                  {sortedLeaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`rounded-lg border p-3 ${getRowStyle(index)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">{getTrophyIcon(index)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{entry.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {entry.email}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">
                          {entry.last_active
                            ? formatDistanceToNow(new Date(entry.last_active), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            : "—"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">PDF</span>
                          <Badge variant="secondary" className="text-xs">{entry.pdf_count}</Badge>
                          <span className="text-xs text-muted-foreground">{t("stats.comparison")}</span>
                          <Badge variant="secondary" className="text-xs">{entry.comparison_count}</Badge>
                          <Badge
                            variant={index < 3 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                                : ""
                            }
                          >
                            {entry.total_points}p
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table layout */}
                <div className="rounded-md border hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">{t("stats.position")}</TableHead>
                        <TableHead>{t("stats.name")}</TableHead>
                        <TableHead>{t("stats.lastActive")}</TableHead>
                        <TableHead className="text-center">{t("stats.pdfReports")}</TableHead>
                        <TableHead className="text-center">{t("stats.comparisons")}</TableHead>
                        <TableHead className="text-center">{t("stats.points")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLeaderboard.map((entry, index) => (
                        <TableRow
                          key={entry.user_id}
                          className={getRowStyle(index)}
                        >
                          <TableCell>{getTrophyIcon(index)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {entry.last_active
                              ? formatDistanceToNow(new Date(entry.last_active), {
                                  addSuffix: true,
                                  locale: dateLocale,
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{entry.pdf_count}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{entry.comparison_count}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={index < 3 ? "default" : "outline"}
                              className={
                                index === 0
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                                  : ""
                              }
                            >
                              {entry.total_points}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
