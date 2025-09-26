import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, X, Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CouponDetails {
  id: string;
  percent_off?: number;
  amount_off?: number;
  currency?: string;
  duration?: string;
  duration_in_months?: number;
  name?: string;
}

interface CouponCodeInputProps {
  onApplyCoupon: (couponCode: string, couponDetails: CouponDetails) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: string;
  appliedCouponDetails?: CouponDetails;
  loading?: boolean;
  disabled?: boolean;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'error';

export const CouponCodeInput = ({ 
  onApplyCoupon, 
  onRemoveCoupon, 
  appliedCoupon, 
  appliedCouponDetails,
  loading = false,
  disabled = false
}: CouponCodeInputProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string>("");
  const [validCouponDetails, setValidCouponDetails] = useState<CouponDetails | null>(null);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!couponCode.trim()) return;

    setValidationState('validating');
    setValidationError("");

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { coupon_code: couponCode.trim().toUpperCase() }
      });

      if (error) throw error;

      if (data.valid) {
        setValidationState('valid');
        setValidCouponDetails(data.coupon);
        onApplyCoupon(couponCode.trim().toUpperCase(), data.coupon);
        toast({
          title: "Coupon Applied!",
          description: `${getDiscountText(data.coupon)} discount will be applied at checkout.`,
        });
      } else {
        setValidationState('invalid');
        setValidationError(data.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setValidationState('error');
      setValidationError("Failed to validate coupon. Please try again.");
      toast({
        title: "Validation Failed",
        description: "Unable to validate coupon code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponCode("");
    setValidationState('idle');
    setValidationError("");
    setValidCouponDetails(null);
  };

  const getDiscountText = (coupon: CouponDetails): string => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}%`;
    }
    if (coupon.amount_off && coupon.currency) {
      const amount = coupon.amount_off / 100; // Convert cents to dollars
      return `$${amount.toFixed(2)}`;
    }
    return "Discount";
  };

  if (appliedCoupon && appliedCouponDetails) {
    return (
      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            {appliedCoupon} • {getDiscountText(appliedCouponDetails)} off
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="w-full text-sm text-muted-foreground hover:text-foreground h-8"
      >
        <Tag className="w-4 h-4 mr-2" />
        Have a coupon code?
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            if (validationState !== 'idle') {
              setValidationState('idle');
              setValidationError("");
              setValidCouponDetails(null);
            }
          }}
          disabled={loading || disabled || validationState === 'validating'}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && validationState !== 'validating') {
              handleApply();
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleApply}
          disabled={loading || disabled || !couponCode.trim() || validationState === 'validating'}
          className="h-8 px-3"
        >
          {validationState === 'validating' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : 'Apply'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            setCouponCode("");
            setValidationState('idle');
            setValidationError("");
            setValidCouponDetails(null);
          }}
          disabled={disabled}
          className="h-8 px-3 text-muted-foreground"
        >
          Cancel
        </Button>
      </div>

      {/* Success state */}
      {validationState === 'valid' && validCouponDetails && (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Valid! {getDiscountText(validCouponDetails)} discount
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => {
              onApplyCoupon(couponCode.trim().toUpperCase(), validCouponDetails);
              setIsExpanded(false);
            }}
            className="h-6 text-xs px-2"
          >
            Apply
          </Button>
        </div>
      )}

      {/* Error state */}
      {(validationState === 'invalid' || validationState === 'error') && validationError && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{validationError}</span>
        </div>
      )}
    </div>
  );
};