import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, X } from "lucide-react";

interface CouponCodeInputProps {
  onApplyCoupon: (couponCode: string) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: string;
  loading?: boolean;
  disabled?: boolean;
}

export const CouponCodeInput = ({ 
  onApplyCoupon, 
  onRemoveCoupon, 
  appliedCoupon, 
  loading = false,
  disabled = false
}: CouponCodeInputProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    if (couponCode.trim()) {
      onApplyCoupon(couponCode.trim());
      setCouponCode("");
      setIsExpanded(false);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponCode("");
  };

  if (appliedCoupon) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-medium">Coupon applied: {appliedCoupon}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="text-sm w-full"
      >
        <Tag className="w-4 h-4 mr-2" />
        Have a coupon code?
      </Button>
    );
  }

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">Enter coupon code</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={loading || disabled}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApply();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleApply}
              disabled={loading || disabled || !couponCode.trim()}
            >
              {loading ? "Applying..." : "Apply"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};