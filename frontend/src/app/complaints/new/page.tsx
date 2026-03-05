"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  CreditCard,
  HelpCircle,
  Loader2,
  Package,
  Send,
  ShieldAlert,
  Star,
  Utensils,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { complaintService } from "@/services/complaint.service";
import { cn } from "@/lib/utils";

const categories = [
  {
    value: "order_not_received",
    label: "Order Not Received",
    icon: Package,
    description: "Didn't get your delivery",
  },
  {
    value: "wrong_order",
    label: "Wrong Order",
    icon: Utensils,
    description: "Received incorrect items",
  },
  {
    value: "merchant_fraud",
    label: "Merchant Issue",
    icon: ShieldAlert,
    description: "Problem with the restaurant",
  },
  {
    value: "courier_issue",
    label: "Courier Issue",
    icon: Bike,
    description: "Problem with delivery person",
  },
  {
    value: "payment_problem",
    label: "Payment Problem",
    icon: CreditCard,
    description: "Billing or charge issue",
  },
  {
    value: "quality_issue",
    label: "Quality Issue",
    icon: Star,
    description: "Food quality concern",
  },
  {
    value: "other",
    label: "Other",
    icon: HelpCircle,
    description: "Something else",
  },
] as const;

const complaintSchema = z.object({
  category: z.enum([
    "order_not_received",
    "wrong_order",
    "merchant_fraud",
    "courier_issue",
    "payment_problem",
    "quality_issue",
    "other",
  ]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  orderId: z.string().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

function NewComplaintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const form = useForm<ComplaintFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    resolver: zodResolver(complaintSchema as any),
    defaultValues: {
      category: "other",
      subject: "",
      description: "",
      orderId: orderId || "",
    },
  });

  const selectedCategory = form.watch("category");

  const createComplaintMutation = useMutation({
    mutationFn: complaintService.create,
    onSuccess: () => {
      toast.success("Complaint submitted successfully");
      router.push("/complaints");
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit complaint",
      );
    },
  });

  const onSubmit = (data: ComplaintFormValues) => {
    const { orderId, ...rest } = data;
    const payload = !orderId ? rest : { ...rest, orderId };
    createComplaintMutation.mutate(payload);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-[#0a0a0a] border border-white/10 rounded-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors duration-300 mb-4 cursor-pointer uppercase tracking-widest"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white leading-none">
          Submit a Complaint
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-medium">
          Describe your issue and we&apos;ll get back to you as soon as
          possible.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                  What&apos;s the issue?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = field.value === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => field.onChange(cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-sm border p-3 sm:p-4 text-center transition-all duration-300 cursor-pointer group",
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/5 text-white"
                            : "border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300 hover:bg-white/[0.02]",
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-sm transition-all duration-300",
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-white/5 text-zinc-600 group-hover:text-zinc-400",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight">
                          {cat.label}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono hidden sm:block">
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage className="text-red-400 text-xs mt-2" />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <label
                  htmlFor="complaint-subject"
                  className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Subject
                </label>
                <FormControl>
                  <input
                    id="complaint-subject"
                    placeholder="Brief summary of the issue"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all duration-300 font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs mt-1.5" />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <label
                  htmlFor="complaint-description"
                  className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Description
                </label>
                <FormControl>
                  <textarea
                    id="complaint-description"
                    placeholder="Please provide detailed information about what happened..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all duration-300 min-h-[140px] resize-y font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs mt-1.5" />
              </FormItem>
            )}
          />

          {/* Order Link */}
          {orderId && (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-sm p-4">
              <div className="h-8 w-8 bg-amber-500/10 flex items-center justify-center rounded-sm shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  Linked to Order
                </p>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  {orderId.slice(0, 8)}...
                </p>
                <input type="hidden" {...form.register("orderId")} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={createComplaintMutation.isPending}
              className="px-5 py-2.5 border border-white/10 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:border-white/30 hover:text-white rounded-sm transition-all duration-300 disabled:opacity-30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createComplaintMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-widest rounded-sm transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {createComplaintMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Loading...
          </p>
        </div>
      }
    >
      <NewComplaintContent />
    </Suspense>
  );
}
