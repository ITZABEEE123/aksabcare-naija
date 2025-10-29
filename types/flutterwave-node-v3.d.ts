declare module 'flutterwave-node-v3' {
  interface FlutterwaveResponse {
    status: string;
    message: string;
    data: {
      id?: string;
      link?: string;
      status?: string;
      amount?: number;
      currency?: string;
      tx_ref?: string;
      [key: string]: unknown;
    };
  }

  interface PaymentPayload {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
      email: string;
      phonenumber: string;
      name: string;
    };
    customizations: {
      title: string;
      description: string;
      logo: string;
    };
    configurations?: {
      session_duration?: number;
      max_retry_attempt?: number;
    };
  }

  interface RefundPayload {
    id: string;
    amount?: number;
  }

  interface VerifyPayload {
    id: string;
  }

  interface StandardSubaccountInterface {
    create(payload: PaymentPayload): Promise<FlutterwaveResponse>;
  }

  interface TransactionInterface {
    verify(payload: VerifyPayload): Promise<FlutterwaveResponse>;
    refund(payload: RefundPayload): Promise<FlutterwaveResponse>;
  }

  class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    StandardSubaccount: StandardSubaccountInterface;
    Transaction: TransactionInterface;
  }

  export = Flutterwave;
}