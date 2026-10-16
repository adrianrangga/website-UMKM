declare module "midtrans-client" {
  type ClientOptions = {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  };

  type SnapTransaction = {
    token: string;
    redirect_url: string;
  };

  type SnapClient = {
    createTransaction(
      parameter: Record<string, unknown>,
    ): Promise<SnapTransaction>;
  };

  type TransactionStatus = {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    transaction_status?: string;
    fraud_status?: string;
    payment_type?: string;
    [key: string]: unknown;
  };

  type CoreApiClient = {
    transaction: {
      status(transactionId: string): Promise<TransactionStatus>;
      notification(notificationObj: unknown): Promise<TransactionStatus>;
    };
  };

  const midtransClient: {
    Snap: new (options: ClientOptions) => SnapClient;
    CoreApi: new (options: ClientOptions) => CoreApiClient;
  };

  export default midtransClient;
}
