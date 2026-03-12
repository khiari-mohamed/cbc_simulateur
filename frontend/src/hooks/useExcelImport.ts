import { useState } from 'react';
import * as XLSX from 'xlsx';


interface UseExcelImportOptions<T> {
  sheetIndex?: number;          // which sheet to read (default 0)
  expectedColumns?: number;     // optional validation (checks max columns found)
  transform: (rows: any[][]) => T;  // convert raw rows to your data structure
  timeout?: number;             // timeout in milliseconds (default 30000)
}

export function useExcelImport<T>({ sheetIndex = 0, expectedColumns, transform }: UseExcelImportOptions<T>) {
  const [isImporting, setIsImporting] = useState(false);

  const importFile = (file: File): Promise<T | null> => {
    return new Promise((resolve, reject) => {
      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            throw new Error('Le fichier ne contient aucune feuille de calcul.');
          }
          
          const sheetName = workbook.SheetNames[sheetIndex];
          if (!sheetName) {
            throw new Error(`Feuille ${sheetIndex + 1} introuvable dans le fichier.`);
          }
          
          const worksheet = workbook.Sheets[sheetName];
          
          // Enhanced parsing options
          const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '', // Empty cells become empty strings
            raw: false, // Convert numbers to strings to preserve formatting
            dateNF: 'yyyy-mm-dd', // Handle dates consistently
            blankrows: false // Skip completely empty rows
          });

          if (rows.length === 0) {
            throw new Error('La feuille de calcul est vide ou ne contient aucune donnée.');
          }

          // Filter out completely empty rows
          const nonEmptyRows = rows.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
          );

          if (nonEmptyRows.length === 0) {
            throw new Error('Aucune donnée trouvée dans la feuille de calcul.');
          }

          // Find the row with the most columns to use for validation
          const maxColumns = Math.max(...nonEmptyRows.map(row => row.length));
          
          if (expectedColumns && maxColumns < expectedColumns) {
            throw new Error(`Fichier invalide : au moins ${expectedColumns} colonnes attendues, ${maxColumns} trouvées.`);
          }

          const result = transform(nonEmptyRows);
          resolve(result);
        } catch (error: any) {
          // Enhanced error messages
          if (error.message?.includes('Unsupported file type')) {
            reject(new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv.'));
          } else if (error.message?.includes('Invalid or corrupted')) {
            reject(new Error('Fichier corrompu ou invalide. Vérifiez que le fichier n\'est pas endommagé.'));
          } else {
            reject(error);
          }
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        setIsImporting(false);
        reject(new Error('Erreur de lecture du fichier. Vérifiez que le fichier n\'est pas corrompu.'));
      };
      
      // Add timeout for very large files
      const timeout = setTimeout(() => {
        setIsImporting(false);
        reject(new Error('Timeout: Le fichier est trop volumineux ou la lecture a pris trop de temps.'));
      }, 30000); // 30 second timeout
      
      reader.onloadend = () => {
        clearTimeout(timeout);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  return { importFile, isImporting };
}