// src/lib/export/exportReportExcel.ts
// Requires: npm install exceljs
// Usage: import { exportReportExcel } from '../lib/export/exportReportExcel';

import ExcelJS from 'exceljs';

// ── Colour palette (matches ARS brand) ───────────────────────────────────────
const C = {
  darkBlue:  'FF1E3A5F',
  midBlue:   'FF2563EB',
  lightBlue: 'FFDBEAFE',
  white:     'FFFFFFFF',
  green:     'FF10B981',
  red:       'FFEF4444',
  yellow:    'FFF59E0B',
  purple:    'FF7C3AED',
  grayText:  'FF6B7280',
  grayBg:    'FFF8FAFC',
  border:    'FFCBD5E1',
  navy:      'FF1E40AF',
  teal:      'FF065F46',
  slate:     'FF64748B',
  row0:      'FFDBEAFE',   // even row
  row1:      'FFFFFFFF',   // odd row
};

type ARGB = string;

// ── Helpers ───────────────────────────────────────────────────────────────────

function thin(color: ARGB = C.border): Partial<ExcelJS.Borders> {
  const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

function solidFill(argb: ARGB): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function altFill(idx: number): ExcelJS.Fill {
  return solidFill(idx % 2 === 0 ? C.row0 : C.row1);
}

function hFont(size = 11, color: ARGB = C.white): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold: true, color: { argb: color } };
}

function bodyFont(size = 10, bold = false, color: ARGB = 'FF1F2937'): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold, color: { argb: color } };
}

function center(): Partial<ExcelJS.Alignment> {
  return { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function left(): Partial<ExcelJS.Alignment> {
  return { horizontal: 'left', vertical: 'middle' };
}

function banner(
  ws: ExcelJS.Worksheet,
  startRow: number,
  text: string,
  bgArgb: ARGB,
  lastCol = 'F',
  fontSize = 14
) {
  const cell = ws.getCell(`B${startRow}`);
  ws.mergeCells(`B${startRow}:${lastCol}${startRow}`);
  cell.value = text;
  cell.fill   = solidFill(bgArgb);
  cell.font   = hFont(fontSize);
  cell.alignment = center();
}

function sectionHeader(ws: ExcelJS.Worksheet, row: number, text: string, bg: ARGB = C.navy) {
  ws.mergeCells(`B${row}:F${row}`);
  const c = ws.getCell(`B${row}`);
  c.value = text;
  c.fill  = solidFill(bg);
  c.font  = hFont(10);
  c.alignment = center();
  ws.getRow(row).height = 16;
}

function tableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[], startCol = 2) {
  ws.getRow(row).height = 22;
  headers.forEach((h, i) => {
    const c = ws.getCell(row, startCol + i);
    c.value = h;
    c.fill  = solidFill(C.darkBlue);
    c.font  = hFont(10);
    c.alignment = center();
    c.border = thin();
  });
}

function dataRow(
  ws: ExcelJS.Worksheet,
  row: number,
  values: (string | number)[],
  startCol = 2,
  boldCol?: number   // 0-indexed column to bold
) {
  ws.getRow(row).height = 19;
  values.forEach((v, i) => {
    const c = ws.getCell(row, startCol + i);
    c.value  = v;
    c.fill   = altFill(row);
    c.font   = bodyFont(10, i === (boldCol ?? -1));
    c.alignment = i === 0 ? left() : center();
    c.border = thin();
  });
}

function totalRow(ws: ExcelJS.Worksheet, row: number, values: (string | number)[], startCol = 2) {
  ws.getRow(row).height = 22;
  values.forEach((v, i) => {
    const c = ws.getCell(row, startCol + i);
    c.value  = v;
    c.fill   = solidFill(C.darkBlue);
    c.font   = hFont(10);
    c.alignment = center();
    c.border = thin();
  });
}

function footerRow(ws: ExcelJS.Worksheet, text: string) {
  const row = ws.lastRow ? ws.lastRow.number + 2 : 2;
  ws.getRow(row).height = 18;
  ws.mergeCells(`B${row}:F${row}`);
  const c = ws.getCell(`B${row}`);
  c.value = text;
  c.fill  = solidFill(C.slate);
  c.font  = { name: 'Arial', size: 9, color: { argb: C.white } };
  c.alignment = center();
}

// ── Column width presets ──────────────────────────────────────────────────────
function setColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

// ── Progress bar characters ───────────────────────────────────────────────────
function progressBar(pct: number, total = 20): string {
  const filled = Math.round((pct / 100) * total);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, total - filled));
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function exportReportExcel(stats: {
  reporting: {
    quotes: {
      total: number;
      generated: number;
      submitted: number;
      validated: number;
      rejected: number;
      transformed: number;
    };
    contracts: { total: number; active: number };
    users:     { total: number; active: number };
    companies: { total: number };
    simulations: { total: number };
    rates: {
      conversionRate: number;
      validationRate: number;
      rejectionRate:  number;
    };
    byCompany: Array<{
      companyName: string;
      totalQuotes: number;
      totalRevenue: number;
    }>;
    byConvention: Array<{
      conventionName:  string;
      organizationName: string;
      totalSimulations: number;
      totalContracts:   number;
      totalPremium:     number;
    }>;
  };
}) {
  const wb  = new ExcelJS.Workbook();
  const now = new Date().toLocaleString('fr-FR');
  const { reporting } = stats;
  const q = reporting.quotes;
  const totalQ = q.total || 1;

  // ════════════════════════════════════════════════════════════════════════
  //  SHEET 1 – Dashboard
  // ════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('📊 Dashboard', { views: [{ showGridLines: false }] });
  setColWidths(ws1, [3, 28, 18, 18, 18, 18, 3]);

  ws1.getRow(1).height = 8;
  ws1.getRow(2).height = 50;
  banner(ws1, 2, '🏢  ARS — Rapports & Statistiques', C.darkBlue, 'F', 18);

  ws1.getRow(3).height = 22;
  banner(ws1, 3, `Généré le ${now}  |  Plateforme d'assurance ARS`, C.midBlue, 'F', 10);

  ws1.getRow(4).height = 8;
  ws1.getRow(5).height = 14;
  sectionHeader(ws1, 5, 'INDICATEURS CLÉS', C.navy);

  // KPI cards (rows 6-8)
  const kpis = [
    { col: 2, title: '📋  Simulations',   value: reporting.simulations.total, color: C.midBlue },
    { col: 3, title: '📄  Total Devis',    value: q.total,                    color: 'FF7C3AED' },
    { col: 4, title: '✅  Devis Validés',  value: q.validated,                color: C.green },
    { col: 5, title: '👥  Utilisateurs',   value: reporting.users.total,      color: C.yellow },
  ];

  [6, 7, 8].forEach(r => { ws1.getRow(r).height = r === 7 ? 38 : 22; });

  kpis.forEach(({ col, title, value, color }) => {
    // Header
    const h = ws1.getCell(6, col);
    h.value = title; h.fill = solidFill(color);
    h.font = hFont(9); h.alignment = center(); h.border = thin(color);

    // Value
    const v = ws1.getCell(7, col);
    v.value = value; v.fill = solidFill('FFF0F9FF');
    v.font = { name: 'Arial', size: 22, bold: true, color: { argb: color } };
    v.alignment = center(); v.border = thin(color);

    // Accent bottom
    const a = ws1.getCell(8, col);
    a.fill = solidFill(color); a.border = thin(color);
  });

  // Rates
  ws1.getRow(9).height = 8;
  ws1.getRow(10).height = 14;
  sectionHeader(ws1, 10, 'TAUX DE PERFORMANCE', 'FF064E3B');

  const rates = [
    { label: 'Taux de Conversion', value: reporting.rates.conversionRate, color: C.green },
    { label: 'Taux de Validation', value: reporting.rates.validationRate, color: C.midBlue },
    { label: 'Taux de Rejet',      value: reporting.rates.rejectionRate,  color: C.red },
  ];
  rates.forEach(({ label, value, color }, i) => {
    const row = 11 + i;
    ws1.getRow(row).height = 20;

    const lc = ws1.getCell(row, 2);
    lc.value = label; lc.fill = altFill(row);
    lc.font = bodyFont(10, false); lc.alignment = left(); lc.border = thin();

    const vc = ws1.getCell(row, 3);
    vc.value = `${value.toFixed(1)}%`; vc.fill = altFill(row);
    vc.font = { name: 'Arial', size: 10, bold: true, color: { argb: color } };
    vc.alignment = center(); vc.border = thin();
  });

  // Quotes by status table
  ws1.getRow(15).height = 8;
  ws1.getRow(16).height = 14;
  sectionHeader(ws1, 15, '');
  sectionHeader(ws1, 16, 'DEVIS PAR STATUT', C.navy);
  tableHeader(ws1, 17, ['Statut', 'Nombre', '% du Total', 'Progression']);

  const statusItems = [
    { label: 'Généré',     count: q.generated,   color: C.grayText },
    { label: 'Soumis',     count: q.submitted,   color: C.midBlue  },
    { label: 'Validé',     count: q.validated,   color: C.green    },
    { label: 'Rejeté',     count: q.rejected,    color: C.red      },
    { label: 'Transformé', count: q.transformed, color: C.purple   },
  ];

  statusItems.forEach(({ label, count, color }, i) => {
    const row = 18 + i;
    const pct = (count / totalQ) * 100;
    ws1.getRow(row).height = 19;

    [[label, left()], [count, center()], [`${pct.toFixed(1)}%`, center()], [progressBar(pct), center()]]
      .forEach(([v, align], ci) => {
        const c = ws1.getCell(row, 2 + ci);
        c.value = v as string | number;
        c.fill  = altFill(row);
        c.font  = ci === 3
          ? { name: 'Courier New', size: 9, color: { argb: color } }
          : bodyFont(10, ci === 1);
        c.alignment = align as Partial<ExcelJS.Alignment>;
        c.border = thin();
      });
  });

  footerRow(ws1, `Généré automatiquement le ${now} — Plateforme ARS`);

  // ════════════════════════════════════════════════════════════════════════
  //  SHEET 2 – Devis & Contrats
  // ════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('📄 Devis & Contrats', { views: [{ showGridLines: false }] });
  setColWidths(ws2, [3, 30, 20, 20, 20, 20, 3]);

  ws2.getRow(1).height = 8;
  ws2.getRow(2).height = 44;
  banner(ws2, 2, '📄  Devis & Contrats — Détail Complet', C.darkBlue);

  ws2.getRow(3).height = 8;
  ws2.getRow(4).height = 14;
  sectionHeader(ws2, 4, 'RÉSUMÉ CONTRATS', C.teal);

  const contractItems: [string, string | number][] = [
    ['Total Contrats',    reporting.contracts.total],
    ['Contrats Actifs',   reporting.contracts.active],
    ['Taux d\'Activité',  `${(reporting.contracts.active / (reporting.contracts.total || 1) * 100).toFixed(1)}%`],
    ['Devis Transformés', q.transformed],
  ];
  contractItems.forEach(([k, v], i) => {
    const row = 5 + i;
    ws2.getRow(row).height = 20;
    dataRow(ws2, row, [k, v as string | number], 2, 1);
  });

  ws2.getRow(10).height = 8;
  ws2.getRow(11).height = 14;
  sectionHeader(ws2, 11, 'STATUTS DES DEVIS', C.darkBlue);
  tableHeader(ws2, 12, ['Statut', 'Nombre', 'Pourcentage']);

  statusItems.forEach(({ label, count }, i) => {
    const pct = (count / totalQ) * 100;
    dataRow(ws2, 13 + i, [label, count, `${pct.toFixed(1)}%`], 2, 1);
  });

  footerRow(ws2, `Généré automatiquement le ${now} — Plateforme ARS`);

  // ════════════════════════════════════════════════════════════════════════
  //  SHEET 3 – Par Compagnie
  // ════════════════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('🏢 Par Compagnie', { views: [{ showGridLines: false }] });
  setColWidths(ws3, [3, 32, 18, 22, 18, 18, 3]);

  ws3.getRow(1).height = 8;
  ws3.getRow(2).height = 44;
  banner(ws3, 2, '🏢  Statistiques par Compagnie', C.darkBlue);
  ws3.getRow(3).height = 8;

  tableHeader(ws3, 4, ['Compagnie', 'Total Devis', 'Revenu Total (TND)', '% Devis', '% Revenu']);

  const companies = reporting.byCompany || [];
  const totalQComp = companies.reduce((s, c) => s + c.totalQuotes,  0) || 1;
  const totalRev   = companies.reduce((s, c) => s + c.totalRevenue, 0) || 1;

  companies.forEach((comp, i) => {
    const row = 5 + i;
    dataRow(ws3, row, [
      comp.companyName,
      comp.totalQuotes,
      comp.totalRevenue,
      `${(comp.totalQuotes / totalQComp * 100).toFixed(1)}%`,
      `${(comp.totalRevenue / totalRev * 100).toFixed(1)}%`,
    ], 2, 1);
  });

  totalRow(ws3, 5 + companies.length, [
    'TOTAL',
    companies.reduce((s, c) => s + c.totalQuotes,  0),
    companies.reduce((s, c) => s + c.totalRevenue, 0),
    '100%', '100%',
  ]);

  footerRow(ws3, `Généré automatiquement le ${now} — Plateforme ARS`);

  // ════════════════════════════════════════════════════════════════════════
  //  SHEET 4 – Par Convention
  // ════════════════════════════════════════════════════════════════════════
  const ws4 = wb.addWorksheet('📋 Par Convention', { views: [{ showGridLines: false }] });
  setColWidths(ws4, [3, 28, 32, 20, 20, 20, 3]);

  ws4.getRow(1).height = 8;
  ws4.getRow(2).height = 44;
  banner(ws4, 2, '📋  Statistiques par Convention', C.darkBlue);
  ws4.getRow(3).height = 8;

tableHeader(ws4, 4, ['Convention', 'Organisation', 'Simulations', 'Contrats', 'Prime Nette (TND)']);
ws4.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
ws4.getRow(4).height = 22;

  const convs = reporting.byConvention || [];
  convs.forEach((conv, i) => {
    dataRow(ws4, 5 + i, [
      conv.conventionName,
      conv.organizationName,
      conv.totalSimulations,
      conv.totalContracts,
      conv.totalPremium,
    ], 2, 2);
    ws4.getRow(5 + i).height = 36;
    ws4.getCell(5 + i, 3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  if (convs.length) {
    totalRow(ws4, 5 + convs.length, [
      'TOTAL', '',
      convs.reduce((s, c) => s + c.totalSimulations, 0),
      convs.reduce((s, c) => s + c.totalContracts,   0),
      convs.reduce((s, c) => s + c.totalPremium,     0),
    ]);
  }

  footerRow(ws4, `Généré automatiquement le ${now} — Plateforme ARS`);

  // ════════════════════════════════════════════════════════════════════════
  //  SHEET 5 – Utilisateurs
  // ════════════════════════════════════════════════════════════════════════
  const ws5 = wb.addWorksheet('👥 Utilisateurs', { views: [{ showGridLines: false }] });
  setColWidths(ws5, [3, 32, 20, 20, 20, 20, 3]);

  ws5.getRow(1).height = 8;
  ws5.getRow(2).height = 44;
  banner(ws5, 2, '👥  Statistiques Utilisateurs', C.darkBlue);
  ws5.getRow(3).height = 8;
  ws5.getRow(4).height = 14;
  sectionHeader(ws5, 4, 'RÉSUMÉ', C.teal);

  const userItems: [string, string | number][] = [
    ['Total Utilisateurs',   reporting.users.total],
    ['Utilisateurs Actifs',  reporting.users.active],
    ['Utilisateurs Inactifs', reporting.users.total - reporting.users.active],
    ['Taux d\'Activité',     `${(reporting.users.active / (reporting.users.total || 1) * 100).toFixed(1)}%`],
    ['Total Entreprises',    reporting.companies.total],
  ];
  userItems.forEach(([k, v], i) => {
    const row = 5 + i;
    ws5.getRow(row).height = 20;
    dataRow(ws5, row, [k, v as string | number], 2, 1);
  });

  footerRow(ws5, `Généré automatiquement le ${now} — Plateforme ARS`);

  // ── Trigger download ───────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `rapport-ars-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}