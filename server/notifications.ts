import { notifyOwner } from "./_core/notification";

/**
 * Send notification for new property inquiry
 */
export async function sendInquiryNotification(
  propertyTitle: string,
  buyerName: string,
  buyerEmail: string,
  message: string
) {
  try {
    await notifyOwner({
      title: `New Inquiry: ${propertyTitle}`,
      content: `A new inquiry has been received for "${propertyTitle}" from ${buyerName} (${buyerEmail}).\n\nMessage: ${message}`,
    });
    return true;
  } catch (error) {
    console.warn("[Notification] Failed to send inquiry notification:", error);
    return false;
  }
}

/**
 * Send notification for listing approval
 */
export async function sendApprovalNotification(propertyTitle: string, propertyId: number) {
  try {
    await notifyOwner({
      title: `Listing Approved: ${propertyTitle}`,
      content: `Your property listing "${propertyTitle}" (#${propertyId}) has been approved and is now visible to buyers.`,
    });
    return true;
  } catch (error) {
    console.warn("[Notification] Failed to send approval notification:", error);
    return false;
  }
}

/**
 * Send notification for listing rejection
 */
export async function sendRejectionNotification(propertyTitle: string, propertyId: number) {
  try {
    await notifyOwner({
      title: `Listing Rejected: ${propertyTitle}`,
      content: `Your property listing "${propertyTitle}" (#${propertyId}) has been rejected. Please review our listing guidelines and update your listing.`,
    });
    return true;
  } catch (error) {
    console.warn("[Notification] Failed to send rejection notification:", error);
    return false;
  }
}
