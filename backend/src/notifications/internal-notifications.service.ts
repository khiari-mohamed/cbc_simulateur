import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export enum InternalNotificationType {
  // Admin to Gestionnaire
  QUOTE_NEEDS_VALIDATION = 'QUOTE_NEEDS_VALIDATION',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CLIENT_QUERY = 'CLIENT_QUERY',
  
  // Gestionnaire to Admin
  QUOTE_VALIDATED = 'QUOTE_VALIDATED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  
  // System to All
  URGENT_REVIEW = 'URGENT_REVIEW',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

@Injectable()
export class InternalNotificationsService {
  constructor(private prisma: PrismaService) {}

  // Send notification to specific role
  async notifyRole(
    targetRole: Role,
    type: InternalNotificationType,
    subject: string,
    content: string,
    metadata?: any
  ) {
    const users = await this.prisma.user.findMany({
      where: { role: targetRole, isActive: true },
    });

    const notifications = users.map(user => ({
      userId: user.id,
      type,
      subject,
      content,
      channel: 'EMAIL' as const,
      status: 'PENDING' as const,
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    return { notified: users.length };
  }

  // Send notification to specific user
  async notifyUser(
    userId: string,
    type: InternalNotificationType,
    subject: string,
    content: string
  ) {
    await this.prisma.notification.create({
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

  // Quote workflow notifications
  async notifyQuoteSubmitted(quoteId: string, clientName: string, quoteNumber: string) {
    await this.notifyRole(
      Role.GESTIONNAIRE_VALIDATION_ARS,
      InternalNotificationType.QUOTE_NEEDS_VALIDATION,
      'Nouveau devis à valider',
      `${clientName} a soumis le devis ${quoteNumber} pour validation.`
    );
  }

  async notifyQuoteValidated(adminUserId: string, quoteNumber: string, validatorName: string) {
    await this.notifyUser(
      adminUserId,
      InternalNotificationType.QUOTE_VALIDATED,
      'Devis validé',
      `Le devis ${quoteNumber} a été validé par ${validatorName}.`
    );
  }

  async notifyQuoteRejected(adminUserId: string, quoteNumber: string, validatorName: string, reason: string) {
    await this.notifyUser(
      adminUserId,
      InternalNotificationType.QUOTE_REJECTED,
      'Devis rejeté',
      `Le devis ${quoteNumber} a été rejeté par ${validatorName}. Raison: ${reason}`
    );
  }

  // Document workflow notifications
  async notifyDocumentUploaded(quoteNumber: string, clientName: string, documentType: string) {
    await this.notifyRole(
      Role.GESTIONNAIRE_VALIDATION_ARS,
      InternalNotificationType.DOCUMENT_UPLOADED,
      'Nouveau document téléchargé',
      `${clientName} a téléchargé un document (${documentType}) pour le devis ${quoteNumber}.`
    );
  }

  async notifyDocumentRejected(adminUserId: string, quoteNumber: string, documentType: string, reason: string) {
    await this.notifyUser(
      adminUserId,
      InternalNotificationType.DOCUMENT_REJECTED,
      'Document rejeté',
      `Document ${documentType} rejeté pour le devis ${quoteNumber}. Raison: ${reason}`
    );
  }

  // Urgent notifications
  async notifyUrgentReview(quoteNumber: string, reason: string) {
    await this.notifyRole(
      Role.ADMINISTRATEUR_ARS,
      InternalNotificationType.URGENT_REVIEW,
      'Révision urgente requise',
      `Le devis ${quoteNumber} nécessite une révision urgente. ${reason}`
    );
  }

  async notifyDeadlineApproaching(quoteNumber: string, daysLeft: number) {
    await this.notifyRole(
      Role.GESTIONNAIRE_VALIDATION_ARS,
      InternalNotificationType.DEADLINE_APPROACHING,
      'Échéance approche',
      `Le devis ${quoteNumber} doit être traité dans ${daysLeft} jour(s).`
    );
  }

  // System alerts
  async notifySystemAlert(message: string, targetRole?: Role) {
    if (targetRole) {
      await this.notifyRole(
        targetRole,
        InternalNotificationType.SYSTEM_ALERT,
        'Alerte système',
        message
      );
    } else {
      // Notify all roles
      const roles = [Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS];
      for (const role of roles) {
        await this.notifyRole(role, InternalNotificationType.SYSTEM_ALERT, 'Alerte système', message);
      }
    }
  }

  // Get role-specific notifications
  async getRoleNotifications(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new Error('User not found');

    const internalTypes = Object.values(InternalNotificationType);
    
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
          type: { in: internalTypes },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          type: { in: internalTypes },
        },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get unread internal notifications count
  async getUnreadInternalCount(userId: string): Promise<{ count: number }> {
    const internalTypes = Object.values(InternalNotificationType);
    
    const count = await this.prisma.notification.count({
      where: {
        userId,
        type: { in: internalTypes },
        status: 'PENDING',
      },
    });

    return { count };
  }
}