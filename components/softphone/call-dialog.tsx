import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Phone, Delete, PhoneOff } from "lucide-react";
import { useState, useEffect } from "react";

export function CallDialog() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const handleCallStarted = () => setIsCalling(true);
    const handleCallEnded = () => setIsCalling(false);

    window.addEventListener("telesip-call-started", handleCallStarted);
    window.addEventListener("telesip-call-ended", handleCallEnded);

    return () => {
      window.removeEventListener("telesip-call-started", handleCallStarted);
      window.removeEventListener("telesip-call-ended", handleCallEnded);
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (isCalling) return;
    setPhone((prev) => prev + digit);
  };

  const handleDelete = () => {
    if (isCalling) return;
    setPhone((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phone || isCalling) return;
    window.makeCall(phone);
    setIsCalling(true);
  };

  const handleEndCall = () => {
    if (window.hangupCall) {
      window.hangupCall();
    }
    // setIsCalling(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // ⬅️ RẤT QUAN TRỌNG
      e.stopPropagation();
      handleCall();
      return;
    }

    if (isCalling) return;

    if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
    else if (e.key === "*" || e.key === "#") handleDigit(e.key);
    else if (e.key === "Backspace") handleDelete();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-emerald-500 transition"
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onKeyDownCapture={handleKeyDown}
          onKeyDown={handleKeyDown}
          className={`
            sm:max-w-[340px] p-6 
            bg-gradient-to-b from-background via-background to-emerald-50/40
            dark:to-emerald-900/10
            backdrop-blur-xl border border-border/40
            shadow-2xl rounded-2xl
          `}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Dialer</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6">
            {/* Display */}
            <div className="w-full relative">
              <Input
                value={phone}
                readOnly
                placeholder="Nhập số"
                className={`
                  text-center text-3xl font-semibold tracking-widest
                  bg-transparent border-none shadow-none
                  focus-visible:ring-0 h-14
                  ${isCalling && "text-emerald-600 animate-pulse"}
                `}
              />

              {phone && !isCalling && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500"
                >
                  <Delete className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Dial Pad */}
            {!isCalling && (
              <div className="grid grid-cols-3 gap-4 w-full max-w-[260px]">
                {[
                  ["1", ""],
                  ["2", "ABC"],
                  ["3", "DEF"],
                  ["4", "GHI"],
                  ["5", "JKL"],
                  ["6", "MNO"],
                  ["7", "PQRS"],
                  ["8", "TUV"],
                  ["9", "WXYZ"],
                  ["*", ""],
                  ["0", "+"],
                  ["#", ""],
                ].map(([digit, letters]) => (
                  <Button
                    key={digit}
                    variant="outline"
                    onClick={() => handleDigit(digit)}
                    className={`
                      h-14 w-14 rounded-full
                      text-2xl font-medium
                      bg-background/70
                      hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-cyan-500/20
                      active:scale-95 transition-all
                      flex flex-col justify-center
                      shadow-sm
                    `}
                  >
                    {digit}
                  </Button>
                ))}
              </div>
            )}

            {/* Call Control */}
            <div className="mt-2 w-full px-4">
              {!isCalling ? (
                <Button
                  type="button"
                  onClick={handleCall}
                  disabled={!phone}
                  className={`
                    w-full h-12 rounded-lg
                    bg-gradient-to-r from-emerald-500 to-cyan-500
                    hover:from-emerald-600 hover:to-cyan-600
                    text-white shadow-lg
                    transition active:scale-95
                    disabled:opacity-50
                    flex items-center justify-center gap-2
                    font-semibold text-lg
                  `}
                >
                  <Phone className="h-5 w-5 fill-current" />
                  Gọi điện
                </Button>
              ) : (
                <Button
                  onClick={handleEndCall}
                  className={`
                    w-full h-12 rounded-lg
                    bg-red-600 hover:bg-red-700
                    text-white shadow-xl animate-pulse
                    transition active:scale-95
                    flex items-center justify-center gap-2
                    font-semibold text-lg
                  `}
                >
                  <PhoneOff className="h-5 w-5" />
                  Kết thúc
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
