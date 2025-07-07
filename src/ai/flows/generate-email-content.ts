// src/ai/flows/generate-email-content.ts
'use server';

/**
 * @fileOverview AI-powered email content generation flow.
 *
 * This file defines a Genkit flow that uses a language model to generate multiple versions of email messages
 * and offers for marketing campaigns. The goal is to provide users with a variety of content options to improve
 * campaign effectiveness and reduce the risk of being flagged as spam.
 *
 * @param generateEmailContent - The main function to trigger the email content generation flow.
 * @param GenerateEmailContentInput - The input type definition for the flow.
 * @param GenerateEmailContentOutput - The output type definition for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the email content generation flow.
const GenerateEmailContentInputSchema = z.object({
  campaignName: z.string().describe('The name of the email campaign.'),
  productName: z.string().describe('The name of the product or service being advertised.'),
  targetAudience: z.string().describe('Description of the target audience for the campaign.'),
  offerDetails: z.string().describe('Details of the offer or promotion.'),
  numberOfVersions: z.number().int().min(1).max(5).default(3).describe('The number of email content variations to generate (1-5).'),
});
export type GenerateEmailContentInput = z.infer<typeof GenerateEmailContentInputSchema>;

// Define the output schema for the email content generation flow.
const GenerateEmailContentOutputSchema = z.object({
  emailVersions: z.array(
    z.object({
      subject: z.string().describe('The email subject line.'),
      body: z.string().describe('The email body content.'),
    })
  ).describe('An array of generated email versions.')
});
export type GenerateEmailContentOutput = z.infer<typeof GenerateEmailContentOutputSchema>;

// Exported function to generate email content.
export async function generateEmailContent(input: GenerateEmailContentInput): Promise<GenerateEmailContentOutput> {
  return generateEmailContentFlow(input);
}

// Define the prompt for generating email content.
const generateEmailContentPrompt = ai.definePrompt({
  name: 'generateEmailContentPrompt',
  input: {schema: GenerateEmailContentInputSchema},
  output: {schema: GenerateEmailContentOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in crafting engaging email campaigns that avoid spam filters.

  Generate multiple versions of email content for a campaign. Each version should have a distinct subject line and body.
  The goal is to attract the target audience and promote the product effectively, while minimizing the chances of being marked as spam.

  Campaign Name: {{{campaignName}}}
  Product Name: {{{productName}}}
  Target Audience: {{{targetAudience}}}
  Offer Details: {{{offerDetails}}}

  Generate {{{numberOfVersions}}} distinct email versions.
  Each version should include a subject and body.
  `,
});

// Define the Genkit flow for generating email content.
const generateEmailContentFlow = ai.defineFlow(
  {
    name: 'generateEmailContentFlow',
    inputSchema: GenerateEmailContentInputSchema,
    outputSchema: GenerateEmailContentOutputSchema,
  },
  async input => {
    const {output} = await generateEmailContentPrompt(input);
    return output!;
  }
);
