import { useState } from "react";

export default function useToast() {
  const [msg, setMsg] = useState("");
  const show = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  };
  return [msg, show];
}
