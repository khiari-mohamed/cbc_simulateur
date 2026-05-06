import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export enum NotificationType {
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  QUOTE_CREATED = 'QUOTE_CREATED',
  QUOTE_SUBMITTED = 'QUOTE_SUBMITTED',
  QUOTE_VALIDATED = 'QUOTE_VALIDATED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  DOCUMENT_REQUESTED = 'DOCUMENT_REQUESTED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  RENEWAL_REMINDER = 'RENEWAL_REMINDER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

@Injectable()
export class NotificationsService {
  private transporter;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const smtpPort = parseInt(this.config.get('SMTP_PORT') || '25');
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: smtpPort,
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendQuoteCreated(to: string, quoteNumber: string, clientName: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Devis créé - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #003366; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ARS Assurance</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${clientName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Votre devis d'assurance automobile <strong>${quoteNumber}</strong> a été créé avec succès.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Vous pouvez le consulter, le télécharger en PDF et le soumettre pour validation depuis votre espace client.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/quotes" 
                 style="background: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir mon devis
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Cordialement,<br>
              L'équipe ARS Assurance
            </p>
          </div>
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>ARS Assurance - Courtier en Assurances</p>
          </div>
        </div>
      `,
    });
  }

  async sendQuoteSubmitted(adminEmail: string, quoteNumber: string, clientName: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: adminEmail,
      subject: `Nouveau devis soumis - ${quoteNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #003366; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ARS Assurance - Admin</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Nouveau devis à valider</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Le client <strong>${clientName}</strong> a soumis le devis <strong>${quoteNumber}</strong> pour validation.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Veuillez vérifier les informations et demander les pièces justificatives nécessaires.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('APP_URL')}/admin/quotes" 
                 style="background: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accéder au tableau de bord
              </a>
            </div>
          </div>
        </div>
      `,
    });
  }

  async sendQuoteValidated(to: string, quoteNumber: string, clientName: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: `"ARS Tunisia" <${this.config.get('SMTP_FROM')}>`,
      to,
      subject: 'Devis validé - ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Votre devis d'assurance automobile a été validé.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Vous pouvez maintenant procéder à l'achat de votre contrat directement depuis votre espace ARS.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Notre équipe reste à votre disposition pour tout accompagnement.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/quotes" 
                 style="background: #28a745; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Voir mon devis
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });
  }

  async sendQuoteModified(to: string, quoteNumber: string, clientName: string, modificationNote: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Devis modifié et validé - ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour ${clientName},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Suite à l'étude de votre demande, votre devis <strong>${quoteNumber}</strong> a été mis à jour et validé.
            </p>
            ${modificationNote ? `<div style="background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;"><p style="font-size: 16px; line-height: 1.6; color: #004399; margin: 0;"><strong>Note de notre équipe:</strong></p><p style="font-size: 15px; line-height: 1.6; color: #004399; margin: 8px 0 0 0;">${modificationNote}</p></div>` : ''}
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 20px;">
              Vous pouvez désormais procéder à l'achat de votre contrat directement depuis votre espace ARS.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Nous restons à votre disposition pour toute précision.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/quotes" 
                 style="background: #003366; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Voir mon devis
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });
  }

  async sendQuoteRejected(to: string, quoteNumber: string, clientName: string, reason?: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Devis refusé, modifié - ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Suite à l'étude de votre demande, votre devis a été mis à jour avec nos commentaires.
            </p>
            ${reason ? `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;"><p style="font-size: 16px; line-height: 1.6; color: #856404; margin: 0;"><strong>Commentaire:</strong> ${reason}</p></div>` : ''}
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Vous pouvez désormais procéder à l'achat via votre espace.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Nous restons à votre disposition pour toute précision.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/quotes" 
                 style="background: #003366; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Voir mon devis
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });
  }

  async sendContractCreated(to: string, contractNumber: string, clientName: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Transformation du devis en contrat - ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Votre devis a été transformé avec succès en contrat d'assurance et votre couverture est désormais active.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Les documents contractuels vous seront transmis selon le mode choisi lors du paiement.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Merci pour votre confiance.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/contracts" 
                 style="background: #28a745; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Voir mon contrat
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });
  }

  async sendDocumentRequest(to: string, quoteNumber: string, clientName: string, documents: string[]) {
    const docList = documents.map(doc => `<li>${doc}</li>`).join('');
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Documents requis - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: #333; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Documents Requis</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${clientName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Pour finaliser la validation de votre devis <strong>${quoteNumber}</strong>, nous avons besoin des documents suivants :
            </p>
            <ul style="font-size: 16px; line-height: 2; margin: 20px 0;">
              ${docList}
            </ul>
            <p style="font-size: 16px; line-height: 1.6;">
              Veuillez les télécharger depuis votre espace client dans les meilleurs délais.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/quotes/${quoteNumber}" 
                 style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Télécharger les documents
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Cordialement,<br>
              L'équipe ARS Assurance
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendOTP(to: string, otp: string) {
    console.log('🔐 OTP for', to, ':', otp);
    
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    try {
      const mailOptions = {
        from: this.config.get('SMTP_FROM'),
        to,
        subject: 'Code OTP - ARS Tunisia',
        text: `Votre code de vérification OTP est: ${otp}\n\nCe code expire dans 10 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez cet email.\n\nARS Tunisia - Courtier en Assurances`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #003366; padding: 30px; text-align: center;">
              <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
            </div>
            <div style="padding: 40px 30px; background: #f9f9f9;">
              <h2 style="color: #003366; margin-bottom: 20px;">Code de vérification</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Veuillez saisir le code de validation (OTP) suivant dans l'application afin d'accéder à votre espace personnel et initier vos demandes de devis en toute simplicité.
              </p>
              <div style="background: #ffffff; border: 2px solid #003366; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #003366; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              <p style="font-size: 14px; color: #666; text-align: center;">
                Ce code expire dans 10 minutes.
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
              </p>
            </div>
            <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
              <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
            </div>
          </div>
        `,
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP Email sent successfully:', info.messageId);
      console.log('📧 Accepted:', info.accepted);
      console.log('❌ Rejected:', info.rejected);
    } catch (error: any) {
      console.error('❌ OTP Email failed:', error.message);
      console.error('Full error:', error);
      console.log('🔑 For development, use this OTP:', otp);
      throw error;
    }
  }

  // In-app notification methods
  async createNotification(
    userId: string,
    type: NotificationType,
    subject: string,
    content: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        subject,
        content,
        channel: 'EMAIL' as const,
        status: 'PENDING' as const,
      },
    });
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const where = {
      userId,
      ...(unreadOnly && { status: 'PENDING' as const }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, status: 'PENDING' as const },
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { status: 'SENT' as const },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, status: 'PENDING' as const },
      data: { status: 'SENT' as const },
    });
    return { success: true };
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.prisma.notification.delete({
      where: { id: notificationId, userId },
    });
    return { success: true };
  }

  async bulkDeleteNotifications(notificationIds: string[], userId: string) {
    await this.prisma.notification.deleteMany({
      where: { id: { in: notificationIds }, userId },
    });
    return { success: true };
  }

  // Enhanced notification methods that create both email and in-app notifications
  async notifyQuoteCreated(user: any, quoteNumber: string) {
    // Send email
    await this.sendQuoteCreated(user.email, quoteNumber, `${user.firstName} ${user.lastName}`);
    
    // Create in-app notification
    await this.createNotification(
      user.id,
      NotificationType.QUOTE_CREATED,
      'Devis créé',
      `Votre devis ${quoteNumber} a été créé avec succès.`,
    );
  }

  async notifyQuoteValidated(user: any, quoteNumber: string) {
    // Send email
    await this.sendQuoteValidated(user.email, quoteNumber, `${user.firstName} ${user.lastName}`);
    
    // Create in-app notification
    await this.createNotification(
      user.id,
      NotificationType.QUOTE_VALIDATED,
      'Devis validé',
      `Votre devis ${quoteNumber} a été validé par notre équipe.`,
    );
  }

  async notifyQuoteRejected(user: any, quoteNumber: string, reason?: string) {
    // Send email
    await this.sendQuoteRejected(user.email, quoteNumber, `${user.firstName} ${user.lastName}`, reason);
    
    // Create in-app notification
    await this.createNotification(
      user.id,
      NotificationType.QUOTE_REJECTED,
      'Devis refusé',
      `Votre devis ${quoteNumber} n'a pas pu être validé.${reason ? ` Raison: ${reason}` : ''}`,
    );
  }

  async notifyQuoteModified(user: any, quoteNumber: string, note: string) {
    // Create in-app notification FIRST (most important)
    await this.createNotification(
      user.id,
      NotificationType.QUOTE_VALIDATED,
      'Devis modifié et validé',
      `Votre devis ${quoteNumber} a été modifié et validé. Consultez la note pour plus de détails.`,
    );
    
    // Try to send email (non-blocking)
    try {
      await this.sendQuoteModified(user.email, quoteNumber, `${user.firstName} ${user.lastName}`, note);
    } catch (err: any) {
      console.error('Failed to send email notification:', err.message);
    }
  }

  async notifyContractCreated(user: any, contractNumber: string) {
    // Send email
    await this.sendContractCreated(user.email, contractNumber, `${user.firstName} ${user.lastName}`);
    
    // Create in-app notification
    await this.createNotification(
      user.id,
      NotificationType.CONTRACT_CREATED,
      'Contrat créé',
      `Votre contrat ${contractNumber} a été créé avec succès.`,
    );
  }

  async notifyDocumentRequest(user: any, quoteNumber: string, documents: string[]) {
    // Send email
    await this.sendDocumentRequest(user.email, quoteNumber, `${user.firstName} ${user.lastName}`, documents);
    
    // Create in-app notification
    await this.createNotification(
      user.id,
      NotificationType.DOCUMENT_REQUESTED,
      'Documents requis',
      `Des documents sont requis pour votre devis ${quoteNumber}.`,
    );
  }

  // Additional notification methods for complete coverage
  async notifyAccountCreated(user: any) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Création de votre compte – Application ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Votre compte a été créé avec succès sur l'application ARS de tarification en ligne.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Vous pouvez maintenant accéder à votre espace personnel et initier vos demandes de devis en toute simplicité.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/dashboard" 
                 style="background: #003366; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Accéder à mon espace
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.ACCOUNT_CREATED,
      'Compte créé',
      'Bienvenue chez ARS ! Votre compte a été créé avec succès.',
    );
  }

  async notifyQuoteSubmitted(user: any, quoteNumber: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Devis soumis – En cours de validation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Bonjour,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Nous accusons réception de votre devis soumis via l'application ARS.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Votre demande est actuellement en cours de validation par nos équipes.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Vous serez notifié(e) dès qu'une décision sera prise.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.QUOTE_SUBMITTED,
      'Devis soumis',
      `Votre devis ${quoteNumber} a été soumis pour validation.`,
    );
  }

  async notifyDocumentUploaded(adminUsers: any[], clientName: string, quoteNumber: string) {
    for (const admin of adminUsers) {
      await this.createNotification(
        admin.id,
        NotificationType.DOCUMENT_UPLOADED,
        'Nouveau document',
        `${clientName} a téléchargé des documents pour le devis ${quoteNumber}.`,
      );
    }
  }

  async notifyDocumentRejected(user: any, quoteNumber: string, reason: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Document refusé - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Document Refusé</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${user.firstName} ${user.lastName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Un document pour votre devis <strong>${quoteNumber}</strong> a été refusé.
            </p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Raison:</strong> ${reason}</p>
            <p style="font-size: 16px; line-height: 1.6;">
              Veuillez télécharger un nouveau document depuis votre espace client.
            </p>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.DOCUMENT_REJECTED,
      'Document refusé',
      `Un document pour votre devis ${quoteNumber} a été refusé. Raison: ${reason}`,
    );
  }

  async notifyPaymentRequired(user: any, contractNumber: string, amount: number) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Paiement requis - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: #333; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">💳 Paiement Requis</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${user.firstName} ${user.lastName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Votre contrat <strong>${contractNumber}</strong> est prêt. Le montant à payer est de <strong>${amount.toLocaleString()} DT</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/contracts/${contractNumber}/payment" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Procéder au paiement
              </a>
            </div>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.PAYMENT_REQUIRED,
      'Paiement requis',
      `Votre contrat ${contractNumber} est prêt. Montant: ${amount.toLocaleString()} DT`,
    );
  }

  async notifyPaymentConfirmed(user: any, contractNumber: string, amount: number) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Paiement confirmé - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">✅ Paiement Confirmé</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${user.firstName} ${user.lastName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Votre paiement de <strong>${amount.toLocaleString()} DT</strong> pour le contrat <strong>${contractNumber}</strong> a été confirmé.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Votre police d'assurance est maintenant active.
            </p>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.PAYMENT_CONFIRMED,
      'Paiement confirmé',
      `Paiement de ${amount.toLocaleString()} DT confirmé pour le contrat ${contractNumber}.`,
    );
  }

  async notifyPaymentFailed(user: any, contractNumber: string, reason: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Échec du paiement - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">❌ Échec du Paiement</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${user.firstName} ${user.lastName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Le paiement pour votre contrat <strong>${contractNumber}</strong> a échoué.
            </p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Raison:</strong> ${reason}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.get('FRONTEND_URL')}/contracts/${contractNumber}/payment" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Réessayer le paiement
              </a>
            </div>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.PAYMENT_FAILED,
      'Échec du paiement',
      `Le paiement pour le contrat ${contractNumber} a échoué. Raison: ${reason}`,
    );
  }

  async notifyRenewalReminder(user: any, contractNumber: string, expiryDate: Date) {
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: user.email,
      subject: 'Rappel de renouvellement - ARS Assurance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: #333; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🔔 Rappel de Renouvellement</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #003366;">Bonjour ${user.firstName} ${user.lastName},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Votre contrat <strong>${contractNumber}</strong> expire dans <strong>${daysUntilExpiry} jours</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Contactez-nous pour renouveler votre assurance automobile.
            </p>
          </div>
        </div>
      `,
    });

    await this.createNotification(
      user.id,
      NotificationType.RENEWAL_REMINDER,
      'Rappel de renouvellement',
      `Votre contrat ${contractNumber} expire dans ${daysUntilExpiry} jours.`,
    );
  }

  async notifySystemAnnouncement(users: any[], title: string, message: string) {
    for (const user of users) {
      await this.createNotification(
        user.id,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
      );
    }
  }

  // Admin notification for new quote submission
  async notifyAdminNewQuote(adminUsers: any[], clientName: string, quoteNumber: string) {
    for (const admin of adminUsers) {
      await this.createNotification(
        admin.id,
        NotificationType.QUOTE_SUBMITTED,
        'Nouveau devis à valider',
        `${clientName} a soumis le devis ${quoteNumber} pour validation.`,
      );
    }
  }

  // Payment refund notification
  async notifyPaymentRefunded(email: string, transactionId: string, amount: number, reason: string) {
    const logoUrl = `${this.config.get('FRONTEND_URL')}/Image1.png`;
    
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: email,
      subject: 'Remboursement de paiement - ARS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #003366; padding: 30px; text-align: center;">
            <img src="${logoUrl}" alt="ARS Tunisia" style="max-width: 180px; height: auto;" />
          </div>
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #003366; margin-bottom: 20px;">Remboursement effectué</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Votre paiement a été remboursé suite à la raison suivante:
            </p>
            <div style="background: #fce4ec; border-left: 4px solid #c2185b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #880e4f;"><strong>${reason}</strong></p>
            </div>
            <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #0d47a1;"><strong>Montant remboursé:</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1565c0;">${amount.toFixed(3)} DT</p>
              <p style="margin: 15px 0 0 0; color: #0d47a1;"><strong>Référence:</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #1565c0;">${transactionId}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Le remboursement sera visible sur votre compte bancaire dans 3-5 jours ouvrables.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Si vous avez des questions, contactez-nous sans hésiter.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Cordialement,<br>
              L'équipe ARS
            </p>
          </div>
          <div style="background: #003366; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ARS Tunisia - Courtier en Assurances</p>
            <p style="margin: 5px 0 0 0;">© 2026 Tous droits réservés</p>
          </div>
        </div>
      `,
    });
  }
}
