-- AddUniqueConstraint
ALTER TABLE "Page" ADD CONSTRAINT "Page_auditId_url_key" UNIQUE ("auditId", "url");
