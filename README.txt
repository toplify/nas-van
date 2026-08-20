0 KM V12 — IPHONE FIRST

Primární zařízení je iPhone v režimu na výšku.
Mobilní layout je nyní hlavní, desktop pouze sekundární.

Na iPhonu:
- 3 horní stavové hodnoty jsou v jedné kompaktní řadě
- obsah jde přirozeně pod sebe
- kapitoly jsou 2 × 2
- velké revealy využívají téměř celou obrazovku
- TOMÍK editor má vstupy a tlačítka vhodná pro dotyk
- formulářová pole používají velikost 16 px, aby Safari při psaní samo nezoomovalo
- zohledňuje se safe area horního výřezu / Dynamic Islandu a spodního Home indikátoru
- cesta je horizontálně posuvná
- editorový pruh je sticky

Heslo TOMÍK: VAN2026

Poznámka: data jsou stále localStorage. Pro živou synchronizaci mezi dvěma iPhony bude potřeba databáze.

V12.3:
Po odemčení kapitoly Náš van může hráčka sama zadat jméno vanu.
Jméno se uloží a propíše do názvu karty Náš van, spodního milníku a dalších kapitol.
Hráčka ho může později sama změnit.


V12.4 — JMÉNO + ODHALENÍ VANU
- Tína může jméno nastavit pouze jednou.
- Po uložení na hráčské stránce už není tlačítko Změnit.
- Jméno může následně měnit jen TOMÍK v editovatelném admin pohledu.
- TOMÍK může nahrát fotografii konkrétního vanu.
- Po pojmenování vyskočí speciální reveal: kouř/mlha zakryje fotografii a postupně odhalí van a jeho nové jméno.
- Pokud fotografie ještě není nahraná, reveal použije van placeholder.


V12.5 — RESET PRO TESTOVÁNÍ
V TOMÍK režimu je dole tlačítko „Resetovat 0 KM“.
Reset vrátí:
- fond na 0
- den na 1
- km na 0
- priority na prázdné
- kandidáty na prázdné
- lekce na prázdné
- jméno vanu na prázdné
- fotografii vanu na prázdnou
- všechny kapitoly na zamčené
- všechny reveal stavy na začátek

V12.6:
Po pojmenování vanu se fotografie nahraná TOMÍKEM nezobrazuje pouze v reveal animaci.
Zůstává také přímo v otevřené kapitole „Náš van“, společně s jeho jménem.

V12.7:
Fotografie vanu může být TOMÍKEM nahraná předem, ale hráčka ji v kapitole Náš van neuvidí před naming revealem.
Po pojmenování se nejdřív zobrazí kouřový reveal. Teprve po jeho zavření/odkliknutí se fotografie zpřístupní i v samotné kapitole.

V13 — COZY GAME DESIGN
Vzhled převeden na iPhone-first cozy game styl:
- bílé / krémové panely
- teplé béžové akcenty
- jemný papírový background
- vygenerovaná watercolor krajina v headeru
- světlejší herní karty, kapitoly, formuláře a revealy
- zachována veškerá funkčnost V12.7

V14.1 — POVINNÁ INSPIRACE
Výchozí pravidlo:
- každá část Přestavby musí mít vybranou variantu + nahranou inspirační fotku
- bez fotky nejde část uložit jako dokončenou

TOMÍK režim:
- přepínač „Vyžadovat inspirační fotky“
- vypnutím lze části dokončit i bez fotografie

V15.4:
Opraven toggle kapitol. Při zavření se už nemaže obsah chapterInner; kapitola se pouze skryje.
Opětovné otevření znovu vykreslí její obsah a nezobrazuje prázdný bílý pruh.


V17.2 — OPRAVA PŘESTAVBY
- výběr možnosti / vlastní odpověď je povinný
- inspirační fotografie je dobrovolná
- nahrání fotografie už nezavírá modal ani kapitolu
- fotografie se nejdřív jen lokálně zobrazí jako náhled a uloží se až společně s volbou
- fotografie se před uložením zmenší, aby méně zatěžovala localStorage
- po potvrzení se kapitola znovu vykreslí a odemkne další krok
- jméno a identita vanu mají samostatnou lokální zálohu, aby se po pozdější práci s obrázky neztratily


V17.3 — NÁŠ DOMOV ZŮSTÁVÁ OTEVŘENÝ
- po uložení jednoho kroku se kapitola Náš domov nezavře
- okamžitě se překreslí a ukáže další odemčený krok
- totéž platí při přidání / odstranění fotografie v této kapitole
