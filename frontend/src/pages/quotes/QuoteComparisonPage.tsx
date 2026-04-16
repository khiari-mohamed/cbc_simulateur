import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Download, Check, X, FileSpreadsheet } from 'lucide-react';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';

export const QuoteComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quoteIds = searchParams.get('ids')?.split(',') || [];

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', 'comparison', quoteIds],
    queryFn: async () => {
      const promises = quoteIds.map(id => api.get(`/quotes/${id}`).then(res => res.data));
      return Promise.all(promises);
    },
    enabled: quoteIds.length > 0,
  });

  const downloadQuote = async (quoteId: string) => {
    try {
      const { data } = await api.get(`/quotes/${quoteId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Devis téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const exportToExcel = async () => {
    try {
      if (!quotes || quotes.length === 0) return;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comparaison');

      // ── Palette ──────────────────────────────────────────────
      const DARK_BLUE  = 'FF1F4E79';
      const MID_BLUE   = 'FF2E75B6';
      const LIGHT_BLUE = 'FFD6E4F0';
      const GREEN_BG   = 'FFE2EFDA';
      const GREEN_FG   = 'FF375623';
      const RED_FG     = 'FF9C0006';
      const RED_BG     = 'FFFCE4D6';
      const GREY_BG    = 'FFF2F2F2';
      const WHITE      = 'FFFFFFFF';
      const TOTAL_BG   = 'FFFFD966';

      const border = (style: 'thin' | 'medium' = 'thin'): Partial<ExcelJS.Borders> => ({
        top:    { style },
        left:   { style },
        bottom: { style },
        right:  { style },
      });

      const centerMiddle: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const leftMiddle: Partial<ExcelJS.Alignment>   = { horizontal: 'left',   vertical: 'middle', wrapText: true };

      // ── Layout constants ──────────────────────────────────────
      // Layout per company (3 cols each): Garantie | ✓/✗ | Capital
      // Col 1 = Garantie label (fixed, shared)
      // Per company i: col 2+i*2 = Statut (✓/✗), col 3+i*2 = Capital
      const COL_LABEL    = 1;                          // shared "Garantie" column
      const colStatus    = (i: number) => 2 + i * 2;  // ✓/✗ column for company i
      const colCapital   = (i: number) => 3 + i * 2;  // Capital column for company i
      const totalCols    = 1 + quotes.length * 2;      // total columns

      // Column widths
      worksheet.getColumn(COL_LABEL).width = 36;
      quotes.forEach((_: any, i: number) => {
        worksheet.getColumn(colStatus(i)).width  = 18;
        worksheet.getColumn(colCapital(i)).width = 22;
      });

      let R = 1;

      // ── Main title ────────────────────────────────────────────
      worksheet.mergeCells(R, 1, R, totalCols);
      const titleCell = worksheet.getCell(R, 1);
      titleCell.value = 'COMPARAISON DE DEVIS';
      titleCell.style = {
        font:      { bold: true, size: 15, color: { argb: WHITE }, name: 'Arial' },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BLUE } },
        alignment: centerMiddle,
      };
      worksheet.getRow(R).height = 30;
      R++;

      // ── Vehicle info ──────────────────────────────────────────
      if (quotes[0]?.simulation?.vehicle) {
        R++;

        worksheet.mergeCells(R, 1, R, totalCols);
        const vh = worksheet.getCell(R, 1);
        vh.value = 'INFORMATIONS DU VÉHICULE';
        vh.style = {
          font:      { bold: true, size: 11, color: { argb: WHITE }, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
          alignment: leftMiddle,
        };
        worksheet.getRow(R).height = 22;
        R++;

        const vehicle = quotes[0].simulation.vehicle;
        const vehicleInfo: [string, string][] = [
          ['Immatriculation',   vehicle.registration || 'N/A'],
          ['Valeur à neuf',     `${vehicle.newValue.toLocaleString('fr-FR')} DT`],
          ['Valeur vénale',     `${vehicle.marketValue.toLocaleString('fr-FR')} DT`],
          ['Puissance fiscale', `${vehicle.fiscalHorsepower} CV`],
          ['Nombre de places',  String(vehicle.numberOfSeats)],
        ];

        vehicleInfo.forEach(([label, value], idx) => {
          const rowBg = idx % 2 === 0 ? WHITE : GREY_BG;
          worksheet.mergeCells(R, 2, R, totalCols);

          const lCell = worksheet.getCell(R, COL_LABEL);
          lCell.value = label;
          lCell.style = {
            font:      { bold: true, size: 10, name: 'Arial' },
            fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } },
            alignment: leftMiddle,
            border:    border(),
          };

          const vCell = worksheet.getCell(R, 2);
          vCell.value = value;
          vCell.style = {
            font:      { size: 10, name: 'Arial' },
            fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } },
            alignment: leftMiddle,
            border:    border(),
          };
          worksheet.getRow(R).height = 18;
          R++;
        });
      }

      R++;

      // ── Company headers (row A: company name spanning 2 cols) ─
      // Left label cell
      const emptyLabelCell = worksheet.getCell(R, COL_LABEL);
      emptyLabelCell.value = '';
      emptyLabelCell.style = {
        fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BLUE } },
        border: border('medium'),
      };

      quotes.forEach((quote: any, i: number) => {
        worksheet.mergeCells(R, colStatus(i), R, colCapital(i));
        const c = worksheet.getCell(R, colStatus(i));
        c.value = `${quote.company.name}\n${quote.quoteNumber}`;
        c.style = {
          font:      { bold: true, size: 11, color: { argb: WHITE }, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BLUE } },
          alignment: centerMiddle,
          border:    border('medium'),
        };
      });
      worksheet.getRow(R).height = 38;
      R++;

      // ── Sub-column headers: Garantie | Statut | Capital ───────
      const subLabelCell = worksheet.getCell(R, COL_LABEL);
      subLabelCell.value = 'Garantie';
      subLabelCell.style = {
        font:      { bold: true, size: 10, color: { argb: WHITE }, name: 'Arial' },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
        alignment: centerMiddle,
        border:    border(),
      };

      quotes.forEach((_: any, i: number) => {
        const sCell = worksheet.getCell(R, colStatus(i));
        sCell.value = 'Statut';
        sCell.style = {
          font:      { bold: true, size: 10, color: { argb: WHITE }, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
          alignment: centerMiddle,
          border:    border(),
        };

        const cCell = worksheet.getCell(R, colCapital(i));
        cCell.value = 'Capital';
        cCell.style = {
          font:      { bold: true, size: 10, color: { argb: WHITE }, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
          alignment: centerMiddle,
          border:    border(),
        };
      });
      worksheet.getRow(R).height = 20;
      R++;

      // ── Total TTC row ─────────────────────────────────────────
      const ttcLabel = worksheet.getCell(R, COL_LABEL);
      ttcLabel.value = 'Total TTC';
      ttcLabel.style = {
        font:      { bold: true, size: 12, name: 'Arial' },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } },
        alignment: leftMiddle,
        border:    border('medium'),
      };

      quotes.forEach((quote: any, i: number) => {
        worksheet.mergeCells(R, colStatus(i), R, colCapital(i));
        const c = worksheet.getCell(R, colStatus(i));
        c.value = `${quote.totalAPayer.toLocaleString('fr-FR')} DT`;
        c.style = {
          font:      { bold: true, size: 13, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } },
          alignment: centerMiddle,
          border:    border('medium'),
        };
      });
      worksheet.getRow(R).height = 28;
      R++;

      // ── Price breakdown rows ──────────────────────────────────
      const priceRows: Array<[string, (q: any) => string]> = [
        ['Prime nette',        (q: any) => `${q.primeNette.toLocaleString('fr-FR')} DT`],
        ['Frais',              (q: any) => `${q.frais.toLocaleString('fr-FR')} DT`],
        ['Taxes',              (q: any) => `${q.taxes.toLocaleString('fr-FR')} DT`],
        ['Frais additionnels', (q: any) => `${(q.fpac + q.fssr + q.fg).toLocaleString('fr-FR')} DT`],
      ];

      priceRows.forEach(([label, getValue], idx) => {
        const rowBg = idx % 2 === 0 ? WHITE : GREY_BG;

        const lCell = worksheet.getCell(R, COL_LABEL);
        lCell.value = label;
        lCell.style = {
          font:      { size: 10, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } },
          alignment: leftMiddle,
          border:    border(),
        };

        quotes.forEach((quote: any, i: number) => {
          worksheet.mergeCells(R, colStatus(i), R, colCapital(i));
          const c = worksheet.getCell(R, colStatus(i));
          c.value = getValue(quote);
          c.style = {
            font:      { size: 10, name: 'Arial' },
            fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } },
            alignment: centerMiddle,
            border:    border(),
          };
        });
        worksheet.getRow(R).height = 18;
        R++;
      });

      R++;

      // ── Guarantees section header ─────────────────────────────
      worksheet.mergeCells(R, 1, R, totalCols);
      const guarTitle = worksheet.getCell(R, 1);
      guarTitle.value = 'GARANTIES INCLUSES';
      guarTitle.style = {
        font:      { bold: true, size: 11, color: { argb: WHITE }, name: 'Arial' },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
        alignment: leftMiddle,
      };
      worksheet.getRow(R).height = 22;
      R++;

      // ── Guarantee rows: Garantie | ✓/✗ | Capital (per company) ─
      // allGuarantees is computed identically to the JSX section below
      const allGuaranteesSet = Array.from(
        new Set(
          quotes.flatMap((q: any) =>
            q.items
              ?.filter((item: any) => {
                if (q.simulation?.formulaType === 'STANDARD') {
                  return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
                }
                return true;
              })
              .map((item: any) => item.guarantee.nameFr) || []
          )
        )
      ) as string[];

      allGuaranteesSet.forEach((guarantee: string, rowIdx: number) => {
        const rowBg = rowIdx % 2 === 0 ? WHITE : GREY_BG;

        // Garantie label (shared col 1)
        const lCell = worksheet.getCell(R, COL_LABEL);
        lCell.value = guarantee;
        lCell.style = {
          font:      { size: 10, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } },
          alignment: leftMiddle,
          border:    border(),
        };

        quotes.forEach((quote: any, i: number) => {
          const item = quote.items
            ?.filter((item: any) => {
              if (quote.simulation?.formulaType === 'STANDARD') {
                return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
              }
              return true;
            })
            .find((item: any) => item.guarantee.nameFr === guarantee);

          const statusCell  = worksheet.getCell(R, colStatus(i));
          const capitalCell = worksheet.getCell(R, colCapital(i));

          if (item) {
            const isNonAccordee = item.isNotCovered || false;

            // Statut column: ✓ or ✗ only (no price)
            statusCell.value = isNonAccordee ? '✗' : '✓';
            statusCell.style = {
              font: {
                bold:  true,
                size:  13,
                name:  'Arial',
                color: { argb: isNonAccordee ? RED_FG : GREEN_FG },
              },
              fill: {
                type:    'pattern',
                pattern: 'solid',
                fgColor: { argb: isNonAccordee ? RED_BG : GREEN_BG },
              },
              alignment: centerMiddle,
              border:    border(),
            };

            // Capital column
            const hasCapital = item.capital && Number(item.capital) > 0;
            capitalCell.value = hasCapital
              ? `${Number(item.capital).toLocaleString('fr-FR')} DT`
              : '—';
            capitalCell.style = {
              font: {
                size:   10,
                name:   'Arial',
                italic: !hasCapital,
                color:  { argb: hasCapital ? '00000000' : 'FF999999' },
              },
              fill: {
                type:    'pattern',
                pattern: 'solid',
                fgColor: { argb: isNonAccordee ? RED_BG : rowBg },
              },
              alignment: centerMiddle,
              border:    border(),
            };
          } else {
            // Not included in this formula
            const absentStyle: Partial<ExcelJS.Style> = {
              font:      { size: 10, name: 'Arial', italic: true, color: { argb: 'FF999999' } },
              fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } },
              alignment: centerMiddle,
              border:    border(),
            };
            statusCell.value  = '—';
            capitalCell.value = '—';
            statusCell.style  = absentStyle as any;
            capitalCell.style = absentStyle as any;
          }
        });

        worksheet.getRow(R).height = 22;
        R++;
      });

      R++;

      // ── Legend ────────────────────────────────────────────────
      worksheet.mergeCells(R, 1, R, totalCols);
      const legHeader = worksheet.getCell(R, 1);
      legHeader.value = 'LÉGENDE';
      legHeader.style = {
        font:      { bold: true, size: 11, color: { argb: WHITE }, name: 'Arial' },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } },
        alignment: leftMiddle,
      };
      worksheet.getRow(R).height = 22;
      R++;

      const legends: [string, string, string][] = [
        ['✓', GREEN_BG, 'Garantie accordée par la compagnie'],
        ['✗', RED_BG,   'Garantie non accordée par la compagnie'],
        ['—', GREY_BG,  'Garantie non incluse dans cette formule'],
      ];

      legends.forEach(([icon, bg, desc]) => {
        worksheet.mergeCells(R, 2, R, totalCols);

        const iconCell = worksheet.getCell(R, 1);
        iconCell.value = icon;
        iconCell.style = {
          font:      { bold: true, size: 12, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
          alignment: centerMiddle,
          border:    border(),
        };

        const descCell = worksheet.getCell(R, 2);
        descCell.value = desc;
        descCell.style = {
          font:      { size: 10, name: 'Arial' },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
          alignment: leftMiddle,
          border:    border(),
        };
        worksheet.getRow(R).height = 20;
        R++;
      });

      // ── Generate & download ───────────────────────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `comparaison-devis-${date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Fichier Excel téléchargé avec succès!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Aucun devis à comparer</p>
        <Button onClick={() => navigate('/quotes')} className="mt-4">
          Retour aux devis
        </Button>
      </div>
    );
  }

  const bestPrice = Math.min(...quotes.map((q: any) => q.totalAPayer));

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/quotes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux devis
          </Button>

          <Button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exporter en Excel
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Comparaison de devis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comparez {quotes.length} devis côte à côte
          </p>
        </div>

        {quotes[0]?.simulation?.vehicle && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Informations du véhicule</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="whitespace-nowrap min-w-[200px]">
                <span className="text-gray-600 dark:text-gray-400">Immatriculation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.registration || 'N/A'}
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">Valeur à neuf:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.newValue.toLocaleString()} DT
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">Valeur vénale:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.marketValue.toLocaleString()} DT
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">Puissance:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.fiscalHorsepower} CV
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">Places:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.numberOfSeats}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                  Critère
                </th>
                {quotes.map((quote: any) => (
                  <th key={quote.id} className="p-4 text-center min-w-[200px]">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {quote.company.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {quote.quoteNumber}
                    </div>
                    {quote.totalAPayer === bestPrice && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Meilleur prix
                        </span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                <td className="p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/10">
                  Total TTC
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {quote.totalAPayer.toLocaleString()} DT
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Prime nette
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.primeNette.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Frais
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.frais.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Taxes
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.taxes.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Frais additionnels
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {(quote.fpac + quote.fssr + quote.fg).toLocaleString()} DT
                  </td>
                ))}
              </tr>



              <tr className="bg-gray-50 dark:bg-gray-900">
                <td className="p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900">
                  Actions
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQuote(quote.id)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Garanties incluses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              // Get all unique guarantees across all quotes
              const allGuarantees = Array.from(
                new Set(
                  quotes.flatMap((q: any) =>
                    q.items
                      ?.filter((item: any) => {
                        if (q.simulation?.formulaType === 'STANDARD') {
                          return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
                        }
                        return true;
                      })
                      .map((item: any) => item.guarantee.nameFr) || []
                  )
                )
              );

              return quotes.map((quote: any) => {
                return (
                  <div key={quote.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 dark:bg-blue-700 text-white p-3">
                      <h3 className="font-semibold">{quote.company.name}</h3>
                      <p className="text-xs opacity-90">{quote.quoteNumber}</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Garantie</th>
                            <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-white w-24">Statut</th>
                            <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-white w-32">Capital</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allGuarantees.map((guaranteeName: string, idx: number) => {
                            const item = quote.items
                              ?.filter((item: any) => {
                                if (quote.simulation?.formulaType === 'STANDARD') {
                                  return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
                                }
                                return true;
                              })
                              .find((item: any) => item.guarantee.nameFr === guaranteeName);

                            const isNonAccordee = item?.isNotCovered || false;
                            const hasCapital = item?.capital && Number(item.capital) > 0;
                            
                            return (
                              <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                                  {guaranteeName}
                                </td>
                                <td className="p-3 text-center">
                                  {isNonAccordee ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                        NON ACCORDÉE
                                      </span>
                                    </div>
                                  ) : item ? (
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-center text-sm text-gray-900 dark:text-white">
                                  {hasCapital ? (
                                    <span className="font-medium">
                                      {Number(item.capital).toLocaleString('fr-FR')} DT
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Conseil :</strong> Le meilleur prix n'est pas toujours le meilleur choix. 
            Vérifiez les garanties incluses et choisissez la couverture qui correspond le mieux à vos besoins.
          </p>
        </div>

        <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Légende</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Garantie accordée et tarifée</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Garantie non accordée par la compagnie</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Garantie non incluse dans cette formule</span>
            </div>
          </div>
        </div>
    </div>
  );
};