import { Box, Button, Chip } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

interface OrderStepperProps {
  orderStatus: string;
  orderDate?: string | Date;
  orderId?: string;
  onCancelOrder?: () => void;
  isCancelling?: boolean;
}

const OrderStepper = ({
  orderStatus,
  orderDate,
  orderId,
  onCancelOrder,
  isCancelling,
}: OrderStepperProps) => {
  const normStatus = (orderStatus || 'PENDING').toUpperCase();

  // Dynamic date calculations based on order placement date
  const baseDate = orderDate ? new Date(orderDate) : new Date();
  const formatDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const placedDateStr = formatDay(baseDate);
  const packedDate = new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);
  const packedDateStr = formatDay(packedDate);
  const shippedDate = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const shippedDateStr = formatDay(shippedDate);
  const arrivingDateStart = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);
  const arrivingDateEnd = new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const arrivingDateStr = `${formatDay(arrivingDateStart)} - ${formatDay(arrivingDateEnd)}`;

  const standardSteps = [
    { name: "Order Placed", description: `Placed on ${placedDateStr}`, value: "PENDING" },
    { name: "Processing & Packed", description: `Dispatched by ${packedDateStr}`, value: "CONFIRMED" },
    { name: "In Transit", description: `Shipped by ${shippedDateStr}`, value: "SHIPPED" },
    { name: "Out for Delivery", description: `Arriving ${arrivingDateStr}`, value: "DELIVERING" },
    { name: "Delivered", description: `Handed over securely`, value: "DELIVERED" },
  ];

  const cancelledSteps = [
    { name: "Order Placed", description: `Placed on ${placedDateStr}`, value: "PENDING" },
    { name: "Order Cancelled", description: "Order has been successfully cancelled & refund initiated", value: "CANCELLED" },
  ];

  const statusPriority: Record<string, number> = {
    PENDING: 0,
    PLACED: 0,
    CONFIRMED: 1,
    SHIPPED: 2,
    DELIVERING: 3,
    ARRIVING: 3,
    DELIVERED: 4,
    CANCELLED: 1,
  };

  const currentStep = statusPriority[normStatus] ?? 0;
  const isCancelled = normStatus === 'CANCELLED';
  const steps = isCancelled ? cancelledSteps : standardSteps;
  const canCancel = !isCancelled && currentStep <= 1;

  return (
    <Box className="mx-auto my-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Tracking Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <LocalShippingIcon fontSize="small" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Live Delivery Tracking</h4>
            {orderId && (
              <p className="text-xs text-slate-400">
                Tracking ID: <span className="font-mono font-semibold text-slate-700">TRK-{orderId.slice(0, 10).toUpperCase()}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Chip
            size="small"
            label={isCancelled ? "CANCELLED" : normStatus}
            color={isCancelled ? "error" : normStatus === "DELIVERED" ? "success" : "primary"}
            sx={{ fontWeight: 700, fontSize: "11px" }}
          />
          {canCancel && onCancelOrder && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={isCancelling}
              onClick={onCancelOrder}
              sx={{ textTransform: "none", fontSize: "12px", borderRadius: "8px", py: 0.5 }}
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="mt-6 space-y-1">
        {steps.map((step, index) => {
          const isDone = isCancelled ? index <= currentStep : index <= currentStep;
          const isCurrent = isCancelled ? index === currentStep : (step.value === normStatus || (normStatus === 'PLACED' && index === 0));

          return (
            <div key={index} className="flex px-2">
              <div className="flex flex-col items-center">
                <Box
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? isCancelled
                        ? "bg-red-500 text-white shadow-md shadow-red-200"
                        : "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : isDone
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-300"
                      : "bg-slate-100 text-slate-300"
                  }`}
                >
                  {isCancelled && index === currentStep ? (
                    <CancelIcon sx={{ fontSize: 18 }} />
                  ) : isDone ? (
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <FiberManualRecordIcon sx={{ fontSize: 12 }} />
                  )}
                </Box>
                {index < steps.length - 1 && (
                  <div
                    className={`w-[2px] h-14 my-1 transition-all ${
                      index < currentStep
                        ? isCancelled
                          ? "bg-red-300"
                          : "bg-blue-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              <div className="ml-4 w-full pb-5">
                <div
                  className={`p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? isCancelled
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-200"
                      : "bg-transparent"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? isCancelled
                          ? "text-red-700"
                          : "text-blue-900"
                        : isDone
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.name}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrent
                        ? isCancelled
                          ? "text-red-600"
                          : "text-blue-700 font-medium"
                        : "text-slate-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
};

export default OrderStepper;
