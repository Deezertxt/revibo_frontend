const CLOUD_NAME = "ddze3h0ej";
const API_KEY = "297156743425639";
const API_SECRET = "zmbM5qiw3NMNnCc1rKw50qPevRo";

async function generarFirmaSHA1(stringParaFirmar: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(stringParaFirmar);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function obtenerPublicId(url: string): string | null {
  try {
    if (!url.includes("/upload/")) return null;

    const urlCortada = url.split("/upload/")[1];
    const partes = urlCortada.split("/");

    const archivoConExtension = partes[partes.length - 1];
    const rutaCarpeta = partes.slice(0, -1).join("/");
    const nombreArchivo = archivoConExtension.substring(
      0,
      archivoConExtension.lastIndexOf("."),
    );

    const esVersion = partes[0].match(/^v\d+$/);

    if (esVersion) {
      const rutaSinVersion = partes.slice(1).join("/");
      return rutaSinVersion.substring(0, rutaSinVersion.lastIndexOf("."));
    }

    return rutaCarpeta ? `${rutaCarpeta}/${nombreArchivo}` : nombreArchivo;
  } catch (error) {
    console.error("Error al procesar la URL de Cloudinary:", error);
    return null;
  }
}

export const eliminarImagenDeCloudinary = async (
  imageUrl: string,
): Promise<boolean> => {
  const publicId = obtenerPublicId(imageUrl);

  if (!publicId) {
    console.warn("No se pudo resolver el public_id para la URL:", imageUrl);
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const stringParaFirmar = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;

  const firmaSha1 = await generarFirmaSHA1(stringParaFirmar);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", firmaSha1);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        body: formData,
      },
    );

    const resultado = await response.json();
    return resultado.result === "ok";
  } catch (error) {
    console.error("Error de red al intentar borrar en Cloudinary:", error);
    return false;
  }
};
