import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');

  constructor() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateQuotePdf(quote: any): Promise<string> {
    const html = this.generateQuoteHtml(quote);
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
    const html = this.generateContractHtml(contract);
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

  private generateQuoteHtml(quote: any): string {
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
    body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.3; font-size: 11px; }
    .header { background: #d52b36; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; }
    .header-logo { height: 40px; }
    .header-text { flex: 1; text-align: center; }
    .header h1 { font-size: 20px; margin-bottom: 3px; }
    .header p { font-size: 11px; opacity: 0.9; }
    .content { padding: 15px 20px; }
    .section { margin-bottom: 12px; }
    .section-title { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 12px; margin-bottom: 8px; border-left: 3px solid #d52b36; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item { padding: 4px 0; }
    .info-label { font-weight: bold; color: #666; font-size: 10px; }
    .info-value { color: #333; font-size: 11px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #d52b36; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
    .total-section { background: #f8f8f8; padding: 12px; margin-top: 12px; border-radius: 3px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
    .total-row.final { font-size: 14px; font-weight: bold; color: #d52b36; border-top: 2px solid #d52b36; padding-top: 8px; margin-top: 6px; }
    .footer { text-align: center; padding: 10px; font-size: 9px; color: #666; border-top: 1px solid #ddd; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />` : ''}
    <div class="header-text">
      <h1>ARS ASSURANCE</h1>
      <p>Devis d'Assurance Automobile</p>
    </div>
    <div style="width: 40px;"></div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du Devis</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">N° Devis</div>
          <div class="info-value">${quote.quoteNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date</div>
          <div class="info-value">${formatDate(quote.createdAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Compagnie</div>
          <div class="info-value">${quote.company.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Client</div>
          <div class="info-value">${quote.user.firstName} ${quote.user.lastName}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Véhicule</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Immatriculation</div>
          <div class="info-value">${quote.simulation.vehicle.registration || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">CV / Places</div>
          <div class="info-value">${quote.simulation.vehicle.fiscalHorsepower} CV / ${quote.simulation.vehicle.numberOfSeats} places</div>
        </div>
        <div class="info-item">
          <div class="info-label">1ère Circulation</div>
          <div class="info-value">${formatDate(quote.simulation.vehicle.firstCirculationDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Valeur Neuf / Vénale</div>
          <div class="info-value">${formatCurrency(quote.simulation.vehicle.newValue)} / ${formatCurrency(quote.simulation.vehicle.marketValue)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Garanties Souscrites</div>
      <table>
        <thead>
          <tr>
            <th>Garantie</th>
            <th>Capital Assuré</th>
            <th>Prime (DT)</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map((item: any) => `
            <tr>
              <td>${item.guarantee.nameFr}</td>
              <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
              <td>${formatCurrency(item.prime)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div class="total-row">
        <span>Prime Nette</span>
        <span>${formatCurrency(quote.primeNette)}</span>
      </div>
      <div class="total-row">
        <span>Frais</span>
        <span>${formatCurrency(quote.frais)}</span>
      </div>
      <div class="total-row">
        <span>Taxes</span>
        <span>${formatCurrency(quote.taxes)}</span>
      </div>
      <div class="total-row">
        <span>F.P.A.C</span>
        <span>${formatCurrency(quote.fpac)}</span>
      </div>
      <div class="total-row">
        <span>F.S.S.R</span>
        <span>${formatCurrency(quote.fssr)}</span>
      </div>
      <div class="total-row">
        <span>F.G</span>
        <span>${formatCurrency(quote.fg)}</span>
      </div>
      <div class="total-row final">
        <span>TOTAL À PAYER</span>
        <span>${formatCurrency(quote.totalAPayer)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Ce devis est valable 30 jours • ARS Assurance - Courtier en Assurances</p>
  </div>
</body>
</html>
    `;
  }

  private generateContractHtml(contract: any): string {
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
    body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.3; font-size: 11px; }
    .header { background: #d52b36; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; }
    .header-logo { height: 40px; }
    .header-text { flex: 1; text-align: center; }
    .header h1 { font-size: 20px; margin-bottom: 3px; }
    .header p { font-size: 11px; opacity: 0.9; }
    .content { padding: 15px 20px; }
    .section { margin-bottom: 12px; }
    .section-title { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 12px; margin-bottom: 8px; border-left: 3px solid #d52b36; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item { padding: 4px 0; }
    .info-label { font-weight: bold; color: #666; font-size: 10px; }
    .info-value { color: #333; font-size: 11px; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 3px 10px; background: #28a745; color: white; border-radius: 10px; font-size: 9px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #d52b36; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
    .total-section { background: #f8f8f8; padding: 12px; margin-top: 12px; border-radius: 3px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
    .total-row.final { font-size: 14px; font-weight: bold; color: #d52b36; border-top: 2px solid #d52b36; padding-top: 8px; margin-top: 6px; }
    .footer { text-align: center; padding: 10px; font-size: 9px; color: #666; border-top: 1px solid #ddd; margin-top: 15px; }
    .terms { background: #f9f9f9; padding: 10px; margin-top: 10px; font-size: 9px; border-left: 3px solid #d52b36; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />` : ''}
    <div class="header-text">
      <h1>ARS ASSURANCE</h1>
      <p>Contrat d'Assurance Automobile</p>
    </div>
    <div style="width: 40px;"></div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du Contrat</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">N° Contrat</div>
          <div class="info-value">${contract.contractNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Statut</div>
          <div class="info-value"><span class="status-badge">${contract.status}</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">Date Début</div>
          <div class="info-value">${formatDate(contract.startDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date Fin</div>
          <div class="info-value">${formatDate(contract.endDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Devis Associé</div>
          <div class="info-value">${contract.quote.quoteNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Compagnie</div>
          <div class="info-value">${contract.quote.company.name}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Assuré</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nom Complet</div>
          <div class="info-value">${contract.user.firstName} ${contract.user.lastName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${contract.user.email}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Véhicule Assuré</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Immatriculation</div>
          <div class="info-value">${contract.quote.simulation?.vehicle?.registration || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">CV / Places</div>
          <div class="info-value">${contract.quote.simulation?.vehicle?.fiscalHorsepower || 'N/A'} CV / ${contract.quote.simulation?.vehicle?.numberOfSeats || 'N/A'} places</div>
        </div>
        <div class="info-item">
          <div class="info-label">1ère Circulation</div>
          <div class="info-value">${contract.quote.simulation?.vehicle?.firstCirculationDate ? formatDate(contract.quote.simulation.vehicle.firstCirculationDate) : 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Valeur Neuf / Vénale</div>
          <div class="info-value">${contract.quote.simulation?.vehicle?.newValue ? formatCurrency(contract.quote.simulation.vehicle.newValue) : 'N/A'} / ${contract.quote.simulation?.vehicle?.marketValue ? formatCurrency(contract.quote.simulation.vehicle.marketValue) : 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Garanties Souscrites</div>
      <table>
        <thead>
          <tr>
            <th>Garantie</th>
            <th>Capital Assuré</th>
            <th>Prime (DT)</th>
          </tr>
        </thead>
        <tbody>
          ${contract.quote.items.map((item: any) => `
            <tr>
              <td>${item.guarantee.nameFr}</td>
              <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
              <td>${formatCurrency(item.prime)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div class="total-row">
        <span>Prime Nette</span>
        <span>${formatCurrency(contract.quote.primeNette)}</span>
      </div>
      <div class="total-row">
        <span>Frais</span>
        <span>${formatCurrency(contract.quote.frais)}</span>
      </div>
      <div class="total-row">
        <span>Taxes</span>
        <span>${formatCurrency(contract.quote.taxes)}</span>
      </div>
      <div class="total-row">
        <span>F.P.A.C</span>
        <span>${formatCurrency(contract.quote.fpac)}</span>
      </div>
      <div class="total-row">
        <span>F.S.S.R</span>
        <span>${formatCurrency(contract.quote.fssr)}</span>
      </div>
      <div class="total-row">
        <span>F.G</span>
        <span>${formatCurrency(contract.quote.fg)}</span>
      </div>
      ${contract.deliveryFee > 0 ? `
      <div class="total-row">
        <span>Frais de Livraison</span>
        <span>${formatCurrency(contract.deliveryFee)}</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>TOTAL PAYÉ</span>
        <span>${formatCurrency(Number(contract.quote.totalAPayer) + Number(contract.deliveryFee))}</span>
      </div>
    </div>

    <div class="terms">
      <strong>Conditions:</strong> Contrat valable 1 an renouvelable • Déclaration sinistre sous 5 jours • Paiement avant prise d'effet • Modification à notifier sous 15 jours
    </div>
  </div>

  <div class="footer">
    <p>Document officiel - Contrat d'assurance • ARS Assurance - Courtier Agréé • Émis le ${formatDate(contract.createdAt)}</p>
  </div>
</body>
</html>
    `;
  }
}
