import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Save, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import { useExcelImport } from '../../../hooks/useExcelImport';

interface RcCell {
  id?: string;
  companyId: string;
  guaranteeId: string;
  usageId?: string;
  bonusMalusClass: number;
  minPower: number;
  maxPower: number;
  fixedPremium: number;
}

const POWER_RANGES = [
  { label: '3-4 CV', minPower: 3, maxPower: 4 },
  { label: '5-6 CV', minPower: 5, maxPower: 6 },
  { label: '7-10 CV', minPower: 7, maxPower: 10 },
  { label: '11-14 CV', minPower: 11, maxPower: 14 },
  { label: '≥15 CV', minPower: 15, maxPower: 999 },
];

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8];

export const RcTableGrid = () => {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUsage, setSelectedUsage] = useState('');
  const [editedCells, setEditedCells] = useState<Map<string, number>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    // Format with commas as thousand separators to match Excel format
    return num.toLocaleString('en-US'); // Uses commas: 77,000
  };

  const parseNumberInput = (value: string): number => {
    // Remove commas and parse the number
    const cleanValue = value.replace(/,/g, '');
    return cleanValue === '' ? 0 : parseFloat(cleanValue);
  };

  // Excel import hook
  const { importFile, isImporting } = useExcelImport({
    expectedColumns: 5, // At least 5 columns (CLASSE + 4 CV ranges minimum)
    transform: (rows) => {
      // Find start row containing "01" or "1" - scan more thoroughly
      let startRow = -1;
      
      for (let i = 0; i < rows.length; i++) {
        const firstCell = rows[i][0]?.toString().trim();
        // Look for "01", "1", or even just a number 1
        if (firstCell === '01' || firstCell === '1' || parseInt(firstCell) === 1) {
          // Verify this looks like a class row by checking if next cells are numbers
          const hasNumericData = rows[i].slice(1, 6).some(cell => {
            const val = cell?.toString().replace(/[,\s]/g, '');
            return val && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
          });
          
          if (hasNumericData) {
            startRow = i;
            break;
          }
        }
      }
      
      if (startRow === -1) {
        throw new Error('Format invalide: impossible de trouver le tableau RC. Vérifiez que la première colonne contient les classes 01-08 et que les données sont numériques.');
      }

      const newEdited = new Map<string, number>();
      let processedClasses = 0;
      
      // Process up to 8 rows for classes 1 to 8
      for (let i = 0; i < 8 && (startRow + i) < rows.length; i++) {
        const classRow = rows[startRow + i];
        if (!classRow || classRow.length < 2) continue;
        
        // Parse class number - handle "01", "1", etc.
        const classStr = classRow[0]?.toString().trim() || '';
        let classNum = parseInt(classStr);
        
        // If parsing failed, try to infer from row position
        if (isNaN(classNum) || classNum < 1 || classNum > 8) {
          classNum = i + 1; // Assume sequential: row 0 = class 1, row 1 = class 2, etc.
        }
        
        if (classNum < 1 || classNum > 8) continue;

        // For each power range, get the value from the appropriate column
        // Handle both 5 and 6 column formats (some exports might have extra columns)
        let validCellsInRow = 0;
        
        POWER_RANGES.forEach((range, idx) => {
          const cellValue = classRow[idx + 1]; // +1 because first column is class
          if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
            const strValue = cellValue.toString().trim();
            if (strValue) {
              // Enhanced number parsing - handle commas, spaces, and various formats
              const cleanValue = strValue.replace(/[,\s]/g, ''); // Remove commas and spaces
              const numValue = parseFloat(cleanValue);
              
              if (!isNaN(numValue) && numValue >= 0) {
                const key = getCellKey(classNum, range);
                newEdited.set(key, numValue);
                validCellsInRow++;
              }
            }
          }
        });
        
        if (validCellsInRow > 0) {
          processedClasses++;
        }
      }
      
      if (newEdited.size === 0) {
        throw new Error('Aucune donnée valide trouvée. Vérifiez que le fichier contient des valeurs numériques dans les colonnes 2-6.');
      }
      
      if (processedClasses < 3) {
        throw new Error(`Seulement ${processedClasses} classes trouvées. Vérifiez que le fichier contient au moins les classes 01-03 avec des données valides.`);
      }
      
      return newEdited;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: usageTypes } = useQuery({
    queryKey: ['usage-types', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types?includeInactive=false');
      return data;
    },
  });

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data.find((g: any) => g.code === 'RC');
    },
  });

  const { data: rcRules, isLoading } = useQuery({
    queryKey: ['rc-rules', selectedCompany, selectedUsage],
    queryFn: async () => {
      if (!selectedCompany || !guarantees) return [];
      const params = new URLSearchParams({
        companyId: selectedCompany,
        guaranteeId: guarantees.id,
      });
      if (selectedUsage) params.set('usageId', selectedUsage);
      const { data } = await api.get(`/pricing-rules?${params}`);
      return data;
    },
    enabled: !!selectedCompany && !!guarantees,
  });

  const saveMutation = useMutation({
    mutationFn: async (cells: RcCell[]) => {
      const promises = cells.map(cell => {
        if (cell.id) {
          return api.patch(`/pricing-rules/${cell.id}`, { fixedPremium: cell.fixedPremium });
        } else {
          return api.post('/pricing-rules', cell);
        }
      });
      return Promise.all(promises);
    },
    onSuccess: async () => {
      // Force refresh the data
      await queryClient.invalidateQueries({ queryKey: ['rc-rules', selectedCompany] });
      await queryClient.refetchQueries({ queryKey: ['rc-rules', selectedCompany] });
      
      // Clear edited cells and reset state
      setEditedCells(new Map());
      setHasChanges(false);
      setFocusedCell(null); // Clear any focused cell
      toast.success('Tableau RC sauvegardé avec succès');
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const getCellKey = (classNum: number, powerRange: typeof POWER_RANGES[0]) => {
    return `${classNum}-${powerRange.minPower}-${powerRange.maxPower}`;
  };

  const getCellValue = (classNum: number, powerRange: typeof POWER_RANGES[0]) => {
    const key = getCellKey(classNum, powerRange);
    
    // Check if edited
    if (editedCells.has(key)) {
      return editedCells.get(key);
    }

    // Find existing rule
    const rule = rcRules?.find((r: any) => 
      r.bonusMalusClass === classNum &&
      r.minPower === powerRange.minPower &&
      r.maxPower === powerRange.maxPower
    );

    // ✅ FIX: Store full values in database, no multiplication needed
    return rule?.fixedPremium ? Number(rule.fixedPremium) : '';
  };

  const handleCellChange = (classNum: number, powerRange: typeof POWER_RANGES[0], value: string) => {
    const key = getCellKey(classNum, powerRange);
    const numValue = parseNumberInput(value);
    
    const newEdited = new Map(editedCells);
    newEdited.set(key, numValue);
    setEditedCells(newEdited);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedCompany || !guarantees) return;

    const cellsToSave: RcCell[] = [];

    editedCells.forEach((premium, key) => {
      const [classNum, minPower, maxPower] = key.split('-').map(Number);
      
      const existingRule = rcRules?.find((r: any) => 
        r.bonusMalusClass === classNum &&
        r.minPower === minPower &&
        r.maxPower === maxPower
      );

      cellsToSave.push({
        id: existingRule?.id,
        companyId: selectedCompany,
        guaranteeId: guarantees.id,
        usageId: selectedUsage || undefined,
        bonusMalusClass: classNum,
        minPower,
        maxPower,
        // ✅ FIX: Store full values in database for exact precision
        fixedPremium: premium,
      });
    });

    saveMutation.mutate(cellsToSave);
  };

  const handleExport = () => {
    if (!rcRules || rcRules.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    // Create CSV content with proper formatting for Excel
    // Use semicolon as separator for better Excel compatibility in French locale
    let csv = 'CLASSE;3-4 CV;5-6 CV;7-10 CV;11-14 CV;≥15 CV\n';
    
    CLASSES.forEach(classNum => {
      const row = [classNum.toString().padStart(2, '0')];
      POWER_RANGES.forEach(range => {
        const value = getCellValue(classNum, range);
        // Format numbers properly for Excel (no commas in CSV)
        row.push(value ? value.toString() : '0');
      });
      csv += row.join(';') + '\n';
    });

    // Add BOM for UTF-8 encoding to ensure Excel opens it correctly
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csv;

    // Download with proper MIME type
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const companyName = companies?.find((c: any) => c.id === selectedCompany)?.name || 'Export';
    link.download = `RC_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Export réussi - Ouvrez le fichier avec Excel');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importFile(file);
      if (importedData) {
        setEditedCells(importedData);
        setHasChanges(true);
        toast.success(`Import réussi! ${importedData.size} cellules importées. Vérifiez les cellules surlignées en bleu, puis cliquez sur Sauvegarder.`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erreur lors de l\'import du fichier.');
    } finally {
      // Reset input
      event.target.value = '';
    }
  };

  if (!companies || companies.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-5 h-5" />
          <p>Veuillez d'abord créer des compagnies</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compagnie:
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setEditedCells(new Map());
                setHasChanges(false);
              }}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une compagnie</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Usage:
            </label>
            <select
              value={selectedUsage}
              onChange={(e) => setSelectedUsage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Tous</option>
              {usageTypes?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nameFr}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!selectedCompany || !rcRules || rcRules.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="hidden"
              id="excel-import"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('excel-import')?.click()}
              disabled={!selectedCompany || isImporting}
              className="flex-1 sm:flex-none"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Import...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Importer Excel
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Modifications non sauvegardées - Cliquez sur Sauvegarder pour appliquer</span>
          </div>
        )}
      </Card>

      {selectedCompany && (
        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="min-w-max">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      CLASSE
                    </th>
                    {POWER_RANGES.map(range => (
                      <th
                        key={range.label}
                        className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
                      >
                        {range.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLASSES.map(classNum => (
                    <tr key={classNum} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900">
                        {classNum.toString().padStart(2, '0')}
                      </td>
                      {POWER_RANGES.map(range => {
                        const value = getCellValue(classNum, range);
                        const key = getCellKey(classNum, range);
                        const isEdited = editedCells.has(key);
                        const numValue = typeof value === 'number' ? value : 0;
                        
                        return (
                          <td
                            key={range.label}
                            className={`border border-gray-300 dark:border-gray-600 p-0 ${
                              isEdited ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {focusedCell === key ? (
                              <input
                                type="text"
                                value={numValue > 0 ? formatNumber(numValue) : ''}
                                onChange={(e) => handleCellChange(classNum, range, e.target.value)}
                                onBlur={() => setFocusedCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Tab') {
                                    setFocusedCell(null);
                                  }
                                }}
                                autoFocus
                                className={`w-full px-3 py-2 text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white ${
                                  isEdited ? 'font-semibold' : ''
                                }`}
                                placeholder="0"
                              />
                            ) : (
                              <div
                                onClick={() => setFocusedCell(key)}
                                className={`w-full px-3 py-2 text-center cursor-text hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white min-h-[2.5rem] flex items-center justify-center ${
                                  isEdited ? 'font-semibold' : ''
                                }`}
                              >
                                {numValue > 0 ? formatNumber(numValue) : ''}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selectedCompany && !isLoading && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Saisissez les primes directement dans les cellules (comme Excel)</li>
                <li>Les cellules modifiées sont surlignées en bleu</li>
                <li>Cliquez sur "Sauvegarder" pour appliquer les modifications</li>
                <li>Utilisez "Exporter" pour télécharger en CSV</li>
                <li>Utilisez "Importer Excel" pour charger un fichier Excel (.xlsx, .xls) ou CSV</li>
                <li>Format attendu: Colonne 1 = Classes (01-08), Colonnes 2-6 = Primes par CV</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
