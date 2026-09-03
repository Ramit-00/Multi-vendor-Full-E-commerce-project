export const uploadToCloudinary = async (pics: any): Promise<string> => {
  const cloud_name = "dxoqwusir";

  if (!pics) {
    return "";
  }

  // Try Cloudinary upload first
  try {
    const data = new FormData();
    data.append("file", pics);
    data.append("upload_preset", "ml_default");
    data.append("cloud_name", cloud_name);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
      method: "post",
      body: data,
    });

    if (res.ok) {
      const fileData = await res.json();
      if (fileData && fileData.secure_url) return fileData.secure_url;
      if (fileData && fileData.url) return fileData.url;
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