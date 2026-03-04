import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { AuthLayout } from './AuthLayout';
import {  ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api/client';


const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Prénom minimum 2 caractères'),
  lastName: z.string().min(2, 'Nom minimum 2 caractères'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Format de téléphone invalide').optional().or(z.literal('')),
  organizationCode: z.string().optional().or(z.literal('')),
  organizationJoinKey: z.string().optional().or(z.literal('')),
  role: z.enum(['CLIENT_ADHERENT', 'ADMINISTRATEUR_ARS', 'GESTIONNAIRE_VALIDATION_ARS']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.organizationCode && !data.organizationJoinKey) return false;
  if (!data.organizationCode && data.organizationJoinKey) return false;
  return true;
}, {
  message: 'Code et clé d\'accès organisation requis ensemble',
  path: ['organizationJoinKey'],
});

const roleOptions = [
  { value: 'CLIENT_ADHERENT', label: 'Client / Adhérent' },
  { value: 'ADMINISTRATEUR_ARS', label: 'Administrateur ARS' },
  { value: 'GESTIONNAIRE_VALIDATION_ARS', label: 'Gestionnaire de Validation ARS' },
];

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post('/auth/register', registerData);
      setUserId(response.data.id);
      setEmail(data.email);
      setStep('verify');
      toast.success('Compte créé! Vérifiez votre email pour le code OTP.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Code OTP invalide (6 chiffres requis)');
      return;
    }
    
    setVerifying(true);
    try {
      await api.post('/auth/verify-otp', { userId, otp });
      toast.success('Compte vérifié avec succès!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      toast.error('Code OTP invalide ou expiré');
    } finally {
      setVerifying(false);
    }
  };

  if (step === 'verify') {
    return (
      <AuthLayout title="Vérification OTP" subtitle="Entrez le code reçu par email">
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-3">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Un code de vérification a été envoyé à<br />
              <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="Code OTP (6 chiffres)"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />

            <Button type="submit" loading={verifying} className="w-full">
              Vérifier le code
            </Button>

            <button
              type="button"
              onClick={() => setStep('register')}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
            >
              Retour à l'inscription
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez ARS Assurance">
      <div>
        <Link to="/login" className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-2">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Retour à la connexion
        </Link>

        <GoogleButton />

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Ou avec votre email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Prénom"
              type="text"
              {...register('firstName')}
              error={errors.firstName?.message}
              placeholder="Jean"
            />
            <Input
              label="Nom"
              type="text"
              {...register('lastName')}
              error={errors.lastName?.message}
              placeholder="Dupont"
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="jean.dupont@email.com"
          />

          <Input
            label="Téléphone (optionnel)"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+212600000000"
          />

          <Select
            label="Rôle"
            {...register('role')}
            error={errors.role?.message}
            options={roleOptions}
          />

          {selectedRole === 'CLIENT_ADHERENT' && (
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🔐 Accès Organisation (optionnel)
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Si vous appartenez à une organisation (ATB Bank, etc.), entrez le code et la clé d'accès fournis par votre organisation.
              </p>
              <Input
                label="Code Organisation"
                type="text"
                {...register('organizationCode')}
                error={errors.organizationCode?.message}
                placeholder="Ex: ATB"
              />
              <Input
                label="Clé d'accès Organisation"
                type="password"
                autoComplete="new-password"
                {...register('organizationJoinKey')}
                error={errors.organizationJoinKey?.message}
                placeholder="Ex: Alpha-Bravo-12345678"
              />
            </div>
          )}

          <Input
            label="Mot de passe"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="••••••••"
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="••••••••"
          />

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="md">
            S'inscrire
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2.5">
          Déjà un compte?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
