CREATE TABLE "PushSubscription" (
    id           VARCHAR(36)  PRIMARY KEY,
    "userId"     VARCHAR(36)  NOT NULL,
    "houseId"    VARCHAR(36),
    endpoint     TEXT         NOT NULL UNIQUE,
    p256dh       TEXT         NOT NULL,
    auth         TEXT         NOT NULL,
    "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_sub_user ON "PushSubscription" ("userId");
CREATE INDEX idx_push_sub_house ON "PushSubscription" ("houseId");
