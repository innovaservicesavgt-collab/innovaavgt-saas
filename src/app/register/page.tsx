import { redirect } from 'next/navigation';

// Esta ruta esta deprecada. Redirige al nuevo flujo de signup.
export default function RegisterRedirect() {
  redirect('/signup');
}
