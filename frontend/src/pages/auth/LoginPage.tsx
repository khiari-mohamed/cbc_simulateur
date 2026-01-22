import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { AuthLayout } from './AuthLayout';
import { Lock, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data.email, data.password);
      
      if (result.requiresOtp && result.userId) {
        setUserId(result.userId);
        setShowOtp(true);
        toast.success('Code OTP envoyé à votre email');
      } else {
        toast.success('Connexion réussie');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      await verifyOtp(userId, otp);
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Code OTP invalide');
    } finally {
      setOtpLoading(false);
    }
  };

  if (showOtp) {
    return (
      <AuthLayout title="Vérification OTP" subtitle="Entrez le code envoyé à votre email">
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="relative">
            <Shield className="absolute left-2.5 top-6 w-4 h-4 text-gray-400" />
            <Input
              label="Code OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="pl-8 text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          <Button type="submit" loading={otpLoading} className="w-full" size="md">
            Vérifier
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowOtp(false)} 
            className="w-full"
          >
            Retour
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace client">
      <div>

        <GoogleButton />

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Ou continuer avec</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
            <div className="relative">
              <Mail className="absolute left-2.5 top-6 w-4 h-4 text-gray-400" />
              <Input
                label="Adresse email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="votre@email.com"
                className="pl-8"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-2.5 top-6 w-4 h-4 text-gray-400" />
              <Input
                label="Mot de passe"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="••••••••"
                className="pl-8"
              />
              <div className="text-right mt-0.5">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">
                  Mot de passe oublié?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="md">
              Se connecter
            </Button>
        </form>

        <div className="mt-2.5 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pas encore de compte?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
