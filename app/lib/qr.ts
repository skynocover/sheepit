import QRCode from 'qrcode';

export const generateQrDataUrl = async (
  text: string,
  options?: { width?: number; margin?: number },
): Promise<string> => {
  return QRCode.toDataURL(text, {
    width: options?.width ?? 300,
    margin: options?.margin ?? 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};
