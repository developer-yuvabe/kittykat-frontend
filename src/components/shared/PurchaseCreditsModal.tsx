import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCreditsStore } from "@/store/credits.store";
import StripeSvg from "@/assets/stripe.svg";
import CreditGif from "@/assets/credit.gif";
import Image from "next/image";
import { Plan } from "@/types/payment.types";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const PLANS: Plan[] = [
  {
    id: "credits_20000",
    name: "Starter",
    description: "Perfect for individuals or small teams testing the platform.",
    credits: 20000,
  },
  {
    id: "credits_50000",
    name: "Growth",
    description: "Best value for growing teams with moderate usage.",
    credits: 50000,
    isRecommended: true,
  },
  {
    id: "credits_75000",
    name: "Scale",
    description: "Designed for scaling projects and higher workloads.",
    credits: 75000,
  },
  {
    id: "credits_100000",
    name: "Enterprise",
    description: "Enterprise-ready pack for heavy, consistent usage.",
    credits: 100000,
  },
];

const PurchaseCreditsModal = () => {
  const [chosenPlan, setChosenPlan] = React.useState<Plan | null>(null);
  const { showPurchaseCreditsModal, setShowPurchaseCreditsModal } =
    useCreditsStore();

  return (
    <AlertDialog
      open={showPurchaseCreditsModal}
      onOpenChange={(open) => {
        setShowPurchaseCreditsModal(open);
      }}
    >
      <AlertDialogContent className="p-0 sm:max-w-3xl">
        <AlertDialogHeader className="border-b px-6 py-4 gap-0 flex flex-row justify-between items-center">
          <div>
            <AlertDialogTitle className="text-left">
              Choose Your Credit Pack
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Select the right plan for your needs.
            </AlertDialogDescription>
          </div>
          <div className="w-24 h-24 scale-105 -mt-6 -mr-4">
            <Image
              src={CreditGif}
              alt="Credits Gif"
              className="w-full h-full scale-105 object-cover"
            />
          </div>
        </AlertDialogHeader>
        <div className="my-2 px-6 py-6">
          <div className="flex gap-x-4">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                className={cn(
                  "h-80 border rounded-lg p-4 mb-4 cursor-pointer hover:bg-primary/10 transition flex flex-col justify-evenly items-center text-center",
                  {
                    "border-primary bg-primary/10": chosenPlan?.id === plan.id,
                    "scale-105": plan.isRecommended,
                  }
                )}
                onClick={() => setChosenPlan(plan)}
              >
                <div>
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {plan.description}
                  </p>
                </div>
                <div className="">
                  <p className="text-3xl font-bold"> {plan.credits}</p>
                  <p className="text-sm text-muted-foreground">Credits</p>
                </div>
                {plan.isRecommended && (
                  <Badge className="text-xs font-medium">Recommended</Badge>
                )}
              </button>
            ))}
          </div>
          {chosenPlan && <div></div>}
        </div>
        <AlertDialogFooter className="flex px-6 pb-6">
          <AlertDialogCancel className="flex-1">Maybe later</AlertDialogCancel>
          <AlertDialogAction
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              setShowPurchaseCreditsModal(false);
            }}
          >
            <p>Continue with</p>
            <Image src={StripeSvg} alt="Stripe Logo" width={40} height={24} />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PurchaseCreditsModal;
