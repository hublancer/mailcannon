import { redirect } from 'next/navigation';

export default function AIGeneratorPage() {
  // This page is no longer used directly. The AI Generator is now a dialog
  // within the campaign creation flow. Redirect users there as a fallback.
  redirect('/campaigns/new');
}
