const fs = require('fs');
const filePath = 'C:/Users/sandr/OneDrive/Desktop/tehnika-vordlus/src/pages/Admin.tsx';
let data = fs.readFileSync(filePath, 'utf8');

// Helper: replace exact string safely
function rep(from, to) {
  if (!data.includes(from)) {
    console.warn('NOT FOUND:', JSON.stringify(from.slice(0, 80)));
    return;
  }
  data = data.replace(from, to);
  console.log('Replaced:', JSON.stringify(from.slice(0, 60)));
}

// 1. Add `t` to useTranslation destructure
rep(
  'const { i18n } = useTranslation();',
  'const { t, i18n } = useTranslation();'
);

// 2. Admin banner title
rep(
  '<h1 className="text-3xl font-bold">Administreerimine</h1>',
  '<h1 className="text-3xl font-bold">{t("admin.title")}</h1>'
);

// 3. Admin banner description
rep(
  'Halda tehnikaid, konkurentsieeliseid ja müüte.',
  '{t("admin.description")}'
);

// 4. Tab labels
rep(
  '                  Tehnika\n                </TabsTrigger>',
  '                  {t("admin.tabEquipment")}\n                </TabsTrigger>'
);
rep(
  '                    Argumendid\n                   </TabsTrigger>',
  '                    {t("admin.tabArguments")}\n                   </TabsTrigger>'
);
rep(
  '                    Müüdid\n                   </TabsTrigger>',
  '                    {t("admin.tabMyths")}\n                   </TabsTrigger>'
);
rep(
  '                    Kasutajad\n                   </TabsTrigger>',
  '                    {t("admin.tabUsers")}\n                   </TabsTrigger>'
);

// 5. Equipment section heading and button
rep(
  '<h2 className="text-xl font-semibold">Tehnika nimekiri</h2>',
  '<h2 className="text-xl font-semibold">{t("admin.equipmentList")}</h2>'
);
rep(
  '                      Lisa tehnika\n                    </Button>',
  '                      {t("admin.addEquipment")}\n                    </Button>'
);
rep(
  '{editingEquipment ? "Muuda tehnikat" : "Lisa uus tehnika"}',
  '{editingEquipment ? t("admin.editEquipment") : t("admin.newEquipment")}'
);

// 6. Arguments section heading and button
rep(
  '<h2 className="text-xl font-semibold">Konkurentsieelised</h2>',
  '<h2 className="text-xl font-semibold">{t("admin.competitiveAdvantages")}</h2>'
);
rep(
  '                      Lisa argument\n                    </Button>',
  '                      {t("admin.addArgument")}\n                    </Button>'
);
rep(
  '{editingArgument ? "Muuda argumenti" : "Lisa uus argument"}',
  '{editingArgument ? t("admin.editArgument") : t("admin.newArgument")}'
);

// 7. Argument form labels
rep(
  '<Label>Tehnika tüüp</Label>',
  '<Label>{t("admin.equipmentType")}</Label>'
);
rep(
  '<SelectValue placeholder="Vali tehnika tüüp" />',
  '<SelectValue placeholder={t("admin.selectEquipmentType")} />'
);
rep(
  '<Label>Konkurent</Label>',
  '<Label>{t("admin.competitor")}</Label>'
);
rep(
  '<SelectValue placeholder="Vali konkurent" />',
  '<SelectValue placeholder={t("admin.selectCompetitor")} />'
);
rep(
  '<Label>Kategooria</Label>\n                          <Select name="category" defaultValue={editingArgument',
  '<Label>{t("admin.category")}</Label>\n                          <Select name="category" defaultValue={editingArgument'
);
rep(
  '<SelectItem value="technology">Tehnoloogia</SelectItem>',
  '<SelectItem value="technology">{t("advantage.category.technology")}</SelectItem>'
);
rep(
  '<SelectItem value="performance">Jõudlus</SelectItem>',
  '<SelectItem value="performance">{t("advantage.category.performance")}</SelectItem>'
);
rep(
  '<SelectItem value="fuel">Kütusesääst</SelectItem>',
  '<SelectItem value="fuel">{t("advantage.category.fuel")}</SelectItem>'
);
rep(
  '<SelectItem value="efficiency">Tõhusus</SelectItem>',
  '<SelectItem value="efficiency">{t("advantage.category.efficiency")}</SelectItem>'
);
rep(
  '<SelectItem value="automation">Automatiseerimine</SelectItem>',
  '<SelectItem value="automation">{t("advantage.category.automation")}</SelectItem>'
);
rep(
  '<SelectItem value="precision">Täppispõllumajandus</SelectItem>',
  '<SelectItem value="precision">{t("advantage.category.precision")}</SelectItem>'
);
rep(
  '<SelectItem value="comfort">Mugavus</SelectItem>',
  '<SelectItem value="comfort">{t("advantage.category.comfort")}</SelectItem>'
);
rep(
  '<SelectItem value="service">Teenindus</SelectItem>',
  '<SelectItem value="service">{t("advantage.category.service")}</SelectItem>'
);
rep(
  '<SelectItem value="value">Väärtus</SelectItem>',
  '<SelectItem value="value">{t("advantage.category.value")}</SelectItem>'
);
rep(
  '<Label>Ikooni nimi</Label>',
  '<Label>{t("admin.iconName")}</Label>'
);
rep(
  '<SelectItem value="Lightbulb">Lambipirn (Tehnoloogia)</SelectItem>',
  '<SelectItem value="Lightbulb">{t("iconLabel.Lightbulb")}</SelectItem>'
);
rep(
  '<SelectItem value="Fuel">Kütus</SelectItem>',
  '<SelectItem value="Fuel">{t("iconLabel.Fuel")}</SelectItem>'
);
rep(
  '<SelectItem value="Zap">Välk (Jõudlus)</SelectItem>',
  '<SelectItem value="Zap">{t("iconLabel.Zap")}</SelectItem>'
);
rep(
  '<SelectItem value="Wrench">Mutrivõti (Hooldus)</SelectItem>',
  '<SelectItem value="Wrench">{t("iconLabel.Wrench")}</SelectItem>'
);
rep(
  '<SelectItem value="TrendingUp">Trend üles (Kasum)</SelectItem>',
  '<SelectItem value="TrendingUp">{t("iconLabel.TrendingUp")}</SelectItem>'
);
rep(
  '<SelectItem value="Shield">Kilp (Kvaliteet)</SelectItem>',
  '<SelectItem value="Shield">{t("iconLabel.Shield")}</SelectItem>'
);

// 8. Argument form lang-tab field labels
rep(
  '<Label>Pealkiri ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.titleField")} ({l.toUpperCase()})</Label>'
);
rep(
  '<Label>Probleem ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.problemField")} ({l.toUpperCase()})</Label>'
);
rep(
  '<Label>John Deere lahendus ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.jdSolution")} ({l.toUpperCase()})</Label>'
);
rep(
  '<Label>Kasu kliendile ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.customerBenefit")} ({l.toUpperCase()})</Label>'
);

// 9. Argument save button
rep(
  '{createArgument.isPending || updateArgument.isPending ? "Salvestan..." : "Salvesta"}',
  '{createArgument.isPending || updateArgument.isPending ? t("admin.saving") : t("common.save")}'
);

// 10. Filter label and "all types"
rep(
  '<Label className="text-sm text-muted-foreground">Filtreeri tehnika tüübi järgi:</Label>',
  '<Label className="text-sm text-muted-foreground">{t("admin.filterByType")}</Label>'
);
rep(
  '<SelectItem value="all">Kõik tüübid</SelectItem>',
  '<SelectItem value="all">{t("admin.allTypes")}</SelectItem>'
);

// 11. Arguments empty state
rep(
  '                  Argumente pole veel lisatud\n                </div>',
  '                  {t("admin.argsEmpty")}\n                </div>'
);

// 12. Argument count badge
rep(
  "<Badge variant=\"outline\" className=\"ml-auto\">{typeArgs.length} argumenti</Badge>",
  "<Badge variant=\"outline\" className=\"ml-auto\">{t(\"admin.argCount\", { count: typeArgs.length })}</Badge>"
);

// 13. Argument card labels
rep(
  '<span className="font-medium">Probleem:</span>',
  '<span className="font-medium">{t("admin.argProblem")}</span>'
);
rep(
  '<span className="font-medium text-primary">Lahendus:</span>',
  '<span className="font-medium text-primary">{t("admin.argSolution")}</span>'
);
rep(
  '<span>Kasu:</span>',
  '<span>{t("admin.argBenefit")}</span>'
);

// 14. Myths section heading and button
rep(
  '<h2 className="text-xl font-semibold">Müütide haldamine</h2>',
  '<h2 className="text-xl font-semibold">{t("admin.mythsManagement")}</h2>'
);
rep(
  '                      Lisa müüt\n                    </Button>',
  '                      {t("admin.addMyth")}\n                    </Button>'
);
rep(
  '{editingMyth ? "Muuda müüti" : "Lisa uus müüt"}',
  '{editingMyth ? t("admin.editMyth") : t("admin.newMyth")}'
);

// 15. Myth form labels
rep(
  '<Label>Kategooria</Label>\n                         <Select name="category" required',
  '<Label>{t("admin.category")}</Label>\n                         <Select name="category" required'
);
rep(
  '<SelectValue placeholder="Vali kategooria" />',
  '<SelectValue placeholder={t("admin.selectCategory")} />'
);
// Myth categories - use t() keys (they already exist in myths.category.*)
rep(
  '{MYTH_CATEGORIES.map((cat) => (\n                               <SelectItem key={cat.value} value={cat.value}>\n                                 {cat.label}\n                               </SelectItem>\n                             ))}',
  '{MYTH_CATEGORIES.map((cat) => (\n                               <SelectItem key={cat.value} value={cat.value}>\n                                 {t(`myths.category.${cat.value}`)}\n                               </SelectItem>\n                             ))}'
);
rep(
  '<Label htmlFor="sort_order">Järjekord</Label>',
  '<Label htmlFor="sort_order">{t("admin.sortOrder")}</Label>'
);

// 16. Myth form field labels
rep(
  '<Label>Müüt ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.mythField")} ({l.toUpperCase()})</Label>'
);
rep(
  '<Label>Tegelikkus ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.realityField")} ({l.toUpperCase()})</Label>'
);
rep(
  '<Label>John Deere eelis ({l.toUpperCase()})</Label>',
  '<Label>{t("admin.jdAdvantage")} ({l.toUpperCase()})</Label>'
);

// 17. Myth save button
rep(
  '{createMyth.isPending || updateMyth.isPending ? "Salvestan..." : "Salvesta"}',
  '{createMyth.isPending || updateMyth.isPending ? t("admin.saving") : t("common.save")}'
);

// 18. Myths empty state
rep(
  '                Müüte pole veel lisatud\n              </div>',
  '                {t("admin.mythsEmpty")}\n              </div>'
);

// 19. Myth card category label uses t() - fix myth list rendering
rep(
  '<h3 className="font-semibold text-lg">{cat.label}</h3>',
  '<h3 className="font-semibold text-lg">{t(`myths.category.${cat.value}`)}</h3>'
);

// 20. Myth card labels
rep(
  '<span className="text-xs font-medium text-destructive">MÜÜT:</span>',
  '<span className="text-xs font-medium text-destructive">{t("admin.mythLabel")}</span>'
);
rep(
  '<span className="text-xs font-medium text-primary">TEGELIKKUS:</span>',
  '<span className="text-xs font-medium text-primary">{t("admin.realityLabel")}</span>'
);
rep(
  '<span className="text-xs font-medium text-success">JOHN DEERE EELIS:</span>',
  '<span className="text-xs font-medium text-success">{t("admin.jdAdvantageLabel")}</span>'
);

// 21. Brochure dialog title
rep(
  'Laadi üles brošüür: {brochureEquipment?.model_name}',
  '{t("admin.uploadBrochure")}: {brochureEquipment?.model_name}'
);

// 22. Toast messages
rep(
  'toast({ title: "Tehnika uuendatud!" });',
  'toast({ title: t("admin.equipmentUpdated") });'
);
rep(
  'toast({ title: "Tehnika lisatud!" });',
  'toast({ title: t("admin.equipmentAdded") });'
);
rep(
  '"Tehnika uuendamine ebaõnnestus" : "Tehnika lisamine ebaõnnestus"',
  't("admin.equipmentUpdateFailed") : t("admin.equipmentAddFailed")'
);
rep(
  'toast({ title: "Argument uuendatud!" });',
  'toast({ title: t("admin.argumentUpdated") });'
);
rep(
  'toast({ title: "Argument lisatud!" });',
  'toast({ title: t("admin.argumentAdded") });'
);
rep(
  '"Argumendi uuendamine ebaõnnestus" : "Argumendi lisamine ebaõnnestus"',
  't("admin.argumentUpdateFailed") : t("admin.argumentAddFailed")'
);
rep(
  'toast({ title: "Andmed salvestatud!" });',
  'toast({ title: t("admin.dataSaved") });'
);
rep(
  'description: `${brochureEquipment.model_name} tehnilised andmed on uuendatud.',
  'description: t("admin.dataUpdated", { model: brochureEquipment.model_name })'
);
// Remove the trailing backtick that was part of the template literal
data = data.replace(
  't("admin.dataUpdated", { model: brochureEquipment.model_name })`',
  't("admin.dataUpdated", { model: brochureEquipment.model_name })'
);
rep(
  '"Andmete salvestamine ebaõnnestus"',
  't("admin.dataSaveFailed")'
);
rep(
  'toast({ title: "Müüt uuendatud!" });',
  'toast({ title: t("admin.mythUpdated") });'
);
rep(
  'toast({ title: "Müüt lisatud!" });',
  'toast({ title: t("admin.mythAdded") });'
);
rep(
  '"Müüdi uuendamine ebaõnnestus" : "Müüdi lisamine ebaõnnestus"',
  't("admin.mythUpdateFailed") : t("admin.mythAddFailed")'
);

fs.writeFileSync(filePath, data);
console.log('\nAdmin.tsx patched successfully!');
console.log('File length:', data.length);
