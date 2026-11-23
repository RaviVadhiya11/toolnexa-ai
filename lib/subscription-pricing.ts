// Display prices for ToolNexa AI subscriptions, in USD.
// Billing is recurring; yearly prices are charged once every 12 months.
// The corresponding PayPal Billing Plans must be configured with matching
// amounts and intervals before enabling checkout.
export type PaidTier='Starter'|'Pro'|'Premium'|'Max';
export type BillingPeriod='monthly'|'yearly';
export const paidTiers:PaidTier[]=['Starter','Pro','Premium','Max'];
export const billingPeriods:BillingPeriod[]=['monthly','yearly'];
export const subscriptionPrices:Record<PaidTier,Record<BillingPeriod,string>>={
 Starter:{monthly:'3.99',yearly:'39.99'},
 Pro:{monthly:'5.99',yearly:'59.99'},
 Premium:{monthly:'9.99',yearly:'99.99'},
 // Capped Max tier; distinct PayPal plan IDs must be configured and verified before checkout.
 Max:{monthly:'14.99',yearly:'149.99'}
};
