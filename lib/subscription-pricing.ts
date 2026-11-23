// Display prices for ToolNexa AI subscriptions, in USD.
// Billing is recurring; yearly prices are charged once every 12 months.
// The corresponding PayPal Billing Plans must be configured with matching
// amounts and intervals before enabling checkout.
export type PaidTier='Starter'|'Pro'|'Premium'|'Unlimited';
export type BillingPeriod='monthly'|'yearly';
export const paidTiers:PaidTier[]=['Starter','Pro','Premium','Unlimited'];
export const billingPeriods:BillingPeriod[]=['monthly','yearly'];
export const subscriptionPrices:Record<PaidTier,Record<BillingPeriod,string>>={
 Starter:{monthly:'3.99',yearly:'39.99'},
 Pro:{monthly:'5.99',yearly:'59.99'},
 Premium:{monthly:'9.99',yearly:'99.99'},
 // Launch prices. Existing subscribers keep the billing terms approved on PayPal.
 Unlimited:{monthly:'14.99',yearly:'149.99'}
};
export const unlimitedPreviewPrices={
 monthly:{regular:'19.99',launch:'14.99'},
 yearly:{regular:'199.99',launch:'149.99'}
} as const;
