'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { GenerateEmailContentOutput } from '@/ai/flows/generate-email-content';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  campaignName: z.string().min(3, {
    message: 'Campaign name must be at least 3 characters.',
  }),
  productName: z.string().min(2, {
    message: 'Product name must be at least 2 characters.',
  }),
  targetAudience: z.string().min(10, {
    message: 'Target audience description must be at least 10 characters.',
  }),
  offerDetails: z.string().min(10, {
    message: 'Offer details must be at least 10 characters.',
  }),
  numberOfVersions: z.coerce.number().int().min(1).max(5),
});

type FormValues = z.infer<typeof formSchema>;

interface AIGeneratorFormProps {
  generate: (input: FormValues) => Promise<GenerateEmailContentOutput | undefined>;
  onContentSelect?: (content: { subject: string; body: string }) => void;
}

export function AIGeneratorForm({ generate, onContentSelect }: AIGeneratorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateEmailContentOutput | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignName: '',
      productName: '',
      targetAudience: '',
      offerDetails: '',
      numberOfVersions: 3,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedContent(null);
    try {
      const result = await generate(data);
      if (result) {
        setGeneratedContent(result);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 h-full">
      <Card>
        <CardHeader>
          <CardTitle>Content Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Summer Sale 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product/Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Widget" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your target audience, e.g., Tech-savvy professionals aged 25-40 interested in productivity tools."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offerDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the special offer, e.g., 25% off for the first 100 customers, valid until the end of the month."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfVersions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Versions</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of versions" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How many email variations to generate.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Content
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating amazing content...</p>
            </div>
          )}
          {!isLoading && !generatedContent && (
             <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Ready to be creative?</h3>
                <p className="text-muted-foreground">Fill out the form to generate email content.</p>
            </div>
          )}
           {generatedContent && (
            <ScrollArea className="h-full pr-4">
              <Accordion type="single" collapsible className="w-full">
                {generatedContent.emailVersions.map((version, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>Version {index + 1}: {version.subject}</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4 bg-secondary rounded-md mb-4">
                          {version.body}
                      </div>
                      {onContentSelect && (
                          <Button onClick={() => onContentSelect(version)}>
                              Use This Content
                          </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
