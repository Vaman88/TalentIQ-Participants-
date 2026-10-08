"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { scanResumeServer } from "@/app/scan-actions";

export type ResumeSelection = { file: File; source: "upload" | "scan"; proof?: string };

export function ResumeInput({ disabled, onChange }: { disabled: boolean; onChange: (resume: ResumeSelection | null) => void }) {
  const [mode, setMode] = useState<"upload" | "scan">("upload");
  const [selection, setSelection] = useState<ResumeSelection | null>(null);
  const [warning, setWarning] = useState("");
  const [scanning, setScanning] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [text, setText] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const liveStream = useRef<MediaStream | null>(null);
  const request = useRef(0);
  const busy = disabled || scanning || openingCamera;

  const stopCamera = useCallback(() => {
    liveStream.current?.getTracks().forEach(track => track.stop());
    liveStream.current = null;
    setStream(null);
    setCameraReady(false);
  }, []);

  useEffect(() => () => {
    request.current++;
    liveStream.current?.getTracks().forEach(track => track.stop());
  }, []);
  useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream;
  }, [stream]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const reset = () => {
    request.current++;
    stopCamera();
    setSelection(null);
    onChange(null);
    setWarning("");
    setText("");
    setPhotoUrl("");
  };

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const next: ResumeSelection = { file: files[0], source: "upload" };
    setSelection(next);
    setWarning("");
    onChange(next);
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: () => {
      setSelection(null);
      onChange(null);
      setWarning("Resume must be a PDF or DOCX file no larger than 8 MB.");
    },
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    maxSize: 8 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
    disabled: busy,
  });

  const scan = (photo: File) => {
    stopCamera();
    setSelection(null);
    onChange(null);
    setText("");
    setWarning("");
    setPhotoUrl("");
    if (!["image/jpeg", "image/png"].includes(photo.type) || !photo.size || photo.size > 8 * 1024 * 1024) {
      setWarning("The captured photo is too large. Retake the photo or upload a PDF or DOCX up to 8 MB.");
      return;
    }
    setPhotoUrl(URL.createObjectURL(photo));
    setScanning(true);
    const current = ++request.current;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("photo", photo);
        const result = await scanResumeServer(formData);
        if (request.current !== current) return;
        if (!result.success) { setWarning(result.error); return; }
        const bytes = Uint8Array.from(atob(result.pdf), character => character.charCodeAt(0));
        const next: ResumeSelection = {
          file: new File([bytes], "scanned-resume.pdf", { type: "application/pdf" }),
          source: "scan", proof: result.proof,
        };
        setSelection(next);
        setText(result.text);
        onChange(next);
      } catch {
        if (request.current === current) setWarning("Text extraction failed. Check your connection, then retake the photo or upload your resume.");
      } finally {
        if (request.current === current) setScanning(false);
      }
    });
  };

  const openCamera = async () => {
    reset();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setWarning("Camera access requires HTTPS or localhost. Upload a PDF or DOCX instead.");
      return;
    }
    setOpeningCamera(true);
    const current = request.current;
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 2400 }, height: { ideal: 3200 } }, audio: false });
      if (request.current !== current) { next.getTracks().forEach(track => track.stop()); return; }
      liveStream.current = next;
      setStream(next);
    } catch {
      if (request.current === current) setWarning("Camera access was denied or no camera is available. Allow camera access and try Scan resume again, or upload your resume.");
    } finally {
      if (request.current === current) setOpeningCamera(false);
    }
  };

  const capture = async () => {
    if (!video.current || !cameraReady) return;
    const current = request.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) { setWarning("The camera is not ready. Please try again."); return; }
    context.drawImage(video.current, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.95));
    if (request.current !== current || !liveStream.current) return;
    if (!blob) { setWarning("The photo could not be captured. Please try again."); return; }
    scan(new File([blob], "resume-photo.jpg", { type: "image/jpeg" }));
  };

  const buttonClass = "inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-sm border border-jbh-black px-3 py-3 text-xs min-[400px]:text-sm sm:text-sm font-bold touch-manipulation [&>svg]:shrink-0 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <fieldset className="min-w-0 pt-4" disabled={disabled}>
      <legend className="mb-2 w-full text-xs font-bold uppercase tracking-wide">Resume <span className="float-right normal-case">Required</span></legend>
      <input {...getInputProps()} />
      <div className="mb-3 grid grid-cols-1 min-[360px]:grid-cols-2 gap-2" role="group" aria-label="Resume method">
        {(["upload", "scan"] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} disabled={busy} onClick={() => {
            setMode(value);
            if (value === "scan") void openCamera();
            else { reset(); open(); }
          }} className={`${buttonClass} ${mode === value ? "bg-jbh-black text-white" : "bg-white text-jbh-black"}`}>
            {value === "upload" ? <UploadCloud size={18} /> : <Camera size={18} />}
            {value === "upload" ? "Upload resume" : "Scan resume"}
          </button>
        ))}
      </div>

      {mode === "upload" && !selection && (
        <div {...getRootProps()} aria-label="Upload PDF or DOCX resume" className={`rounded-sm border-2 border-dashed p-4 text-center ${isDragActive ? "border-jbh-black bg-jbh-yellow/10" : "border-[#A0A0A0] bg-[#f9f9f9]"}`}>
          <p className="text-sm">{isDragActive ? "Drop your resume here" : "Upload a PDF or DOCX, or drag it here."}</p>
          <p className="mt-1 text-xs text-jbh-black/70">Up to 8 MB.</p>
        </div>
      )}

      {mode === "scan" && (
        <div className="space-y-3 rounded-sm border border-jbh-gray bg-[#f9f9f9] p-4">
          <p className="text-sm leading-relaxed">Fit the whole page in the frame. Use good lighting and avoid glare.</p>
          <p className="text-xs text-jbh-black/70">One English page. Submission requires readable text.</p>
          {stream && (
            <div className="space-y-2">
              <video ref={video} autoPlay muted playsInline onLoadedData={() => setCameraReady(true)} className="max-h-[50dvh] sm:max-h-96 w-full rounded-sm bg-black object-contain" aria-label="Resume camera preview" />
              <div className="flex gap-2">
                <button type="button" onClick={capture} disabled={busy || !cameraReady} className={`${buttonClass} flex-1 bg-jbh-yellow`}><Camera size={18} /> Capture page</button>
                <button type="button" onClick={stopCamera} disabled={busy} className={buttonClass}>Cancel</button>
              </div>
            </div>
          )}
          {photoUrl && <Image src={photoUrl} alt="Captured resume page" width={600} height={800} unoptimized className="max-h-72 w-full rounded-sm object-contain" />}
          {!stream && photoUrl && (
            <div>
              <button type="button" onClick={openCamera} disabled={busy} className={`${buttonClass} bg-jbh-yellow`}>
                <Camera size={18} /> Retake photo
              </button>
            </div>
          )}
          {openingCamera && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={18} className="animate-spin" /> Opening camera…</p>}
          {scanning && <p role="status" className="flex items-center gap-2 text-sm font-semibold"><Loader2 size={18} className="animate-spin" /> Checking photo and extracting text…</p>}
          {text && (
            <div className="space-y-2">
              <p role="status" className="flex items-center gap-2 text-sm font-semibold text-green-800"><CheckCircle2 size={18} /> Text extracted. Your searchable PDF is ready.</p>
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold">Review extracted text</summary>
                <p className="mt-2 text-xs text-jbh-black/70">Check names and contact details. If text is missing or incorrect, retake the photo or upload your original resume.</p>
                <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-jbh-gray bg-white p-3 font-sans text-xs">{text}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      {selection && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-sm border-2 border-jbh-black bg-jbh-yellow/5 p-3">
          <FileText size={22} className="shrink-0" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{selection.file.name}</p><p className="text-xs text-jbh-black/70">{(selection.file.size / 1024 / 1024).toFixed(1)} MB</p></div>
          <button type="button" aria-label="Remove resume" onClick={reset} disabled={busy} className="flex min-h-11 min-w-11 items-center justify-center p-2 touch-manipulation"><X size={18} /></button>
        </div>
      )}
      {warning && <p role="alert" className="mt-3 rounded-sm border border-amber-400 bg-amber-50 p-3 text-sm font-medium text-amber-950">{warning}{mode === "scan" && !selection && " Submission is blocked until a scan passes or you upload a resume."}</p>}
    </fieldset>
  );
}
