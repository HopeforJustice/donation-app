/*
  Warnings:

  - You are about to drop the `BillingRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mandate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentGateway` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentGatewayCustomer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessedEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillingRequest" DROP CONSTRAINT "BillingRequest_customerId_fkey";

-- DropForeignKey
ALTER TABLE "BillingRequest" DROP CONSTRAINT "BillingRequest_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Mandate" DROP CONSTRAINT "Mandate_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Mandate" DROP CONSTRAINT "Mandate_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentGatewayCustomer" DROP CONSTRAINT "PaymentGatewayCustomer_customerId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentGatewayCustomer" DROP CONSTRAINT "PaymentGatewayCustomer_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessedEvent" DROP CONSTRAINT "ProcessedEvent_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_gatewayId_fkey";

-- DropTable
DROP TABLE "BillingRequest";

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "Mandate";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "PaymentGateway";

-- DropTable
DROP TABLE "PaymentGatewayCustomer";

-- DropTable
DROP TABLE "ProcessedEvent";

-- DropTable
DROP TABLE "Subscription";

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "donorfy_constituent_id" TEXT NOT NULL,
    "donorfy_constituent_number" TEXT NOT NULL,
    "donorfy_instance" TEXT,
    "already_in_donorfy" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_customers" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "gateway_customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandates" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "mandate_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_requests" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "billing_request_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "id" SERIAL NOT NULL,
    "gateway_id" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_donorfy_constituent_id_key" ON "customers"("donorfy_constituent_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_donorfy_constituent_number_key" ON "customers"("donorfy_constituent_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_customers_customer_id_gateway_id_key" ON "payment_gateway_customers"("customer_id", "gateway_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_id_customer_id_key" ON "subscriptions"("subscription_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "mandates_mandate_id_key" ON "mandates"("mandate_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_requests_billing_request_id_key" ON "billing_requests"("billing_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_id_gateway_id_key" ON "payments"("payment_id", "gateway_id");

-- CreateIndex
CREATE UNIQUE INDEX "processed_events_event_id_gateway_id_key" ON "processed_events"("event_id", "gateway_id");

-- AddForeignKey
ALTER TABLE "payment_gateway_customers" ADD CONSTRAINT "payment_gateway_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_gateway_customers" ADD CONSTRAINT "payment_gateway_customers_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_events" ADD CONSTRAINT "processed_events_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;
