import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';
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
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mot de passe réinitialisé!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
          </div>
          <Link to="/login">
            <Button className="w-full !py-2.5">Se connecter</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Nouveau mot de passe" subtitle="Entrez le code OTP reçu par email">
        <div className="space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl mb-3">
              <KeyRound className="w-7 h-7 text-primary-600" />
            </div>
          </div>

          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <Input
              label="Code OTP"
              type="text"
              {...otpForm.register('otp')}
              error={otpForm.formState.errors.otp?.message}
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-[0.4em] font-mono"
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
            <Button type="submit" loading={otpForm.formState.isSubmitting} className="w-full !py-2.5">
              Réinitialiser
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Entrez votre email pour recevoir un code de réinitialisation">
      <div className="space-y-5">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl mb-3">
            <Mail className="w-7 h-7 text-primary-600" />
          </div>
        </div>

        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            {...emailForm.register('email')}
            error={emailForm.formState.errors.email?.message}
            placeholder="jean.dupont@email.com"
          />
          <Button type="submit" loading={emailForm.formState.isSubmitting} className="w-full !py-2.5">
            Envoyer le code OTP
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};
