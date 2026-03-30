import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { AuthLayout } from './AuthLayout';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace de courtage">
      <div className="space-y-5">
        <GoogleButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white dark:bg-gray-950 text-xs text-gray-400 uppercase tracking-wider">
              Ou continuer avec
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-[34px] w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              label="Adresse email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="votre@email.com"
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-[34px] w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              label="Mot de passe"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
              className="pl-9"
            />
            <div className="text-right mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Mot de passe oublié?
              </Link>
            </div>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full !py-2.5" size="md">
            Se connecter
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Pas encore de compte?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
