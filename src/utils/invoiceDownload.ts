/**
 * Utility to download authenticated order PDF invoice from backend
 */
export const downloadOrderInvoice = async (orderId: number | string, tokenNumber?: string) => {
  try {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const numericId = typeof orderId === 'string' ? Number(orderId.replace(/\D/g, '')) || 1 : orderId;

    const response = await fetch(`${apiBase}/orders/${numericId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Failed to download invoice" }));
      throw new Error(err.message || "Failed to download invoice");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CampusEats_Invoice_${tokenNumber || orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Invoice download error:", err);
    alert(err.message || "Could not download PDF invoice. Ensure backend is running.");
  }
};
