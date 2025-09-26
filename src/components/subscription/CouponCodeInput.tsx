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
      <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-green-800">
                  Coupon Applied
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Code: <span className="font-mono">{appliedCoupon}</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {getDiscountText(appliedCouponDetails)} discount will be applied at checkout
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isExpanded) {
    return (
      <Card className="border border-border/50 hover:border-border transition-colors cursor-pointer" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Tag className="w-5 h-5" />
            <span className="text-sm font-medium">Have a coupon code?</span>
            <div className="ml-auto text-xs text-primary hover:text-primary/80 transition-colors">
              Click to add
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 border shadow-sm ${
      validationState === 'valid' ? 'bg-green-50/50 border-green-200' : 
      validationState === 'invalid' || validationState === 'error' ? 'bg-red-50/50 border-red-200' :
      'bg-background border-border'
    }`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status */}
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              validationState === 'validating' ? 'bg-blue-100' :
              validationState === 'valid' ? 'bg-green-100' :
              validationState === 'invalid' || validationState === 'error' ? 'bg-red-100' :
              'bg-muted'
            }`}>
              {validationState === 'validating' && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
              {validationState === 'valid' && <Check className="w-3 h-3 text-green-600" />}
              {(validationState === 'invalid' || validationState === 'error') && <AlertCircle className="w-3 h-3 text-red-600" />}
              {validationState === 'idle' && <Tag className="w-3 h-3 text-muted-foreground" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${
                validationState === 'valid' ? 'text-green-700' :
                validationState === 'invalid' || validationState === 'error' ? 'text-red-700' :
                'text-foreground'
              }`}>
                {validationState === 'validating' ? 'Validating coupon...' :
                 validationState === 'valid' ? 'Valid coupon code!' :
                 validationState === 'invalid' || validationState === 'error' ? 'Invalid coupon code' :
                 'Enter coupon code'}
              </div>
              
              {validationState === 'valid' && validCouponDetails && (
                <div className="text-xs text-green-600 mt-1">
                  {getDiscountText(validCouponDetails)} discount will be applied
                </div>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {(validationState === 'invalid' || validationState === 'error') && validationError && (
            <div className="text-xs text-red-600 bg-red-100 border border-red-200 rounded-md p-2">
              {validationError}
            </div>
          )}

          {/* Success message and action */}
          {validationState === 'valid' && validCouponDetails && (
            <div className="bg-green-100 border border-green-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700">
                  Code: <span className="font-mono font-semibold">{couponCode}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onApplyCoupon(couponCode.trim().toUpperCase(), validCouponDetails);
                    setIsExpanded(false);
                  }}
                  className="h-7 text-xs px-3"
                >
                  Apply Coupon
                </Button>
              </div>
            </div>
          )}

          {/* Input and buttons */}
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
              className={`flex-1 transition-colors ${
                validationState === 'valid' ? 'border-green-300 focus-visible:ring-green-200' :
                validationState === 'invalid' || validationState === 'error' ? 'border-red-300 focus-visible:ring-red-200' :
                ''
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validationState !== 'validating') {
                  handleApply();
                }
              }}
            />
            
            <Button
              onClick={handleApply}
              disabled={loading || disabled || !couponCode.trim() || validationState === 'validating'}
              className="px-4 font-medium"
            >
              {validationState === 'validating' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Validating
                </>
              ) : 'Apply'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                setCouponCode("");
                setValidationState('idle');
                setValidationError("");
                setValidCouponDetails(null);
              }}
              disabled={disabled}
              className="px-3 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};