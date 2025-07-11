
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIGeneratorForm } from './ai-generator-form';
import { generateEmailContent, type GenerateEmailContentInput, type GenerateEmailContentOutput } from '@/ai/flows/generate-email-content';

interface AIGeneratorDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onApplyVariants: (variants: { subject: string; body: string }[]) => void;
}

export function AIGeneratorDialog({ isOpen, onOpenChange, onApplyVariants }: AIGeneratorDialogProps) {
    async function generate(input: GenerateEmailContentInput): Promise<GenerateEmailContentOutput | undefined> {
        // The 'use server' directive is in the flow file itself
        return await generateEmailContent(input);
    }
    
    const handleApply = (variants: { subject: string; body: string }[]) => {
        onApplyVariants(variants);
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>AI Message & Offer Generator</DialogTitle>
                    <DialogDescription>
                        Create multiple message and offer variations. Select one to use in your campaign.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <AIGeneratorForm generate={generate} onApplyVariants={handleApply} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
