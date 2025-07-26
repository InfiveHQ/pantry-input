import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

export default function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    scanner.render(
      (text) => {
        scanner.clear();
        onScan(text);
      },
      (err) => console.warn(err)
    );
  }, []);

  return <div id="reader" />;
}
