
import { redirect } from 'next/navigation';

export default function LogsPage() {
  // The logs page has been removed. Redirect to the main campaigns page.
  redirect('/campaigns');
}
