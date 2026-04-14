import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateQuotePdf(quote: any): Promise<string> {
    const bundlings = await this.getBundlingsForCompany(quote.companyId, quote.simulation?.formulaType);
    
    const html = this.generateQuoteHtml(quote, bundlings);
    const filename = `quote-${quote.quoteNumber}-${Date.now()}.pdf`;
    const filepath = path.join(this.uploadsDir, filename);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    await browser.close();

    return filepath;
  }

  async generateContractPdf(contract: any): Promise<string> {
    const bundlings = await this.getBundlingsForCompany(contract.quote.companyId, contract.quote.simulation?.formulaType);
    
    const html = this.generateContractHtml(contract, bundlings);
    const filename = `contract-${contract.contractNumber}-${Date.now()}.pdf`;
    const filepath = path.join(this.uploadsDir, filename);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();

    return filepath;
  }

  private async getBundlingsForCompany(companyId: string, formulaType?: string) {
    const bundlings = await this.prisma.guaranteeBundling.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { formulaType: null },
          { formulaType: formulaType as any },
        ],
      },
      include: {
        parentGuarantee: true,
        includedGuarantee: true,
      },
    });

    const bundlingMap = new Map<string, string[]>();
    for (const bundling of bundlings) {
      const parentCode = bundling.parentGuarantee.code;
      if (!bundlingMap.has(parentCode)) {
        bundlingMap.set(parentCode, []);
      }
      bundlingMap.get(parentCode)!.push(bundling.includedGuarantee.code);
    }

    return bundlingMap;
  }

  private generateQuoteHtml(quote: any, bundlings: Map<string, string[]>): string {
    const formatCurrency = (value: any) => {
      return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
      }).format(Number(value));
    };

    const formatDate = (date: any) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'Image1.png');
    const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';

    // Dynamic formula label with franchise rate
    let formulaLabel = '';
    if (quote.simulation.formulaType === 'STANDARD') {
      formulaLabel = 'Standard';
    } else if (quote.simulation.formulaType === 'DOMMAGES_COLLISIONS') {
      formulaLabel = 'Dommages Collision';
    } else if (quote.simulation.formulaType === 'TOUS_RISQUES_0') {
      const franchiseRate = quote.simulation.franchiseRate || 0;
      formulaLabel = `Tous Risques ${franchiseRate}%`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #2d3452; line-height: 1.4; font-size: 11px; background: #f4f6fb; }

    .page-wrap { padding: 16px; }

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #d9112c;
      color: white;
      padding: 18px 24px;
      border-radius: 10px 10px 0 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo-circle {
      width: 52px; height: 52px; border-radius: 50%;
      background: #ffffff;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
    }
    .logo-circle img { width: 40px; height: 40px; object-fit: contain; }
    .header-brand { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
    .header-sub { font-size: 10px; opacity: 0.65; margin-top: 2px; letter-spacing: 0.8px; text-transform: uppercase; }
    .header-right { text-align: right; }
    .quote-label { font-size: 9px; opacity: 0.55; text-transform: uppercase; letter-spacing: 1px; }
    .quote-number { font-size: 20px; font-weight: bold; color: #e8b84b; letter-spacing: 1px; }
    .validity-pill {
      display: inline-block; margin-top: 6px;
      padding: 3px 12px; border-radius: 20px;
      background: rgba(255,255,255,0.12);
      font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.25);
    }

    /* ── GOLD ACCENT BAR ── */
    .accent-bar { height: 4px; background: linear-gradient(90deg, #e8b84b, #f5d78e, #e8b84b); }

    /* ── META ROW ── */
    .meta-row {
      display: flex; gap: 0;
      background: #ffffff;
      border: 1px solid #e0e5f0;
      border-top: none;
    }
    .meta-cell {
      flex: 1; padding: 10px 16px;
      border-right: 1px solid #e0e5f0;
    }
    .meta-cell:last-child { border-right: none; }
    .meta-cell-label { font-size: 8.5px; color: #8892aa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
    .meta-cell-value { font-size: 11px; color: #d9112c; font-weight: bold; }

    /* ── BODY ── */
    .body { background: #ffffff; border: 1px solid #e0e5f0; border-top: none; padding: 18px 20px; }

    /* ── TWO-COL INFO ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .info-card {
      background: #f7f9fc;
      border: 1px solid #e0e5f0;
      border-radius: 7px;
      padding: 12px 14px;
    }
    .info-card-title {
      font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.9px;
      color: #8892aa; margin-bottom: 10px; padding-bottom: 7px;
      border-bottom: 1px solid #e0e5f0;
    }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 3px 0; }
    .info-key { color: #7a8299; font-size: 10px; }
    .info-val { color: #d9112c; font-size: 10px; font-weight: bold; text-align: right; max-width: 55%; }
    .info-val-badge {
      display: inline-block;
      background: #fff3cd; color: #7a5c00;
      border: 1px solid #f5d78e;
      border-radius: 4px; padding: 1px 7px;
      font-size: 9px; font-weight: bold;
    }

    /* ── SECTION HEADING ── */
    .section-heading {
      display: flex; align-items: center; gap: 8px;
      font-size: 10px; font-weight: bold; text-transform: uppercase;
      letter-spacing: 0.8px; color: #d9112c;
      margin: 16px 0 10px;
    }
    .section-heading::before {
      content: '';
      display: inline-block; width: 3px; height: 14px;
      background: #e8b84b; border-radius: 2px; flex-shrink: 0;
    }
    .section-heading::after {
      content: ''; flex: 1; height: 1px; background: #e0e5f0;
    }

    /* ── GUARANTEES TABLE ── */
    .gtable { width: 100%; border-collapse: collapse; }
    .gtable thead tr { background: #d9112c; }
    .gtable th {
      padding: 8px 10px; text-align: left;
      font-size: 9px; font-weight: bold;
      text-transform: uppercase; letter-spacing: 0.7px;
      color: #e8b84b;
    }
    .gtable th:last-child { text-align: right; }
    .gtable td { padding: 7px 10px; font-size: 10px; color: #2d3452; border-bottom: 1px solid #f0f2f8; }
    .gtable td:last-child { text-align: right; font-weight: bold; color: #d9112c; }
    .gtable tbody tr:nth-child(even) { background: #fafbfd; }
    .gtable .combined-row { background: #fffbef !important; }
    .gtable .combined-row td { color: #7a5c00; }
    .combined-tag { font-size: 8.5px; color: #b08a20; display: block; margin-top: 2px; }

    /* ── TOTALS PANEL ── */
    .totals-panel {
  display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-top: 16px; align-items: start;
  page-break-inside: avoid; break-inside: avoid;
}
    .terms-box {
      background: #f7f9fc; border: 1px solid #e0e5f0; border-radius: 7px; padding: 12px 14px;
    }
    .terms-box-title { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #8892aa; margin-bottom: 8px; }
    .terms-list { list-style: none; }
    .terms-list li { font-size: 9.5px; color: #5a6480; padding: 3px 0; display: flex; gap: 7px; align-items: flex-start; }
    .terms-list li::before { content: '›'; color: #e8b84b; font-size: 12px; line-height: 1; flex-shrink: 0; }

    .totals-box { background: #d9112c; border-radius: 7px; padding: 14px 16px; page-break-inside: avoid; break-inside: avoid; }
    .total-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); }
    .total-line .amount { color: rgba(255,255,255,0.85); }
    .total-divider { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 8px 0; }
    .total-final { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
    .total-final-label { font-size: 10px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
    .total-final-amount { font-size: 18px; font-weight: bold; color: #e8b84b; }

    /* ── FOOTER ── */
    .footer {
      background: #f7f9fc; border: 1px solid #e0e5f0; border-top: none;
      border-radius: 0 0 10px 10px;
      padding: 10px 20px;
      display: flex; justify-content: space-between; align-items: center;
       page-break-inside: avoid; break-inside: avoid;
    }
    .footer-left { font-size: 8.5px; color: #8892aa; }
    .footer-right { font-size: 8.5px; color: #8892aa; text-align: right; }
    .footer-brand { font-size: 9px; font-weight: bold; color: #d9112c; }
  </style>
</head>
<body>
<div class="page-wrap">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoBase64 ? `
        <div class="logo-circle">
          <img src="data:image/png;base64,${logoBase64}" alt="Logo" />
        </div>
      ` : ''}
      <div>
        <div class="header-brand">ARS ASSURANCE</div>
        <div class="header-sub">Courtier en Assurances</div>
      </div>
    </div>
    <div class="header-right">
      <div class="quote-label">Devis d'Assurance Automobile</div>
      <div class="quote-number">${quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}</div>
      <div class="validity-pill">Valable 30 jours</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- META ROW -->
  <div class="meta-row">
    <div class="meta-cell">
      <div class="meta-cell-label">Date</div>
      <div class="meta-cell-value">${formatDate(quote.createdAt)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Compagnie</div>
      <div class="meta-cell-value">${quote.company.name}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Client</div>
      <div class="meta-cell-value">${quote.user.firstName} ${quote.user.lastName}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Fractionnement</div>
      <div class="meta-cell-value">${quote.fractionnement === 'SEMESTRIEL' ? 'Semestriel' : 'Annuel'}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Formule</div>
      <div class="meta-cell-value">${formulaLabel}</div>
    </div>
  </div>

  <div class="body">

    <!-- CLIENT + VEHICLE INFO CARDS -->
    <div class="two-col">
      <div class="info-card">
        <div class="info-card-title">Assuré</div>
        <div class="info-row">
          <span class="info-key">Nom complet</span>
          <span class="info-val">${quote.user.firstName} ${quote.user.lastName}</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-title">Véhicule</div>
        <div class="info-row">
          <span class="info-key">Immatriculation</span>
          <span class="info-val">${quote.simulation.vehicle.registration || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">CV / Places</span>
          <span class="info-val">${quote.simulation.vehicle.fiscalHorsepower} CV / ${quote.simulation.vehicle.numberOfSeats} places</span>
        </div>
        <div class="info-row">
          <span class="info-key">1ère Circulation</span>
          <span class="info-val">${formatDate(quote.simulation.vehicle.firstCirculationDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Valeur Neuf</span>
          <span class="info-val">${formatCurrency(quote.simulation.vehicle.newValue)}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Valeur Vénale</span>
          <span class="info-val">${formatCurrency(quote.simulation.vehicle.marketValue)}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Classe Bonus/Malus</span>
          <span class="info-val">Classe ${quote.simulation.bonusMalus}</span>
        </div>
        ${quote.eligibilitySnapshot ? `
        <div class="info-row">
          <span class="info-key">Âge du véhicule</span>
          <span class="info-val">
            ${quote.eligibilitySnapshot.vehicleAge} an(s)
            ${quote.eligibilitySnapshot.ruleApplied
              ? `<span class="info-val-badge">✓ &lt; ${quote.eligibilitySnapshot.maxAgeYears} ans</span>`
              : ''}
          </span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- GUARANTEES -->
    <div class="section-heading">Garanties Souscrites</div>

    <table class="gtable">
      <thead>
        <tr>
          <th>Garantie</th>
          <th>Capital Assuré</th>
          <th>Prime (DT)</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          const processedGuarantees = new Set<string>();
          let rows = '';
          const pricingSnapshot = quote.pricingSnapshot;

          quote.items.forEach((item: any) => {
            const guaranteeCode = item.guarantee.code;

            if (processedGuarantees.has(guaranteeCode)) return;

            const includedCodes = bundlings.get(guaranteeCode);
            const isFree = Number(item.prime) === 0;
            const isNotCovered = item.isNotCovered || false;
            const notCoveredLabel = isNotCovered ? ' <span style="color: #dc2626; font-weight: bold; font-size: 9px;">(NON ACCORDÉE)</span>' : '';
            const freeLabel = (!isNotCovered && isFree) ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : '';
            let reductionInfo = null;
            if (pricingSnapshot?.reductions && pricingSnapshot.reductions[guaranteeCode]) {
              reductionInfo = pricingSnapshot.reductions[guaranteeCode];
            }

            if (includedCodes && includedCodes.length > 0) {
              const includedItems = includedCodes
                .map(code => quote.items.find((i: any) => i.guarantee.code === code))
                .filter(Boolean);

              if (includedItems.length === includedCodes.length) {
                const parentItem = item;
                const combinedPrime = [parentItem, ...includedItems]
                  .reduce((sum, i) => sum + Number(i.prime), 0);
                const combinedCapital = Math.max(
                  Number(parentItem.capital),
                  ...includedItems.map((i: any) => Number(i.capital))
                );

                processedGuarantees.add(guaranteeCode);
                includedCodes.forEach(code => processedGuarantees.add(code));

                const includedNames = includedItems.map((i: any) => i.guarantee.nameFr).join(' + ');
                const combinedIsFree = combinedPrime === 0;
                
                let primeDisplay = formatCurrency(combinedPrime);
                if (reductionInfo && reductionInfo.discountPercent > 0) {
                  primeDisplay = `<div style="text-decoration: line-through; color: #999; font-size: 9px;">${formatCurrency(reductionInfo.originalPrime)}</div><div>${formatCurrency(combinedPrime)} <span style="color: #16a34a; font-size: 8px;">(-${reductionInfo.discountPercent}%)</span></div>`;
                }
                
                rows += `
                  <tr class="combined-row">
                    <td><strong>${parentItem.guarantee.nameFr}</strong>${!isNotCovered && combinedIsFree ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : ''}${notCoveredLabel}<span class="combined-tag">Inclut: ${includedNames}</span></td>
                    <td>${combinedCapital == 0 ? 'ILLIMITÉ' : formatCurrency(combinedCapital)}</td>
                    <td>${primeDisplay}</td>
                  </tr>
                `;
                return;
              }
            }

            processedGuarantees.add(guaranteeCode);
            
            let primeDisplay = formatCurrency(item.prime);
            if (reductionInfo && reductionInfo.discountPercent > 0) {
              primeDisplay = `<div style="text-decoration: line-through; color: #999; font-size: 9px;">${formatCurrency(reductionInfo.originalPrime)}</div><div>${formatCurrency(item.prime)} <span style="color: #16a34a; font-size: 8px;">(-${reductionInfo.discountPercent}%)</span></div>`;
            }
            
            rows += `
              <tr>
                <td>${item.guarantee.nameFr}${freeLabel}${notCoveredLabel}</td>
                <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
                <td>${primeDisplay}</td>
              </tr>
            `;
          });

          return rows;
        })()}
      </tbody>
    </table>

    <!-- TOTALS PANEL -->
    <div class="totals-panel">
      <div class="terms-box">
        <div class="terms-box-title">Informations du Devis</div>
        <ul class="terms-list">
          <li>Devis valable 30 jours à compter de la date d'émission</li>
          <li>Tarif soumis à acceptation de la compagnie</li>
          <li>Paiement requis avant prise d'effet</li>
          <li>Document non contractuel</li>
        </ul>
      </div>

      <div class="totals-box">
        <div class="total-line"><span>Prime Nette</span><span class="amount">${formatCurrency(quote.primeNette)}</span></div>
        <div class="total-line"><span>Frais</span><span class="amount">${formatCurrency(quote.frais)}</span></div>
        <div class="total-line"><span>Taxes</span><span class="amount">${formatCurrency(quote.taxes)}</span></div>
        <div class="total-line"><span>F.P.A.C</span><span class="amount">${formatCurrency(quote.fpac)}</span></div>
        <div class="total-line"><span>F.S.S.R</span><span class="amount">${formatCurrency(quote.fssr)}</span></div>
        <div class="total-line"><span>F.G</span><span class="amount">${formatCurrency(quote.fg)}</span></div>
        <hr class="total-divider" />
        <div class="total-final">
          <span class="total-final-label">Total ${quote.fractionnement === 'SEMESTRIEL' ? '(Semestriel)' : '(Annuel)'}</span>
          <span class="total-final-amount">${formatCurrency(quote.totalAPayer)}</span>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      <div class="footer-brand">ARS ASSURANCE</div>
      <div>Courtier Agréé • Document Non Contractuel</div>
    </div>
    <div class="footer-right">
      <div>Émis le ${formatDate(quote.createdAt)}</div>
    </div>
  </div>

</div>
</body>
</html>
    `;
  }

  private generateContractHtml(contract: any, bundlings: Map<string, string[]>): string {
    const formatCurrency = (value: any) => {
      return new Intl.NumberFormat('fr-TN', { 
        style: 'currency', 
        currency: 'TND',
        minimumFractionDigits: 2 
      }).format(Number(value));
    };

    const formatDate = (date: any) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'Image1.png');
    const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #d9112c; line-height: 1.4; font-size: 11px; background: #f4f6fb; }

    .page-wrap { padding: 16px; }

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #d9112c;
      color: white;
      padding: 18px 24px;
      border-radius: 10px 10px 0 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo-circle {
      width: 52px; height: 52px; border-radius: 50%;
      background: #ffffff;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
    }
    .logo-circle img { width: 40px; height: 40px; object-fit: contain; }
    .header-brand { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
    .header-sub { font-size: 10px; opacity: 0.65; margin-top: 2px; letter-spacing: 0.8px; text-transform: uppercase; }
    .header-right { text-align: right; }
    .contract-label { font-size: 9px; opacity: 0.55; text-transform: uppercase; letter-spacing: 1px; }
    .contract-number { font-size: 20px; font-weight: bold; color: #e8b84b; letter-spacing: 1px; }
    .status-pill {
      display: inline-block; margin-top: 6px;
      padding: 3px 12px; border-radius: 20px;
      background: rgba(255,255,255,0.12);
      font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.25);
    }

    /* ── GOLD ACCENT BAR ── */
    .accent-bar { height: 4px; background: linear-gradient(90deg, #e8b84b, #f5d78e, #e8b84b); }

    /* ── META ROW ── */
    .meta-row {
      display: flex; gap: 0;
      background: #ffffff;
      border: 1px solid #e0e5f0;
      border-top: none;
    }
    .meta-cell {
      flex: 1; padding: 10px 16px;
      border-right: 1px solid #e0e5f0;
    }
    .meta-cell:last-child { border-right: none; }
    .meta-cell-label { font-size: 8.5px; color: #8892aa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
    .meta-cell-value { font-size: 11px; color: #d9112c; font-weight: bold; }

    /* ── BODY ── */
    .body { background: #ffffff; border: 1px solid #e0e5f0; border-top: none; padding: 18px 20px; }

    /* ── TWO-COL INFO ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .info-card {
      background: #f7f9fc;
      border: 1px solid #e0e5f0;
      border-radius: 7px;
      padding: 12px 14px;
    }
    .info-card-title {
      font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.9px;
      color: #8892aa; margin-bottom: 10px; padding-bottom: 7px;
      border-bottom: 1px solid #e0e5f0;
    }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 3px 0; }
    .info-key { color: #7a8299; font-size: 10px; }
    .info-val { color: #d9112c; font-size: 10px; font-weight: bold; text-align: right; max-width: 55%; }

    /* ── SECTION HEADING ── */
    .section-heading {
      display: flex; align-items: center; gap: 8px;
      font-size: 10px; font-weight: bold; text-transform: uppercase;
      letter-spacing: 0.8px; color: #d9112c;
      margin: 16px 0 10px;
    }
    .section-heading::before {
      content: '';
      display: inline-block; width: 3px; height: 14px;
      background: #e8b84b; border-radius: 2px; flex-shrink: 0;
    }
    .section-heading::after {
      content: ''; flex: 1; height: 1px; background: #e0e5f0;
    }

    /* ── GUARANTEES TABLE ── */
    .gtable { width: 100%; border-collapse: collapse; }
    .gtable thead tr { background: #d9112c; }
    .gtable th {
      padding: 8px 10px; text-align: left;
      font-size: 9px; font-weight: bold;
      text-transform: uppercase; letter-spacing: 0.7px;
      color: #e8b84b;
    }
    .gtable th:last-child { text-align: right; }
    .gtable td { padding: 7px 10px; font-size: 10px; color: #2d3452; border-bottom: 1px solid #f0f2f8; }
    .gtable td:last-child { text-align: right; font-weight: bold; color: #d9112c; }
    .gtable tbody tr:nth-child(even) { background: #fafbfd; }
    .gtable .combined-row { background: #fffbef !important; }
    .gtable .combined-row td { color: #7a5c00; }
    .combined-tag { font-size: 8.5px; color: #b08a20; display: block; margin-top: 2px; }

    /* ── TOTALS PANEL ── */
    .totals-panel {
      display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-top: 16px; align-items: start;
      page-break-inside: avoid; break-inside: avoid;
    }
    .terms-box {
      background: #f7f9fc; border: 1px solid #e0e5f0; border-radius: 7px; padding: 12px 14px;
    }
    .terms-box-title { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #8892aa; margin-bottom: 8px; }
    .terms-list { list-style: none; }
    .terms-list li { font-size: 9.5px; color: #5a6480; padding: 3px 0; display: flex; gap: 7px; align-items: flex-start; }
    .terms-list li::before { content: '›'; color: #e8b84b; font-size: 12px; line-height: 1; flex-shrink: 0; }

    .totals-box { background: #d9112c; border-radius: 7px; padding: 14px 16px; page-break-inside: avoid; break-inside: avoid; }
    .total-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); }
    .total-line .amount { color: rgba(255,255,255,0.85); }
    .total-divider { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 8px 0; }
    .total-final { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
    .total-final-label { font-size: 10px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
    .total-final-amount { font-size: 18px; font-weight: bold; color: #e8b84b; }

    /* ── FOOTER ── */
    .footer {
      background: #f7f9fc; border: 1px solid #e0e5f0; border-top: none;
      border-radius: 0 0 10px 10px;
      padding: 10px 20px;
      display: flex; justify-content: space-between; align-items: center;
      page-break-inside: avoid; break-inside: avoid;
    }
    .footer-left { font-size: 8.5px; color: #8892aa; }
    .footer-right { font-size: 8.5px; color: #8892aa; text-align: right; }
    .footer-brand { font-size: 9px; font-weight: bold; color: #d9112c; }
  </style>
</head>
<body>
<div class="page-wrap">

  <div class="header">
    <div class="header-left">
      ${logoBase64 ? `
        <div class="logo-circle">
          <img src="data:image/png;base64,${logoBase64}" alt="Logo" />
        </div>
      ` : ''}
      <div>
        <div class="header-brand">ARS ASSURANCE</div>
        <div class="header-sub">Courtier en Assurances</div>
      </div>
    </div>
    <div class="header-right">
      <div class="contract-label">Contrat d'Assurance Automobile</div>
      <div class="contract-number">${contract.contractNumber}</div>
      <div class="status-pill">${contract.status}</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <div class="meta-row">
    <div class="meta-cell">
      <div class="meta-cell-label">Date Début</div>
      <div class="meta-cell-value">${formatDate(contract.startDate)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Date Fin</div>
      <div class="meta-cell-value">${formatDate(contract.endDate)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Devis Associé</div>
      <div class="meta-cell-value">${contract.quote.quoteNumber}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Compagnie</div>
      <div class="meta-cell-value">${contract.quote.company.name}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell-label">Fractionnement</div>
      <div class="meta-cell-value">${contract.fractionnement === 'SEMESTRIEL' ? 'Semestriel' : 'Annuel'}</div>
    </div>
  </div>

  <div class="body">

    <div class="two-col">
      <div class="info-card">
        <div class="info-card-title">Assuré</div>
        <div class="info-row">
          <span class="info-key">Nom complet</span>
          <span class="info-val">${contract.user.firstName} ${contract.user.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Email</span>
          <span class="info-val">${contract.user.email}</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-title">Véhicule Assuré</div>
        <div class="info-row">
          <span class="info-key">Immatriculation</span>
          <span class="info-val">${contract.quote.simulation?.vehicle?.registration || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">CV / Places</span>
          <span class="info-val">${contract.quote.simulation?.vehicle?.fiscalHorsepower || 'N/A'} CV / ${contract.quote.simulation?.vehicle?.numberOfSeats || 'N/A'} pl.</span>
        </div>
        <div class="info-row">
          <span class="info-key">1ère Circulation</span>
          <span class="info-val">${contract.quote.simulation?.vehicle?.firstCirculationDate ? formatDate(contract.quote.simulation.vehicle.firstCirculationDate) : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Valeur Neuf</span>
          <span class="info-val">${contract.quote.simulation?.vehicle?.newValue ? formatCurrency(contract.quote.simulation.vehicle.newValue) : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Valeur Vénale</span>
          <span class="info-val">${contract.quote.simulation?.vehicle?.marketValue ? formatCurrency(contract.quote.simulation.vehicle.marketValue) : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Classe Bonus/Malus</span>
          <span class="info-val">Classe ${contract.quote.simulation?.bonusMalus || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Formule</span>
          <span class="info-val">${contract.quote.simulation?.formulaType === 'STANDARD' ? 'Standard' : contract.quote.simulation?.formulaType === 'DOMMAGES_COLLISIONS' ? 'Dommages Collision' : contract.quote.simulation?.formulaType === 'TOUS_RISQUES_0' ? 'Tous Risques 0%' : 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="section-heading">Garanties Souscrites</div>

    <table class="gtable">
      <thead>
        <tr>
          <th>Garantie</th>
          <th>Capital Assuré</th>
          <th>Prime (DT)</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          const processedGuarantees = new Set<string>();
          let rows = '';
          const pricingSnapshot = contract.quote.pricingSnapshot;
          
          contract.quote.items.forEach((item: any) => {
            const guaranteeCode = item.guarantee.code;
            
            if (processedGuarantees.has(guaranteeCode)) return;
            
            const includedCodes = bundlings.get(guaranteeCode);
            const isFree = Number(item.prime) === 0;
            const isNotCovered = item.isNotCovered || false;
            const notCoveredLabel = isNotCovered ? ' <span style="color: #dc2626; font-weight: bold; font-size: 9px;">(NON ACCORDÉE)</span>' : '';
            const freeLabel = (!isNotCovered && isFree) ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : '';
            
            // Check if reduction was applied from pricingSnapshot
            let reductionInfo = null;
            if (pricingSnapshot?.reductions && pricingSnapshot.reductions[guaranteeCode]) {
              reductionInfo = pricingSnapshot.reductions[guaranteeCode];
            }
            
            if (includedCodes && includedCodes.length > 0) {
              const includedItems = includedCodes
                .map(code => contract.quote.items.find((i: any) => i.guarantee.code === code))
                .filter(Boolean);
              
              if (includedItems.length === includedCodes.length) {
                const parentItem = item;
                const combinedPrime = [parentItem, ...includedItems]
                  .reduce((sum, i) => sum + Number(i.prime), 0);
                const combinedCapital = Math.max(
                  Number(parentItem.capital),
                  ...includedItems.map((i: any) => Number(i.capital))
                );
                
                processedGuarantees.add(guaranteeCode);
                includedCodes.forEach(code => processedGuarantees.add(code));
                
                const includedNames = includedItems.map((i: any) => i.guarantee.nameFr).join(' + ');
                const combinedIsFree = combinedPrime === 0;
                
                let primeDisplay = formatCurrency(combinedPrime);
                if (reductionInfo && reductionInfo.discountPercent > 0) {
                  primeDisplay = `<div style="text-decoration: line-through; color: #999; font-size: 9px;">${formatCurrency(reductionInfo.originalPrime)}</div><div>${formatCurrency(combinedPrime)} <span style="color: #16a34a; font-size: 8px;">(-${reductionInfo.discountPercent}%)</span></div>`;
                }
                
                rows += `
                  <tr class="combined-row">
                    <td><strong>${parentItem.guarantee.nameFr}</strong>${!isNotCovered && combinedIsFree ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : ''}${notCoveredLabel}<span class="combined-tag">Inclut: ${includedNames}</span></td>
                    <td>${combinedCapital == 0 ? 'ILLIMITÉ' : formatCurrency(combinedCapital)}</td>
                    <td>${primeDisplay}</td>
                  </tr>
                `;
                return;
              }
            }
            
            processedGuarantees.add(guaranteeCode);
            
            let primeDisplay = formatCurrency(item.prime);
            if (reductionInfo && reductionInfo.discountPercent > 0) {
              primeDisplay = `<div style="text-decoration: line-through; color: #999; font-size: 9px;">${formatCurrency(reductionInfo.originalPrime)}</div><div>${formatCurrency(item.prime)} <span style="color: #16a34a; font-size: 8px;">(-${reductionInfo.discountPercent}%)</span></div>`;
            }
            
            rows += `
              <tr>
                <td>${item.guarantee.nameFr}${freeLabel}${notCoveredLabel}</td>
                <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
                <td>${primeDisplay}</td>
              </tr>
            `;
          });
          
          return rows;
        })()}
      </tbody>
    </table>

    <div class="totals-panel">
      <div class="terms-box">
        <div class="terms-box-title">Conditions du Contrat</div>
        <ul class="terms-list">
          <li>Contrat valable 1 an renouvelable</li>
          <li>Déclaration sinistre sous 5 jours</li>
          <li>Paiement avant prise d'effet</li>
          <li>Modification à notifier sous 15 jours</li>
        </ul>
      </div>

      <div class="totals-box">
        <div class="total-line"><span>Prime Nette</span><span class="amount">${formatCurrency(contract.quote.primeNette)}</span></div>
        <div class="total-line"><span>Frais</span><span class="amount">${formatCurrency(contract.quote.frais)}</span></div>
        <div class="total-line"><span>Taxes</span><span class="amount">${formatCurrency(contract.quote.taxes)}</span></div>
        <div class="total-line"><span>F.P.A.C</span><span class="amount">${formatCurrency(contract.quote.fpac)}</span></div>
        <div class="total-line"><span>F.S.S.R</span><span class="amount">${formatCurrency(contract.quote.fssr)}</span></div>
        <div class="total-line"><span>F.G</span><span class="amount">${formatCurrency(contract.quote.fg)}</span></div>
        ${contract.deliveryFee > 0 ? `
        <div class="total-line"><span>Frais de Livraison</span><span class="amount">${formatCurrency(contract.deliveryFee)}</span></div>
        ` : ''}
        <hr class="total-divider" />
        <div class="total-final">
          <span class="total-final-label">Total Payé</span>
          <span class="total-final-amount">${formatCurrency(Number(contract.quote.totalAPayer) + Number(contract.deliveryFee))}</span>
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="footer-brand">ARS ASSURANCE</div>
      <div>Courtier Agréé • Document Officiel</div>
    </div>
    <div class="footer-right">
      <div>Émis le ${formatDate(contract.createdAt)}</div>
      ${contract.quittanceNumber ? `<div>Quittance N° ${contract.quittanceNumber}</div>` : ''}
    </div>
  </div>

</div>
</body>
</html>
    `;
  }
}