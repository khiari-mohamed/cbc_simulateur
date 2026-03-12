import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface RcCell {
  id?: string;
  companyId: string;
  guaranteeId: string;
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
  const [editedCells, setEditedCells] = useState<Map<string, number>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
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
    queryKey: ['rc-rules', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany || !guarantees) return [];
      const params = new URLSearchParams({
        companyId: selectedCompany,
        guaranteeId: guarantees.id,
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rc-rules'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      setEditedCells(new Map());
      setHasChanges(false);
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

    return rule?.fixedPremium ? Number(rule.fixedPremium) : '';
  };

  const handleCellChange = (classNum: number, powerRange: typeof POWER_RANGES[0], value: string) => {
    const key = getCellKey(classNum, powerRange);
    const numValue = value === '' ? 0 : parseFloat(value);
    
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
        bonusMalusClass: classNum,
        minPower,
        maxPower,
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

    // Create CSV content
    let csv = 'CLASSE,3-4 CV,5-6 CV,7-10 CV,11-14 CV,≥15 CV\n';
    
    CLASSES.forEach(classNum => {
      const row = [classNum.toString().padStart(2, '0')];
      POWER_RANGES.forEach(range => {
        const value = getCellValue(classNum, range);
        row.push(value ? value.toString() : '');
      });
      csv += row.join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RC_${companies?.find((c: any) => c.id === selectedCompany)?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Export réussi');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const newEdited = new Map(editedCells);
        
        dataLines.forEach((line, idx) => {
          const values = line.split(',');
          const classNum = parseInt(values[0]);
          
          if (classNum >= 1 && classNum <= 8) {
            POWER_RANGES.forEach((range, rangeIdx) => {
              const premium = values[rangeIdx + 1];
              if (premium && premium.trim()) {
                const key = getCellKey(classNum, range);
                newEdited.set(key, parseFloat(premium));
              }
            });
          }
        });
        
        setEditedCells(newEdited);
        setHasChanges(true);
        toast.success('Import réussi - Cliquez sur Sauvegarder pour appliquer');
      } catch (error) {
        toast.error('Erreur lors de l\'import du fichier');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
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
            <label className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedCompany}
                className="w-full"
                as="span"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
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
                        
                        return (
                          <td
                            key={range.label}
                            className={`border border-gray-300 dark:border-gray-600 p-0 ${
                              isEdited ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleCellChange(classNum, range, e.target.value)}
                              className={`w-full px-3 py-2 text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white ${
                                isEdited ? 'font-semibold' : ''
                              }`}
                              placeholder="0"
                              step="0.01"
                            />
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
                <li>Utilisez "Importer" pour charger un fichier CSV</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
