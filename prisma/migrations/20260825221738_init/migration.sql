-- CreateEnum
CREATE TYPE "friend_requests_status" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "posts_visibility" AS ENUM ('public', 'allies');

-- CreateEnum
CREATE TYPE "seller_geographic_scopes_scope_type" AS ENUM ('include', 'exclude');

-- CreateEnum
CREATE TYPE "seller_geographic_scopes_level" AS ENUM ('country', 'state', 'city');

-- CreateEnum
CREATE TYPE "users_account_status" AS ENUM ('active', 'deactivated');

-- CreateTable
CREATE TABLE "bidding_company_statuses" (
    "id" SERIAL NOT NULL,
    "bidding_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bidding_company_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidding_products" (
    "id" SERIAL NOT NULL,
    "bidding_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "product_catalog_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" VARCHAR(1000),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bidding_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidding_products_taxes" (
    "id" SERIAL NOT NULL,
    "bidding_product_id" INTEGER NOT NULL,
    "tax_id" INTEGER NOT NULL,
    "tax_rate" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bidding_products_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidding_user_statuses" (
    "id" SERIAL NOT NULL,
    "bidding_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bidding_user_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biddings" (
    "id" SERIAL NOT NULL,
    "bidding_number" VARCHAR(255) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "description" VARCHAR(255),
    "deadline" TIMESTAMP(0),
    "delivery_date" TIMESTAMP(0),
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "delivery_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "address_id" INTEGER,
    "currency" VARCHAR(10) NOT NULL,
    "delivery_type" VARCHAR(50) NOT NULL,
    "cost_shipping" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total_taxes" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "notified_today" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "rated" BOOLEAN NOT NULL DEFAULT false,
    "category_id" INTEGER,
    "attachments" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "biddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "product_type_id" INTEGER,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "web_site" VARCHAR(255),
    "rfc_tax_id" VARCHAR(255) NOT NULL,
    "country" VARCHAR(255),
    "state" VARCHAR(255),
    "city" VARCHAR(255),
    "address" VARCHAR(255),
    "zip_code" VARCHAR(255),
    "photo" VARCHAR(255),
    "logo" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "rating_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_folio_numbers" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "entity_type" VARCHAR(255) NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "company_folio_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_users" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rol" VARCHAR(255),
    "income_at" TIMESTAMP(0),
    "outcome_at" TIMESTAMP(0),
    "read_at" TIMESTAMP(0),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "conversation_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255) NOT NULL DEFAULT 'direct',
    "name" VARCHAR(255),
    "description" TEXT,
    "image" VARCHAR(255),
    "last_activity_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "iso_code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "boundary_coordinates" JSONB,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "source_currency" VARCHAR(255) NOT NULL,
    "target_currency" VARCHAR(255) NOT NULL,
    "rate" DECIMAL(15,6) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "status" "friend_requests_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "message_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER,
    "content" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL DEFAULT 'text',
    "sent_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(0),
    "read_at" TIMESTAMP(0),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" VARCHAR(100),
    "user_last_name" VARCHAR(100),
    "user_email" VARCHAR(100),
    "user_cel_phone_country_code" VARCHAR(4),
    "user_cel_phone" VARCHAR(20),
    "token_device" VARCHAR(255),
    "message_category_id" INTEGER NOT NULL,
    "notification_channel_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "type" VARCHAR(50),
    "send_status" VARCHAR(50) DEFAULT 'pending',
    "websocket_sent" BOOLEAN NOT NULL DEFAULT false,
    "read_status" VARCHAR(255),
    "read_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "sender_id" INTEGER,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_products" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_catalog_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_products_taxes" (
    "id" SERIAL NOT NULL,
    "order_product_id" INTEGER NOT NULL,
    "tax_id" INTEGER NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_products_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" VARCHAR(255) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "bidding_id" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "payment_statuses" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "payment_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_terms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(255) NOT NULL,
    "payment_status_id" INTEGER NOT NULL,
    "payment_id" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "supported" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(255),
    "description" TEXT,
    "price_buyer_month" DECIMAL(10,2),
    "price_buyer_annual" DECIMAL(10,2),
    "price_seller_month" DECIMAL(10,2),
    "price_seller_annual" DECIMAL(10,2),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "default" BOOLEAN NOT NULL DEFAULT false,
    "custom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "image" VARCHAR(255),
    "visibility" "posts_visibility" NOT NULL DEFAULT 'public',
    "original_post_id" INTEGER,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_catalogs" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "name" VARCHAR(5000) NOT NULL,
    "brand" VARCHAR(255),
    "internal_code" VARCHAR(255) NOT NULL,
    "external_code" VARCHAR(255),
    "sat_key" VARCHAR(255),
    "description" TEXT,
    "keywords" JSONB,
    "technical_sheet" VARCHAR(255),
    "image" VARCHAR(255),
    "price" DECIMAL(10,2) NOT NULL,
    "stock_quantity" BIGINT NOT NULL DEFAULT 0,
    "unit_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_catalogs_taxes" (
    "id" SERIAL NOT NULL,
    "product_catalog_id" INTEGER NOT NULL,
    "tax_id" INTEGER NOT NULL,
    "tax_rate" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_catalogs_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" SERIAL NOT NULL,
    "viewer_id" INTEGER NOT NULL,
    "viewed_id" INTEGER NOT NULL,
    "viewed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_products" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "product_catalog_id" INTEGER NOT NULL,
    "bidding_product_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "total_taxes" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "quote_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_products_taxes" (
    "id" SERIAL NOT NULL,
    "quote_product_id" INTEGER NOT NULL,
    "tax_id" INTEGER NOT NULL,
    "tax_rate" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "quote_products_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "bidding_id" INTEGER NOT NULL,
    "quote_number" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total_taxes" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(5) NOT NULL,
    "payment_status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "delivery_status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "cost_shipping" DECIMAL(15,2),
    "status" VARCHAR(255) NOT NULL DEFAULT 'active',
    "delivery_date" DATE,
    "delivery_type" VARCHAR(255),
    "shipping_address" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "payment_term_id" INTEGER,
    "custom_payment_terms" TEXT,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bidding_id" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_quotes" (
    "id" SERIAL NOT NULL,
    "quote_product_id" INTEGER NOT NULL,
    "justification" VARCHAR(255) NOT NULL,
    "other_justification" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "selected_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_geographic_scopes" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "state_id" INTEGER,
    "city_name" VARCHAR(255),
    "scope_type" "seller_geographic_scopes_scope_type" NOT NULL,
    "level" "seller_geographic_scopes_level" NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "seller_geographic_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "iso_code" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "boundary_coordinates" JSONB,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_statuses" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "subscription_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" SERIAL NOT NULL,
    "country" VARCHAR(255) NOT NULL,
    "tax_name" VARCHAR(255) NOT NULL,
    "tax_rate" DECIMAL(5,2),
    "description" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "abbreviation" VARCHAR(255) NOT NULL,
    "product_type_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "state_id" INTEGER NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "outdoor_number" VARCHAR(50) NOT NULL,
    "interior_number" VARCHAR(50),
    "zip_code" VARCHAR(20) NOT NULL,
    "address_type" VARCHAR(50) NOT NULL DEFAULT 'office',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_categories" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_message_categories" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message_category_id" INTEGER NOT NULL,
    "subscription_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_message_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_channels" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_channel_id" INTEGER NOT NULL,
    "subscription_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "user_type_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(0),
    "password" VARCHAR(60) NOT NULL,
    "password_expiry" TIMESTAMP(0),
    "remember_token" VARCHAR(100),
    "phone_country_code" VARCHAR(4),
    "phone" VARCHAR(15),
    "cel_phone_country_code" VARCHAR(4),
    "cel_phone" VARCHAR(15),
    "info_cel_phone" VARCHAR(255),
    "info_cel_phone_country_code" VARCHAR(10),
    "two_factor_authentication_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_auth_suggestion_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pending_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "role_id" INTEGER,
    "verification_token" VARCHAR(255),
    "language" VARCHAR(5) NOT NULL DEFAULT 'es',
    "account_status" "users_account_status" NOT NULL DEFAULT 'active',
    "deactivation_reason" TEXT,
    "deactivated_at" TIMESTAMP(0),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bidding_company_statuses_bidding_id_idx" ON "bidding_company_statuses"("bidding_id");

-- CreateIndex
CREATE INDEX "bidding_company_statuses_company_id_idx" ON "bidding_company_statuses"("company_id");

-- CreateIndex
CREATE INDEX "bidding_products_bidding_id_idx" ON "bidding_products"("bidding_id");

-- CreateIndex
CREATE INDEX "bidding_products_order_id_idx" ON "bidding_products"("order_id");

-- CreateIndex
CREATE INDEX "bidding_products_product_catalog_id_idx" ON "bidding_products"("product_catalog_id");

-- CreateIndex
CREATE INDEX "bidding_products_taxes_tax_id_idx" ON "bidding_products_taxes"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "bidding_products_taxes_bidding_product_id_tax_id_key" ON "bidding_products_taxes"("bidding_product_id", "tax_id");

-- CreateIndex
CREATE INDEX "bidding_user_statuses_bidding_id_idx" ON "bidding_user_statuses"("bidding_id");

-- CreateIndex
CREATE INDEX "bidding_user_statuses_user_id_idx" ON "bidding_user_statuses"("user_id");

-- CreateIndex
CREATE INDEX "biddings_address_id_idx" ON "biddings"("address_id");

-- CreateIndex
CREATE INDEX "biddings_category_id_idx" ON "biddings"("category_id");

-- CreateIndex
CREATE INDEX "biddings_created_by_idx" ON "biddings"("created_by");

-- CreateIndex
CREATE INDEX "biddings_updated_by_idx" ON "biddings"("updated_by");

-- CreateIndex
CREATE INDEX "categories_product_type_id_idx" ON "categories"("product_type_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_rfc_tax_id_key" ON "companies"("rfc_tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_folio_numbers_company_id_year_entity_type_key" ON "company_folio_numbers"("company_id", "year", "entity_type");

-- CreateIndex
CREATE INDEX "conversation_users_conversation_id_idx" ON "conversation_users"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_users_user_id_idx" ON "conversation_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_key" ON "countries"("iso_code");

-- CreateIndex
CREATE INDEX "friend_requests_receiver_id_idx" ON "friend_requests"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "friend_requests_sender_id_receiver_id_key" ON "friend_requests"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "friendships_friend_id_idx" ON "friendships"("friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_categories_name_key" ON "message_categories"("name");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_channels_name_key" ON "notification_channels"("name");

-- CreateIndex
CREATE INDEX "notifications_message_category_id_idx" ON "notifications"("message_category_id");

-- CreateIndex
CREATE INDEX "notifications_notification_channel_id_idx" ON "notifications"("notification_channel_id");

-- CreateIndex
CREATE INDEX "notifications_sender_id_idx" ON "notifications"("sender_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "order_products_order_id_idx" ON "order_products"("order_id");

-- CreateIndex
CREATE INDEX "order_products_product_catalog_id_idx" ON "order_products"("product_catalog_id");

-- CreateIndex
CREATE INDEX "order_products_taxes_order_product_id_idx" ON "order_products_taxes"("order_product_id");

-- CreateIndex
CREATE INDEX "order_products_taxes_tax_id_idx" ON "order_products_taxes"("tax_id");

-- CreateIndex
CREATE INDEX "orders_bidding_id_idx" ON "orders"("bidding_id");

-- CreateIndex
CREATE INDEX "orders_company_id_idx" ON "orders"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_statuses_status_key" ON "payment_statuses"("status");

-- CreateIndex
CREATE INDEX "payments_payment_status_id_idx" ON "payments"("payment_status_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "plan_features_feature_id_idx" ON "plan_features"("feature_id");

-- CreateIndex
CREATE INDEX "plan_features_plan_id_idx" ON "plan_features"("plan_id");

-- CreateIndex
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_company_id_idx" ON "posts"("company_id");

-- CreateIndex
CREATE INDEX "posts_original_post_id_idx" ON "posts"("original_post_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "product_catalogs_created_by_idx" ON "product_catalogs"("created_by");

-- CreateIndex
CREATE INDEX "product_catalogs_product_type_id_idx" ON "product_catalogs"("product_type_id");

-- CreateIndex
CREATE INDEX "product_catalogs_unit_id_idx" ON "product_catalogs"("unit_id");

-- CreateIndex
CREATE INDEX "product_catalogs_updated_by_idx" ON "product_catalogs"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalogs_company_id_external_code_key" ON "product_catalogs"("company_id", "external_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalogs_company_id_internal_code_key" ON "product_catalogs"("company_id", "internal_code");

-- CreateIndex
CREATE INDEX "product_catalogs_taxes_tax_id_idx" ON "product_catalogs_taxes"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalogs_taxes_product_catalog_id_tax_id_key" ON "product_catalogs_taxes"("product_catalog_id", "tax_id");

-- CreateIndex
CREATE INDEX "profile_views_viewed_id_idx" ON "profile_views"("viewed_id");

-- CreateIndex
CREATE INDEX "profile_views_viewer_id_viewed_id_viewed_at_idx" ON "profile_views"("viewer_id", "viewed_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "profile_views_viewer_id_viewed_id_viewed_at_key" ON "profile_views"("viewer_id", "viewed_id", "viewed_at");

-- CreateIndex
CREATE INDEX "quote_products_bidding_product_id_idx" ON "quote_products"("bidding_product_id");

-- CreateIndex
CREATE INDEX "quote_products_product_catalog_id_idx" ON "quote_products"("product_catalog_id");

-- CreateIndex
CREATE INDEX "quote_products_quote_id_idx" ON "quote_products"("quote_id");

-- CreateIndex
CREATE INDEX "quote_products_taxes_quote_product_id_idx" ON "quote_products_taxes"("quote_product_id");

-- CreateIndex
CREATE INDEX "quote_products_taxes_tax_id_idx" ON "quote_products_taxes"("tax_id");

-- CreateIndex
CREATE INDEX "quotes_bidding_id_idx" ON "quotes"("bidding_id");

-- CreateIndex
CREATE INDEX "quotes_company_id_idx" ON "quotes"("company_id");

-- CreateIndex
CREATE INDEX "quotes_payment_term_id_idx" ON "quotes"("payment_term_id");

-- CreateIndex
CREATE INDEX "quotes_user_id_idx" ON "quotes"("user_id");

-- CreateIndex
CREATE INDEX "ratings_bidding_id_idx" ON "ratings"("bidding_id");

-- CreateIndex
CREATE INDEX "ratings_company_id_idx" ON "ratings"("company_id");

-- CreateIndex
CREATE INDEX "ratings_user_id_idx" ON "ratings"("user_id");

-- CreateIndex
CREATE INDEX "selected_quotes_quote_product_id_idx" ON "selected_quotes"("quote_product_id");

-- CreateIndex
CREATE INDEX "seller_geographic_scopes_country_id_idx" ON "seller_geographic_scopes"("country_id");

-- CreateIndex
CREATE INDEX "seller_geographic_scopes_state_id_idx" ON "seller_geographic_scopes"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_geographic_scopes_seller_id_country_id_state_id_city_key" ON "seller_geographic_scopes"("seller_id", "country_id", "state_id", "city_name", "level");

-- CreateIndex
CREATE INDEX "states_country_id_idx" ON "states"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_statuses_status_key" ON "subscription_statuses"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_is_default_status_idx" ON "subscriptions"("user_id", "is_default", "status");

-- CreateIndex
CREATE INDEX "user_addresses_country_id_idx" ON "user_addresses"("country_id");

-- CreateIndex
CREATE INDEX "user_addresses_state_id_idx" ON "user_addresses"("state_id");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "user_categories_category_id_idx" ON "user_categories"("category_id");

-- CreateIndex
CREATE INDEX "user_categories_user_id_idx" ON "user_categories"("user_id");

-- CreateIndex
CREATE INDEX "user_message_categories_message_category_id_idx" ON "user_message_categories"("message_category_id");

-- CreateIndex
CREATE INDEX "user_message_categories_user_id_idx" ON "user_message_categories"("user_id");

-- CreateIndex
CREATE INDEX "user_notification_channels_notification_channel_id_idx" ON "user_notification_channels"("notification_channel_id");

-- CreateIndex
CREATE INDEX "user_notification_channels_user_id_idx" ON "user_notification_channels"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_user_type_id_idx" ON "users"("user_type_id");

-- AddForeignKey
ALTER TABLE "bidding_company_statuses" ADD CONSTRAINT "bidding_company_statuses_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_company_statuses" ADD CONSTRAINT "bidding_company_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_products" ADD CONSTRAINT "bidding_products_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_products" ADD CONSTRAINT "bidding_products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_products" ADD CONSTRAINT "bidding_products_product_catalog_id_fkey" FOREIGN KEY ("product_catalog_id") REFERENCES "product_catalogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_products_taxes" ADD CONSTRAINT "bidding_products_taxes_bidding_product_id_fkey" FOREIGN KEY ("bidding_product_id") REFERENCES "bidding_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_products_taxes" ADD CONSTRAINT "bidding_products_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_user_statuses" ADD CONSTRAINT "bidding_user_statuses_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bidding_user_statuses" ADD CONSTRAINT "bidding_user_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "biddings" ADD CONSTRAINT "biddings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "biddings" ADD CONSTRAINT "biddings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "biddings" ADD CONSTRAINT "biddings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "biddings" ADD CONSTRAINT "biddings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_folio_numbers" ADD CONSTRAINT "company_folio_numbers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_message_category_id_fkey" FOREIGN KEY ("message_category_id") REFERENCES "message_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_channel_id_fkey" FOREIGN KEY ("notification_channel_id") REFERENCES "notification_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_product_catalog_id_fkey" FOREIGN KEY ("product_catalog_id") REFERENCES "product_catalogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_products_taxes" ADD CONSTRAINT "order_products_taxes_order_product_id_fkey" FOREIGN KEY ("order_product_id") REFERENCES "order_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_products_taxes" ADD CONSTRAINT "order_products_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_status_id_fkey" FOREIGN KEY ("payment_status_id") REFERENCES "payment_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs_taxes" ADD CONSTRAINT "product_catalogs_taxes_product_catalog_id_fkey" FOREIGN KEY ("product_catalog_id") REFERENCES "product_catalogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalogs_taxes" ADD CONSTRAINT "product_catalogs_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewed_id_fkey" FOREIGN KEY ("viewed_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_products" ADD CONSTRAINT "quote_products_bidding_product_id_fkey" FOREIGN KEY ("bidding_product_id") REFERENCES "bidding_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_products" ADD CONSTRAINT "quote_products_product_catalog_id_fkey" FOREIGN KEY ("product_catalog_id") REFERENCES "product_catalogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_products" ADD CONSTRAINT "quote_products_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_products_taxes" ADD CONSTRAINT "quote_products_taxes_quote_product_id_fkey" FOREIGN KEY ("quote_product_id") REFERENCES "quote_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_products_taxes" ADD CONSTRAINT "quote_products_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_bidding_id_fkey" FOREIGN KEY ("bidding_id") REFERENCES "biddings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "selected_quotes" ADD CONSTRAINT "selected_quotes_quote_product_id_fkey" FOREIGN KEY ("quote_product_id") REFERENCES "quote_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seller_geographic_scopes" ADD CONSTRAINT "seller_geographic_scopes_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seller_geographic_scopes" ADD CONSTRAINT "seller_geographic_scopes_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seller_geographic_scopes" ADD CONSTRAINT "seller_geographic_scopes_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_message_categories" ADD CONSTRAINT "user_message_categories_message_category_id_fkey" FOREIGN KEY ("message_category_id") REFERENCES "message_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_message_categories" ADD CONSTRAINT "user_message_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notification_channels" ADD CONSTRAINT "user_notification_channels_notification_channel_id_fkey" FOREIGN KEY ("notification_channel_id") REFERENCES "notification_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notification_channels" ADD CONSTRAINT "user_notification_channels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
