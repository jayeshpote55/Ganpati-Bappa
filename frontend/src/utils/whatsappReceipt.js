/**
 * Formats a phone number for WhatsApp wa.me links
 * e.g., 9876543210 -> 919876543210
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  return digits;
}

/**
 * Translates payment mode to Marathi
 */
export function getPaymentModeInMarathi(mode) {
  switch (mode?.toLowerCase()) {
    case "upi":
      return "यु.पी.आय. (UPI)";
    case "cash":
      return "नगद (Cash)";
    case "cheque":
      return "चेक (Cheque)";
    case "bank_transfer":
      return "बँक ट्रान्सफर (Bank Transfer)";
    case "card":
      return "कार्ड (Card)";
    case "razorpay":
      return "ऑनलाइन Razorpay";
    default:
      return mode || "इतर";
  }
}

/**
 * Generates official Marathi WhatsApp Receipt Text
 */
export function generateMarathiReceiptText(donation, defaultMandalName = "श्री गणेश उत्सव मंडळ") {
  if (!donation) return "";

  const mandalName = donation.mandal?.name || donation.mandalName || defaultMandalName;
  const dateObj = donation.createdAt ? new Date(donation.createdAt) : new Date();
  const formattedDate = dateObj.toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const donorName = donation.donorName || "अनामित भक्त";
  const donorPhone = donation.donorPhone || "7972558521";
  const amount = (donation.amount || 0).toLocaleString("en-IN");
  const modeInMarathi = getPaymentModeInMarathi(donation.paymentMode);
  const receiptId = donation._id ? donation._id.slice(-6).toUpperCase() : donation.transactionId || "GEN-" + Date.now().toString().slice(-6);

  let text = `🚩 *${mandalName}* 🚩\n`;
  text += `🙏 *गणेशोत्सव वर्गणी पावती (Vargani Receipt)* 🙏\n\n`;
  text += `🗓 *दिनांक (Date):* ${formattedDate}\n`;
  text += `👤 *देणगीदाराचे नाव (Donor):* ${donorName}\n`;
  text += `📱 *व्हॉट्सॲप (WhatsApp):* ${donorPhone}\n`;
  text += `💰 *वर्गणी रक्कम (Amount):* ₹${amount}/-\n`;
  text += `💳 *देणगी माध्यम (Mode):* ${modeInMarathi}\n`;

  if (donation.message) {
    text += `💬 *संदेश:* ${donation.message}\n`;
  }

  text += `\nगणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🌺\n`;
  text += `आपल्या अमूल्य देणगी व सहकार्याबद्दल मंडळ आपले मनःपूर्वक आभारी आहे. 🙏`;

  return text;
}

/**
 * Opens WhatsApp Web or WhatsApp app with prefilled Marathi receipt message
 */
export function openWhatsAppReceipt(donation, defaultMandalName) {
  const text = generateMarathiReceiptText(donation, defaultMandalName);
  const rawPhone = donation?.donorPhone || "7972558521";
  const phone = formatWhatsAppPhone(rawPhone);

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
