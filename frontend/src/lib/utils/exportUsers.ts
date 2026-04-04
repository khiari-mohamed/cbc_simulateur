
import * as XLSX from 'xlsx-js-style';
// ─── Types ────────────────────────────────────────────────────────────────────

interface Convention {
  id?: string;
  name: string;
  status?: string;
}

interface Organization {
  id?: string;
  name: string;
  code: string;
  conventions?: Convention[];
}

interface DriverProfile {
  birthDate: string;
  licenseDate: string;
  experienceYears: number;
}

export interface ExportUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  otpEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  organization?: Organization;
  driverProfile?: DriverProfile;
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const C = {
  navyDark:   '0D1B2A',
  navy:       '1E3A5F',
  blue:       '2D6A9F',
  bluePale:   'E8F4FD',
  blueLight:  'F0F8FF',
  white:      'FFFFFF',
  green:      '1E8449',
  greenPale:  'D5F5E3',
  red:        'C0392B',
  redPale:    'FADBD8',
  orange:     'D35400',
  orangePale: 'FDEBD0',
  purple:     '6C3483',
  purplePale: 'F4ECF7',
  gray:       '5D6D7E',
  grayLight:  'F2F3F4',
  border:     'AED6F1',
  text:       '1A252F',
};

// ─── Style Factories ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CS = Record<string, any>;

const solid = (rgb: string) => ({ fgColor: { rgb }, type: 'pattern', patternType: 'solid' });

const thinBorder = (rgb = C.border) => ({
  top:    { style: 'thin',   color: { rgb } },
  bottom: { style: 'thin',   color: { rgb } },
  left:   { style: 'thin',   color: { rgb } },
  right:  { style: 'thin',   color: { rgb } },
});

const medBorder = (rgb: string) => ({
  top:    { style: 'medium', color: { rgb } },
  bottom: { style: 'medium', color: { rgb } },
  left:   { style: 'medium', color: { rgb } },
  right:  { style: 'medium', color: { rgb } },
});

const sTitle = (): CS => ({
  font:      { name: 'Arial', bold: true, sz: 18, color: { rgb: C.white } },
  fill:      solid(C.navyDark),
  alignment: { horizontal: 'center', vertical: 'center' },
  border:    medBorder(C.navyDark),
});

const sSubTitle = (): CS => ({
  font:      { name: 'Arial', italic: true, sz: 9, color: { rgb: 'AAAAAA' } },
  fill:      solid(C.navyDark),
  alignment: { horizontal: 'center', vertical: 'center' },
});

const sHeader = (bg = C.navy): CS => ({
  font:      { name: 'Arial', bold: true, sz: 10, color: { rgb: C.white } },
  fill:      solid(bg),
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border:    thinBorder(C.blue),
});

const sSectionTitle = (): CS => ({
  font:      { name: 'Arial', bold: true, sz: 11, color: { rgb: C.white } },
  fill:      solid(C.blue),
  alignment: { horizontal: 'left', vertical: 'center' },
  border:    medBorder(C.blue),
});

const sData = (row: number, align: 'left' | 'center' | 'right' = 'left'): CS => ({
  font:      { name: 'Arial', sz: 9, color: { rgb: C.text } },
  fill:      solid(row % 2 === 0 ? C.white : C.blueLight),
  alignment: { horizontal: align, vertical: 'center' },
  border:    thinBorder(C.border),
});

const sBadge = (bg: string, fg = C.white): CS => ({
  font:      { name: 'Arial', bold: true, sz: 9, color: { rgb: fg } },
  fill:      solid(bg),
  alignment: { horizontal: 'center', vertical: 'center' },
  border:    thinBorder(bg),
});

const sKpiLabel = (bg: string): CS => ({
  font:      { name: 'Arial', bold: true, sz: 8, color: { rgb: C.white } },
  fill:      solid(bg),
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border:    medBorder(bg),
});

const sKpiValue = (color: string): CS => ({
  font:      { name: 'Arial', bold: true, sz: 22, color: { rgb: color } },
  fill:      solid(C.white),
  alignment: { horizontal: 'center', vertical: 'center' },
  border:    thinBorder(color),
});

const sStatLabel = (): CS => ({
  font:      { name: 'Arial', bold: true, sz: 10, color: { rgb: C.navy } },
  fill:      solid(C.bluePale),
  alignment: { horizontal: 'left', vertical: 'center' },
  border:    { ...thinBorder(), left: { style: 'medium', color: { rgb: C.navy } } },
});

const sStatValue = (color = C.navy): CS => ({
  font:      { name: 'Arial', bold: true, sz: 14, color: { rgb: color } },
  fill:      solid(C.blueLight),
  alignment: { horizontal: 'center', vertical: 'center' },
  border:    { ...thinBorder(), right: { style: 'medium', color: { rgb: C.navy } } },
});

const sEmpty = (): CS => ({ fill: solid(C.white) });

// ─── Low-level Cell Helpers ───────────────────────────────────────────────────

const enc = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });

function sc(ws: XLSX.WorkSheet, r: number, c: number, v: unknown, s: CS) {
  ws[enc(r, c)] = { v, t: typeof v === 'number' ? 'n' : 's', s };
}

function merge(ws: XLSX.WorkSheet, r1: number, c1: number, r2: number, c2: number) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function setRef(ws: XLSX.WorkSheet, maxR: number, maxC: number) {
  ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: maxC })}`;
}

// ─── Data Helpers ─────────────────────────────────────────────────────────────

const getRoleLabel = (role: string) =>
  ({ CLIENT_ADHERENT: 'Client Adhérent', ADMINISTRATEUR_ARS: 'Administrateur ARS', GESTIONNAIRE_VALIDATION_ARS: 'Gestionnaire Validation ARS' }[role] ?? role);

const getRoleColor = (role: string) =>
  ({ CLIENT_ADHERENT: C.blue, ADMINISTRATEUR_ARS: C.purple, GESTIONNAIRE_VALIDATION_ARS: C.green }[role] ?? C.gray);

const fmtDate     = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR');
const nowStr      = () => new Date().toLocaleString('fr-FR');
const pct         = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%';

const calcAge = (iso: string): number => {
  const bd = new Date(iso);
  const td = new Date();
  let age = td.getFullYear() - bd.getFullYear();
  if (td.getMonth() - bd.getMonth() < 0 || (td.getMonth() === bd.getMonth() && td.getDate() < bd.getDate())) age--;
  return age;
};

function buildOrgMap(users: ExportUser[]) {
  const map = new Map<string, { name: string; code: string; count: number; conventions: Set<string> }>();
  users.forEach(u => {
    if (!u.organization) return;
    const key = u.organization.code;
    if (!map.has(key)) map.set(key, { name: u.organization.name, code: key, count: 0, conventions: new Set() });
    const o = map.get(key)!;
    o.count++;
    u.organization.conventions?.forEach(c => o.conventions.add(c.name));
  });
  return map;
}

// ─── Sheet 1: Tableau de Bord ─────────────────────────────────────────────────

function buildDashboard(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const total   = users.length;
  const active  = users.filter(u => u.isActive).length;
  const with2fa = users.filter(u => u.otpEnabled).length;
  //const clients = users.filter(u => u.role === 'CLIENT_ADHERENT').length;
  //const admins  = users.filter(u => u.role === 'ADMINISTRATEUR_ARS').length;
  //const gests   = users.filter(u => u.role === 'GESTIONNAIRE_VALIDATION_ARS').length;
  const withOrg = users.filter(u => u.organization).length;
  const withDrv = users.filter(u => u.driverProfile).length;
  const orgMap  = buildOrgMap(users);

  // ── Title
  sc(ws, 0, 0, '  TABLEAU DE BORD — GESTION DES UTILISATEURS', sTitle());
  merge(ws, 0, 0, 0, 5);
  sc(ws, 1, 0, `Exporté le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 5);
  for (let c = 0; c < 6; c++) sc(ws, 2, c, '', sEmpty());

  // ── KPI Row
  const kpis = [
    { label: 'TOTAL\nUTILISATEURS', value: total,         color: C.navy   },
    { label: 'ACTIFS',              value: active,         color: C.green  },
    { label: 'INACTIFS',            value: total - active, color: C.red    },
    { label: 'AVEC 2FA',            value: with2fa,        color: C.purple },
    { label: 'AVEC ORG.',           value: withOrg,        color: C.orange },
    { label: 'CONDUCTEURS',         value: withDrv,        color: C.gray   },
  ];
  kpis.forEach((k, i) => {
    sc(ws, 3, i, k.label,  sKpiLabel(k.color));
    sc(ws, 4, i, k.value,  sKpiValue(k.color));
  });
  for (let c = 0; c < 6; c++) sc(ws, 5, c, '', sEmpty());

  // ── Répartition par Rôle
  sc(ws, 6, 0, '  RÉPARTITION PAR RÔLE', sSectionTitle());
  merge(ws, 6, 0, 6, 5);
  ['Rôle', 'Nombre', '% Total', 'Actifs', 'Avec 2FA', 'Inactifs'].forEach((h, i) => sc(ws, 7, i, h, sHeader(C.blue)));

  const roleRows = [
    { label: 'Client Adhérent',             code: 'CLIENT_ADHERENT',            color: C.blue   },
    { label: 'Administrateur ARS',          code: 'ADMINISTRATEUR_ARS',         color: C.purple },
    { label: 'Gestionnaire Validation ARS', code: 'GESTIONNAIRE_VALIDATION_ARS',color: C.green  },
  ];
  roleRows.forEach((rr, i) => {
    const cnt   = users.filter(u => u.role === rr.code).length;
    const act   = users.filter(u => u.role === rr.code && u.isActive).length;
    const tfa   = users.filter(u => u.role === rr.code && u.otpEnabled).length;
    const row   = 8 + i;
    sc(ws, row, 0, rr.label,     { ...sData(i), font: { name: 'Arial', bold: true, sz: 9, color: { rgb: rr.color } } });
    sc(ws, row, 1, cnt,          { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 2, pct(cnt, total), { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 3, act,          { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 4, tfa,          { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 5, cnt - act,    { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
  });
  for (let c = 0; c < 6; c++) sc(ws, 11, c, '', sEmpty());

  // ── Répartition par Organisation
  const orgArr = Array.from(orgMap.values());
  const indep  = total - withOrg;

  sc(ws, 12, 0, '  RÉPARTITION PAR ORGANISATION', sSectionTitle());
  merge(ws, 12, 0, 12, 5);
  ['Organisation', 'Code', 'Utilisateurs', 'Conventions', '% Total', 'Actifs'].forEach((h, i) => sc(ws, 13, i, h, sHeader(C.blue)));

  orgArr.forEach((org, i) => {
    const row  = 14 + i;
    const acts = users.filter(u => u.organization?.code === org.code && u.isActive).length;
    sc(ws, row, 0, org.name,   sData(i));
    sc(ws, row, 1, org.code,   { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 2, org.count,  { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 3, Array.from(org.conventions).join(', ') || 'Aucune', { ...sData(i), font: { name: 'Arial', sz: 8, color: { rgb: C.purple } } });
    sc(ws, row, 4, pct(org.count, total), { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 5, acts,       { ...sData(i), alignment: { horizontal: 'center', vertical: 'center' } });
  });

  if (indep > 0) {
    const row = 14 + orgArr.length;
    sc(ws, row, 0, 'Utilisateurs Indépendants', { ...sData(orgArr.length), font: { name: 'Arial', sz: 9, italic: true, color: { rgb: C.gray } } });
    sc(ws, row, 1, '—',                { ...sData(orgArr.length), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 2, indep,              { ...sData(orgArr.length), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 3, 'Aucune',           sData(orgArr.length));
    sc(ws, row, 4, pct(indep, total),  { ...sData(orgArr.length), alignment: { horizontal: 'center', vertical: 'center' } });
    sc(ws, row, 5, users.filter(u => !u.organization && u.isActive).length, { ...sData(orgArr.length), alignment: { horizontal: 'center', vertical: 'center' } });
  }

  const lastRow = 14 + orgArr.length + (indep > 0 ? 1 : 0);
  setRef(ws, lastRow, 5);
  ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 10 }];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 18 }, { hpt: 8 }, { hpt: 46 }, { hpt: 44 }];
  return ws;
}

// ─── Sheet 2: Utilisateurs ────────────────────────────────────────────────────

function buildUsersSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  sc(ws, 0, 0, '  LISTE DES UTILISATEURS', sTitle());
  merge(ws, 0, 0, 0, 10);
  sc(ws, 1, 0, `${users.length} utilisateur(s) — exporté le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 10);

  const headers = ['#', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Organisation', 'Conventions', '2FA', 'Statut', 'Date Création'];
  headers.forEach((h, i) => sc(ws, 2, i, h, sHeader()));

  users.forEach((u, idx) => {
    const r   = idx + 3;
    const row = idx;
    sc(ws, r, 0,  idx + 1,                          { ...sData(row, 'center') });
    sc(ws, r, 1,  u.firstName,                      sData(row));
    sc(ws, r, 2,  u.lastName,                       sData(row));
    sc(ws, r, 3,  u.email,                          sData(row));
    sc(ws, r, 4,  u.phone || '—',                   { ...sData(row, 'center') });
    sc(ws, r, 5,  getRoleLabel(u.role),              sBadge(getRoleColor(u.role)));
    sc(ws, r, 6,  u.organization?.name || '—',      sData(row));
    sc(ws, r, 7,  u.organization?.conventions?.map(c => c.name).join(', ') || 'Aucune',
                  { ...sData(row), font: { name: 'Arial', sz: 8, color: { rgb: C.purple } } });
    sc(ws, r, 8,  u.otpEnabled ? '✔ ON' : '✘ OFF', sBadge(u.otpEnabled ? C.green : C.gray));
    sc(ws, r, 9,  u.isActive   ? '● Actif' : '○ Inactif', sBadge(u.isActive ? C.green : C.red));
    sc(ws, r, 10, fmtDate(u.createdAt),             { ...sData(row, 'center') });
  });

  setRef(ws, users.length + 3, 10);
  ws['!cols'] = [
    { wch: 5 }, { wch: 16 }, { wch: 16 }, { wch: 32 }, { wch: 16 },
    { wch: 26 }, { wch: 28 }, { wch: 36 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
  ];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 16 }, { hpt: 22 }];
  return ws;
}

// ─── Sheet 3: Profils Conducteurs ─────────────────────────────────────────────

function buildDriversSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const drivers = users.filter(u => u.driverProfile);

  sc(ws, 0, 0, '  PROFILS CONDUCTEURS', sTitle());
  merge(ws, 0, 0, 0, 6);
  sc(ws, 1, 0, `${drivers.length} conducteur(s) — exporté le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 6);

  ['#', 'Nom Complet', 'Email', 'Date Naissance', 'Âge', 'Date Permis', 'Expérience (ans)'].forEach((h, i) =>
    sc(ws, 2, i, h, sHeader())
  );

  drivers.forEach((u, idx) => {
    const r  = idx + 3;
    const dp = u.driverProfile!;
    sc(ws, r, 0, idx + 1,                            { ...sData(idx, 'center') });
    sc(ws, r, 1, `${u.firstName} ${u.lastName}`,     sData(idx));
    sc(ws, r, 2, u.email,                            sData(idx));
    sc(ws, r, 3, fmtDate(dp.birthDate),              { ...sData(idx, 'center') });
    sc(ws, r, 4, calcAge(dp.birthDate),              { ...sData(idx, 'center'), font: { name: 'Arial', bold: true, sz: 9, color: { rgb: C.navy } } });
    sc(ws, r, 5, fmtDate(dp.licenseDate),            { ...sData(idx, 'center') });
    sc(ws, r, 6, dp.experienceYears,                 { ...sData(idx, 'center'), font: { name: 'Arial', bold: true, sz: 9, color: { rgb: C.blue } } });
  });

  setRef(ws, drivers.length + 3, 6);
  ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 32 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 18 }];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 16 }, { hpt: 22 }];
  return ws;
}

// ─── Sheet 4: Organisations ───────────────────────────────────────────────────

function buildOrgsSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const orgMap = buildOrgMap(users);
  const orgs   = Array.from(orgMap.values());
  const total  = users.length;
  const indep  = users.filter(u => !u.organization).length;

  sc(ws, 0, 0, '  ORGANISATIONS', sTitle());
  merge(ws, 0, 0, 0, 5);
  sc(ws, 1, 0, `${orgs.length} organisation(s) — exporté le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 5);

  ['#', 'Organisation', 'Code', 'Utilisateurs', '% Total', 'Conventions'].forEach((h, i) => sc(ws, 2, i, h, sHeader()));

  orgs.forEach((org, i) => {
    const r = i + 3;
    sc(ws, r, 0, i + 1,     { ...sData(i, 'center') });
    sc(ws, r, 1, org.name,  sData(i));
    sc(ws, r, 2, org.code,  { ...sData(i, 'center') });
    sc(ws, r, 3, org.count, { ...sData(i, 'center'), font: { name: 'Arial', bold: true, sz: 11, color: { rgb: C.navy } } });
    sc(ws, r, 4, pct(org.count, total), { ...sData(i, 'center') });
    sc(ws, r, 5, Array.from(org.conventions).join(', ') || 'Aucune', { ...sData(i), font: { name: 'Arial', sz: 8, color: { rgb: C.purple } } });
  });

  if (indep > 0) {
    const r = orgs.length + 3;
    sc(ws, r, 0, orgs.length + 1, { ...sData(orgs.length, 'center') });
    sc(ws, r, 1, 'Utilisateurs Indépendants', { ...sData(orgs.length), font: { name: 'Arial', italic: true, sz: 9, color: { rgb: C.gray } } });
    sc(ws, r, 2, '—',     { ...sData(orgs.length, 'center') });
    sc(ws, r, 3, indep,   { ...sData(orgs.length, 'center'), font: { name: 'Arial', bold: true, sz: 11, color: { rgb: C.gray } } });
    sc(ws, r, 4, pct(indep, total), { ...sData(orgs.length, 'center') });
    sc(ws, r, 5, 'Aucune', sData(orgs.length));
  }

  setRef(ws, orgs.length + 4, 5);
  ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 50 }];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 16 }, { hpt: 22 }];
  return ws;
}

// ─── Sheet 5: Statistiques ────────────────────────────────────────────────────

function buildStatsSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const total   = users.length;
  const active  = users.filter(u => u.isActive).length;
  const with2fa = users.filter(u => u.otpEnabled).length;
  const clients = users.filter(u => u.role === 'CLIENT_ADHERENT').length;
  const admins  = users.filter(u => u.role === 'ADMINISTRATEUR_ARS').length;
  const gests   = users.filter(u => u.role === 'GESTIONNAIRE_VALIDATION_ARS').length;
  const withOrg = users.filter(u => u.organization).length;
  const withDrv = users.filter(u => u.driverProfile).length;
  const orgMap  = buildOrgMap(users);

  sc(ws, 0, 0, '  STATISTIQUES', sTitle());
  merge(ws, 0, 0, 0, 2);
  sc(ws, 1, 0, `Généré le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 2);

  type StatEntry = { label: string; value: number | string; color?: string; section?: boolean };

  const stats: StatEntry[] = [
    { label: 'APERÇU GÉNÉRAL', value: '', section: true },
    { label: 'Total utilisateurs',       value: total,            color: C.navy   },
    { label: 'Utilisateurs actifs',      value: active,           color: C.green  },
    { label: 'Utilisateurs inactifs',    value: total - active,   color: C.red    },
    { label: "Taux d'activité",          value: pct(active, total), color: C.blue },
    { label: 'SÉCURITÉ', value: '', section: true },
    { label: 'Avec 2FA activé',          value: with2fa,          color: C.green  },
    { label: 'Sans 2FA',                 value: total - with2fa,  color: C.orange },
    { label: 'Taux adoption 2FA',        value: pct(with2fa, total), color: C.blue },
    { label: 'RÔLES', value: '', section: true },
    { label: 'Clients Adhérents',              value: clients, color: C.blue   },
    { label: 'Administrateurs ARS',            value: admins,  color: C.purple },
    { label: 'Gestionnaires Validation ARS',   value: gests,   color: C.green  },
    { label: 'ORGANISATIONS', value: '', section: true },
    { label: 'Avec organisation',        value: withOrg,          color: C.blue   },
    { label: 'Sans organisation',        value: total - withOrg,  color: C.gray   },
    { label: "Nombre d'organisations",   value: orgMap.size,      color: C.navy   },
    { label: 'PROFILS CONDUCTEURS', value: '', section: true },
    { label: 'Avec profil conducteur',   value: withDrv,          color: C.blue   },
    { label: 'Sans profil conducteur',   value: total - withDrv,  color: C.gray   },
    { label: "Taux d'inscription conducteur", value: pct(withDrv, total), color: C.blue },
  ];

  let r = 2;
  stats.forEach(stat => {
    if (stat.section) {
      sc(ws, r, 0, `  ${stat.label}`, sSectionTitle());
      merge(ws, r, 0, r, 2);
      r++;
      return;
    }
    sc(ws, r, 0, stat.label, sStatLabel());
    sc(ws, r, 1, stat.value, sStatValue(stat.color ?? C.navy));
    merge(ws, r, 1, r, 2);
    r++;
  });

  setRef(ws, r + 1, 2);
  ws['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 8 }];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 16 }];
  return ws;
}

// ─── Sheet 6: Données Graphique ───────────────────────────────────────────────
// Pure data tables. In Excel, select any table → Insert → Chart to visualize.

function buildChartDataSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const total   = users.length;
  const active  = users.filter(u => u.isActive).length;
  const with2fa = users.filter(u => u.otpEnabled).length;
  const clients = users.filter(u => u.role === 'CLIENT_ADHERENT').length;
  const admins  = users.filter(u => u.role === 'ADMINISTRATEUR_ARS').length;
  const gests   = users.filter(u => u.role === 'GESTIONNAIRE_VALIDATION_ARS').length;
  const withOrg = users.filter(u => u.organization).length;
  const withDrv = users.filter(u => u.driverProfile).length;
  const orgMap  = buildOrgMap(users);

  // Title
  sc(ws, 0, 0, '  DONNÉES POUR GRAPHIQUES — sélectionner un tableau → Insertion → Graphique', sTitle());
  merge(ws, 0, 0, 0, 17);
  for (let c = 0; c < 18; c++) sc(ws, 1, c, '', sEmpty());

  // ── Table A: Statut des comptes (col 0-2)
  sc(ws, 2, 0, 'A — Statut des Comptes', sHeader(C.navy));
  sc(ws, 2, 1, 'Nombre', sHeader(C.navy));
  sc(ws, 2, 2, '%', sHeader(C.navy));
  merge(ws, 2, 0, 2, 0);
  const statusData = [
    { label: 'Actifs',   val: active          },
    { label: 'Inactifs', val: total - active  },
  ];
  statusData.forEach((row, i) => {
    sc(ws, 3 + i, 0, row.label, sData(i));
    sc(ws, 3 + i, 1, row.val,   { ...sData(i, 'center') });
    sc(ws, 3 + i, 2, pct(row.val, total), { ...sData(i, 'center') });
  });

  // ── Table B: Répartition par Rôle (col 4-6)
  sc(ws, 2, 4, 'B — Répartition par Rôle', sHeader(C.navy));
  sc(ws, 2, 5, 'Nombre', sHeader(C.navy));
  sc(ws, 2, 6, '%', sHeader(C.navy));
  const roleData2 = [
    { label: 'Client Adhérent',             val: clients },
    { label: 'Administrateur ARS',          val: admins  },
    { label: 'Gestionnaire Validation ARS', val: gests   },
  ];
  roleData2.forEach((row, i) => {
    sc(ws, 3 + i, 4, row.label, sData(i));
    sc(ws, 3 + i, 5, row.val,   { ...sData(i, 'center') });
    sc(ws, 3 + i, 6, pct(row.val, total), { ...sData(i, 'center') });
  });

  // ── Table C: 2FA (col 8-10)
  sc(ws, 2, 8, 'C — Adoption 2FA', sHeader(C.navy));
  sc(ws, 2, 9, 'Nombre', sHeader(C.navy));
  sc(ws, 2, 10, '%', sHeader(C.navy));
  const tfaData = [
    { label: '2FA Activé', val: with2fa          },
    { label: 'Sans 2FA',   val: total - with2fa  },
  ];
  tfaData.forEach((row, i) => {
    sc(ws, 3 + i, 8,  row.label, sData(i));
    sc(ws, 3 + i, 9,  row.val,   { ...sData(i, 'center') });
    sc(ws, 3 + i, 10, pct(row.val, total), { ...sData(i, 'center') });
  });

  // ── Table D: Par Organisation (col 12-14)
  sc(ws, 2, 12, 'D — Utilisateurs par Organisation', sHeader(C.navy));
  sc(ws, 2, 13, 'Nombre', sHeader(C.navy));
  sc(ws, 2, 14, '%', sHeader(C.navy));
  let orgRowIdx = 3;
  orgMap.forEach(org => {
    sc(ws, orgRowIdx, 12, org.name,    sData(orgRowIdx - 3));
    sc(ws, orgRowIdx, 13, org.count,   { ...sData(orgRowIdx - 3, 'center') });
    sc(ws, orgRowIdx, 14, pct(org.count, total), { ...sData(orgRowIdx - 3, 'center') });
    orgRowIdx++;
  });
  const indep2 = total - withOrg;
  if (indep2 > 0) {
    sc(ws, orgRowIdx, 12, 'Indépendants', sData(orgRowIdx - 3));
    sc(ws, orgRowIdx, 13, indep2,         { ...sData(orgRowIdx - 3, 'center') });
    sc(ws, orgRowIdx, 14, pct(indep2, total), { ...sData(orgRowIdx - 3, 'center') });
    orgRowIdx++;
  }

  // ── Table E: Profils (col 16-18)
  sc(ws, 2, 16, 'E — Profils & Organisation', sHeader(C.navy));
  sc(ws, 2, 17, 'Nombre', sHeader(C.navy));
  sc(ws, 2, 18, '%', sHeader(C.navy));
  const profileData = [
    { label: 'Avec profil conducteur', val: withDrv          },
    { label: 'Sans profil conducteur', val: total - withDrv  },
    { label: 'Avec organisation',      val: withOrg          },
    { label: 'Sans organisation',      val: total - withOrg  },
  ];
  profileData.forEach((row, i) => {
    sc(ws, 3 + i, 16, row.label, sData(i));
    sc(ws, 3 + i, 17, row.val,   { ...sData(i, 'center') });
    sc(ws, 3 + i, 18, pct(row.val, total), { ...sData(i, 'center') });
  });

  const maxRow = Math.max(5, orgRowIdx + 1);
  setRef(ws, maxRow, 18);
  ws['!cols'] = [
    { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 4 },
    { wch: 32 }, { wch: 12 }, { wch: 10 }, { wch: 4 },
    { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 4 },
    { wch: 32 }, { wch: 14 }, { wch: 10 }, { wch: 4 },
    { wch: 26 }, { wch: 12 }, { wch: 10 },
  ];
  ws['!rows'] = [{ hpt: 36 }, { hpt: 8 }, { hpt: 22 }];
  return ws;
}

// ─── Sheet 7: Détails Complets ────────────────────────────────────────────────

function buildDetailsSheet(users: ExportUser[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  sc(ws, 0, 0, '  DÉTAILS COMPLETS', sTitle());
  merge(ws, 0, 0, 0, 18);
  sc(ws, 1, 0, `${users.length} utilisateur(s) — exporté le ${nowStr()}`, sSubTitle());
  merge(ws, 1, 0, 1, 18);

  const headers = [
    '#', 'ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Rôle (Code)',
    'Organisation', 'Code Org.', 'Nb Conventions', 'Liste Conventions',
    '2FA', 'Actif', 'Date Création',
    'Profil Conducteur', 'Date Naissance', 'Date Permis', 'Expérience (ans)',
  ];
  headers.forEach((h, i) => sc(ws, 2, i, h, sHeader()));

  users.forEach((u, idx) => {
    const r  = idx + 3;
    const dp = u.driverProfile;

    sc(ws, r, 0,  idx + 1,                            { ...sData(idx, 'center') });
    sc(ws, r, 1,  u.id,                               { ...sData(idx), font: { name: 'Arial', sz: 7, color: { rgb: C.gray } } });
    sc(ws, r, 2,  u.firstName,                        sData(idx));
    sc(ws, r, 3,  u.lastName,                         sData(idx));
    sc(ws, r, 4,  u.email,                            sData(idx));
    sc(ws, r, 5,  u.phone || '—',                     { ...sData(idx, 'center') });
    sc(ws, r, 6,  getRoleLabel(u.role),               sBadge(getRoleColor(u.role)));
    sc(ws, r, 7,  u.role,                             { ...sData(idx), font: { name: 'Arial', sz: 7, color: { rgb: C.gray } } });
    sc(ws, r, 8,  u.organization?.name || '—',        sData(idx));
    sc(ws, r, 9,  u.organization?.code || '—',        { ...sData(idx, 'center') });
    sc(ws, r, 10, u.organization?.conventions?.length ?? 0, { ...sData(idx, 'center') });
    sc(ws, r, 11, u.organization?.conventions?.map(c => c.name).join(' | ') || 'Aucune',
                  { ...sData(idx), font: { name: 'Arial', sz: 8, color: { rgb: C.purple } } });
    sc(ws, r, 12, u.otpEnabled ? '✔ Oui' : '✘ Non',  sBadge(u.otpEnabled ? C.green : C.gray));
    sc(ws, r, 13, u.isActive   ? '● Actif' : '○ Inactif', sBadge(u.isActive ? C.green : C.red));
    sc(ws, r, 14, fmtDateTime(u.createdAt),           { ...sData(idx, 'center') });
    sc(ws, r, 15, dp ? '✔ Oui' : '✘ Non',            sBadge(dp ? C.blue : C.gray));
    sc(ws, r, 16, dp ? fmtDate(dp.birthDate)  : '—',  { ...sData(idx, 'center') });
    sc(ws, r, 17, dp ? fmtDate(dp.licenseDate): '—',  { ...sData(idx, 'center') });
    sc(ws, r, 18, dp ? dp.experienceYears      : '—', { ...sData(idx, 'center') });
  });

  setRef(ws, users.length + 3, 18);
  ws['!cols'] = [
    { wch: 5 }, { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 14 },
    { wch: 26 }, { wch: 34 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 46 },
    { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
  ];
  ws['!rows'] = [{ hpt: 40 }, { hpt: 16 }, { hpt: 22 }];
  return ws;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export const exportUsersToExcel = (users: ExportUser[]) => {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildDashboard(users),       '📊 Tableau de Bord');
  XLSX.utils.book_append_sheet(wb, buildUsersSheet(users),      '👥 Utilisateurs');
  XLSX.utils.book_append_sheet(wb, buildDriversSheet(users),    '🚗 Conducteurs');
  XLSX.utils.book_append_sheet(wb, buildOrgsSheet(users),       '🏢 Organisations');
  XLSX.utils.book_append_sheet(wb, buildStatsSheet(users),      '📈 Statistiques');
  XLSX.utils.book_append_sheet(wb, buildChartDataSheet(users),  '📉 Données Graphique');
  XLSX.utils.book_append_sheet(wb, buildDetailsSheet(users),    '🗂 Détails Complets');

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  XLSX.writeFile(wb, `Utilisateurs_Export_${ts}.xlsx`);
};