import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth() as any;

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh);
      
      // Fetch user data
      import('../../lib/api/client').then(({ default: api }) => {
        api.get('/auth/me')
          .then(({ data }) => {
            setUser(data);
            toast.success('Connexion Google réussie');
            navigate('/dashboard');
          })
          .catch(() => {
            toast.error('Erreur de connexion');
            navigate('/login');
          });
      });
    } else {
      toast.error('Erreur de connexion Google');
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
};
