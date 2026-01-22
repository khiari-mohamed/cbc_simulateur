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
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
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

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; }
    .header { background: #003366; color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { background: #f0f0f0; padding: 10px 15px; font-weight: bold; font-size: 16px; margin-bottom: 15px; border-left: 4px solid #003366; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 8px 0; }
    .info-label { font-weight: bold; color: #666; font-size: 13px; }
    .info-value { color: #333; font-size: 14px; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #003366; color: white; padding: 12px; text-align: left; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
    tr:hover { background: #f9f9f9; }
    .total-section { background: #f8f8f8; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.final { font-size: 18px; font-weight: bold; color: #003366; border-top: 2px solid #003366; padding-top: 15px; margin-top: 10px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ARS ASSURANCE</h1>
    <p>Devis d'Assurance Automobile</p>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du Devis</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Numéro de Devis</div>
          <div class="info-value">${quote.quoteNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date d'émission</div>
          <div class="info-value">${formatDate(quote.createdAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Compagnie</div>
          <div class="info-value">${quote.company.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Statut</div>
          <div class="info-value">${quote.status}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informations Client</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nom</div>
          <div class="info-value">${quote.user.firstName} ${quote.user.lastName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${quote.user.email}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informations Véhicule</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Immatriculation</div>
          <div class="info-value">${quote.simulation.vehicle.registration || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Puissance Fiscale</div>
          <div class="info-value">${quote.simulation.vehicle.fiscalHorsepower} CV</div>
        </div>
        <div class="info-item">
          <div class="info-label">Nombre de Places</div>
          <div class="info-value">${quote.simulation.vehicle.numberOfSeats}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date 1ère Circulation</div>
          <div class="info-value">${formatDate(quote.simulation.vehicle.firstCirculationDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Valeur à Neuf</div>
          <div class="info-value">${formatCurrency(quote.simulation.vehicle.newValue)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Valeur Vénale</div>
          <div class="info-value">${formatCurrency(quote.simulation.vehicle.marketValue)}</div>
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
    <p>Ce devis est valable 30 jours à compter de sa date d'émission.</p>
    <p>ARS Assurance - Courtier en Assurances</p>
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

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; }
    .header { background: #003366; color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { background: #f0f0f0; padding: 10px 15px; font-weight: bold; font-size: 16px; margin-bottom: 15px; border-left: 4px solid #003366; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 8px 0; }
    .info-label { font-weight: bold; color: #666; font-size: 13px; }
    .info-value { color: #333; font-size: 14px; margin-top: 3px; }
    .status-badge { display: inline-block; padding: 5px 15px; background: #28a745; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #003366; color: white; padding: 12px; text-align: left; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
    .total-section { background: #f8f8f8; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.final { font-size: 18px; font-weight: bold; color: #003366; border-top: 2px solid #003366; padding-top: 15px; margin-top: 10px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 30px; }
    .terms { background: #f9f9f9; padding: 15px; margin-top: 20px; font-size: 11px; border-left: 3px solid #003366; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ARS ASSURANCE</h1>
    <p>Contrat d'Assurance Automobile</p>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du Contrat</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Numéro de Contrat</div>
          <div class="info-value">${contract.contractNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Statut</div>
          <div class="info-value"><span class="status-badge">${contract.status}</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">Date de Début</div>
          <div class="info-value">${formatDate(contract.startDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date de Fin</div>
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
      <div class="section-title">Garanties du Contrat</div>
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
      <div class="total-row final">
        <span>TOTAL ANNUEL</span>
        <span>${formatCurrency(contract.quote.totalAPayer)}</span>
      </div>
    </div>

    <div class="terms">
      <strong>Conditions Générales:</strong><br>
      - Le contrat est valable pour une durée d'un an renouvelable.<br>
      - L'assuré s'engage à déclarer tout sinistre dans les 5 jours ouvrables.<br>
      - Le paiement de la prime doit être effectué avant la prise d'effet du contrat.<br>
      - Toute modification doit être notifiée à la compagnie dans les 15 jours.
    </div>
  </div>

  <div class="footer">
    <p><strong>Document officiel - Contrat d'assurance</strong></p>
    <p>ARS Assurance - Courtier en Assurances Agréé</p>
    <p>Date d'émission: ${formatDate(contract.createdAt)}</p>
  </div>
</body>
</html>
    `;
  }
}
