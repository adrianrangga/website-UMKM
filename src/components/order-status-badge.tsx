import type { OrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_BADGE[status]}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
