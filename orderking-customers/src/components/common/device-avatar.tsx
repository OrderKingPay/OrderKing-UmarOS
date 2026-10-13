import { useRef, useState } from "react";
import { Camera, Crown, ImagePlus, Trash2, UserRound } from "lucide-react";
import { useDeviceAvatar } from "@/lib/hooks/use-device-avatar";

export function DeviceAvatar({ userId, name, editor = false }: {
 userId?: string | null; name?: string | null; editor?: boolean;
}) {
  const {image,saveImage}=useDeviceAvatar(userId);
  const picker=useRef<HTMLInputElement>(null);
  const [error,setError]=useState("");
  async function load(file?:File){
    if(!file) return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>6*1024*1024){
      setError("Choose a PNG, JPEG or WebP image up to 6 MB.");return;
    }
    try{
      const dataURL=await new Promise<string>((resolve,reject)=>{
        const reader=new FileReader();
        reader.onerror=()=>reject(new Error("Failed to load photo"));
        reader.onload=()=>resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      const img=await new Promise<HTMLImageElement>((resolve,reject)=>{
        const el=new Image();
        el.onload=()=>resolve(el);el.onerror=reject;el.src=dataURL;
      });
      const canvas=document.createElement("canvas");canvas.width=180;canvas.height=180;
      const ctx=canvas.getContext("2d");
      if(!ctx)throw Error("Image editor unavailable");
      const size=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,180,180);
      const ok=saveImage(canvas.toDataURL("image/jpeg",0.72));
      if(!ok)throw Error("Device storage unavailable");
      setError("");
    }catch{setError("Couldn't save this image on your device.");}
  }
  return (
    <div className={editor?"flex flex-wrap items-center gap-4":"inline-flex items-center"}>
      <div className={editor?"flex size-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-amber-400 bg-emerald-950 shadow-lg":"flex size-8 items-center justify-center overflow-hidden rounded-full border border-amber-400 bg-emerald-950 shadow-sm"}>
        {image?<img src={image} alt="Your selected avatar" className="size-full object-cover" />: name?
          <span className="font-extrabold text-amber-300">{name.charAt(0).toUpperCase()}</span>:
          <UserRound className="size-4 text-amber-300" aria-hidden />}
      </div>
      {editor&&(
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Crown className="size-4 text-amber-600" /> Your profile picture</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={()=>picker.current?.click()}
             className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-emerald-900">
              <ImagePlus className="size-4" /> Choose Photo
            </button>
            {image&&<button type="button" onClick={()=>saveImage(null)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <Trash2 className="size-4" /> Remove
            </button>}
          </div>
          <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={(e)=>{void load(e.target.files?.[0]);e.target.value="";}} aria-label="Upload profile picture" />
          <p className="text-xs text-slate-500">Saved on this device only. Cross-device sync requires secure profile image storage.</p>
          {error&&<p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
