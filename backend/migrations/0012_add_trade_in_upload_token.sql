ALTER TABLE trade_ins
ADD COLUMN upload_token_hash text NOT NULL UNIQUE;
