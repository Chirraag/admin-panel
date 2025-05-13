import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChallengeFormData } from "@/types/challenge";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIGenerateButton } from "@/components/forms/ai-generate-button";
import { BasicInfoForm } from "./components/basic-info-form";
import { ProductForm } from "./components/product-form";
import { ProspectForm } from "./components/prospect-form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Validation schema
const challengeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(1, "Duration must be greater than 0"),
  avatar: z.string().min(1, "Avatar selection is required"),
  isFree: z.boolean(),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  pain_points: z
    .array(z.string())
    .min(1, "At least one pain point is required"),
  product_name: z.string().min(1, "Product name is required"),
  product_description: z.string().min(1, "Product description is required"),
  prospect_data: z.string().min(1, "Prospect data is required"),
  prospect_objection: z.string().min(1, "Prospect objection is required"),
  category_id: z.string().min(1, "Category selection is required"),
  objections: z.array(z.string()),
  talking_points: z.array(z.string()),
  credits: z.number().min(0, "Credits must be a positive number"),
});

interface ChallengeFormProps {
  initialData?: Partial<ChallengeFormData>;
  onSubmit: (data: ChallengeFormData) => Promise<void>;
  onCancel: () => void;
}

export function ChallengeForm({
  initialData,
  onSubmit,
  onCancel,
}: ChallengeFormProps) {
  const [activeTab, setActiveTab] = useState("ai");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      type: "Cold Call",
      description: "",
      duration: 300,
      avatar: "",
      isFree: false,
      features: [],
      pain_points: [],
      product_name: "",
      product_description: "",
      prospect_data: "",
      prospect_objection: "",
      category_id: "",
      objections: [],
      talking_points: [],
      credits: 10,
      ...initialData,
    },
  });

  const handleAIGenerate = (data: ChallengeFormData) => {
    Object.entries(data).forEach(([key, value]) => {
      form.setValue(key as keyof ChallengeFormData, value);
    });
    setActiveTab("manual");
  };

  const handleSubmit = async (data: ChallengeFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Set training_type to match type for backward compatibility
      const finalData = {
        ...data,
        training_type: data.type,
      };
      await onSubmit(finalData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    formState: { errors },
  } = form;
  const hasRequiredFieldErrors = errors.avatar || errors.category_id;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {initialData ? "Edit Challenge" : }
        </DialogTitle>
      </DialogHeader>

      {hasRequiredFieldErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select both an avatar and a category before saving the
            challenge.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <AIGenerateButton
            onGenerate={handleAIGenerate}
            onSuccess={() => setActiveTab("manual")}
          />
        </TabsContent>

        <TabsContent value="manual">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <BasicInfoForm control={form.control} />
              <ProductForm control={form.control} />
              <ProspectForm control={form.control} />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {initialData ? "Updating..." : "Creating..."}
                    </>
                  ) : initialData ? (
                    "Update Challenge"
                  ) : (
                    "Create Challenge"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
