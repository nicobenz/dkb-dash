CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"iban" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "import" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"filename" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"statement_balance_cents" bigint NOT NULL,
	"statement_balance_date" date NOT NULL,
	"first_booking_date" date,
	"last_booking_date" date,
	"added_count" integer NOT NULL,
	"duplicate_count" integer NOT NULL,
	"pending_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parsed" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"import_id" integer NOT NULL,
	"booking_date" date NOT NULL,
	"value_date" date,
	"status" text NOT NULL,
	"payer" text NOT NULL,
	"payee" text NOT NULL,
	"purpose" text NOT NULL,
	"type" text NOT NULL,
	"counterparty_iban" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"creditor_id" text NOT NULL,
	"mandate_reference" text NOT NULL,
	"customer_reference" text NOT NULL,
	"fingerprint" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import" ADD CONSTRAINT "import_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_import_id_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_account_fingerprint" ON "transaction" USING btree ("account_id","fingerprint");--> statement-breakpoint
CREATE INDEX "transaction_account_booking_date" ON "transaction" USING btree ("account_id","booking_date");