const fs = require('fs');
const filePath = 'C:/Users/sandr/OneDrive/Desktop/tehnika-vordlus/src/pages/Admin.tsx';
let data = fs.readFileSync(filePath, 'utf8');

function repExact(from, to) {
  const idx = data.indexOf(from);
  if (idx === -1) {
    console.warn('NOT FOUND:', JSON.stringify(from.slice(0,80)));
    return;
  }
  data = data.slice(0, idx) + to + data.slice(idx + from.length);
  console.log('OK:', JSON.stringify(from.slice(0,60)));
}

// Tab labels (CRLF)
repExact('                  Tehnika\r\n                </TabsTrigger>',
         '                  {t("admin.tabEquipment")}\r\n                </TabsTrigger>');
repExact('                    Argumendid\r\n                   </TabsTrigger>',
         '                    {t("admin.tabArguments")}\r\n                   </TabsTrigger>');
repExact('                    Müüdid\r\n                   </TabsTrigger>',
         '                    {t("admin.tabMyths")}\r\n                   </TabsTrigger>');
repExact('                    Kasutajad\r\n                   </TabsTrigger>',
         '                    {t("admin.tabUsers")}\r\n                   </TabsTrigger>');

// Lisa tehnika button (CRLF)
repExact('                      Lisa tehnika\r\n                    </Button>',
         '                      {t("admin.addEquipment")}\r\n                    </Button>');

// Lisa argument button (CRLF)
repExact('                      Lisa argument\r\n                    </Button>',
         '                      {t("admin.addArgument")}\r\n                    </Button>');

// Argument category label (CRLF)
repExact('<Label>Kategooria</Label>\r\n                          <Select name="category" defaultValue={editingArgument',
         '<Label>{t("admin.category")}</Label>\r\n                          <Select name="category" defaultValue={editingArgument');

// Arguments empty state (CRLF)
repExact('                  Argumente pole veel lisatud\r\n                </div>',
         '                  {t("admin.argsEmpty")}\r\n                </div>');

// Lisa müüt button (CRLF)
repExact('                      Lisa müüt\r\n                    </Button>',
         '                      {t("admin.addMyth")}\r\n                    </Button>');

// Myth form category label (CRLF)
repExact('<Label>Kategooria</Label>\r\n                         <Select name="category" required',
         '<Label>{t("admin.category")}</Label>\r\n                         <Select name="category" required');

// MYTH_CATEGORIES map - replace cat.label
repExact('{MYTH_CATEGORIES.map((cat) => (\r\n                               <SelectItem key={cat.value} value={cat.value}>\r\n                                 {cat.label}\r\n                               </SelectItem>\r\n                             ))}',
         '{MYTH_CATEGORIES.map((cat) => (\r\n                               <SelectItem key={cat.value} value={cat.value}>\r\n                                 {t(`myths.category.${cat.value}`)}\r\n                               </SelectItem>\r\n                             ))}');

// Myths empty state (CRLF)
repExact('                Müüte pole veel lisatud\r\n              </div>',
         '                {t("admin.mythsEmpty")}\r\n              </div>');

// Brochure dataSaved toast
repExact('toast({ title: "Andmed salvestatud!" });',
         'toast({ title: t("admin.dataSaved") });');

fs.writeFileSync(filePath, data);
console.log('\nDone! File length:', data.length);
