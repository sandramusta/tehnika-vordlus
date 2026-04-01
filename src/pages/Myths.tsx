import { Layout } from "@/components/layout/Layout";
import { MythCategory } from "@/components/myths/MythCategory";
import { Clock, Wallet, Wrench, TrendingDown, CloudSun, HelpCircle, Loader2 } from "lucide-react";
import { useMyths } from "@/hooks/useEquipmentData";
import { useTranslation } from "react-i18next";
import { getTranslationField } from "@/lib/i18nHelpers";

const CATEGORY_ICONS = {
  uncertainty: Clock,
  finance: Wallet,
  machines: Wrench,
  costs: TrendingDown,
  weather: CloudSun,
  other: HelpCircle,
};

const CATEGORY_KEYS = ["uncertainty", "finance", "machines", "costs", "weather", "other"] as const;

export default function Myths() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: myths = [], isLoading } = useMyths();

  const CATEGORIES = CATEGORY_KEYS.map((key) => ({
    key,
    title: t(`myths.category.${key}`),
    icon: CATEGORY_ICONS[key],
  }));

  // Group myths by category, applying DB translations when available
  const mythsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    myths: myths
      .filter((m) => m.category === cat.key)
      .map((m) => ({
        id: m.id,
        myth: getTranslationField(m.translations, lang, "myth", m.myth),
        reality: getTranslationField(m.translations, lang, "reality", m.reality),
        advantage: getTranslationField(m.translations, lang, "advantage", m.advantage),
      })),
  }));

  // Calculate starting indices for each category
  let runningIndex = 1;
  const categoriesWithIndices = mythsByCategory.map((cat) => {
    const startIndex = runningIndex;
    runningIndex += cat.myths.length;
    return { ...cat, startIndex };
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">{t("myths.pageTitle")}</h1>
          <p className="mt-2 text-primary-foreground/80">
            {t("myths.pageDescription")}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && myths.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("myths.empty")}</p>
            <p className="text-sm mt-2">{t("myths.loadingHint")}</p>
          </div>
        )}

        {/* Myths by Category */}
        {!isLoading && myths.length > 0 && (
          <div className="grid gap-8">
            {categoriesWithIndices
              .filter((cat) => cat.myths.length > 0)
              .map((category) => (
                <MythCategory
                  key={category.key}
                  title={category.title}
                  icon={category.icon}
                  myths={category.myths}
                  startIndex={category.startIndex}
                />
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
