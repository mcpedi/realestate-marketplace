# Nyumba 360 Property Operations Architecture

Advanced release 2 introduces property operations without changing existing marketplace listing ownership or premium payment behaviour.

| Entity | Required ownership and status fields | Access rule |
|---|---|---|
| `propertyDocuments` | `propertyId`, `uploadedByUserId`, category, file key, original name, mime type, size, `deletedAt` | Property owner, uploader, administrator, or explicit document-access grant |
| `propertyDocumentAccess` | `documentId`, `userId`, permission, granted-by user, timestamp | Only property owner or administrator can grant/revoke |
| `moduleAuditLogs` | actor, action, resource type/id, property id, JSON-safe metadata, timestamp | Administrators can review; regular users see only activity exposed for their own property records |
| `propertyOperationRecords` | Initial typed record store for lease, inspection, maintenance, rent, and vacancy workflows; property owner, participant contact, type, status, priority, due date, amount, and JSON-safe details | Property owner manages records; release 2 uses owner-facing workflows and preserves a later tenant-user relationship as an explicit migration |

## Sensitive Audit Events

The initial implementation records document upload, grant, revoke, and delete actions. Subsequent workflows add lease, inspection, maintenance, rent, and vacancy status-change events. Logs contain identifiers and safe metadata only; document bytes, payment secrets, and private fields are never copied into audit metadata.

## Authorization Contract

Every property-operations procedure loads the target property or record on the server and verifies ownership or explicit user association before returning metadata, issuing a storage URL, mutating status, or writing an audit event. The client never determines authorization. Document files are stored with a unique S3 key; the database record is the authorization source of truth. Release 2 ships the owner-facing dashboard first; a tenant-user relationship and tenant-specific dashboard remain a subsequent, explicit expansion rather than inferring identity from a name or phone number.
