const CLOUD_NAME = "ddze3h0ej";
const UPLOAD_PRESET = "imagenes";

export const uploadImageToCloudinary = async (
  imageUri: string,
): Promise<string> => {
  // CORRECCIÓN: Esta es la URL pública oficial para subir imágenes vía REST API
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: `reporte_${Date.now()}.jpg`,
  } as any);

  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || "Error al subir la imagen a Cloudinary",
    );
  }

  const data = await response.json();
  return data.secure_url;
};
