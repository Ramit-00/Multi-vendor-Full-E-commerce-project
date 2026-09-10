export const uploadToCloudinary = async (pics: any): Promise<string> => {
  const fallbackCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "pddxfqxe";
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ecom_unsigned";

  if (!pics) {
    return "";
  }

  const token = localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");

  // 1. Attempt authenticated signed upload via backend signature
  if (token) {
    try {
      const signRes = await fetch('/api/sellers/product/cloudinary-sign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (signRes.ok) {
        const signData = await signRes.json();
        const signedForm = new FormData();
        signedForm.append('file', pics);
        signedForm.append('api_key', signData.apiKey);
        signedForm.append('timestamp', String(signData.timestamp));
        signedForm.append('signature', signData.signature);
        signedForm.append('folder', signData.folder || 'ecom_products');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName || fallbackCloudName}/image/upload`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: signedForm,
        });

        if (res.ok) {
          const fileData = await res.json();
          if (fileData && fileData.secure_url) return fileData.secure_url;
          if (fileData && fileData.url) return fileData.url;
        }
      }
    } catch (signedErr) {
      console.warn("Signed Cloudinary upload failed, attempting direct upload:", signedErr);
    }
  }

  // 2. Fallback to unsigned preset upload
  try {
    const data = new FormData();
    data.append("file", pics);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", fallbackCloudName);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${fallbackCloudName}/image/upload`, {
      method: "post",
      body: data,
    });

    if (res.ok) {
      const fileData = await res.json();
      if (fileData && fileData.secure_url) return fileData.secure_url;
      if (fileData && fileData.url) return fileData.url;
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn("Cloudinary upload rejected:", errJson);
    }
  } catch (err) {
    console.warn("Cloudinary upload failed, falling back to local base64 reader:", err);
  }

  // Resilient fallback: convert to base64 Data URL
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || "");
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(pics);
    } catch (e) {
      resolve("");
    }
  });
};