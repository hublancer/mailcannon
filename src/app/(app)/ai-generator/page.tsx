import { generateEmailContent, type GenerateEmailContentInput } from '@/ai/flows/generate-email-content';
import { PageHeader } from '@/components/page-header';
import { AIGeneratorForm } from '@/components/ai-generator-form';

export default function AIGeneratorPage() {

  async function generate(input: GenerateEmailContentInput) {
    'use server';
    return await generateEmailContent(input);
  }

  return (
    <>
      <PageHeader
        title="AI Message & Offer Generator"
        description="Create multiple message and offer variations to use within your email campaigns and reduce spam."
      />
      <AIGeneratorForm generate={generate} />
    </>
  );
}
