const fs = require('fs');
const filePath = 'C:/Users/sandr/OneDrive/Desktop/tehnika-vordlus/src/pages/Admin.tsx';
let data = fs.readFileSync(filePath, 'utf8');

function repExact(from, to) {
  const idx = data.indexOf(from);
  if (idx === -1) { console.warn('NOT FOUND:', JSON.stringify(from.slice(0,80))); return; }
  data = data.slice(0, idx) + to + data.slice(idx + from.length);
  console.log('OK:', JSON.stringify(from.slice(0,60)));
}

// Tab labels with correct whitespace
repExact('                    Argumendid\r\n                  </TabsTrigger>',
         '                    {t("admin.tabArguments")}\r\n                  </TabsTrigger>');
repExact('                    Müüdid\r\n                  </TabsTrigger>',
         '                    {t("admin.tabMyths")}\r\n                  </TabsTrigger>');
repExact('                    Kasutajad\r\n                  </TabsTrigger>',
         '                    {t("admin.tabUsers")}\r\n                  </TabsTrigger>');

// Lisa buttons with correct whitespace
repExact('                     Lisa tehnika\r\n                   </Button>',
         '                     {t("admin.addEquipment")}\r\n                   </Button>');
repExact('                     Lisa argument\r\n                   </Button>',
         '                     {t("admin.addArgument")}\r\n                   </Button>');
repExact('                     Lisa müüt\r\n                   </Button>',
         '                     {t("admin.addMyth")}\r\n                   </Button>');

// Andmed salvestatud toast
repExact('title: "Andmed salvestatud!",',
         'title: t("admin.dataSaved"),');

// Müüte pole veel lisatud (correct whitespace)
repExact('                 Müüte pole veel lisatud\r\n               </div>',
         '                 {t("admin.mythsEmpty")}\r\n               </div>');

fs.writeFileSync(filePath, data);
console.log('\nDone! File length:', data.length);
