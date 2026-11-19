# Avaluacions

[English overview and engineering decisions](README.md)

Explorador en català dels resultats de **6è de primària** i **4t d’ESO** a Catalunya, a partir de dades públiques de la Generalitat.

- Resultats anuals: distribucions de puntuacions i mitjanes.
- Evolució i comparació de dos anys amb explicacions calculades.
- Filtres combinables de gènere, àrea territorial i titularitat.
- Referència catalana fixa dins de cada etapa i any.
- Components de cada competència, amb nombres de puntuacions vàlides.
- Descàrrega de les dades de la vista en CSV.
- Pruna per a primària i blau mediterrani per a ESO.

## Executar en local

Només cal Python 3; el web no necessita dependències ni compilació.

```sh
python3 -m http.server 8000 --directory docs --bind 127.0.0.1
```

Obre [localhost:8000](http://localhost:8000). Cal servir el web per HTTP: obrir `index.html` directament no permet carregar els JSON en tots els navegadors.

## Publicar a GitHub Pages

1. Crea un repositori anomenat **avaluacions** al teu compte de GitHub.
2. Puja el contingut d’aquest projecte al repositori, mantenint la carpeta `docs/`.
3. A **Settings → Pages**, selecciona **Deploy from a branch**, branca **main**, carpeta **/docs**, i desa.
4. GitHub mostrarà l’adreça publicada quan acabi el desplegament.

[Documentació oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Tots els recursos utilitzen rutes relatives, compatibles amb una adreça com `https://USUARI.github.io/avaluacions/`. També pots servir el contingut de `docs/` en un altre allotjament estàtic. No cal cap compte de Sites, clau d’API, servidor d’aplicacions ni base de dades.

Per pujar-lo des del terminal, després de crear el repositori buit:

```sh
git init -b main
git add .
git commit -m "Initial version of Avaluacions"
git remote add origin https://github.com/USUARI/avaluacions.git
git push -u origin main
```

Substitueix `USUARI` pel teu usuari de GitHub. La carpeta preparada és un repositori Git local amb branca `main`, sense cap remot configurat. El ZIP no inclou metadades Git; les ordres anteriors també el preparen després de descomprimir-lo.

## Estructura

```text
docs/                 Web estàtic i dades agregades, llest per publicar
  index.html
  style.css
  app.mjs             Interfície, gràfics, filtres i comparacions
  model.mjs           Càlculs compartits
  data.json           Agregats de primària
  data-eso.json       Agregats d’ESO
scripts/build_data.py Conversió dels CSV originals a agregats
tests/model.test.mjs  Verificacions dels càlculs
```

## Dades i atribució

Font: Generalitat de Catalunya, Dades obertes de Catalunya. Exportacions aportades del **19 de novembre de 2026**:

| Etapa | Conjunt original | Files | Cobertura |
|---|---|---:|---|
| 6è de primària | [Avaluació de sisè d’educació primària](https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-sis-d-educaci-prim-ria/rk5x-gny6/about_data) | 1.102.324 | 2009–2025, sense 2020 |
| 4t d’ESO | [Avaluació de quart d’Educació Secundària Obligatòria](https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-quart-d-Educaci-Secund-ria-Obligat-ria/59vm-wwq7/about_data) | 929.604 | 2012–2025, inclou 2020 |

Consulta als conjunts originals les condicions de reutilització. El projecte no és un web oficial de la Generalitat.

Els JSON inclouen només agregats per any, gènere, àrea territorial i titularitat: nombres, sumes i histogrames en intervals de 10 punts. No inclouen codis d’alumne ni dates de naixement. Els CSV originals no es distribueixen amb el projecte i estan exclosos de Git.

### Criteris de càlcul i límits

- Mitjana aritmètica de les puntuacions disponibles de 0 a 100, sense ponderació addicional entre registres. Les notes globals publicades es mantenen; no es recalculen a partir dels components.
- Els buits s’exclouen del denominador; no es converteixen en zeros. `n` indica puntuacions vàlides, no tota la població escolar.
- Histogrames: [0,10), [10,20), …, [90,100]. No són nivells oficials d’assoliment.
- S’unifiquen H/Home, D/Dona, Públic/Pública i Privat/Privada. Es conserven els noms territorials sense suposar equivalències.
- Les categories territorials canvien el 2024–2025 a primària i el 2023 a ESO. ESO inclou 19 registres de Garraf el 2017. Una fila de primària de 2024 sense àrea es manté al total català.
- Anglès de primària té notes des de 2010; medi, des de 2018. Ciència i tecnologia d’ESO, des de 2016. Els components tenen cobertura variable. Francès i alemany no es mostren.
- Cada edició correspon a cohorts diferents. No s’acredita una escala equiparada entre anys o etapes: les comparacions són descriptives, no causals. Les mitjanes del fitxer poden diferir de les dels informes oficials.
- El fitxer és una fotografia de les exportacions; no s’actualitza automàticament.

## Quan el conjunt oficial incorpori un any nou

Per exemple, quan es publiquin els resultats de 2026, descarrega els CSV actualitzats dels mateixos enllaços oficials i executa `scripts/build_data.py` amb aquests fitxers i la nova data d’exportació (vegeu les ordres següents). Pots actualitzar cada etapa per separat. Revisa els canvis en columnes, categories o territoris i actualitza les notes de cobertura i els recomptes de la documentació, així com les descripcions d’etapa de `docs/app.mjs` i `docs/index.html`. Executa les proves, comprova l’any nou a les vistes anual i d’evolució (també els components), i puja i publica els JSON regenerats i els altres canvis. Els selectors d’any i els rangs dels gràfics es calculen a partir de les dades i incorporaran l’any nou automàticament. El web no consulta les actualitzacions oficials per si mateix.

## Actualitzar les dades

Descarrega els CSV originals i desa’ls fora del repositori o a `raw-data/` (carpeta ignorada per Git). Després:

```sh
python3 scripts/build_data.py \
  --primary "raw-data/primaria.csv" \
  --eso "raw-data/eso.csv" \
  --export-date 2026-11-19
```

Pots passar només una etapa. El procés usa la biblioteca estàndard de Python i escriu els JSON a `docs/`. Si canvien l’esquema, les competències o els anys disponibles, revisa també les etiquetes i notes de cobertura a `docs/app.mjs` i `docs/index.html`.

## Verificació

Amb Node.js instal·lat:

```sh
node --test tests/model.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Les dades inicials també s’han contrastat amb lectures independents dels CSV originals i s’han comprovat les vistes, els filtres i el canvi d’etapa al navegador.

Els controls també s’executen a GitHub Actions en cada push i pull request. No hi ha proves automatitzades de navegador; la verificació visual s’ha fet manualment durant el desenvolupament.
