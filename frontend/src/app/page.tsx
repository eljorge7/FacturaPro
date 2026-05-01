import { redirect } from 'next/navigation';

export default function Home() {
  // En un inicio, redirigimos el root publico
  // En el futuro aquí vivirá una Landing Page moderna
  redirect('/dashboard');
}
