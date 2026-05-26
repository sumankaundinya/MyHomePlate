ALTER TABLE onboarding_contacts
  DROP CONSTRAINT IF EXISTS onboarding_contacts_contact_type_check;

ALTER TABLE onboarding_contacts
  ADD CONSTRAINT onboarding_contacts_contact_type_check
  CHECK (contact_type IN ('chef', 'customer', 'field_agent'));
