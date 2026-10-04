export async function detectDevices(media: MediaDevices = navigator.mediaDevices) {
  let stream: MediaStream | undefined;
  let warning = '';
  try {
    try { stream = await media.getUserMedia({audio: true}); }
    catch { warning = 'Mikrofon açılamadı. Windows mikrofon izinlerini ve cihaz bağlantısını kontrol edin; erişilebilen çıkışlar yine listelenir.'; }
    const devices = (await media.enumerateDevices()).filter(d => d.deviceId && (d.kind === 'audioinput' || d.kind === 'audiooutput'));
    return {devices, warning};
  } finally { stream?.getTracks().forEach(track => track.stop()); }
}
