import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP doit contenir 6 chiffres'),
  newPassword: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [userId, setUserId] = useState('');
  const { forgotPassword, resetPassword } = useAuth();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      const result = await forgotPassword(data.email);
      setUserId(result.userId);
      setStep('otp');
      toast.success('Code OTP envoyé à votre email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    try {
      await resetPassword(userId, data.otp, data.newPassword);
      setStep('success');
      toast.success('Mot de passe réinitialisé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Code OTP invalide');
    }
  };

  if (step === 'success') {
    return (
      <AuthLayout title="Réinitialisation réussie" subtitle="Votre mot de passe a été modifié">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-3">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mot de passe réinitialisé!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Vous pouvez maintenant vous connecter</p>
          <Link to="/login">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Nouveau mot de passe" subtitle="Entrez le code OTP reçu par email">
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
          <Input
            label="Code OTP"
            type="text"
            {...otpForm.register('otp')}
            error={otpForm.formState.errors.otp?.message}
            placeholder="123456"
            maxLength={6}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            {...otpForm.register('newPassword')}
            error={otpForm.formState.errors.newPassword?.message}
            placeholder="••••••••"
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            {...otpForm.register('confirmPassword')}
            error={otpForm.formState.errors.confirmPassword?.message}
            placeholder="••••••••"
          />
          <Button type="submit" loading={otpForm.formState.isSubmitting} className="w-full">
            Réinitialiser
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Entrez votre email pour recevoir un code OTP">
      <div>
        <Link to="/login" className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-4">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Retour à la connexion
        </Link>

        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            {...emailForm.register('email')}
            error={emailForm.formState.errors.email?.message}
            placeholder="jean.dupont@email.com"
          />
          <Button type="submit" loading={emailForm.formState.isSubmitting} className="w-full">
            Envoyer le code OTP
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};
