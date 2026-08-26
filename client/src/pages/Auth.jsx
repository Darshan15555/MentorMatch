import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ConstellationLogo } from '../components/Shared.jsx';
import { Card, Field, Input, Select, Button } from '../components/UI.jsx';
import { DnaLoader } from '../components/Motion.jsx';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'mentee' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await register(form);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-[6vh] max-w-[420px] px-4 sm:mt-[8vh]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-[18px] flex justify-center"><ConstellationLogo /></div>
        <h1 className="text-3xl">{isLogin ? 'Tune back in' : 'Find your frequency'}</h1>
        <p>{isLogin
          ? 'Log in to reconnect with your mentors and mentees.'
          : 'A platform where juniors and seniors connect on overlapping skills — not cold DMs.'}</p>
      </div>

      <Card>
        {busy ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <DnaLoader />
            <p className="text-sm">Assembling your profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <Field label="Full name">
                  <Input value={form.name} onChange={update('name')} placeholder="Ada Lovelace" required />
                </Field>
                <Field label="I am joining as a...">
                  <Select value={form.role} onChange={update('role')}>
                    <option value="mentee">Junior / Mentee — seeking guidance</option>
                    <option value="mentor">Senior / Mentor — offering guidance</option>
                    <option value="both">Both</option>
                  </Select>
                </Field>
              </>
            )}
            <Field label="Email">
              <Input type="email" value={form.email} onChange={update('email')} placeholder="you@college.edu" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required />
            </Field>
            <Button type="submit" block>{isLogin ? 'Log in' : 'Create account'}</Button>
            {error && <div className="mt-2.5 text-sm text-danger">{error}</div>}
          </form>
        )}
      </Card>

      <div className="mt-[18px] text-center text-sm text-text-muted">
        {isLogin
          ? <>New here? <Link className="font-semibold text-signal" to="/register">Create an account</Link></>
          : <>Already have an account? <Link className="font-semibold text-signal" to="/login">Log in</Link></>}
      </div>
    </div>
  );
}

export function LoginPage() { return <AuthForm mode="login" />; }
export function RegisterPage() { return <AuthForm mode="register" />; }
