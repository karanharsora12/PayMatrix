import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 chars'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: 'admin@paymatrix.com', password: 'Password123!' } });

  const onSubmit = async (v: FormValues) => {
    setLoading(true);
    try {
      await login(v.email, v.password);
      toast.success('Login successful');
      nav('/');
    } catch (e: any) {
      const msg = e?.normalizedError?.message ?? e?.response?.data?.error?.message ?? 'Login failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">PM</div>
          <CardTitle className="text-xl">PayMatrix Login</CardTitle>
          <p className="text-sm text-muted-foreground">Payroll & HR Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input {...register('email')} placeholder="admin@paymatrix.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" {...register('password')} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
            <p className="text-xs text-center text-muted-foreground">Demo: admin@paymatrix.com / Password123!</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
