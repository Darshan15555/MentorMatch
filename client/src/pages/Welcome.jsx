import { Link } from 'react-router-dom';
import { ConstellationForming } from '../components/Motion.jsx';
import { Button } from '../components/UI.jsx';

export default function WelcomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <ConstellationForming size={180} />
      <h1 className="mt-6 text-4xl">Two signals. One frequency.</h1>
      <p className="mt-3 text-base">
        Signal connects juniors with seniors whose skills actually overlap with
        what they want to learn — no cold DMs, no guessing who to ask.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link to="/register" className="w-full sm:w-auto">
          <Button block className="sm:w-auto sm:px-8">Find your frequency</Button>
        </Link>
        <Link to="/login" className="w-full sm:w-auto">
          <Button variant="secondary" block className="sm:w-auto sm:px-8">I already have an account</Button>
        </Link>
      </div>
    </div>
  );
}
